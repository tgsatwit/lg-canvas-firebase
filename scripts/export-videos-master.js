const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

// Function to safely parse the service account JSON
function getServiceAccount() {
  // Check for both possible environment variable names
  const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!credentials) {
    console.error("❌ Firebase service account credentials not found!");
    console.error("Please set one of these environment variables:");
    console.error("  - FIREBASE_SERVICE_ACCOUNT_JSON");
    console.error("  - FIREBASE_SERVICE_ACCOUNT_KEY");
    console.error("\nYou can:");
    console.error("1. Create a .env file in the project root with your credentials");
    console.error("2. Set the environment variable directly in your shell");
    console.error("3. Export the variable: export FIREBASE_SERVICE_ACCOUNT_JSON='{your_service_account_json}'");
    throw new Error("Firebase service account credentials not configured");
  }
  
  try {
    let credentialsString = credentials;
    
    // Clean up the credentials string - remove surrounding quotes if present
    credentialsString = credentialsString.trim();
    if ((credentialsString.startsWith('"') && credentialsString.endsWith('"')) ||
        (credentialsString.startsWith("'") && credentialsString.endsWith("'"))) {
      credentialsString = credentialsString.slice(1, -1);
    }
    
    const parsed = JSON.parse(credentialsString);
    console.log('✅ Firebase service account credentials parsed successfully');
    return parsed;
  } catch (error) {
    console.error("❌ Failed to parse Firebase service account credentials", error);
    console.error("Credentials string preview:", credentials?.substring(0, 100) + '...');
    throw error;
  }
}

// Function to flatten nested objects for CSV
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      if (value === null || value === undefined) {
        flattened[newKey] = '';
      } else if (typeof value === 'object' && !Array.isArray(value) && !(value.toDate)) {
        // If it's an object (but not array or Firestore timestamp), flatten it
        Object.assign(flattened, flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        // Convert arrays to comma-separated strings
        flattened[newKey] = value.join(', ');
      } else if (value.toDate) {
        // Handle Firestore timestamps
        flattened[newKey] = value.toDate().toISOString();
      } else {
        flattened[newKey] = String(value);
      }
    }
  }
  
  return flattened;
}

// Function to escape CSV values
function escapeCSV(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  
  // If the value contains comma, newline, or double quote, wrap it in quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    // Escape double quotes by doubling them
    value = value.replace(/"/g, '""');
    return `"${value}"`;
  }
  
  return value;
}

// Function to convert data to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  // Get all unique column names from all rows
  const allColumns = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(key => allColumns.add(key));
  });
  
  const columns = Array.from(allColumns).sort();
  
  // Create CSV header
  const header = columns.map(col => escapeCSV(col)).join(',');
  
  // Create CSV rows
  const rows = data.map(row => {
    return columns.map(col => escapeCSV(row[col] || '')).join(',');
  });
  
  return [header, ...rows].join('\n');
}

async function exportVideosToCSV() {
  try {
    console.log('🚀 Starting videos-master export...');
    
    // Initialize Firebase Admin
    const serviceAccount = getServiceAccount();
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    
    // Get Firestore instance for the pbl-backend database
    const db = getFirestore(app, 'pbl-backend');
    console.log('✅ Connected to pbl-backend database');
    
    // Query the videos-master collection
    console.log('📥 Fetching videos from videos-master collection...');
    const collectionRef = db.collection('videos-master');
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No videos found in the collection');
      return;
    }
    
    console.log(`📊 Found ${snapshot.docs.length} videos`);
    
    // Process each document
    const allVideos = [];
    let processedCount = 0;
    
    snapshot.docs.forEach(doc => {
      try {
        const data = doc.data();
        
        // Add document ID to the data
        const videoData = {
          document_id: doc.id,
          ...data
        };
        
        // Flatten the object to make it CSV-friendly
        const flattenedData = flattenObject(videoData);
        allVideos.push(flattenedData);
        
        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(`⏳ Processed ${processedCount} videos...`);
        }
      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error);
      }
    });
    
    console.log(`✅ Processed all ${processedCount} videos`);
    
    // Convert to CSV
    console.log('📝 Converting to CSV format...');
    const csvData = convertToCSV(allVideos);
    
    // Create output filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputDir = path.join(__dirname, '..', 'exports');
    const outputFile = path.join(outputDir, `videos-master-export-${timestamp}.csv`);
    
    // Ensure export directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write CSV file
    fs.writeFileSync(outputFile, csvData, 'utf8');
    
    console.log(`🎉 Export completed successfully!`);
    console.log(`📁 File saved to: ${outputFile}`);
    console.log(`📊 Total records exported: ${allVideos.length}`);
    
    // Display some sample columns
    if (allVideos.length > 0) {
      const sampleColumns = Object.keys(allVideos[0]);
      console.log(`\n📋 Sample columns (showing first 10):`);
      sampleColumns.slice(0, 10).forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });
      if (sampleColumns.length > 10) {
        console.log(`   ... and ${sampleColumns.length - 10} more columns`);
      }
    }
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Run the export
if (require.main === module) {
  exportVideosToCSV()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { exportVideosToCSV }; 