#!/usr/bin/env node

/**
 * YouTube Upload System Test Script
 * 
 * Quick test script to verify YouTube upload functionality
 * Run with: node scripts/test-youtube-upload.js
 */

const axios = require('axios');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.blue}=== ${message} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

async function testSystemHealth() {
  logHeader('Testing System Health');
  
  const result = await makeRequest('GET', '/api/health');
  
  if (result.success) {
    logSuccess('System health check passed');
    return true;
  } else {
    logError(`System health check failed: ${result.error}`);
    return false;
  }
}

async function testYouTubeConnection() {
  logHeader('Testing YouTube API Connection');
  
  // First, enable test mode
  logInfo('Enabling test mode...');
  const testModeResult = await makeRequest('POST', '/api/youtube/test', { testMode: true });
  
  if (testModeResult.success) {
    logSuccess('Test mode enabled');
  } else {
    logWarning('Could not enable test mode - continuing anyway');
  }
  
  // Run full test
  logInfo('Running YouTube API tests...');
  const testResult = await makeRequest('GET', '/api/youtube/test');
  
  if (testResult.success && testResult.data.success) {
    const { connection, upload } = testResult.data.results;
    
    if (connection.success) {
      logSuccess(`YouTube connection successful`);
      if (connection.user) {
        logInfo(`Channel: ${connection.user.channelTitle}`);
        logInfo(`Channel ID: ${connection.user.channelId}`);
      }
    } else {
      logError(`YouTube connection failed: ${connection.error}`);
    }
    
    if (upload.success) {
      logSuccess(`Test upload successful`);
      logInfo(`Test Video ID: ${upload.videoId}`);
    } else {
      logError(`Test upload failed: ${upload.error}`);
    }
    
    return connection.success && upload.success;
  } else {
    logError(`YouTube tests failed: ${testResult.error || 'Unknown error'}`);
    if (testResult.status === 401) {
      logWarning('Authentication required - make sure YouTube tokens are set');
    }
    return false;
  }
}

async function testUploadManagement() {
  logHeader('Testing Upload Management');
  
  // Check active uploads
  logInfo('Checking active uploads...');
  const uploadsResult = await makeRequest('GET', '/api/youtube/uploads');
  
  if (uploadsResult.success) {
    const uploadCount = uploadsResult.data.count || 0;
    logSuccess(`Found ${uploadCount} active uploads`);
    
    if (uploadCount > 0) {
      logInfo('Active uploads:');
      Object.entries(uploadsResult.data.uploads || {}).forEach(([id, upload]) => {
        log(`  - ${id}: ${upload.status} (${upload.progress}%)`);
      });
    }
    
    return true;
  } else {
    logError(`Failed to get upload status: ${uploadsResult.error}`);
    return false;
  }
}

async function testKillSwitch() {
  logHeader('Testing Kill Switch');
  
  // Test cleanup (safe operation)
  logInfo('Testing session cleanup...');
  const cleanupResult = await makeRequest('POST', '/api/youtube/uploads', { action: 'cleanup' });
  
  if (cleanupResult.success) {
    logSuccess('Session cleanup successful');
    return true;
  } else {
    logError(`Session cleanup failed: ${cleanupResult.error}`);
    return false;
  }
}

async function runAllTests() {
  logHeader('YouTube Upload System Test');
  logInfo(`Testing against: ${BASE_URL}`);
  
  const results = {
    health: false,
    youtube: false,
    uploads: false,
    killSwitch: false,
  };
  
  try {
    // Test system health
    results.health = await testSystemHealth();
    
    // Test YouTube connection
    results.youtube = await testYouTubeConnection();
    
    // Test upload management
    results.uploads = await testUploadManagement();
    
    // Test kill switch
    results.killSwitch = await testKillSwitch();
    
    // Summary
    logHeader('Test Results Summary');
    
    const tests = [
      { name: 'System Health', result: results.health },
      { name: 'YouTube API', result: results.youtube },
      { name: 'Upload Management', result: results.uploads },
      { name: 'Kill Switch', result: results.killSwitch },
    ];
    
    tests.forEach(test => {
      if (test.result) {
        logSuccess(`${test.name}: PASSED`);
      } else {
        logError(`${test.name}: FAILED`);
      }
    });
    
    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    log(`\n${colors.bright}Overall Result: ${passedCount}/${totalCount} tests passed${colors.reset}`);
    
    if (passedCount === totalCount) {
      logSuccess('🎉 All tests passed! YouTube upload system is ready.');
      process.exit(0);
    } else {
      logError('❌ Some tests failed. Check the output above for details.');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Test script error: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
YouTube Upload System Test Script

Usage: node scripts/test-youtube-upload.js [options]

Options:
  --help, -h     Show this help message
  --base-url     Set base URL (default: http://localhost:3000)

Environment Variables:
  NEXT_PUBLIC_BASE_URL    Base URL for the application

Examples:
  node scripts/test-youtube-upload.js
  node scripts/test-youtube-upload.js --base-url http://localhost:3000
  NEXT_PUBLIC_BASE_URL=https://myapp.com node scripts/test-youtube-upload.js
`);
  process.exit(0);
}

// Override base URL if provided
const baseUrlIndex = args.indexOf('--base-url');
if (baseUrlIndex !== -1 && args[baseUrlIndex + 1]) {
  BASE_URL = args[baseUrlIndex + 1];
}

// Run the tests
runAllTests(); 