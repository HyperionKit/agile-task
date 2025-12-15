#!/usr/bin/env node
/**
 * Syncs GitHub Project views (Backlog/Board/Current iteration/Roadmap)
 * Uses GraphQL API to update project fields based on issue labels
 * Usage: node sync-project-issues.js
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

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

// Get project ID and field IDs
async function getProjectFields(projectId) {
  // Get all field types: single-select, iteration, number, date, text
  const fieldsQuery = `query { node(id: "${projectId}") { ... on ProjectV2 { fields(first: 30) { nodes { ... on ProjectV2Field { id name dataType } ... on ProjectV2SingleSelectField { id name dataType options { id name } } ... on ProjectV2IterationField { id name } } } } } } }`;
  
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
      { encoding: 'utf-8', stdio: 'ignore', shell: true }
    );
    return true;
  } catch (error) {
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
        if (type === 'iteration') return f.__typename === 'ProjectV2IterationField';
        return true;
      });
    };
    
    const statusField = findField('Status', 'singleSelect');
    const priorityField = findField('Priority', 'singleSelect');
    const sizeField = findField('Size', 'singleSelect');
    const estimateField = findField('Estimate', 'number');
    const iterationField = findField('Iteration', 'iteration');
    const startDateField = findField('Start date', 'date') || findField('Start Date', 'date');
    const targetDateField = findField('Target date', 'date') || findField('Target Date', 'date');
    
    console.log(`Fields found: Status=${!!statusField}, Priority=${!!priorityField}, Size=${!!sizeField}, Estimate=${!!estimateField}, Iteration=${!!iterationField}, StartDate=${!!startDateField}, TargetDate=${!!targetDateField}`);
    
    if (!statusField) {
      console.warn('⚠️  Status field not found in project. Please ensure a "Status" field exists.');
    }
    
    // Map status labels to option IDs
    const statusMap = {
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
    
    console.log(`\nUpdating project fields for ${issues.length} issues...`);
    
    for (const issue of issues) {
      const itemId = issueToItemId.get(issue.number);
      if (!itemId) {
        continue;
      }
      
      processed++;
      let issueUpdated = false;
      
      // Update Status field
      if (statusField && statusField.options) {
        const statusLabel = issue.labels.find(l => l.name.startsWith('status:'));
        if (statusLabel) {
          const statusValue = statusMap[statusLabel.name] || 'Todo';
          const option = statusField.options.find(o => o.name === statusValue);
          if (option) {
            const success = await updateProjectField(projectId, itemId, statusField.id, {
              type: 'singleSelect',
              optionId: option.id
            });
            if (success) {
              issueUpdated = true;
            }
          }
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
      
      // Extract and update dates from issue body
      if (issue.body) {
        const startDateMatch = issue.body.match(/\*\*Start Date\*\*: (\d{4}-\d{2}-\d{2})/);
        if (startDateMatch && startDateField) {
          await updateProjectField(projectId, itemId, startDateField.id, {
            type: 'date',
            date: startDateMatch[1]
          });
          issueUpdated = true;
        }
        
        const targetDateMatch = issue.body.match(/\*\*Target Date\*\*: (\d{4}-\d{2}-\d{2})/);
        if (targetDateMatch && targetDateField) {
          await updateProjectField(projectId, itemId, targetDateField.id, {
            type: 'date',
            date: targetDateMatch[1]
          });
          issueUpdated = true;
        }
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
    console.log('\n📊 Project views (Backlog/Board/Current iteration/Roadmap) are now synced');
    console.log('   Fields updated: Status, Priority, Start Date, Target Date');
    
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
