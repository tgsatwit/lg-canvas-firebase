const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

async function testConnection() {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    // Initialize Firebase Admin
    const serviceAccount = getServiceAccount();
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    
    // Get Firestore instance for the pbl-backend database
    const db = getFirestore(app, 'pbl-backend');
    console.log('✅ Connected to pbl-backend database');
    
    // Test query to count documents
    console.log('📊 Counting videos in videos-master collection...');
    const collectionRef = db.collection('videos-master');
    const snapshot = await collectionRef.count().get();
    
    const count = snapshot.data().count;
    console.log(`📹 Found ${count} videos in the collection`);
    
    // Get first few documents to show sample data
    if (count > 0) {
      console.log('\n📋 Fetching sample documents...');
      const sampleQuery = await collectionRef.limit(3).get();
      
      sampleQuery.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n📄 Sample Video ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Name: ${data.name || 'N/A'}`);
        console.log(`   Vimeo ID: ${data.vimeoId || 'N/A'}`);
        console.log(`   Created: ${data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : 'N/A'}`);
        console.log(`   Confirmed: ${data.confirmed || false}`);
        
        // Show top-level fields
        const fields = Object.keys(data);
        if (fields.length > 10) {
          console.log(`   Fields (${fields.length} total): ${fields.slice(0, 10).join(', ')}...`);
        } else {
          console.log(`   Fields: ${fields.join(', ')}`);
        }
      });
    }
    
    console.log(`\n✅ Connection test completed successfully!`);
    console.log(`🚀 Ready to export ${count} videos to CSV`);
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testConnection()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testConnection }; 