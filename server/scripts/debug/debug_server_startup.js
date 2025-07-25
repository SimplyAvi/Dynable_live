/**
 * Server Startup Diagnostic Tool
 * 
 * This script guides proper server startup process and identifies
 * startup issues that might be causing SimplyAvi's problems.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = util.promisify(exec);

const debugServerStartup = async () => {
  console.log('🔍 SERVER STARTUP DIAGNOSTIC TOOL\n');
  console.log('Analyzing server startup process...\n');

  try {
    // Test 1: Check current directory and package.json
    console.log('🧪 Test 1: Project Structure Check');
    const structureCheck = await checkProjectStructure();
    console.log(`  Current directory: ${structureCheck.currentDir}`);
    console.log(`  Package.json exists: ${structureCheck.packageJsonExists ? '✅ YES' : '❌ NO'}`);
    console.log(`  Server directory exists: ${structureCheck.serverDirExists ? '✅ YES' : '❌ NO'}`);
    console.log(`  Node modules exist: ${structureCheck.nodeModulesExists ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Test 2: Check for running processes
    console.log('🧪 Test 2: Running Process Check');
    const processCheck = await checkRunningProcesses();
    console.log(`  Node processes running: ${processCheck.nodeProcesses.length}`);
    console.log(`  Port 5001 in use: ${processCheck.port5001InUse ? '✅ YES' : '❌ NO'}`);
    if (processCheck.nodeProcesses.length > 0) {
      console.log('  Running Node processes:');
      processCheck.nodeProcesses.forEach(proc => {
        console.log(`    PID ${proc.pid}: ${proc.command}`);
      });
    }
    console.log('');

    // Test 3: Check package.json scripts
    console.log('🧪 Test 3: Package.json Scripts Check');
    const scriptsCheck = await checkPackageScripts();
    console.log(`  Dev script exists: ${scriptsCheck.devScript ? '✅ YES' : '❌ NO'}`);
    console.log(`  Start script exists: ${scriptsCheck.startScript ? '✅ YES' : '❌ NO'}`);
    console.log(`  Available scripts: ${scriptsCheck.availableScripts.join(', ')}`);
    console.log('');

    // Test 4: Check dependencies
    console.log('🧪 Test 4: Dependencies Check');
    const depsCheck = await checkDependencies();
    console.log(`  All dependencies installed: ${depsCheck.allInstalled ? '✅ YES' : '❌ NO'}`);
    if (!depsCheck.allInstalled) {
      console.log('  Missing dependencies:');
      depsCheck.missing.forEach(dep => {
        console.log(`    - ${dep}`);
      });
    }
    console.log('');

    // Test 5: Check environment files
    console.log('🧪 Test 5: Environment Files Check');
    const envCheck = await checkEnvironmentFiles();
    console.log(`  Root .env exists: ${envCheck.rootEnv ? '✅ YES' : '❌ NO'}`);
    console.log(`  Server .env exists: ${envCheck.serverEnv ? '✅ YES' : '❌ NO'}`);
    console.log(`  Env.example exists: ${envCheck.envExample ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Test 6: Test server startup
    console.log('🧪 Test 6: Server Startup Test');
    const startupTest = await testServerStartup();
    console.log(`  Server startup test: ${startupTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!startupTest.success) {
      console.log(`  Error: ${startupTest.error}`);
    } else {
      console.log(`  Server started successfully`);
      console.log(`  Process ID: ${startupTest.pid}`);
      console.log(`  Port: ${startupTest.port}`);
    }
    console.log('');

    // Summary and recommendations
    console.log('📊 SERVER STARTUP DIAGNOSTIC SUMMARY:');
    console.log(`  Project structure: ${structureCheck.packageJsonExists && structureCheck.serverDirExists ? '✅' : '❌'}`);
    console.log(`  Running processes: ${processCheck.port5001InUse ? '✅' : '❌'}`);
    console.log(`  Package scripts: ${scriptsCheck.devScript ? '✅' : '❌'}`);
    console.log(`  Dependencies: ${depsCheck.allInstalled ? '✅' : '❌'}`);
    console.log(`  Environment files: ${envCheck.rootEnv && envCheck.serverEnv ? '✅' : '❌'}`);
    console.log(`  Server startup: ${startupTest.success ? '✅' : '❌'}`);
    console.log('');

    // Provide specific recommendations
    if (!structureCheck.packageJsonExists) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Not in correct directory');
      console.log('💡 SOLUTION: Navigate to project root');
      console.log('   cd /Users/justinlinzan/dynable_new');
    } else if (!depsCheck.allInstalled) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Missing dependencies');
      console.log('💡 SOLUTION: Install dependencies');
      console.log('   npm install');
    } else if (!envCheck.rootEnv || !envCheck.serverEnv) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Missing environment files');
      console.log('💡 SOLUTION: Create .env files');
      console.log('   cp env.example .env');
      console.log('   cd server && cp ../env.example .env');
    } else if (!startupTest.success) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Server startup failing');
      console.log('💡 SOLUTION: Check server logs and configuration');
      console.log('   cd server && npm run dev');
    } else {
      console.log('✅ Server startup appears to be working correctly');
      console.log('💡 If SimplyAvi is still having issues, check:');
      console.log('   - Frontend configuration');
      console.log('   - Network connectivity');
      console.log('   - Browser console errors');
    }

    // Provide startup commands
    console.log('\n🚀 RECOMMENDED STARTUP COMMANDS:');
    console.log('1. Navigate to project root:');
    console.log('   cd /Users/justinlinzan/dynable_new');
    console.log('');
    console.log('2. Install dependencies (if needed):');
    console.log('   npm install');
    console.log('   cd server && npm install');
    console.log('');
    console.log('3. Start the backend server:');
    console.log('   cd server && npm run dev');
    console.log('');
    console.log('4. In a new terminal, start the frontend:');
    console.log('   npm start');
    console.log('');

  } catch (error) {
    console.error('❌ Server startup diagnostic failed:', error.message);
  }
};

// Helper functions
async function checkProjectStructure() {
  const currentDir = process.cwd();
  const packageJsonExists = fs.existsSync(path.join(currentDir, 'package.json'));
  const serverDirExists = fs.existsSync(path.join(currentDir, 'server'));
  const nodeModulesExists = fs.existsSync(path.join(currentDir, 'node_modules'));
  
  return {
    currentDir,
    packageJsonExists,
    serverDirExists,
    nodeModulesExists
  };
}

async function checkRunningProcesses() {
  try {
    // Check for Node processes
    const { stdout: nodeProcesses } = await execAsync("ps aux | grep -E '(node|npm|nodemon)' | grep -v grep");
    const processes = nodeProcesses.trim().split('\n').map(line => {
      const parts = line.split(/\s+/);
      return {
        pid: parts[1],
        command: line
      };
    });

    // Check if port 5001 is in use
    let port5001InUse = false;
    try {
      const { stdout: portCheck } = await execAsync("lsof -i :5001");
      port5001InUse = portCheck.trim().length > 0;
    } catch (error) {
      port5001InUse = false;
    }

    return {
      nodeProcesses: processes,
      port5001InUse
    };
  } catch (error) {
    return {
      nodeProcesses: [],
      port5001InUse: false
    };
  }
}

async function checkPackageScripts() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      return {
        devScript: false,
        startScript: false,
        availableScripts: []
      };
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};

    return {
      devScript: !!scripts.dev,
      startScript: !!scripts.start,
      availableScripts: Object.keys(scripts)
    };
  } catch (error) {
    return {
      devScript: false,
      startScript: false,
      availableScripts: []
    };
  }
}

async function checkDependencies() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      return {
        allInstalled: false,
        missing: ['package.json not found']
      };
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const missing = [];

    for (const [dep, version] of Object.entries(dependencies)) {
      const depPath = path.join(process.cwd(), 'node_modules', dep);
      if (!fs.existsSync(depPath)) {
        missing.push(dep);
      }
    }

    return {
      allInstalled: missing.length === 0,
      missing
    };
  } catch (error) {
    return {
      allInstalled: false,
      missing: [error.message]
    };
  }
}

async function checkEnvironmentFiles() {
  const rootEnv = fs.existsSync(path.join(process.cwd(), '.env'));
  const serverEnv = fs.existsSync(path.join(process.cwd(), 'server', '.env'));
  const envExample = fs.existsSync(path.join(process.cwd(), 'env.example'));

  return {
    rootEnv,
    serverEnv,
    envExample
  };
}

async function testServerStartup() {
  try {
    // Check if server is already running
    const { stdout: portCheck } = await execAsync("lsof -i :5001");
    if (portCheck.trim().length > 0) {
      return {
        success: true,
        pid: 'Already running',
        port: 5001
      };
    }

    // Try to start server in background
    const serverDir = path.join(process.cwd(), 'server');
    if (!fs.existsSync(serverDir)) {
      return {
        success: false,
        error: 'Server directory not found'
      };
    }

    // Start server with timeout
    const { stdout, stderr } = await execAsync('cd server && timeout 10s npm run dev', {
      timeout: 15000
    });

    // Check if server started successfully
    await new Promise(resolve => setTimeout(resolve, 2000));
    const { stdout: finalPortCheck } = await execAsync("lsof -i :5001");
    
    if (finalPortCheck.trim().length > 0) {
      return {
        success: true,
        pid: 'Started successfully',
        port: 5001
      };
    } else {
      return {
        success: false,
        error: 'Server failed to start or timeout'
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the diagnostic
debugServerStartup(); 