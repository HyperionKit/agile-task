#!/usr/bin/env node
/**
 * Closes GitHub issues for tasks in deliver/ folder
 * Usage: node close-completed-issues.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_NAME = 'HyperionKit/agile-task';

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
  
  walkDir('src/documentation/deliver');
  return taskFiles;
}

function getTaskName(filePath) {
  return path.basename(filePath, '.md');
}

async function findIssueByTaskName(taskName) {
  try {
    const output = execSync(
      `gh issue list --repo ${REPO_NAME} --search "${taskName}" --json number,title,state`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const issues = JSON.parse(output);
    const taskIdPattern = new RegExp(taskName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return issues.find(issue => taskIdPattern.test(issue.title));
  } catch (error) {
    return null;
  }
}

async function closeIssue(issueNumber) {
  try {
    const comment = `✅ **Task Completed**\n\nTask completed and moved to deliver/ folder.\n\nClosed automatically from PRD task file.`;
    execSync(`gh issue comment ${issueNumber} --repo ${REPO_NAME} --body "${comment.replace(/"/g, '\\"')}"`, 
      { stdio: 'ignore' });
    execSync(`gh issue close ${issueNumber} --repo ${REPO_NAME}`, { stdio: 'ignore' });
    execSync(`gh issue edit ${issueNumber} --repo ${REPO_NAME} --add-label "status:done"`, 
      { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('Finding completed tasks in deliver/ folder...');
  const taskFiles = findTaskFiles();
  console.log(`Found ${taskFiles.length} completed tasks\n`);
  
  let closed = 0;
  let alreadyClosed = 0;
  let notFound = 0;
  let errors = 0;
  
  for (const filePath of taskFiles) {
    const taskName = getTaskName(filePath);
    const issue = await findIssueByTaskName(taskName);
    
    if (!issue) {
      notFound++;
      continue;
    }
    
    if (issue.state !== 'open') {
      alreadyClosed++;
      continue;
    }
    
    try {
      const success = await closeIssue(issue.number);
      if (success) {
        closed++;
        console.log(`✅ Closed issue #${issue.number} for ${taskName}`);
      } else {
        errors++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      errors++;
      console.error(`❌ Error closing issue for ${taskName}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Closed: ${closed}`);
  console.log(`⚠️  Already closed: ${alreadyClosed}`);
  console.log(`❓ Not found: ${notFound}`);
  console.log(`❌ Errors: ${errors}`);
}

main().catch(console.error);

