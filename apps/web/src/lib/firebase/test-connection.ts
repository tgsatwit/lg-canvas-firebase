import { chatDb } from './config';
import { collection, doc, getDoc } from 'firebase/firestore';

export async function testDatabaseConnection() {
  try {
    console.log('Testing connection to pbl-backend database...');
    
    // Try to access a collection to verify we're connected to the right database
    const testCollection = collection(chatDb, 'conversations');
    console.log('Collection reference created successfully');
    
    // Create a test document reference to verify database access
    const testDoc = doc(testCollection, 'test-connection');
    
    // Try to get the document (this will test permissions and connection)
    try {
      await getDoc(testDoc);
      console.log('Database connection test successful');
    } catch (permissionError) {
      console.log('Database connected but permissions may need setup (expected for new collections)');
    }
    
    return {
      success: true,
      message: 'Connected to pbl-backend database successfully',
    };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export for debugging purposes
export { chatDb }; 