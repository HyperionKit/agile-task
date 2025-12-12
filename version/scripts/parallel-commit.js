#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const config = {
  maxConcurrentCommits: 5,
  dryRun: false,
  excludePatterns: [
    'node_modules/**',
    '.git/**',
    '*.log',
    '*.tmp',
    '.DS_Store',
    'Thumbs.db'
  ],
  // Task-aware paths
  taskPaths: {
    active: 'src/documentation/agile.role',
    deliver: 'src/documentation/deliver',
    overdue: 'src/documentation/overdue',
    reference: 'src/documentation/reference'
  },
  // Task file pattern: TASK-S[Sprint]-[Number]-[description].md
  taskPattern: /TASK-S(\d+)-(\d+)-(.+)\.md$/
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getChangedFiles() {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf8' });
    return output
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3).replace(/^["']|["']$/g, '');
        return { status, file };
      })
      .filter(({ file }) => {
        return !config.excludePatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
          return regex.test(file);
        });
      });
  } catch (error) {
    log('Error getting git status:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Parse task file to extract metadata
function parseTaskFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const metadata = {};
    
    // Extract assignee
    const assigneeMatch = content.match(/Assignee:\s*(\w+)/i);
    if (assigneeMatch) metadata.assignee = assigneeMatch[1];
    
    // Extract status
    const statusMatch = content.match(/Status:\s*(\w+)/i);
    if (statusMatch) metadata.status = statusMatch[1];
    
    // Extract priority
    const priorityMatch = content.match(/Priority:\s*(P\d)/i);
    if (priorityMatch) metadata.priority = priorityMatch[1];
    
    // Extract sprint
    const sprintMatch = content.match(/Sprint:\s*(\d+)/i);
    if (sprintMatch) metadata.sprint = sprintMatch[1];
    
    return metadata;
  } catch {
    return null;
  }
}

// Generate task-aware commit message
function getCommitMessage(file, status) {
  const fileName = path.basename(file);
  const dirPath = path.dirname(file);
  const dirName = dirPath.split(/[/\\]/).pop();
  
  // Check if this is a task file
  const taskMatch = fileName.match(config.taskPattern);
  
  if (taskMatch) {
    const [, sprint, taskNum, description] = taskMatch;
    const taskId = `TASK-S${sprint}-${taskNum}`;
    const taskDesc = description.replace(/-/g, ' ');
    
    // Determine task action based on file location and status
    if (dirPath.includes(config.taskPaths.deliver)) {
      return `task(${taskId}): complete ${taskDesc}`;
    }
    if (dirPath.includes(config.taskPaths.overdue)) {
      return `task(${taskId}): [P0] escalate ${taskDesc}`;
    }
    if (status.includes('A')) {
      return `task(${taskId}): create ${taskDesc}`;
    }
    if (status.includes('D')) {
      return `task(${taskId}): archive ${taskDesc}`;
    }
    
    // Check file content for status changes
    const metadata = parseTaskFile(file);
    if (metadata) {
      if (metadata.status === 'DONE' || metadata.status === 'REVIEW') {
        return `task(${taskId}): update status to ${metadata.status}`;
      }
      if (metadata.status === 'IN_PROGRESS') {
        return `task(${taskId}): start work on ${taskDesc}`;
      }
    }
    
    return `task(${taskId}): update ${taskDesc}`;
  }
  
  // Check for sprint/template files
  if (fileName === 'SPRINT_OVERVIEW.md') {
    return `sprint: update sprint overview`;
  }
  if (fileName === 'TASK_TEMPLATE.md') {
    return `docs: update task template`;
  }
  
  // Check for reference docs
  if (dirPath.includes(config.taskPaths.reference)) {
    if (status.includes('A')) {
      return `docs: add reference ${fileName}`;
    }
    return `docs: update reference ${fileName}`;
  }
  
  // Check for deliver folder
  if (dirPath.includes(config.taskPaths.deliver)) {
    return `deliver: archive ${fileName}`;
  }
  
  // Standard commit messages for other files
  if (status.includes('A')) {
    return `feat: add ${fileName}${dirName && dirName !== '.' ? ` in ${dirName}` : ''}`;
  }
  if (status.includes('M')) {
    return `update: modify ${fileName}${dirName && dirName !== '.' ? ` in ${dirName}` : ''}`;
  }
  if (status.includes('D')) {
    return `remove: delete ${fileName}`;
  }
  if (status.includes('R')) {
    return `refactor: rename ${fileName}`;
  }
  
  return `chore: update ${fileName}`;
}

// Get file category for grouping
function getFileCategory(file) {
  if (file.includes(config.taskPaths.overdue)) return 'overdue';
  if (file.includes(config.taskPaths.deliver)) return 'deliver';
  if (file.includes(config.taskPaths.active)) return 'tasks';
  if (file.includes(config.taskPaths.reference)) return 'reference';
  if (file.includes('.github')) return 'ci';
  if (file.includes('version/scripts')) return 'scripts';
  return 'other';
}

function commitFile(file, status) {
  return new Promise((resolve, reject) => {
    const commitMessage = getCommitMessage(file, status);
    
    if (config.dryRun) {
      log(`[DRY RUN] Would commit: "${file}"`, 'yellow');
      log(`          Message: "${commitMessage}"`, 'cyan');
      resolve({ file, success: true, message: commitMessage });
      return;
    }
    
    try {
      execSync(`git add "${file}"`, { stdio: 'pipe' });
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
      
      log(`Committed: "${file}"`, 'green');
      log(`  Message: "${commitMessage}"`, 'cyan');
      resolve({ file, success: true, message: commitMessage });
    } catch (error) {
      log(`Failed to commit "${file}": ${error.message}`, 'red');
      reject({ file, success: false, error: error.message });
    }
  });
}

function processCommitsInBatches(files) {
  const batches = [];
  for (let i = 0; i < files.length; i += config.maxConcurrentCommits) {
    batches.push(files.slice(i, i + config.maxConcurrentCommits));
  }
  
  return batches.reduce((promise, batch, batchIndex) => {
    return promise.then(() => {
      log(`\nBatch ${batchIndex + 1}/${batches.length} (${batch.length} files)`, 'cyan');
      
      const promises = batch.map(({ file, status }) => commitFile(file, status));
      
      return Promise.allSettled(promises).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        log(`Batch complete: ${successful} success, ${failed} failed`, 
            failed > 0 ? 'yellow' : 'green');
        
        return results;
      });
    });
  }, Promise.resolve());
}

function showSummary(results, categories) {
  const allResults = results.flat();
  const successful = allResults.filter(r => r.status === 'fulfilled' && r.value.success);
  const failed = allResults.filter(r => r.status === 'rejected');
  
  log('\n========================================', 'bright');
  log('COMMIT SUMMARY', 'bright');
  log('========================================', 'bright');
  
  log(`\nTotal: ${allResults.length} files`, 'blue');
  log(`Success: ${successful.length}`, 'green');
  if (failed.length > 0) {
    log(`Failed: ${failed.length}`, 'red');
  }
  
  log('\nBy Category:', 'bright');
  Object.entries(categories).forEach(([cat, count]) => {
    const icon = {
      overdue: 'P0',
      tasks: 'TASK',
      deliver: 'DONE',
      reference: 'DOCS',
      ci: 'CI',
      scripts: 'SCRIPT',
      other: 'OTHER'
    }[cat] || cat;
    log(`  [${icon}] ${count} files`, 'blue');
  });
  
  if (failed.length > 0) {
    log('\nFailed files:', 'red');
    failed.forEach(result => {
      log(`  - ${result.reason.file}`, 'red');
    });
  }
}

async function main() {
  log('========================================', 'bright');
  log('HyperKit Parallel Commit', 'bright');
  log('Task-Aware Version', 'cyan');
  log('========================================', 'bright');
  
  const args = process.argv.slice(2);
  if (args.includes('--dry-run')) {
    config.dryRun = true;
    log('\nDRY RUN MODE - No commits will be made', 'yellow');
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    log('\nUsage: node parallel-commit.js [options]', 'cyan');
    log('\nOptions:', 'cyan');
    log('  --dry-run    Preview commits without executing', 'cyan');
    log('  --help, -h   Show this help message', 'cyan');
    log('\nTask-Aware Features:', 'cyan');
    log('  - Detects TASK-S[X]-[XXX] files', 'cyan');
    log('  - Generates task(ID): messages', 'cyan');
    log('  - Marks P0 overdue tasks', 'cyan');
    log('  - Tracks deliver/complete moves', 'cyan');
    return;
  }
  
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
  } catch {
    log('Not in a git repository!', 'red');
    process.exit(1);
  }
  
  log('\nScanning for changes...', 'blue');
  const changedFiles = getChangedFiles();
  
  if (changedFiles.length === 0) {
    log('No changes to commit', 'green');
    return;
  }
  
  // Categorize files
  const categories = {};
  changedFiles.forEach(({ file }) => {
    const cat = getFileCategory(file);
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  log(`\nFound ${changedFiles.length} changed files:`, 'blue');
  
  // Sort: P0/overdue first, then tasks, then others
  const sortedFiles = changedFiles.sort((a, b) => {
    const catA = getFileCategory(a.file);
    const catB = getFileCategory(b.file);
    const order = { overdue: 0, tasks: 1, deliver: 2, reference: 3, ci: 4, scripts: 5, other: 6 };
    return (order[catA] || 99) - (order[catB] || 99);
  });
  
  sortedFiles.forEach(({ file, status }) => {
    const cat = getFileCategory(file);
    const icon = status.includes('A') ? '+' : 
                 status.includes('M') ? '~' : 
                 status.includes('D') ? '-' : '?';
    const catLabel = cat === 'overdue' ? '[P0]' : 
                     cat === 'tasks' ? '[TASK]' : 
                     `[${cat.toUpperCase()}]`;
    log(`  ${icon} ${catLabel} ${file}`, cat === 'overdue' ? 'red' : 'blue');
  });
  
  log(`\nProcessing commits (max ${config.maxConcurrentCommits} concurrent)...`, 'cyan');
  const results = await processCommitsInBatches(sortedFiles);
  
  showSummary(results, categories);
  
  if (!config.dryRun) {
    log('\nAll commits completed!', 'green');
  }
}

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled Rejection: ${reason}`, 'red');
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    log(`Script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, getChangedFiles, commitFile, config };
