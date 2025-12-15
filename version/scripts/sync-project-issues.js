#!/usr/bin/env node
/**
 * Syncs GitHub Project views (Backlog/Board/Current iteration/Roadmap)
 * Uses GraphQL API to update project fields based on issue labels
 * Usage: node sync-project-issues.js
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
const PROJECT_OWNER = process.env.GITHUB_PROJECT_OWNER || 'HyperionKit';
const PROJECT_NUMBER = process.env.GITHUB_PROJECT_NUMBER || '1';

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

// Find task file for an issue by searching for issue number in task files
// Also matches by task ID in issue title (e.g., TASK-M3-AA-001)
function findTaskFileForIssue(issueNumber, issueTitle = null) {
  const taskDirs = [
    'src/documentation/agile.role/aaron',
    'src/documentation/agile.role/justine',
    'src/documentation/agile.role/tristan',
    'src/documentation/overdue/aaron',
    'src/documentation/overdue/justine',
    'src/documentation/overdue/tristan'
  ];
  
  // Strategy 1: Extract task ID from issue title (e.g., "TASK-M3-AA-001-entrypoint-v07: EntryPoint V0.7 Integration #17")
  let taskIdFromTitle = null;
  if (issueTitle) {
    const taskIdMatch = issueTitle.match(/TASK-([A-Z0-9-]+)/);
    if (taskIdMatch) {
      taskIdFromTitle = taskIdMatch[1];
    }
  }
  
  for (const dir of taskDirs) {
    const fullPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(fullPath)) continue;
    
    const files = fs.readdirSync(fullPath);
    for (const file of files) {
      if (!file.startsWith('TASK-') || !file.endsWith('.md')) continue;
      
      const filePath = path.join(fullPath, file);
      
      // Strategy 1a: Match by task ID from title
      if (taskIdFromTitle && file.includes(taskIdFromTitle)) {
        return filePath;
      }
      
      // Strategy 1b: Match by full task ID pattern
      const fileNameTaskId = file.replace('TASK-', '').replace('.md', '');
      if (taskIdFromTitle && fileNameTaskId.startsWith(taskIdFromTitle)) {
        return filePath;
      }
      
      // Strategy 2: Check if file content references issue number
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes(`#${issueNumber}`) || 
            content.includes(`issues/${issueNumber}`) ||
            content.includes(`/issues/${issueNumber}`)) {
          return filePath;
        }
      } catch (e) {
        // Skip if file can't be read
        continue;
      }
    }
  }
  return null;
}

// Parse task file to get status, due date, estimated hours, and month from PRD (source of truth)
function getTaskDataFromFile(taskFilePath) {
  if (!taskFilePath || !fs.existsSync(taskFilePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(taskFilePath, 'utf-8');
    const statusMatch = content.match(/- Status:\s*(BACKLOG|IN_PROGRESS|REVIEW|DONE|BLOCKED|OVERDUE)/);
    const dueDateMatch = content.match(/- Due Date:\s*(\d{4}-\d{2}-\d{2})/);
    const estimatedHoursMatch = content.match(/- Estimated Hours:\s*(\d+)/);
    const monthMatch = content.match(/- Month:\s*(.+)/);
    
    return {
      status: statusMatch ? statusMatch[1] : null,
      dueDate: dueDateMatch ? dueDateMatch[1] : null,
      estimatedHours: estimatedHoursMatch ? parseInt(estimatedHoursMatch[1]) : null,
      month: monthMatch ? monthMatch[1].trim() : null
    };
  } catch (error) {
    return null;
  }
}

// Get project ID and field IDs
async function getProjectFields(projectId) {
  // Get all field types: single-select, iteration, number, date, text
  const fieldsQuery = `query { node(id: "${projectId}") { ... on ProjectV2 { fields(first: 30) { nodes { ... on ProjectV2Field { id name dataType } ... on ProjectV2SingleSelectField { id name dataType options { id name } } ... on ProjectV2IterationField { id name configuration { iterations { id title startDate duration } } } } } } } } }`;
  
  try {
    const output = execSync(
      `gh api graphql -f query="${fieldsQuery.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', stdio: 'pipe', shell: true }
    );
    const data = JSON.parse(output);
    const fields = data?.data?.node?.fields?.nodes || [];
    
    console.log(`✅ Found ${fields.length} project fields`);
    return fields;
  } catch (error) {
    console.error(`❌ Failed to get project fields: ${error.message}`);
    return [];
  }
}

// Update project field value using GraphQL
async function updateProjectField(projectId, itemId, fieldId, value) {
  let valueInput;
  
  if (value.type === 'singleSelect') {
    valueInput = `{ singleSelectOptionId: "${value.optionId}" }`;
  } else if (value.type === 'iteration') {
    valueInput = `{ iterationId: "${value.iterationId}" }`;
  } else if (value.type === 'date') {
    valueInput = `{ date: "${value.date}" }`;
  } else if (value.type === 'number') {
    valueInput = `{ number: ${value.number} }`;
  } else if (value.type === 'text') {
    valueInput = `{ text: "${value.text}" }`;
  } else {
    return false;
  }
  
  const mutation = `mutation { updateProjectV2ItemFieldValue(input: { projectId: "${projectId}" itemId: "${itemId}" fieldId: "${fieldId}" value: ${valueInput} }) { projectV2Item { id } } }`;
  
  try {
    execSync(
      `gh api graphql -f query="${mutation.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', stdio: 'pipe', shell: true }
    );
    return true;
  } catch (error) {
    // Log error for debugging (first few only to avoid spam)
    if (Math.random() < 0.1) { // Log 10% of errors
      console.warn(`  ⚠️  Field update failed: ${error.message.substring(0, 100)}`);
    }
    return false;
  }
}

async function syncProjectIssues() {
  try {
    console.log('Syncing GitHub Project views...');
    
    // Get all issues with full details
    const issuesOutput = execSync(
      `gh issue list --repo ${REPO_NAME} --state all --json number,title,labels,body,state --limit 200`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const issues = JSON.parse(issuesOutput);
    
    console.log(`Found ${issues.length} issues (open and closed)`);
    
    // Map issue numbers to task file data (source of truth)
    console.log('Reading task files for status (source of truth)...');
    const taskStatusMap = new Map();
    const taskDueDateMap = new Map();
    const taskEstimatedHoursMap = new Map();
    const taskMonthMap = new Map();
    
    for (const issue of issues) {
      const taskFilePath = findTaskFileForIssue(issue.number, issue.title);
      if (taskFilePath) {
        const taskData = getTaskDataFromFile(taskFilePath);
        if (taskData) {
          if (taskData.status) taskStatusMap.set(issue.number, taskData.status);
          if (taskData.dueDate) taskDueDateMap.set(issue.number, taskData.dueDate);
          if (taskData.estimatedHours) taskEstimatedHoursMap.set(issue.number, taskData.estimatedHours);
          if (taskData.month) taskMonthMap.set(issue.number, taskData.month);
        }
      }
    }
    console.log(`✅ Found ${taskStatusMap.size} issues with task file status (source of truth)`);
    if (taskStatusMap.size < issues.length / 2) {
      console.log(`⚠️  Warning: Only ${taskStatusMap.size}/${issues.length} issues matched to task files. Check task file naming or issue titles.`);
    }
    
    // Determine if owner is user or organization
    const ownerType = getProjectOwnerType(PROJECT_OWNER);
    const queryField = ownerType === 'organization' ? 'organization' : 'user';
    
    // Get project ID and items (single-line query to avoid parsing issues)
    const projectQuery = `query { ${queryField}(login: "${PROJECT_OWNER}") { projectV2(number: ${PROJECT_NUMBER}) { id items(first: 100) { nodes { id content { ... on Issue { number } } } pageInfo { hasNextPage endCursor } } } } } }`;
    
    // Use JSON format to avoid shell escaping issues
    const projectOutput = execSync(
      `gh api graphql -f query="${projectQuery.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', stdio: 'pipe', shell: true }
    );
    const projectData = JSON.parse(projectOutput);
    const projectId = projectData?.data?.[queryField]?.projectV2?.id;
    
    if (!projectId) {
      throw new Error(`Project ${PROJECT_NUMBER} not found for ${PROJECT_OWNER} (${ownerType})`);
    }
    
    console.log(`✅ Found project ID: ${projectId}`);
    
    // Get all project items with pagination
    let allItems = projectData?.data?.[queryField]?.projectV2?.items?.nodes || [];
    let pageInfo = projectData?.data?.[queryField]?.projectV2?.items?.pageInfo;
    
      while (pageInfo?.hasNextPage) {
        const paginatedQuery = `query { ${queryField}(login: "${PROJECT_OWNER}") { projectV2(number: ${PROJECT_NUMBER}) { items(first: 100, after: "${pageInfo.endCursor}") { nodes { id content { ... on Issue { number } } } pageInfo { hasNextPage endCursor } } } } } }`;
        
        const paginatedOutput = execSync(
          `gh api graphql -f query="${paginatedQuery.replace(/"/g, '\\"')}"`,
          { encoding: 'utf-8', stdio: 'pipe', shell: true }
        );
      const paginatedData = JSON.parse(paginatedOutput);
      const nextItems = paginatedData?.data?.[queryField]?.projectV2?.items?.nodes || [];
      allItems = allItems.concat(nextItems);
      pageInfo = paginatedData?.data?.[queryField]?.projectV2?.items?.pageInfo;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Project has ${allItems.length} items`);
    
    // Create map of issue number to item ID
    const issueToItemId = new Map();
    for (const item of allItems) {
      if (item.content?.number) {
        issueToItemId.set(item.content.number, item.id);
      }
    }
    
    // Get project fields
    const fields = await getProjectFields(projectId);
    
    // Find all field IDs (case-insensitive, flexible matching)
    const findField = (name, type = null) => {
      const lowerName = name.toLowerCase();
      return fields.find(f => {
        const match = f.name && f.name.toLowerCase() === lowerName;
        if (!match) return false;
        if (type === 'singleSelect') return f.options;
        if (type === 'date') return f.dataType === 'DATE';
        if (type === 'number') return f.dataType === 'NUMBER';
        if (type === 'iteration') {
          // Check if it's an iteration field by checking for configuration
          return f.__typename === 'ProjectV2IterationField' || (f.configuration && f.configuration.iterations);
        }
        return true;
      });
    };
    
    const statusField = findField('Status', 'singleSelect');
    const priorityField = findField('Priority', 'singleSelect');
    const sizeField = findField('Size', 'singleSelect');
    const estimateField = findField('Estimate', 'number');
    
    // Iteration field detection - check by name and configuration
    // Iteration fields may not have __typename set in some cases
    let iterationField = null;
    
    // First, try exact name match
    for (const field of fields) {
      if (field.name && field.name.toLowerCase() === 'iteration') {
        // Check if it has configuration (iteration field) or is explicitly ProjectV2IterationField
        if (field.configuration || field.__typename === 'ProjectV2IterationField') {
          iterationField = field;
          break;
        }
      }
    }
    
    // If not found, try alternative names (Sprint, etc.)
    if (!iterationField) {
      for (const field of fields) {
        if (field.name && (field.name.toLowerCase().includes('iteration') || field.name.toLowerCase().includes('sprint'))) {
          if (field.configuration || field.__typename === 'ProjectV2IterationField') {
            iterationField = field;
            break;
          }
        }
      }
    }
    
    // Debug: Log iteration field details if found
    if (iterationField) {
      const iterCount = iterationField.configuration?.iterations?.length || 0;
      console.log(`✅ Iteration field found: ${iterationField.name}, iterations available: ${iterCount}`);
      if (iterCount > 0) {
        console.log(`   Available iterations: ${iterationField.configuration.iterations.map(i => `${i.title || i.id} (${i.startDate || 'no date'})`).join(', ')}`);
      }
    } else {
      console.log(`⚠️  Iteration field not found. Available field names: ${fields.map(f => f.name).filter(Boolean).join(', ')}`);
    }
    
    const startDateField = findField('Start date', 'date') || findField('Start Date', 'date');
    const targetDateField = findField('Target date', 'date') || findField('Target Date', 'date');
    
    console.log(`Fields found: Status=${!!statusField}, Priority=${!!priorityField}, Size=${!!sizeField}, Estimate=${!!estimateField}, Iteration=${!!iterationField}, StartDate=${!!startDateField}, TargetDate=${!!targetDateField}`);
    
    if (!statusField) {
      console.warn('⚠️  Status field not found in project. Please ensure a "Status" field exists.');
    }
    
    // Map task status (from PRD files) to project status values
    // This is the source of truth - task files override issue labels
    const taskStatusToProjectStatus = {
      'BACKLOG': 'Todo',
      'IN_PROGRESS': 'In Progress',
      'REVIEW': 'In Review',
      'DONE': 'Done',
      'BLOCKED': 'Blocked',
      'OVERDUE': 'Critical'  // Overdue tasks go to Critical column
    };
    
    // Map status labels (fallback if no task file found)
    const labelStatusMap = {
      'status:backlog': 'Todo',
      'status:in-progress': 'In Progress',
      'status:review': 'In Review',
      'status:done': 'Done',
      'status:blocked': 'Blocked',
      'status:overdue': 'Todo'
    };
    
    const priorityMap = {
      'priority:critical': 'Critical',
      'priority:high': 'High',
      'priority:medium': 'Medium',
      'priority:low': 'Low'
    };
    
    // Add missing issues to project
    let added = 0;
    for (const issue of issues) {
      if (!issueToItemId.has(issue.number)) {
        try {
          const addMutation = `mutation { addProjectV2ItemById(input: { projectId: "${projectId}" contentId: "I_${issue.number}" }) { item { id } } }`;
          
          const addOutput = execSync(
            `gh api graphql -f query="${addMutation.replace(/"/g, '\\"')}"`,
            { encoding: 'utf-8', stdio: 'pipe', shell: true }
          );
          const addData = JSON.parse(addOutput);
          const itemId = addData?.data?.addProjectV2ItemById?.item?.id;
          
          if (itemId) {
            issueToItemId.set(issue.number, itemId);
            console.log(`✅ Added issue #${issue.number} to project`);
            added++;
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`❌ Failed to add issue #${issue.number}: ${error.message}`);
        }
      }
    }
    
    // Update project fields for all issues
    let updated = 0;
    let processed = 0;
    let iterationUpdatedCount = 0;
    let iterationFailCount = 0;
    
    console.log(`\nUpdating project fields for ${issues.length} issues...`);
    
    for (const issue of issues) {
      const itemId = issueToItemId.get(issue.number);
      if (!itemId) {
        continue;
      }
      
      processed++;
      let issueUpdated = false;
      
      // Update Status field (priority: task file status > issue label)
      // Task files are the source of truth for project status
      if (statusField && statusField.options) {
        let projectStatus = 'Todo';
        
        // First, try to get status from task file (source of truth)
        const taskStatus = taskStatusMap.get(issue.number);
        if (taskStatus && taskStatusToProjectStatus[taskStatus]) {
          projectStatus = taskStatusToProjectStatus[taskStatus];
        } else {
          // Check if task should be "In Progress" based on start date
          let startDate = null;
          const taskDueDate = taskDueDateMap.get(issue.number);
          if (taskDueDate) {
            try {
              const dueDate = new Date(taskDueDate);
              const start = new Date(dueDate);
              start.setDate(start.getDate() - 7);
              startDate = start;
            } catch (e) {
              // Invalid date, skip
            }
          }
          
          // Also check issue body for start date
          if (!startDate && issue.body) {
            const startDateMatch = issue.body.match(/\*\*Start Date\*\*: (\d{4}-\d{2}-\d{2})/);
            if (startDateMatch) {
              try {
                startDate = new Date(startDateMatch[1]);
              } catch (e) {
                // Invalid date, skip
              }
            }
          }
          
          // If start date has passed and task is not done, mark as "In Progress"
          if (startDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            
            if (startDate <= today) {
              // Check if task is overdue
              if (taskDueDate) {
                try {
                  const dueDate = new Date(taskDueDate);
                  dueDate.setHours(0, 0, 0, 0);
                  if (dueDate < today) {
                    projectStatus = 'Critical';
                  } else {
                    projectStatus = 'In Progress';
                  }
                } catch (e) {
                  projectStatus = 'In Progress';
                }
              } else {
                projectStatus = 'In Progress';
              }
            }
          } else {
            // Check if task is overdue based on due date
            if (taskDueDate) {
              try {
                const dueDate = new Date(taskDueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);
                
                // If due date is in the past, mark as Critical (overdue)
                if (dueDate < today) {
                  projectStatus = 'Critical';
                }
              } catch (e) {
                // Invalid date, skip overdue check
              }
            }
          }
          
          // Fallback to issue label if no task file found and not determined yet
          if (projectStatus === 'Todo') {
            const statusLabel = issue.labels.find(l => l.name.startsWith('status:'));
            if (statusLabel) {
              projectStatus = labelStatusMap[statusLabel.name] || 'Todo';
            }
          }
        }
        
        const option = statusField.options.find(o => o.name === projectStatus);
        if (option) {
          const success = await updateProjectField(projectId, itemId, statusField.id, {
            type: 'singleSelect',
            optionId: option.id
          });
          if (success) {
            issueUpdated = true;
          }
        } else if (projectStatus === 'Critical') {
          // Log warning if Critical option not found
          console.warn(`⚠️  Issue #${issue.number}: "Critical" status option not found in project. Please ensure "Critical" column exists.`);
        }
      }
      
      // Update Priority field
      if (priorityField && priorityField.options) {
        const priorityLabel = issue.labels.find(l => l.name.startsWith('priority:'));
        if (priorityLabel) {
          const priorityValue = priorityMap[priorityLabel.name] || 'Medium';
          const option = priorityField.options.find(o => o.name === priorityValue);
          if (option) {
            await updateProjectField(projectId, itemId, priorityField.id, {
              type: 'singleSelect',
              optionId: option.id
            });
            issueUpdated = true;
          }
        }
      }
      
      // Update Estimate field (from task file Estimated Hours)
      if (estimateField) {
        const estimatedHours = taskEstimatedHoursMap.get(issue.number);
        if (estimatedHours && estimatedHours > 0) {
          await updateProjectField(projectId, itemId, estimateField.id, {
            type: 'number',
            number: estimatedHours
          });
          issueUpdated = true;
        }
      }
      
      // Update Iteration field (from task file Month)
      // Note: Iteration fields use iterationId, not optionId
      // We need to match based on date ranges or iteration names
      if (iterationField && iterationField.configuration && iterationField.configuration.iterations) {
        const month = taskMonthMap.get(issue.number);
        const taskDueDate = taskDueDateMap.get(issue.number);
        const iterations = iterationField.configuration.iterations;
        
        if (month || taskDueDate) {
          let matchedIteration = null;
          
          // Strategy 1: Match by due date range (most accurate)
          if (taskDueDate && !matchedIteration) {
            try {
              const dueDate = new Date(taskDueDate);
              dueDate.setHours(0, 0, 0, 0);
              
              for (const iteration of iterations) {
                if (iteration.startDate) {
                  const iterStart = new Date(iteration.startDate);
                  iterStart.setHours(0, 0, 0, 0);
                  const iterEnd = new Date(iterStart);
                  iterEnd.setDate(iterEnd.getDate() + (iteration.duration || 14));
                  
                  if (dueDate >= iterStart && dueDate <= iterEnd) {
                    matchedIteration = iteration;
                    break;
                  }
                }
              }
            } catch (e) {
              // Invalid date, skip
            }
          }
          
          // Strategy 2: Match by month number from task file
          if (!matchedIteration && month) {
            // Extract month number from formats: "Month 3", "3 (December 2025)", or just "3"
            let monthNum = null;
            const monthMatch = month.match(/Month (\d+)/);
            if (monthMatch) {
              monthNum = monthMatch[1];
            } else {
              // Try format: "3 (December 2025)" or just "3"
              const altMatch = month.match(/^(\d+)/);
              if (altMatch) {
                monthNum = altMatch[1];
              }
            }
            
            if (monthNum) {
              // Try multiple matching strategies for month number:
              for (const iteration of iterations) {
                // Strategy 2a: Match month number in iteration title (e.g., "Iteration 3", "Month 3")
                if (iteration.title) {
                  const titleLower = iteration.title.toLowerCase();
                  // Extract iteration number from title (e.g., "Iteration 3" -> "3")
                  const iterNumMatch = titleLower.match(/(?:iteration|month|sprint)\s*(\d+)/);
                  if (iterNumMatch && iterNumMatch[1] === monthNum) {
                    matchedIteration = iteration;
                    break;
                  }
                  // Fallback: Check if title contains month number
                  if (
                    titleLower.includes(`month ${monthNum}`) ||
                    titleLower.includes(`sprint ${monthNum}`) ||
                    titleLower.includes(`iteration ${monthNum}`) ||
                    (titleLower.includes(monthNum) && !isNaN(parseInt(monthNum)))
                  ) {
                    matchedIteration = iteration;
                    break;
                  }
                }
                
                // Strategy 2b: Match by iteration start date month
                if (!matchedIteration && iteration.startDate) {
                  try {
                    const iterStart = new Date(iteration.startDate);
                    const iterMonthNum = iterStart.getMonth() + 1; // 1-12
                    if (iterMonthNum.toString() === monthNum) {
                      matchedIteration = iteration;
                      break;
                    }
                  } catch (e) {
                    // Skip invalid dates
                  }
                }
                
                // Strategy 2c: Match by due date month if available
                if (!matchedIteration && taskDueDate) {
                  try {
                    const dueDate = new Date(taskDueDate);
                    const dueMonthNum = dueDate.getMonth() + 1; // 1-12
                    if (dueMonthNum.toString() === monthNum && iteration.startDate) {
                      const iterStart = new Date(iteration.startDate);
                      const iterMonthNum = iterStart.getMonth() + 1;
                      // Match if both are in same month
                      if (iterMonthNum === dueMonthNum) {
                        matchedIteration = iteration;
                        break;
                      }
                    }
                  } catch (e) {
                    // Skip invalid dates
                  }
                }
              }
            }
          }
          
          // Strategy 3: Fallback - match by due date month to iteration start month
          if (!matchedIteration && taskDueDate) {
            try {
              const dueDate = new Date(taskDueDate);
              const dueMonth = dueDate.getMonth() + 1; // 1-12
              
              for (const iteration of iterations) {
                if (iteration.startDate) {
                  const iterStart = new Date(iteration.startDate);
                  const iterMonth = iterStart.getMonth() + 1;
                  
                  // Match if due date month matches iteration start month
                  if (iterMonth === dueMonth) {
                    matchedIteration = iteration;
                    break;
                  }
                }
              }
            } catch (e) {
              // Skip invalid dates
            }
          }
          
          // Update iteration field if match found
          if (matchedIteration && matchedIteration.id) {
            const success = await updateProjectField(projectId, itemId, iterationField.id, {
              type: 'iteration',
              iterationId: matchedIteration.id
            });
            if (success) {
              issueUpdated = true;
              iterationUpdatedCount++;
              // Log first 20 matches for debugging
              if (iterationUpdatedCount <= 20) {
                console.log(`  ✅ Issue #${issue.number}: Iteration="${matchedIteration.title || matchedIteration.id}" (month: ${month || 'N/A'}, due: ${taskDueDate || 'N/A'})`);
              }
            } else {
              // Log update failures
              if (iterationUpdatedCount <= 20) {
                console.log(`  ❌ Issue #${issue.number}: Failed to update iteration field`);
              }
            }
          } else {
            // Strategy 4: If no match found, try to assign to current iteration based on today's date
            // This ensures tasks show up in "Current iteration" view
            if (!matchedIteration) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // Find current iteration (iteration that contains today's date)
              for (const iteration of iterations) {
                if (iteration.startDate) {
                  try {
                    const iterStart = new Date(iteration.startDate);
                    iterStart.setHours(0, 0, 0, 0);
                    const iterEnd = new Date(iterStart);
                    iterEnd.setDate(iterEnd.getDate() + (iteration.duration || 14));
                    
                    if (today >= iterStart && today <= iterEnd) {
                      matchedIteration = iteration;
                      console.log(`  🔄 Issue #${issue.number}: Assigning to current iteration "${iteration.title}" (no match found, using current iteration)`);
                      break;
                    }
                  } catch (e) {
                    // Skip invalid dates
                  }
                }
              }
              
              // If still no match, assign to latest iteration
              if (!matchedIteration && iterations.length > 0) {
                // Find latest iteration by start date
                let latestIter = null;
                let latestDate = null;
                for (const iter of iterations) {
                  if (iter.startDate) {
                    const iterDate = new Date(iter.startDate);
                    if (!latestDate || iterDate > latestDate) {
                      latestDate = iterDate;
                      latestIter = iter;
                    }
                  }
                }
                if (latestIter) {
                  matchedIteration = latestIter;
                  console.log(`  🔄 Issue #${issue.number}: Assigning to latest iteration "${latestIter.title}" (fallback)`);
                }
              }
              
              // Update with matched iteration (even if it's a fallback)
              if (matchedIteration && matchedIteration.id) {
                const success = await updateProjectField(projectId, itemId, iterationField.id, {
                  type: 'iteration',
                  iterationId: matchedIteration.id
                });
                if (success) {
                  issueUpdated = true;
                  iterationUpdatedCount++;
                }
              } else {
                // Debug: Log why iteration wasn't matched (first 10 only)
                if (iterationFailCount < 10 && (month || taskDueDate)) {
                  console.log(`  ⚠️  Issue #${issue.number}: No iteration match (month: ${month || 'N/A'}, dueDate: ${taskDueDate || 'N/A'}, available: ${iterations.length} iterations)`);
                  iterationFailCount++;
                }
              }
            }
          }
        } else {
          // No month or due date, but still try to assign to current iteration
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (const iteration of iterations) {
            if (iteration.startDate) {
              try {
                const iterStart = new Date(iteration.startDate);
                iterStart.setHours(0, 0, 0, 0);
                const iterEnd = new Date(iterStart);
                iterEnd.setDate(iterEnd.getDate() + (iteration.duration || 14));
                
                if (today >= iterStart && today <= iterEnd) {
                  const success = await updateProjectField(projectId, itemId, iterationField.id, {
                    type: 'iteration',
                    iterationId: iteration.id
                  });
                  if (success) {
                    issueUpdated = true;
                    iterationUpdatedCount++;
                    if (iterationUpdatedCount <= 10) {
                      console.log(`  🔄 Issue #${issue.number}: Assigned to current iteration "${iteration.title}" (no month/due date)`);
                    }
                  }
                  break;
                }
              } catch (e) {
                // Skip invalid dates
              }
            }
          }
        }
      }
      
      // Extract and update dates (priority: task file > issue body)
      // Roadmap view uses Start Date and Target Date
      let startDate = null;
      let targetDate = null;
      
      // First, try to get dates from task file (source of truth)
      const taskDueDate = taskDueDateMap.get(issue.number);
      if (taskDueDate) {
        // Calculate start date (7 days before due date)
        try {
          const dueDate = new Date(taskDueDate);
          const start = new Date(dueDate);
          start.setDate(start.getDate() - 7);
          startDate = start.toISOString().split('T')[0];
          targetDate = taskDueDate;
        } catch (e) {
          // Invalid date, skip
        }
      }
      
      // Fallback to issue body if no task file date found
      if (!targetDate && issue.body) {
        const startDateMatch = issue.body.match(/\*\*Start Date\*\*: (\d{4}-\d{2}-\d{2})/);
        if (startDateMatch) startDate = startDateMatch[1];
        
        const targetDateMatch = issue.body.match(/\*\*Target Date\*\*: (\d{4}-\d{2}-\d{2})/);
        if (targetDateMatch) targetDate = targetDateMatch[1];
      }
      
      // Update Start Date field (for Roadmap view)
      if (startDate && startDateField) {
        await updateProjectField(projectId, itemId, startDateField.id, {
          type: 'date',
          date: startDate
        });
        issueUpdated = true;
      }
      
      // Update Target Date field (for Roadmap view)
      if (targetDate && targetDateField) {
        await updateProjectField(projectId, itemId, targetDateField.id, {
          type: 'date',
          date: targetDate
        });
        issueUpdated = true;
      }
      
      if (issueUpdated) {
        updated++;
        if (updated % 10 === 0) {
          console.log(`  Progress: ${processed}/${issues.length} processed, ${updated} updated...`);
        }
      }
      
      // Rate limiting (300ms between updates to avoid API throttling)
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\n✅ Sync complete!`);
    console.log(`   - ${added} issues added to project`);
    console.log(`   - ${updated} issues updated with project fields`);
    console.log(`   - ${processed} issues processed`);
    // Count how many issues were marked as Critical
    let criticalCount = 0;
    for (const issue of issues) {
      const taskStatus = taskStatusMap.get(issue.number);
      if (taskStatus === 'OVERDUE') {
        criticalCount++;
      } else {
        const taskDueDate = taskDueDateMap.get(issue.number);
        if (taskDueDate) {
          try {
            const dueDate = new Date(taskDueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today) {
              criticalCount++;
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
      }
    }
    
    console.log(`   - ${taskStatusMap.size} issues synced from task files (source of truth)`);
    console.log(`   - ${criticalCount} issues marked as Critical (overdue/rush)`);
    console.log(`   - ${iterationUpdatedCount} issues assigned to iterations`);
    if (iterationFailCount > 0) {
      console.log(`   - ${iterationFailCount} issues couldn't be matched to iterations`);
    }
    console.log('\n📊 Project views synced:');
    console.log('   - Backlog: Filters by Status field (Todo) - All tasks with Todo status');
    console.log('   - Board: Columns based on Status (Todo/In Progress/Done/Critical) - All tasks grouped by status');
    console.log('   - Critical Column: Overdue tasks and rush items - Tasks past due date or marked OVERDUE');
    console.log('   - Current iteration: Filters by Iteration + Status - Tasks in current iteration, grouped by status');
    console.log('   - Roadmap: Timeline based on Start/Target dates + Status - All tasks on timeline');
    console.log('\n   ⚠️  IMPORTANT: All views use the same Status and Iteration fields.');
    console.log('   Changes to Status or Iteration in one view will sync to all other views automatically.');
    console.log('\n   Fields updated:');
    console.log('   - Status: From task files (BACKLOG→Todo, IN_PROGRESS→In Progress, DONE→Done, OVERDUE→Critical)');
    console.log('   - Overdue Detection: Tasks past due date automatically marked as Critical');
    console.log('   - Priority: From issue labels');
    console.log('   - Start Date: From task files or issue body (for Roadmap)');
    console.log('   - Target Date: From task files or issue body (for Roadmap)');
    
  } catch (error) {
    console.error(`❌ Failed to sync project: ${error.message}`);
    console.log('Note: Ensure GITHUB_PROJECT_NUMBER environment variable is set correctly');
    process.exit(1);
  }
}

// Run sync
syncProjectIssues().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
