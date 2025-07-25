/**
 * Backend Connection Diagnostic Tool
 * 
 * This script tests if the backend server is running and accessible
 * on SimplyAvi's machine. It will help identify connection issues.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const http = require('http');
const https = require('https');
const net = require('net');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const BACKEND_URL = 'http://localhost:5001';
const BACKEND_HEALTH_ENDPOINT = '/api/health';

const debugBackendConnection = async () => {
  console.log('🔍 BACKEND CONNECTION DIAGNOSTIC TOOL\n');
  console.log('Testing backend server connectivity...\n');

  try {
    // Test 1: Check if port 5001 is listening
    console.log('🧪 Test 1: Port 5001 Availability');
    const isPortListening = await checkPortListening(5001);
    console.log(`  Port 5001 listening: ${isPortListening ? '✅ YES' : '❌ NO'}`);
    
    if (!isPortListening) {
      console.log('  ⚠️  Backend server is not running on port 5001');
      console.log('  💡 Try starting the backend: cd server && npm run dev');
    }
    console.log('');

    // Test 2: Check if backend process is running
    console.log('🧪 Test 2: Backend Process Check');
    const processInfo = await checkBackendProcess();
    console.log(`  Backend process running: ${processInfo.running ? '✅ YES' : '❌ NO'}`);
    if (processInfo.running) {
      console.log(`  Process ID: ${processInfo.pid}`);
      console.log(`  Command: ${processInfo.command}`);
    }
    console.log('');

    // Test 3: Test HTTP connection to backend
    console.log('🧪 Test 3: HTTP Connection Test');
    const httpTest = await testHttpConnection();
    console.log(`  HTTP connection: ${httpTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!httpTest.success) {
      console.log(`  Error: ${httpTest.error}`);
    }
    console.log('');

    // Test 4: Test specific API endpoints
    console.log('🧪 Test 4: API Endpoint Tests');
    const endpoints = [
      '/api/health',
      '/api/allergens/allergens',
      '/api/product/search',
      '/api/recipe/recipes'
    ];

    for (const endpoint of endpoints) {
      const endpointTest = await testEndpoint(endpoint);
      console.log(`  ${endpoint}: ${endpointTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!endpointTest.success) {
        console.log(`    Error: ${endpointTest.error}`);
      }
    }
    console.log('');

    // Test 5: Check for port conflicts
    console.log('🧪 Test 5: Port Conflict Check');
    const portConflicts = await checkPortConflicts();
    if (portConflicts.length > 0) {
      console.log('  ⚠️  Potential port conflicts found:');
      portConflicts.forEach(conflict => {
        console.log(`    Port ${conflict.port}: ${conflict.process}`);
      });
    } else {
      console.log('  ✅ No port conflicts detected');
    }
    console.log('');

    // Test 6: Network connectivity test
    console.log('🧪 Test 6: Network Connectivity');
    const networkTest = await testNetworkConnectivity();
    console.log(`  Localhost accessible: ${networkTest.localhost ? '✅ YES' : '❌ NO'}`);
    console.log(`  DNS resolution: ${networkTest.dns ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Summary and recommendations
    console.log('📊 DIAGNOSTIC SUMMARY:');
    console.log(`  Port 5001 listening: ${isPortListening ? '✅' : '❌'}`);
    console.log(`  Backend process: ${processInfo.running ? '✅' : '❌'}`);
    console.log(`  HTTP connection: ${httpTest.success ? '✅' : '❌'}`);
    console.log(`  API endpoints: ${endpoints.every(e => true) ? '✅' : '❌'}`);
    console.log(`  Network connectivity: ${networkTest.localhost ? '✅' : '❌'}`);
    console.log('');

    if (!isPortListening || !processInfo.running) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Backend server is not running');
      console.log('💡 SOLUTION: Start the backend server');
      console.log('   cd server && npm run dev');
    } else if (!httpTest.success) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Backend server is running but not responding');
      console.log('💡 SOLUTION: Check server logs for errors');
      console.log('   Check the terminal where you ran npm run dev');
    } else {
      console.log('✅ Backend connection appears to be working');
      console.log('💡 If SimplyAvi is still having issues, check:');
      console.log('   - Environment variables');
      console.log('   - Database connectivity');
      console.log('   - Frontend configuration');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
};

// Helper functions
async function checkPortListening(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, 'localhost');
  });
}

async function checkBackendProcess() {
  try {
    const { stdout } = await execAsync("ps aux | grep -E '(node|npm|nodemon)' | grep -v grep");
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      if (line.includes('5001') || line.includes('server') || line.includes('dev')) {
        const parts = line.split(/\s+/);
        return {
          running: true,
          pid: parts[1],
          command: line
        };
      }
    }
    
    return { running: false, pid: null, command: null };
  } catch (error) {
    return { running: false, pid: null, command: null };
  }
}

async function testHttpConnection() {
  return new Promise((resolve) => {
    const req = http.get(BACKEND_URL, (res) => {
      resolve({ success: true, statusCode: res.statusCode });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.get(`${BACKEND_URL}${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ success: true, statusCode: res.statusCode, data });
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function checkPortConflicts() {
  try {
    const { stdout } = await execAsync("lsof -i :5001");
    const lines = stdout.trim().split('\n').slice(1); // Skip header
    return lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        port: 5001,
        process: parts[0] || 'Unknown'
      };
    });
  } catch (error) {
    return [];
  }
}

async function testNetworkConnectivity() {
  const localhost = await checkPortListening(5001);
  
  // Test DNS resolution
  let dns = false;
  try {
    await execAsync('nslookup localhost');
    dns = true;
  } catch (error) {
    dns = false;
  }
  
  return { localhost, dns };
}

// Run the diagnostic
debugBackendConnection(); 