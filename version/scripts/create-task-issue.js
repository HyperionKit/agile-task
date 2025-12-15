#!/usr/bin/env node
/**
 * Creates and syncs GitHub issues from PRD task files
 * Usage: node create-task-issue.js <task-file-path> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const REPO_NAME = 'HyperionKit/agile-task';
const LOG_FILE = path.join(__dirname, '../../.github/logs/issue-sync.log');

// Map assignee names to GitHub usernames
const ASSIGNEE_MAP = {
  'Aaron': 'ArhonJay',
  'Justine': 'Justinedevs',
  'Tristan': 'Tristan-T-Dev'
};

// Map priority to labels
const PRIORITY_LABELS = {
  'P0': 'priority:critical',
  'P1': 'priority:high',
  'P2': 'priority:medium',
  'P3': 'priority:low'
};

// Map status to labels
const STATUS_LABELS = {
  'BACKLOG': 'status:backlog',
  'IN_PROGRESS': 'status:in-progress',
  'REVIEW': 'status:review',
  'DONE': 'status:done',
  'BLOCKED': 'status:blocked',
  'OVERDUE': 'status:overdue'
};

// Logging function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  
  // Ensure log directory exists
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(LOG_FILE, logEntry + '\n');
  console.log(logEntry);
}

// Parse task file and extract metadata
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
      
      // Parse metadata
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
      
      // Parse Problem section
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
      
      // Parse Goal section
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
    
    // Extract task name from filename
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
    log(`Error parsing task file ${filePath}: ${error.message}`, 'ERROR');
    return null;
  }
}

// Get GitHub username from assignee name
function getGitHubUsername(assignee) {
  return ASSIGNEE_MAP[assignee] || assignee;
}

// Get repository path for PRD reference
function getRepoPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/src\/documentation\/(.+)$/);
  return match ? match[1] : filePath;
}

// Create issue body with formatted content
function createIssueBody(task) {
  const repoPath = getRepoPath(task.filePath);
  const repoUrl = `https://github.com/${REPO_NAME}/blob/main/${repoPath}`;
  
  // Calculate sprint from month
  const monthMatch = task.metadata.month?.match(/Month (\d+)/);
  const sprint = monthMatch ? `S${monthMatch[1]}` : 'S0';
  
  // Calculate start date (7 days before due date)
  let startDate = 'TBD';
  if (task.metadata.due_date) {
    try {
      const dueDate = new Date(task.metadata.due_date);
      const start = new Date(dueDate);
      start.setDate(start.getDate() - 7);
      startDate = start.toISOString().split('T')[0];
    } catch (e) {
      // Invalid date, keep TBD
    }
  }
  
  const targetDate = task.metadata.due_date || 'TBD';
  const assignee = getGitHubUsername(task.metadata.assignee);
  
  return `📋 **PRD Reference**: ${repoUrl}

**Owner**: @${assignee}
**Sprint**: ${sprint}
**Start Date**: ${startDate}
**Target Date**: ${targetDate}

---

## Problem
${task.problem || 'See PRD Reference for details.'}

## Goal
${task.goal || 'See PRD Reference for details.'}

## Metadata
- **Priority**: ${task.metadata.priority || 'N/A'}
- **Status**: ${task.metadata.status || 'N/A'}
- **Estimated Hours**: ${task.metadata.estimated_hours || 'N/A'}
- **Role**: ${task.metadata.role || 'N/A'}

## Acceptance Criteria
See full details in [PRD Reference](${repoUrl})`;
}

// Find existing issue by task name
async function findIssueByTaskName(taskName) {
  try {
    const output = execSync(
      `gh issue list --repo ${REPO_NAME} --search "${taskName}" --json number,title,state,labels,body`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const issues = JSON.parse(output);
    
    // Match exact task ID pattern in title
    const taskIdPattern = new RegExp(taskName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return issues.find(issue => taskIdPattern.test(issue.title));
  } catch (error) {
    return null;
  }
}

// Get category label from task name
function getCategoryLabel(taskName) {
  if (taskName.includes('HA-') || taskName.includes('-HA-')) {
    return 'category:hyperagent';
  }
  if (taskName.includes('SDK-') || taskName.includes('-SDK-')) {
    return 'category:sdk';
  }
  if (taskName.includes('AA-') || taskName.includes('-AA-')) {
    return 'category:account-abstraction';
  }
  if (taskName.includes('SEC-') || taskName.includes('-SEC-')) {
    return 'category:security';
  }
  if (taskName.includes('UX-') || taskName.includes('UI-') || taskName.includes('frontend')) {
    return 'category:frontend';
  }
  return null;
}

// Get month label from metadata
function getMonthLabel(month) {
  const match = month?.match(/Month (\d+)/);
  if (match) {
    return `month:${match[1]}`;
  }
  return null;
}

// Create GitHub issue
async function createGitHubIssue(task) {
  const assignee = getGitHubUsername(task.metadata.assignee);
  const labels = [
    PRIORITY_LABELS[task.metadata.priority] || 'priority:medium',
    STATUS_LABELS[task.metadata.status] || 'status:backlog',
    'type:task'
  ];
  
  // Add category label
  const categoryLabel = getCategoryLabel(task.taskName);
  if (categoryLabel) {
    labels.push(categoryLabel);
  }
  
  // Add month label
  const monthLabel = getMonthLabel(task.metadata.month);
  if (monthLabel) {
    labels.push(monthLabel);
  }
  
  const title = `${task.taskName}: ${task.taskTitle}`;
  const body = createIssueBody(task);
  
  if (DRY_RUN) {
    log(`[DRY RUN] Would create issue: ${task.taskName}`, 'INFO');
    log(`  Title: ${title}`, 'INFO');
    log(`  Assignee: @${assignee}`, 'INFO');
    log(`  Labels: ${labels.join(', ')}`, 'INFO');
    return `[DRY RUN] Issue would be created`;
  }
  
  // Build gh issue create command
  let cmd = `gh issue create --repo ${REPO_NAME} --title "${title.replace(/"/g, '\\"')}"`;
  
  // Add body (escape properly)
  const escapedBody = body.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  cmd += ` --body "${escapedBody}"`;
  
  // Add assignee
  if (assignee) {
    cmd += ` --assignee ${assignee}`;
  }
  
  // Add labels
  if (labels.length > 0) {
    cmd += ` --label "${labels.join(',')}"`;
  }
  
  try {
    log(`Creating issue for ${task.taskName}...`, 'INFO');
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    const issueUrl = output.trim();
    log(`✅ Created: ${issueUrl}`, 'SUCCESS');
    
    // Update task file with issue URL
    updateTaskFileWithIssue(task.filePath, issueUrl);
    
    return issueUrl;
  } catch (error) {
    log(`❌ Failed to create issue for ${task.taskName}: ${error.message}`, 'ERROR');
    return null;
  }
}

// Update issue status
async function updateIssueStatus(issueNumber, oldStatus, newStatus, taskName) {
  if (oldStatus === newStatus) {
    return;
  }
  
  const newLabel = STATUS_LABELS[newStatus];
  if (!newLabel) {
    return;
  }
  
  if (DRY_RUN) {
    log(`[DRY RUN] Would update issue #${issueNumber} status: ${oldStatus} → ${newStatus}`, 'INFO');
    return;
  }
  
  try {
    // Update labels
    execSync(`gh issue edit ${issueNumber} --repo ${REPO_NAME} --add-label "${newLabel}"`, 
      { stdio: 'ignore' });
    
    // Remove old status label
    const oldLabel = STATUS_LABELS[oldStatus];
    if (oldLabel) {
      execSync(`gh issue edit ${issueNumber} --repo ${REPO_NAME} --remove-label "${oldLabel}"`, 
        { stdio: 'ignore' });
    }
    
    // Add comment for significant status changes
    if (['IN_PROGRESS', 'REVIEW', 'DONE', 'OVERDUE'].includes(newStatus)) {
      const comment = `📊 **Status Updated**: ${oldStatus} → ${newStatus}\n\n` +
                     `Updated from PRD task file at ${new Date().toISOString()}`;
      execSync(`gh issue comment ${issueNumber} --repo ${REPO_NAME} --body "${comment.replace(/"/g, '\\"')}"`, 
        { stdio: 'ignore' });
    }
    
    log(`Updated issue #${issueNumber} status to ${newStatus}`, 'INFO');
  } catch (error) {
    log(`Failed to update issue #${issueNumber}: ${error.message}`, 'ERROR');
  }
}

// Close issue
async function closeIssue(issueNumber, reason) {
  if (DRY_RUN) {
    log(`[DRY RUN] Would close issue #${issueNumber}: ${reason}`, 'INFO');
    return;
  }
  
  try {
    const comment = `✅ **Task Completed**\n\n${reason}\n\nClosed automatically from PRD task file.`;
    execSync(`gh issue comment ${issueNumber} --repo ${REPO_NAME} --body "${comment.replace(/"/g, '\\"')}"`, 
      { stdio: 'ignore' });
    execSync(`gh issue close ${issueNumber} --repo ${REPO_NAME}`, { stdio: 'ignore' });
    
    // Update label to done
    execSync(`gh issue edit ${issueNumber} --repo ${REPO_NAME} --add-label "status:done"`, 
      { stdio: 'ignore' });
    
    log(`Closed issue #${issueNumber}`, 'INFO');
  } catch (error) {
    log(`Failed to close issue #${issueNumber}: ${error.message}`, 'ERROR');
  }
}

// Update task file with GitHub issue URL
function updateTaskFileWithIssue(taskFilePath, issueUrl) {
  try {
    let content = fs.readFileSync(taskFilePath, 'utf-8');
    
    // Check if issue URL already exists
    if (content.includes('GitHub Issue:')) {
      // Update existing
      content = content.replace(
        /GitHub Issue: .+/,
        `GitHub Issue: ${issueUrl}`
      );
    } else {
      // Add new after Actual Hours in metadata
      content = content.replace(
        /(- Actual Hours: .+)/,
        `$1\n- GitHub Issue: ${issueUrl}`
      );
    }
    
    fs.writeFileSync(taskFilePath, content);
    log(`Updated task file with issue URL: ${issueUrl}`, 'INFO');
  } catch (error) {
    log(`Failed to update task file: ${error.message}`, 'ERROR');
  }
}

// Main sync function
async function syncTaskWithIssue(task, taskFilePath) {
  if (!task) {
    return null;
  }
  
  // Check if task moved to deliver/ (completed)
  if (taskFilePath.includes('/deliver/')) {
    const existingIssue = await findIssueByTaskName(task.taskName);
    if (existingIssue && existingIssue.state === 'open') {
      await closeIssue(existingIssue.number, 'Task completed and moved to deliver/');
      return `Closed issue #${existingIssue.number}`;
    }
    return null;
  }
  
  // Check if task moved to overdue/
  const isOverdue = taskFilePath.includes('/overdue/');
  if (isOverdue) {
    const existingIssue = await findIssueByTaskName(task.taskName);
    if (existingIssue && existingIssue.state === 'open') {
      await updateIssueStatus(existingIssue.number, task.metadata.status, 'OVERDUE', task.taskName);
      execSync(`gh issue edit ${existingIssue.number} --repo ${REPO_NAME} --add-label "status:overdue,priority:critical"`, 
        { stdio: 'ignore' });
      const comment = '⚠️ Task marked as OVERDUE';
      execSync(`gh issue comment ${existingIssue.number} --repo ${REPO_NAME} --body "${comment}"`, 
        { stdio: 'ignore' });
      return `Updated overdue issue #${existingIssue.number}`;
    }
  }
  
  // Find existing issue
  const existingIssue = await findIssueByTaskName(task.taskName);
  
  if (existingIssue) {
    // Update existing issue
    if (existingIssue.state === 'open') {
      const currentStatus = task.metadata.status || 'BACKLOG';
      const existingLabels = existingIssue.labels.map(l => l.name);
      const currentStatusLabel = existingLabels.find(l => l.startsWith('status:'));
      
      if (currentStatusLabel) {
        const existingStatus = Object.keys(STATUS_LABELS).find(
          k => STATUS_LABELS[k] === currentStatusLabel
        );
        await updateIssueStatus(existingIssue.number, existingStatus, currentStatus, task.taskName);
      }
      
      return `Issue #${existingIssue.number} already exists`;
    } else {
      log(`Issue #${existingIssue.number} exists but is closed`, 'INFO');
      return `Issue #${existingIssue.number} (closed)`;
    }
  } else {
    // Create new issue
    return await createGitHubIssue(task);
  }
}

// Main execution
const taskFilePath = process.argv.find(arg => arg.endsWith('.md') && !arg.startsWith('--'));

if (!taskFilePath) {
  console.error('Usage: node create-task-issue.js <task-file-path> [--dry-run]');
  process.exit(1);
}

if (!fs.existsSync(taskFilePath)) {
  console.error(`Task file not found: ${taskFilePath}`);
  process.exit(1);
}

(async () => {
  const task = parseTaskFile(taskFilePath);
  if (!task) {
    log('Failed to parse task file', 'ERROR');
    process.exit(1);
  }
  
  const result = await syncTaskWithIssue(task, taskFilePath);
  if (result) {
    log(`Result: ${result}`, 'INFO');
  }
})();

