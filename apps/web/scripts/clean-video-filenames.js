#!/usr/bin/env node

// Load environment variables from .env file (in project root)
require('dotenv').config({ path: '../../.env' });

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
const fs = require('fs');

// Configuration
const BATCH_SIZE = 50; // Process documents in batches to avoid overwhelming the database
const DRY_RUN = process.argv.includes('--dry-run'); // Add --dry-run flag to test without making changes

console.log(`Starting filename cleanup script...`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE RUN (changes will be made)'}`);

// Function to safely parse the service account JSON
function getServiceAccount() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set");
    process.exit(1);
  }
  
  try {
    let credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    // Clean up the credentials string - remove surrounding quotes if present
    credentials = credentials.trim();
    if ((credentials.startsWith('"') && credentials.endsWith('"')) ||
        (credentials.startsWith("'") && credentials.endsWith("'"))) {
      credentials = credentials.slice(1, -1);
    }
    
    return JSON.parse(credentials);
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", error);
    process.exit(1);
  }
}

// Initialize Firebase Admin
function initializeFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = getServiceAccount();
    
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    
    console.log("Firebase Admin SDK initialized successfully");
  }
  
  // Connect to the pbl-backend database
  const db = getFirestore(undefined, 'pbl-backend');
  const storage = getStorage();
  
  return { db, storage };
}

// Function to clean filename - replace problematic characters with underscores
function cleanFilename(filename) {
  // Replace spaces, brackets, parentheses, exclamation marks, colons, ampersands, and other problematic characters with underscores
  return filename.replace(/[\s\[\]()!:&]/g, '_');
}

// Function to extract filename from GCP storage URL
function extractFilenameFromUrl(gcpUrl) {
  try {
    // Handle both gs:// and https:// URLs
    if (gcpUrl.startsWith('gs://')) {
      // For gs:// URLs, extract everything after the bucket name
      // Format: gs://bucket-name/path/to/file.ext
      const parts = gcpUrl.split('/');
      if (parts.length >= 4) {
        // Return the path from the bucket root (includes directory like 'raw/')
        return parts.slice(3).join('/');
      }
      return null;
    } else {
      // For https:// Firebase Storage URLs, parse the URL to extract the file path
      const url = new URL(gcpUrl);
      const pathParts = url.pathname.split('/');
      // The filename is typically the last part of the path, after 'o/' in Firebase Storage URLs
      const oIndex = pathParts.findIndex(part => part === 'o');
      if (oIndex !== -1 && oIndex < pathParts.length - 1) {
        // Decode the filename (Firebase Storage URLs are URL encoded)
        return decodeURIComponent(pathParts[oIndex + 1]);
      }
    }
    return null;
  } catch (error) {
    console.error(`Error extracting filename from URL: ${gcpUrl}`, error);
    return null;
  }
}

// Function to build new GCP URL with cleaned filename
function buildNewGcpUrl(originalUrl, newFilePath) {
  try {
    if (originalUrl.startsWith('gs://')) {
      // For gs:// URLs, replace the file path after the bucket name
      const parts = originalUrl.split('/');
      if (parts.length >= 4) {
        // Keep bucket part and replace the file path
        return parts.slice(0, 3).join('/') + '/' + newFilePath;
      }
    } else {
      // For https:// Firebase Storage URLs
      const url = new URL(originalUrl);
      const pathParts = url.pathname.split('/');
      const oIndex = pathParts.findIndex(part => part === 'o');
      
      if (oIndex !== -1 && oIndex < pathParts.length - 1) {
        // Replace the filename part with the cleaned filename (URL encoded)
        pathParts[oIndex + 1] = encodeURIComponent(newFilePath);
        url.pathname = pathParts.join('/');
        return url.toString();
      }
    }
    return null;
  } catch (error) {
    console.error(`Error building new URL for filename: ${newFilePath}`, error);
    return null;
  }
}

// Function to check if filename needs cleaning
function needsCleaning(filename) {
  return /[\s\[\]()!:&]/.test(filename);
}

// Function to rename file in Firebase Storage
async function renameFileInStorage(storage, originalFilename, newFilename) {
  try {
    const bucket = storage.bucket();
    const originalFile = bucket.file(originalFilename);
    const newFile = bucket.file(newFilename);
    
    // Check if original file exists
    const [exists] = await originalFile.exists();
    if (!exists) {
      console.error(`Original file does not exist: ${originalFilename}`);
      return false;
    }
    
    // Check if new file already exists
    const [newExists] = await newFile.exists();
    if (newExists) {
      console.error(`New filename already exists: ${newFilename}`);
      return false;
    }
    
    if (!DRY_RUN) {
      // Copy the file to the new location
      await originalFile.copy(newFile);
      
      // Delete the original file
      await originalFile.delete();
      
      console.log(`✅ Successfully renamed: ${originalFilename} → ${newFilename}`);
    } else {
      console.log(`🔍 Would rename: ${originalFilename} → ${newFilename}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error renaming file ${originalFilename} to ${newFilename}:`, error);
    return false;
  }
}

// Main function to process documents
async function processDocuments() {
  const { db, storage } = initializeFirebase();
  
  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  try {
    console.log("Fetching documents from videos-master collection...");
    
    // Get all documents from the videos-master collection
    const snapshot = await db.collection('videos-master').get();
    
    console.log(`Found ${snapshot.size} documents to process`);
    
    const docs = snapshot.docs;
    
    // Process documents in batches
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} (documents ${i + 1}-${Math.min(i + BATCH_SIZE, docs.length)})`);
      
      for (const doc of batch) {
        const data = doc.data();
        const gcpLink = data.gcp_link;
        
        processedCount++;
        
        if (!gcpLink) {
          console.log(`⚠️  Document ${doc.id} has no gcp_link field`);
          continue;
        }
        
        // Extract filename from the GCP URL
        const originalFilePath = extractFilenameFromUrl(gcpLink);
        if (!originalFilePath) {
          console.log(`⚠️  Could not extract filename from URL in document ${doc.id}: ${gcpLink}`);
          continue;
        }
        
        // Get just the filename part (without directory) for display and cleaning check
        const originalFilename = originalFilePath.split('/').pop();
        
        // Check if filename needs cleaning
        if (!needsCleaning(originalFilename)) {
          console.log(`✅ Document ${doc.id} filename is already clean: ${originalFilename}`);
          continue;
        }
        
        // Clean the filename and rebuild the full path
        const cleanedFilename = cleanFilename(originalFilename);
        const pathParts = originalFilePath.split('/');
        pathParts[pathParts.length - 1] = cleanedFilename;
        const cleanedFilePath = pathParts.join('/');
        
        console.log(`🔧 Document ${doc.id}: ${originalFilename} → ${cleanedFilename}`);
        
        // Rename file in Firebase Storage
        const renameSuccess = await renameFileInStorage(storage, originalFilePath, cleanedFilePath);
        
        if (renameSuccess) {
          // Build new GCP URL
          const newGcpUrl = buildNewGcpUrl(gcpLink, cleanedFilePath);
          
          if (newGcpUrl) {
            if (!DRY_RUN) {
              // Update the document in Firestore
              await db.collection('videos-master').doc(doc.id).update({
                gcp_link: newGcpUrl
              });
              console.log(`📝 Updated Firestore document ${doc.id} with new URL`);
            } else {
              console.log(`📝 Would update Firestore document ${doc.id} with: ${newGcpUrl}`);
            }
            
            updatedCount++;
          } else {
            console.error(`❌ Could not build new URL for document ${doc.id}`);
            errorCount++;
          }
        } else {
          console.error(`❌ Failed to rename file for document ${doc.id}`);
          errorCount++;
        }
        
        // Add a small delay to avoid overwhelming the services
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
  } catch (error) {
    console.error("Error processing documents:", error);
    errorCount++;
  }
  
  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("CLEANUP SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total documents processed: ${processedCount}`);
  console.log(`Documents updated: ${updatedCount}`);
  console.log(`Errors encountered: ${errorCount}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes made)' : 'LIVE RUN (changes applied)'}`);
  
  if (DRY_RUN) {
    console.log("\n💡 To apply these changes, run the script without the --dry-run flag");
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  processDocuments()
    .then(() => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { processDocuments, cleanFilename, extractFilenameFromUrl, needsCleaning }; 