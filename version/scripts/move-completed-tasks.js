#!/usr/bin/env node
/**
 * Automatically moves completed tasks (Status: DONE) to deliver directory
 * Organized by owner and month
 * Usage: node move-completed-tasks.js
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');

// Task directories to scan
const TASK_DIRS = [
  'src/documentation/agile.role/aaron',
  'src/documentation/agile.role/justine',
  'src/documentation/agile.role/tristan'
];

// Parse task file metadata
function parseTaskFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const metadata = {};
    let inMetadata = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '## Metadata') {
        inMetadata = true;
        continue;
      }
      
      if (inMetadata && trimmed.startsWith('##')) {
        break;
      }
      
      if (inMetadata && trimmed.startsWith('- ')) {
        const match = trimmed.match(/^- (\w+(?:\s+\w+)?): (.+)$/);
        if (match) {
          const key = match[1].toLowerCase().replace(/\s+/g, '_');
          metadata[key] = match[2].trim();
        }
      }
    }
    
    return {
      status: metadata.status,
      assignee: metadata.assignee,
      month: metadata.month,
      filePath
    };
  } catch (error) {
    return null;
  }
}

// Extract month number from month string
function extractMonthNumber(month) {
  if (!month) return null;
  
  // Try format: "Month 1 (October 2025)" or "Month 3"
  const match = month.match(/Month (\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Try format: "1 (October 2025)" or just "1"
  const altMatch = month.match(/^(\d+)/);
  if (altMatch) {
    return parseInt(altMatch[1]);
  }
  
  return null;
}

// Get owner directory name from assignee
function getOwnerDir(assignee) {
  const ownerMap = {
    'Aaron': 'aaron',
    'ArhonJay': 'aaron',
    'Justine': 'justine',
    'Tristan': 'tristan'
  };
  
  return ownerMap[assignee] || assignee.toLowerCase();
}

// Move task file to deliver directory
function moveTaskToDeliver(taskData, fileName) {
  const monthNum = extractMonthNumber(taskData.month);
  if (!monthNum) {
    console.warn(`⚠️  Cannot determine month for ${fileName}, skipping...`);
    return false;
  }
  
  const ownerDir = getOwnerDir(taskData.assignee);
  if (!ownerDir) {
    console.warn(`⚠️  Cannot determine owner for ${fileName}, skipping...`);
    return false;
  }
  
  const deliverDir = path.join(__dirname, '../../src/documentation/deliver', `month-${monthNum}`, ownerDir);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(deliverDir)) {
    fs.mkdirSync(deliverDir, { recursive: true });
    console.log(`✅ Created directory: ${deliverDir}`);
  }
  
  const sourcePath = taskData.filePath;
  const destPath = path.join(deliverDir, fileName);
  
  // Check if file already exists in deliver
  if (fs.existsSync(destPath)) {
    console.log(`⏭️  File already in deliver: ${fileName}`);
    return false;
  }
  
  try {
    // Move file
    fs.renameSync(sourcePath, destPath);
    console.log(`✅ Moved ${fileName} to deliver/month-${monthNum}/${ownerDir}/`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to move ${fileName}: ${error.message}`);
    return false;
  }
}

// Main function
function moveCompletedTasks() {
  console.log('Scanning for completed tasks (Status: DONE)...\n');
  
  let scanned = 0;
  let moved = 0;
  let skipped = 0;
  
  for (const taskDir of TASK_DIRS) {
    const fullPath = path.join(__dirname, '../../', taskDir);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    
    const files = fs.readdirSync(fullPath);
    for (const file of files) {
      if (!file.startsWith('TASK-') || !file.endsWith('.md')) {
        continue;
      }
      
      const filePath = path.join(fullPath, file);
      const taskData = parseTaskFile(filePath);
      
      if (!taskData) {
        continue;
      }
      
      scanned++;
      
      // Check if task is DONE and has assignee
      if (taskData.status === 'DONE' && taskData.assignee) {
        if (moveTaskToDeliver(taskData, file)) {
          moved++;
        } else {
          skipped++;
        }
      }
    }
  }
  
  console.log(`\n✅ Scan complete!`);
  console.log(`   - ${scanned} tasks scanned`);
  console.log(`   - ${moved} tasks moved to deliver/`);
  console.log(`   - ${skipped} tasks skipped (already in deliver or missing data)`);
}

// Run
moveCompletedTasks();

