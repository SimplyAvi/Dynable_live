/**
 * Sync Working Changes to SimplyAvi's Directory
 * 
 * This script copies our working diagnostic tools and fixes
 * to SimplyAvi's actual project directory.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const syncToSimplyAviDirectory = async () => {
  console.log('🔄 SYNCING WORKING CHANGES TO SIMPLYAVI\'S DIRECTORY\n');
  console.log('This will copy our diagnostic tools and fixes to the correct location...\n');

  try {
    // Get current directory (our working directory)
    const currentDir = process.cwd();
    console.log('📁 Current working directory:', currentDir);
    console.log('');

    // Ask for SimplyAvi's actual directory
    console.log('🎯 ENTER SIMPLYAVI\'S ACTUAL PROJECT DIRECTORY:');
    console.log('Examples:');
    console.log('  /Users/justinlinzan/dynable_live');
    console.log('  /Users/justinlinzan/dynable');
    console.log('  /Users/justinlinzan/projects/dynable');
    console.log('');

    // For now, let's try the most likely directory
    const possibleTargets = [
      '/Users/justinlinzan/dynable_live',
      '/Users/justinlinzan/dynable',
      '/Users/justinlinzan/projects/dynable'
    ];

    console.log('🔍 Checking possible target directories:');
    for (const target of possibleTargets) {
      const exists = fs.existsSync(target);
      console.log(`  ${target}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      
      if (exists) {
        const hasServer = fs.existsSync(path.join(target, 'server'));
        const hasPackageJson = fs.existsSync(path.join(target, 'package.json'));
        console.log(`    Has server directory: ${hasServer ? '✅ YES' : '❌ NO'}`);
        console.log(`    Has package.json: ${hasPackageJson ? '✅ YES' : '❌ NO'}`);
        
        if (hasServer && hasPackageJson) {
          console.log(`    ✅ This looks like the right target!`);
          await syncToDirectory(target);
          return;
        }
      }
    }

    console.log('\n❌ No suitable target directory found automatically.');
    console.log('💡 SimplyAvi needs to tell us his actual project directory path.');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
};

async function syncToDirectory(targetDir) {
  console.log(`\n🚀 SYNCING TO: ${targetDir}`);
  console.log('');

  try {
    const targetServerDir = path.join(targetDir, 'server');
    
    // Check if target server directory exists
    if (!fs.existsSync(targetServerDir)) {
      console.log('❌ Target server directory does not exist');
      console.log(`   Expected: ${targetServerDir}`);
      return;
    }

    // Files to copy
    const filesToCopy = [
      'scripts/debug/',
      'database/migrations/',
      'database/config/',
      'server.js',
      'package.json'
    ];

    console.log('📋 Copying files:');
    for (const file of filesToCopy) {
      const sourcePath = path.join(process.cwd(), file);
      const targetPath = path.join(targetServerDir, file);
      
      if (fs.existsSync(sourcePath)) {
        try {
          // Create target directory if it doesn't exist
          const targetDirPath = path.dirname(targetPath);
          if (!fs.existsSync(targetDirPath)) {
            fs.mkdirSync(targetDirPath, { recursive: true });
          }
          
          // Copy file or directory
          if (fs.lstatSync(sourcePath).isDirectory()) {
            await copyDirectory(sourcePath, targetPath);
            console.log(`  ✅ Copied directory: ${file}`);
          } else {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`  ✅ Copied file: ${file}`);
          }
        } catch (error) {
          console.log(`  ❌ Failed to copy ${file}: ${error.message}`);
        }
      } else {
        console.log(`  ⚠️  Source not found: ${file}`);
      }
    }

    // Copy root-level files
    const rootFilesToCopy = [
      'package.json',
      'env.example',
      '.env'
    ];

    console.log('\n📋 Copying root-level files:');
    for (const file of rootFilesToCopy) {
      const sourcePath = path.join(process.cwd(), '..', file);
      const targetPath = path.join(targetDir, file);
      
      if (fs.existsSync(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`  ✅ Copied: ${file}`);
        } catch (error) {
          console.log(`  ❌ Failed to copy ${file}: ${error.message}`);
        }
      } else {
        console.log(`  ⚠️  Source not found: ${file}`);
      }
    }

    console.log('\n✅ SYNC COMPLETE!');
    console.log('');
    console.log('🚀 NEXT STEPS FOR SIMPLYAVI:');
    console.log(`1. Navigate to: ${targetDir}`);
    console.log('2. Run the diagnostic:');
    console.log(`   cd ${targetDir}/server`);
    console.log('   node scripts/debug/run_comprehensive_diagnostics.js');
    console.log('');
    console.log('3. If environment variables are missing, run:');
    console.log('   node scripts/debug/setup_env_files.js');
    console.log('');
    console.log('4. Fill in the Supabase credentials in the .env files');
    console.log('5. Restart the services');

  } catch (error) {
    console.error('❌ Sync to directory failed:', error.message);
  }
}

async function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

// Run the sync
syncToSimplyAviDirectory(); 