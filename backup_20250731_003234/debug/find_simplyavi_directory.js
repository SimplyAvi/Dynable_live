/**
 * Find SimplyAvi's Actual Project Directory
 * 
 * This script helps identify where SimplyAvi is actually running
 * the application from and sync our changes to the correct location.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const findSimplyAviDirectory = async () => {
  console.log('🔍 FINDING SIMPLYAVI\'S ACTUAL PROJECT DIRECTORY\n');
  console.log('This will help us identify where the app is actually running from...\n');

  try {
    // Check current directory
    const currentDir = process.cwd();
    console.log('📁 Current directory:', currentDir);
    console.log('');

    // Check if this looks like the right project
    console.log('🧪 Test 1: Project Structure Check');
    const projectStructure = await checkProjectStructure(currentDir);
    console.log(`  Package.json exists: ${projectStructure.packageJson ? '✅ YES' : '❌ NO'}`);
    console.log(`  Server directory exists: ${projectStructure.serverDir ? '✅ YES' : '❌ NO'}`);
    console.log(`  Src directory exists: ${projectStructure.srcDir ? '✅ YES' : '❌ NO'}`);
    console.log(`  Node modules exist: ${projectStructure.nodeModules ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Check for running processes
    console.log('🧪 Test 2: Running Process Check');
    const runningProcesses = await checkRunningProcesses();
    console.log(`  Node processes running: ${runningProcesses.nodeProcesses.length}`);
    console.log(`  Port 3000 in use: ${runningProcesses.port3000InUse ? '✅ YES' : '❌ NO'}`);
    console.log(`  Port 5001 in use: ${runningProcesses.port5001InUse ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Check for other possible directories
    console.log('🧪 Test 3: Other Possible Directories');
    const otherDirectories = await checkOtherDirectories();
    console.log('  Checking for other dynable directories:');
    otherDirectories.forEach(dir => {
      console.log(`    ${dir.path}: ${dir.exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      if (dir.exists) {
        console.log(`      Package.json: ${dir.hasPackageJson ? '✅ YES' : '❌ NO'}`);
        console.log(`      Server dir: ${dir.hasServerDir ? '✅ YES' : '❌ NO'}`);
      }
    });
    console.log('');

    // Check if this is the right project
    console.log('🧪 Test 4: Project Validation');
    const projectValidation = await validateProject(currentDir);
    console.log(`  This looks like the right project: ${projectValidation.isRightProject ? '✅ YES' : '❌ NO'}`);
    if (projectValidation.isRightProject) {
      console.log(`  Project name: ${projectValidation.projectName}`);
      console.log(`  Has React app: ${projectValidation.hasReactApp ? '✅ YES' : '❌ NO'}`);
      console.log(`  Has backend: ${projectValidation.hasBackend ? '✅ YES' : '❌ NO'}`);
    }
    console.log('');

    // Summary and recommendations
    console.log('📊 DIRECTORY ANALYSIS SUMMARY:');
    console.log(`  Current directory valid: ${projectStructure.packageJson && projectStructure.serverDir ? '✅' : '❌'}`);
    console.log(`  Running processes found: ${runningProcesses.nodeProcesses.length > 0 ? '✅' : '❌'}`);
    console.log(`  Other directories found: ${otherDirectories.filter(d => d.exists).length}`);
    console.log(`  This is the right project: ${projectValidation.isRightProject ? '✅' : '❌'}`);
    console.log('');

    if (projectValidation.isRightProject) {
      console.log('✅ This appears to be the correct project directory!');
      console.log('💡 SimplyAvi should run diagnostics from this location.');
    } else {
      console.log('❌ This may not be the correct project directory.');
      console.log('💡 We need to find where SimplyAvi is actually running the app from.');
      
      if (otherDirectories.filter(d => d.exists).length > 0) {
        console.log('🔍 Found other possible directories:');
        otherDirectories.filter(d => d.exists).forEach(dir => {
          console.log(`   - ${dir.path}`);
        });
      }
    }

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. SimplyAvi should run this same script from his actual project directory');
    console.log('2. We need to identify which directory has the running application');
    console.log('3. We need to sync our working changes to the correct directory');
    console.log('4. Update all diagnostic commands with the correct paths');

  } catch (error) {
    console.error('❌ Directory analysis failed:', error.message);
  }
};

// Helper functions
async function checkProjectStructure(dir) {
  const packageJson = fs.existsSync(path.join(dir, 'package.json'));
  const serverDir = fs.existsSync(path.join(dir, 'server'));
  const srcDir = fs.existsSync(path.join(dir, 'src'));
  const nodeModules = fs.existsSync(path.join(dir, 'node_modules'));
  
  return {
    packageJson,
    serverDir,
    srcDir,
    nodeModules
  };
}

async function checkRunningProcesses() {
  try {
    // Check for Node processes
    const { stdout: nodeProcesses } = await execAsync("ps aux | grep -E '(node|npm|nodemon)' | grep -v grep");
    const processes = nodeProcesses.trim().split('\n').filter(line => line.length > 0);

    // Check if ports are in use
    let port3000InUse = false;
    let port5001InUse = false;
    
    try {
      const { stdout: port3000Check } = await execAsync("lsof -i :3000");
      port3000InUse = port3000Check.trim().length > 0;
    } catch (error) {
      port3000InUse = false;
    }
    
    try {
      const { stdout: port5001Check } = await execAsync("lsof -i :5001");
      port5001InUse = port5001Check.trim().length > 0;
    } catch (error) {
      port5001InUse = false;
    }

    return {
      nodeProcesses: processes,
      port3000InUse,
      port5001InUse
    };
  } catch (error) {
    return {
      nodeProcesses: [],
      port3000InUse: false,
      port5001InUse: false
    };
  }
}

async function checkOtherDirectories() {
  const possiblePaths = [
    '/Users/justinlinzan/dynable_live',
    '/Users/justinlinzan/dynable',
    '/Users/justinlinzan/projects/dynable',
    '/Users/justinlinzan/Desktop/dynable',
    '/Users/justinlinzan/Documents/dynable'
  ];

  const results = [];
  
  for (const dirPath of possiblePaths) {
    const exists = fs.existsSync(dirPath);
    let hasPackageJson = false;
    let hasServerDir = false;
    
    if (exists) {
      hasPackageJson = fs.existsSync(path.join(dirPath, 'package.json'));
      hasServerDir = fs.existsSync(path.join(dirPath, 'server'));
    }
    
    results.push({
      path: dirPath,
      exists,
      hasPackageJson,
      hasServerDir
    });
  }
  
  return results;
}

async function validateProject(dir) {
  try {
    // Check if this looks like a React app with backend
    const packageJsonPath = path.join(dir, 'package.json');
    const serverDirPath = path.join(dir, 'server');
    const srcDirPath = path.join(dir, 'src');
    
    const hasPackageJson = fs.existsSync(packageJsonPath);
    const hasServerDir = fs.existsSync(serverDirPath);
    const hasSrcDir = fs.existsSync(srcDirPath);
    
    let projectName = 'Unknown';
    let hasReactApp = false;
    let hasBackend = false;
    
    if (hasPackageJson) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        projectName = packageJson.name || 'Unknown';
        hasReactApp = packageJson.dependencies && (packageJson.dependencies.react || packageJson.dependencies['react-scripts']);
      } catch (error) {
        // Ignore JSON parse errors
      }
    }
    
    if (hasServerDir) {
      const serverPackageJson = path.join(serverDirPath, 'package.json');
      hasBackend = fs.existsSync(serverPackageJson);
    }
    
    const isRightProject = hasPackageJson && hasServerDir && hasSrcDir;
    
    return {
      isRightProject,
      projectName,
      hasReactApp,
      hasBackend
    };
  } catch (error) {
    return {
      isRightProject: false,
      projectName: 'Unknown',
      hasReactApp: false,
      hasBackend: false
    };
  }
}

// Run the analysis
findSimplyAviDirectory(); 