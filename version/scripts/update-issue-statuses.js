#!/usr/bin/env node
/**
 * Updates GitHub issue statuses based on task file metadata
 * Usage: node update-issue-statuses.js
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
  console.error('   Required scopes: repo, read:org, project');
  process.exit(1);
}

// Set token for gh CLI if not already set
if (process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
  process.env.GH_TOKEN = process.env.GITHUB_TOKEN;
}

const REPO_NAME = process.env.GITHUB_REPO_NAME || 'HyperionKit/agile-task';

// Import parsing logic (simplified)
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
      taskName: path.basename(filePath, '.md'),
      metadata
    };
  } catch (error) {
    return null;
  }
}

function findTaskFiles() {
  const taskFiles = [];
  
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
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
  
  walkDir('src/documentation/agile.role');
  return taskFiles;
}

async function findIssueByTaskName(taskName) {
  try {
    const output = execSync(
      `gh issue list --repo ${REPO_NAME} --search "${taskName}" --json number,title,state,labels`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const issues = JSON.parse(output);
    const taskIdPattern = new RegExp(taskName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return issues.find(issue => taskIdPattern.test(issue.title));
  } catch (error) {
    return null;
  }
}

const STATUS_LABELS = {
  'BACKLOG': 'status:backlog',
  'IN_PROGRESS': 'status:in-progress',
  'REVIEW': 'status:review',
  'DONE': 'status:done',
  'BLOCKED': 'status:blocked',
  'OVERDUE': 'status:overdue'
};

async function updateIssueStatus(issueNumber, newStatus) {
  const newLabel = STATUS_LABELS[newStatus];
  if (!newLabel) return;
  
  try {
    // Get current issue to check labels
    const output = execSync(
      `gh issue view ${issueNumber} --repo ${REPO_NAME} --json labels`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const issue = JSON.parse(output);
    const currentLabels = issue.labels.map(l => l.name);
    
    // Remove old status labels
    const statusLabels = Object.values(STATUS_LABELS);
    const toRemove = currentLabels.filter(l => statusLabels.includes(l));
    for (const label of toRemove) {
      execSync(`gh issue edit ${issueNumber} --repo ${REPO_NAME} --remove-label "${label}"`, 
        { stdio: 'ignore' });
    }
    
    // Add new status label
    execSync(`gh issue edit ${issueNumber} --repo ${REPO_NAME} --add-label "${newLabel}"`, 
      { stdio: 'ignore' });
    
    // Update project status field to sync with views
    const PROJECT_OWNER = process.env.GITHUB_PROJECT_OWNER || 'HyperionKit';
    const PROJECT_NUMBER = process.env.GITHUB_PROJECT_NUMBER || '1';
    
    const statusMap = {
      'BACKLOG': 'Todo',
      'IN_PROGRESS': 'In Progress',
      'REVIEW': 'In Review',
      'DONE': 'Done',
      'BLOCKED': 'Blocked',
      'OVERDUE': 'Todo'
    };
    
    const projectStatus = statusMap[newStatus] || 'Todo';
    
    try {
      execSync(
        `gh project item-edit ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${REPO_NAME}/issues/${issueNumber}" --field-status "${projectStatus}"`,
        { stdio: 'ignore' }
      );
    } catch (error) {
      // Status field might not exist, that's okay
    }
    
    console.log(`✅ Updated issue #${issueNumber} to ${newStatus} (labels + project status)`);
  } catch (error) {
    console.error(`❌ Failed to update issue #${issueNumber}: ${error.message}`);
  }
}

async function main() {
  console.log('Finding all task files...');
  const taskFiles = findTaskFiles();
  console.log(`Found ${taskFiles.length} task files\n`);
  
  let updated = 0;
  let errors = 0;
  
  for (const filePath of taskFiles) {
    const task = parseTaskFile(filePath);
    if (!task || !task.metadata.status) {
      continue;
    }
    
    const issue = await findIssueByTaskName(task.taskName);
    if (!issue || issue.state !== 'open') {
      continue;
    }
    
    try {
      await updateIssueStatus(issue.number, task.metadata.status);
      updated++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      errors++;
      console.error(`Error processing ${task.taskName}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
}

main().catch(console.error);

