#!/usr/bin/env node
/**
 * Syncs all task files with GitHub issues
 * Usage: node sync-task-issues.js [--changed-only]
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Validate required environment variables
if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN or GH_TOKEN environment variable is required');
  console.error('   Set it in your .env file or export it in your shell');
  console.error('   Get token from: https://github.com/settings/tokens');
  console.error('   Required scopes: repo, read:org, read:project, write:project');
  process.exit(1);
}

// Set token for gh CLI if not already set
if (process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
  process.env.GH_TOKEN = process.env.GITHUB_TOKEN;
}

const CHANGED_ONLY = process.argv.includes('--changed-only');
const BATCH_SIZE = 10;
const DELAY_MS = 2000;
const BATCH_DELAY_MS = 10000;

// Import parseTaskFile and syncTaskWithIssue from create-task-issue.js
// For simplicity, we'll duplicate the parsing logic here
function parseTaskFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const metadata = {};
    let inMetadata = false;
    let problem = '';
    let goal = '';
    let inProblem = false;
    let inGoal = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '## Metadata') {
        inMetadata = true;
        continue;
      }
      
      if (inMetadata && line.startsWith('##')) {
        inMetadata = false;
      }
      
      if (inMetadata && line.startsWith('- ')) {
        const match = line.match(/^- (\w+(?:\s+\w+)?): (.+)$/);
        if (match) {
          const key = match[1].toLowerCase().replace(/\s+/g, '_');
          metadata[key] = match[2].trim();
        }
      }
      
      if (line === '## Problem') {
        inProblem = true;
        continue;
      }
      
      if (inProblem && line.startsWith('##') && line !== '## Problem') {
        inProblem = false;
      }
      
      if (inProblem && line && !line.startsWith('##')) {
        problem += line + '\n';
      }
      
      if (line === '## Goal') {
        inGoal = true;
        continue;
      }
      
      if (inGoal && line.startsWith('##') && line !== '## Goal') {
        inGoal = false;
      }
      
      if (inGoal && line && !line.startsWith('##')) {
        goal += line + '\n';
      }
    }
    
    const taskName = path.basename(filePath, '.md');
    const taskTitle = content.split('\n')[0].replace(/^#\s*TASK-[^:]+:\s*/, '').trim();
    
    return {
      taskName,
      taskTitle,
      metadata,
      problem: problem.trim(),
      goal: goal.trim(),
      filePath
    };
  } catch (error) {
    return null;
  }
}

function findTaskFiles() {
  const taskDirs = [
    'src/documentation/agile.role',
    'src/documentation/deliver',
    'src/documentation/overdue'
  ];
  
  const taskFiles = [];
  
  function walkDir(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.startsWith('TASK-') && file.endsWith('.md')) {
        taskFiles.push(filePath);
      }
    }
  }
  
  taskDirs.forEach(walkDir);
  return taskFiles;
}

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
    return output.split('\n').filter(line => 
      line.includes('TASK-') && line.endsWith('.md')
    );
  } catch (error) {
    return [];
  }
}

async function processTaskFile(filePath) {
  try {
    const task = parseTaskFile(filePath);
    if (!task) {
      return { file: filePath, status: 'error', message: 'Failed to parse' };
    }
    
    // Call create-task-issue.js script
    const result = execSync(
      `node ${path.join(__dirname, 'create-task-issue.js')} "${filePath}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    return { file: filePath, status: 'success', message: result.trim() };
  } catch (error) {
    return { file: filePath, status: 'error', message: error.message };
  }
}

async function processTasksInBatches(taskFiles) {
  const results = [];
  const total = taskFiles.length;
  
  for (let i = 0; i < taskFiles.length; i += BATCH_SIZE) {
    const batch = taskFiles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(total / BATCH_SIZE);
    
    console.log(`\nProcessing batch ${batchNum}/${totalBatches} (${batch.length} tasks)...`);
    
    const batchResults = await Promise.all(
      batch.map(async (file, idx) => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS * idx));
        return await processTaskFile(file);
      })
    );
    
    results.push(...batchResults);
    
    // Summary for this batch
    const success = batchResults.filter(r => r.status === 'success').length;
    const errors = batchResults.filter(r => r.status === 'error').length;
    console.log(`Batch ${batchNum}: ${success} success, ${errors} errors`);
    
    // Longer delay between batches
    if (i + BATCH_SIZE < taskFiles.length) {
      console.log(`Waiting ${BATCH_DELAY_MS / 1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
  
  return results;
}

async function main() {
  let taskFiles;
  
  if (CHANGED_ONLY) {
    console.log('Finding changed task files...');
    const changed = getChangedFiles();
    taskFiles = changed.filter(f => fs.existsSync(f));
    console.log(`Found ${taskFiles.length} changed task files`);
  } else {
    console.log('Finding all task files...');
    taskFiles = findTaskFiles();
    console.log(`Found ${taskFiles.length} task files`);
  }
  
  if (taskFiles.length === 0) {
    console.log('No task files to process');
    return;
  }
  
  console.log(`\nProcessing ${taskFiles.length} tasks in batches of ${BATCH_SIZE}...`);
  
  const results = await processTasksInBatches(taskFiles);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  
  const success = results.filter(r => r.status === 'success').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log(`Total processed: ${results.length}`);
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Errors: ${errors}`);
  
  if (errors > 0) {
    console.log('\nErrors:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`  - ${r.file}: ${r.message}`);
    });
  }
}

main().catch(console.error);

