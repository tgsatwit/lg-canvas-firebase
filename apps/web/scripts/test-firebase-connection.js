#!/usr/bin/env node

// Load environment variables from .env file (in project root)
require('dotenv').config({ path: '../../.env' });

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

console.log('Testing Firebase connection and setup...\n');

// Function to safely parse the service account JSON
function getServiceAccount() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set");
    return null;
  }
  
  try {
    let credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    // Clean up the credentials string - remove surrounding quotes if present
    credentials = credentials.trim();
    if ((credentials.startsWith('"') && credentials.endsWith('"')) ||
        (credentials.startsWith("'") && credentials.endsWith("'"))) {
      credentials = credentials.slice(1, -1);
    }
    
    const parsed = JSON.parse(credentials);
    console.log('✅ Firebase service account credentials parsed successfully');
    return parsed;
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", error);
    return null;
  }
}

// Initialize Firebase Admin
function initializeFirebase() {
  try {
    if (getApps().length === 0) {
      const serviceAccount = getServiceAccount();
      if (!serviceAccount) {
        return null;
      }
      
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      
      console.log("✅ Firebase Admin SDK initialized successfully");
    }
    
    // Connect to the pbl-backend database
    const db = getFirestore(undefined, 'pbl-backend');
    const storage = getStorage();
    
    return { db, storage };
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    return null;
  }
}

// Test Firestore connection
async function testFirestore(db) {
  try {
    console.log('\nTesting Firestore connection...');
    
    // Test basic connection by getting a count of documents
    const snapshot = await db.collection('videos-master').limit(1).get();
    console.log(`✅ Successfully connected to Firestore`);
    console.log(`✅ Found videos-master collection`);
    
    // Get total count (this might take a moment with 1000 documents)
    console.log('📊 Counting total documents...');
    const countSnapshot = await db.collection('videos-master').count().get();
    const totalDocs = countSnapshot.data().count;
    console.log(`📊 Total documents in videos-master: ${totalDocs}`);
    
    // Check a few documents for gcp_link field
    if (totalDocs > 0) {
      const sampleSnapshot = await db.collection('videos-master').limit(5).get();
      let docsWithGcpLink = 0;
      let docsWithProblematicFilenames = 0;
      
             sampleSnapshot.docs.forEach(doc => {
         const data = doc.data();
         if (data.gcp_link) {
           docsWithGcpLink++;
           // Extract filename and check for problematic characters
           let filename = '';
           if (data.gcp_link.startsWith('gs://')) {
             const parts = data.gcp_link.split('/');
             filename = parts[parts.length - 1];
           }
           // Check for problematic characters in filename
           if (/[\s\[\]()!:&]/.test(filename)) {
             docsWithProblematicFilenames++;
           }
         }
       });
      
      console.log(`📋 Sample check (first 5 docs):`);
      console.log(`   - Documents with gcp_link: ${docsWithGcpLink}/5`);
      console.log(`   - Documents with problematic filenames: ${docsWithProblematicFilenames}/5`);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Firestore connection test failed:", error);
    return false;
  }
}

// Test Firebase Storage connection
async function testStorage(storage) {
  try {
    console.log('\nTesting Firebase Storage connection...');
    
    const bucket = storage.bucket();
    
    // Test by listing a few files (limited to avoid overwhelming output)
    const [files] = await bucket.getFiles({ maxResults: 5 });
    console.log(`✅ Successfully connected to Firebase Storage`);
    console.log(`📁 Sample files found: ${files.length}`);
    
    if (files.length > 0) {
             console.log('📋 Sample files:');
       files.forEach((file, index) => {
         const needsCleaning = /[\s\[\]()!:&]/.test(file.name);
         console.log(`   ${index + 1}. ${file.name} ${needsCleaning ? '(needs cleaning)' : '(clean)'}`);
       });
    }
    
    return true;
  } catch (error) {
    console.error("❌ Firebase Storage connection test failed:", error);
    return false;
  }
}

// Main test function
async function runTests() {
  try {
    const services = initializeFirebase();
    if (!services) {
      console.log('\n❌ Failed to initialize Firebase services');
      process.exit(1);
    }
    
    const { db, storage } = services;
    
    const firestoreOk = await testFirestore(db);
    const storageOk = await testStorage(storage);
    
    console.log('\n' + '='.repeat(50));
    console.log('TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Firestore connection: ${firestoreOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Storage connection: ${storageOk ? '✅ PASS' : '❌ FAIL'}`);
    
    if (firestoreOk && storageOk) {
      console.log('\n🎉 All tests passed! You can now run the cleanup script.');
      console.log('💡 Next steps:');
      console.log('   1. Run: node scripts/clean-video-filenames.js --dry-run');
      console.log('   2. Review the output');
      console.log('   3. Run: node scripts/clean-video-filenames.js (to apply changes)');
    } else {
      console.log('\n❌ Some tests failed. Please fix the issues before running the cleanup script.');
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
} 