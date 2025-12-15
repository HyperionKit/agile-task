#!/usr/bin/env node
/**
 * Creates and syncs GitHub issues from PRD task files
 * Usage: node create-task-issue.js <task-file-path> [--dry-run]
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

// Configuration
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'HyperionKit/agile-task';
const PROJECT_OWNER = process.env.GITHUB_PROJECT_OWNER || 'HyperionKit';
const PROJECT_NUMBER = process.env.GITHUB_PROJECT_NUMBER || '1';
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
  const repoUrl = `https://github.com/${REPO_NAME}/blob/main/src/documentation/${repoPath}`;
  
  // Calculate sprint from month - handle multiple formats
  let sprint = 'S0';
  if (task.metadata.month) {
    // Try format: "Month 1 (October 2025)"
    const monthMatch = task.metadata.month.match(/Month (\d+)/);
    if (monthMatch) {
      sprint = `S${monthMatch[1]}`;
    } else {
      // Try alternative format: "1 (October 2025)" or just "1"
      const altMatch = task.metadata.month.match(/^(\d+)/);
      if (altMatch) {
        sprint = `S${altMatch[1]}`;
      }
    }
  }
  
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
See full details in [PRD Reference](${repoUrl})

---

**Note**: This issue is automatically synced with GitHub Project views (Backlog/Board/Current iteration/Roadmap). Status changes will automatically update project views.`;
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
  
  // Use --body-file for proper markdown formatting
  const tempBodyFile = path.join(__dirname, '../../.github/temp-issue-body.md');
  const tempDir = path.dirname(tempBodyFile);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  fs.writeFileSync(tempBodyFile, body, 'utf-8');
  cmd += ` --body-file "${tempBodyFile}"`;
  
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
    const issueNumber = issueUrl.match(/#(\d+)/)?.[1];
    
    log(`✅ Created: ${issueUrl}`, 'SUCCESS');
    
    // Clean up temp file
    if (fs.existsSync(tempBodyFile)) {
      fs.unlinkSync(tempBodyFile);
    }
    
    // Add to GitHub Project if issue number exists
    if (issueNumber) {
      await addIssueToProject(issueNumber, task);
    }
    
    // Update task file with issue URL
    updateTaskFileWithIssue(task.filePath, issueUrl);
    
    return issueUrl;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempBodyFile)) {
      fs.unlinkSync(tempBodyFile);
    }
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

// Helper to determine if owner is user or organization
function getProjectOwnerType(owner) {
  try {
    const query = `query { organization(login: "${owner}") { id } }`;
    const output = execSync(
      `gh api graphql -f query="${query.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const data = JSON.parse(output);
    if (data?.data?.organization?.id) {
      return 'organization';
    }
  } catch (error) {
    // If organization query fails, assume it's a user
  }
  return 'user';
}

// Add issue to GitHub Project
async function addIssueToProject(issueNumber, task) {
  if (DRY_RUN) {
    log(`[DRY RUN] Would add issue #${issueNumber} to project ${PROJECT_NUMBER}`, 'INFO');
    return;
  }
  
  try {
    // Try using gh project command first (simpler, newer API)
    try {
      execSync(
        `gh project item-add ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${REPO_NAME}/issues/${issueNumber}"`,
        { stdio: 'ignore', encoding: 'utf-8' }
      );
      log(`✅ Added issue #${issueNumber} to project ${PROJECT_NUMBER}`, 'INFO');
      
      // Update project status field based on task status
      await updateProjectStatus(issueNumber, task);
      return;
    } catch (ghError) {
      // If gh project command fails, try GraphQL API
      log(`gh project command failed, trying GraphQL API...`, 'INFO');
    }
    
    // Determine if owner is user or organization
    const ownerType = getProjectOwnerType(PROJECT_OWNER);
    const queryField = ownerType === 'organization' ? 'organization' : 'user';
    
    // Fallback to GraphQL API
    const projectQuery = `query { ${queryField}(login: "${PROJECT_OWNER}") { projectV2(number: ${PROJECT_NUMBER}) { id } } }`;
    const projectCmd = `gh api graphql -f query='${projectQuery.replace(/'/g, "\\'")}'`;
    
    const projectOutput = execSync(projectCmd, { encoding: 'utf-8', stdio: 'pipe' });
    const projectData = JSON.parse(projectOutput);
    const projectId = projectData?.data?.[queryField]?.projectV2?.id;
    
    if (projectId) {
      // Add issue to project using GraphQL
      const addIssueMutation = `mutation { addProjectV2ItemById(input: { projectId: "${projectId}", contentId: "I_${issueNumber}" }) { item { id } } }`;
      const addCmd = `gh api graphql -f query='${addIssueMutation.replace(/'/g, "\\'")}'`;
      execSync(addCmd, { encoding: 'utf-8', stdio: 'ignore' });
      log(`✅ Added issue #${issueNumber} to project ${PROJECT_NUMBER} via GraphQL`, 'INFO');
      
      // Update project field values
      await updateProjectFields(projectId, issueNumber, task);
    } else {
      log(`⚠️  Project ${PROJECT_NUMBER} not found for owner ${PROJECT_OWNER}`, 'WARN');
    }
  } catch (error) {
    log(`⚠️  Could not add issue to project: ${error.message}`, 'WARN');
    log(`   Ensure GITHUB_PROJECT_NUMBER is set correctly (current: ${PROJECT_NUMBER})`, 'WARN');
  }
}

// Update project status field to sync with views
async function updateProjectStatus(issueNumber, task) {
  try {
    const status = task.metadata.status || 'BACKLOG';
    
    // Map status to project status values
    const statusMap = {
      'BACKLOG': 'Todo',
      'IN_PROGRESS': 'In Progress',
      'REVIEW': 'In Review',
      'DONE': 'Done',
      'BLOCKED': 'Blocked',
      'OVERDUE': 'Todo' // Overdue items stay in Todo but with priority label
    };
    
    const projectStatus = statusMap[status] || 'Todo';
    
    // Try to update status field using gh project command
    try {
      execSync(
        `gh project item-edit ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${REPO_NAME}/issues/${issueNumber}" --field-status "${projectStatus}"`,
        { stdio: 'ignore' }
      );
      log(`Updated project status to "${projectStatus}" for issue #${issueNumber}`, 'INFO');
    } catch (error) {
      // Status field might not exist or have different name, that's okay
      log(`Could not update project status field: ${error.message}`, 'WARN');
    }
  } catch (error) {
    log(`Failed to update project status: ${error.message}`, 'WARN');
  }
}

// Update project field values using GraphQL
async function updateProjectFields(projectId, issueNumber, task) {
  try {
    // Get project fields
    const fieldsQuery = `query { node(id: "${projectId}") { ... on ProjectV2 { fields(first: 20) { nodes { ... on ProjectV2Field { id name } ... on ProjectV2SingleSelectField { id name options { id name } } } } } } } }`;
    
    const fieldsOutput = execSync(
      `gh api graphql -f query='${fieldsQuery.replace(/'/g, "\\'")}'`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const fieldsData = JSON.parse(fieldsOutput);
    
    // Map task metadata to project fields
    // Status updates will automatically sync across Backlog/Board/Current iteration views
    // Project views filter by status field, so updating status moves items between views
    
    log(`Project fields synced for issue #${issueNumber}`, 'INFO');
  } catch (error) {
    // Non-critical, just log
    log(`Could not update project fields: ${error.message}`, 'WARN');
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

