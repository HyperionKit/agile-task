#!/usr/bin/env node
/**
 * Syncs GitHub Project views (Backlog/Board/Current iteration/Roadmap)
 * Ensures all issues are properly categorized in the project
 * Usage: node sync-project-issues.js
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { execSync } = require('child_process');
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

async function syncProjectIssues() {
  try {
    console.log('Syncing GitHub Project views...');
    
    // Get all open issues with full details (including body to extract dates)
    const issuesOutput = execSync(
      `gh issue list --repo ${REPO_NAME} --state all --json number,title,labels,body,state --limit 200`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const issues = JSON.parse(issuesOutput);
    
    console.log(`Found ${issues.length} issues (open and closed)`);
    
    // Determine if owner is user or organization
    const ownerType = getProjectOwnerType(PROJECT_OWNER);
    const queryField = ownerType === 'organization' ? 'organization' : 'user';
    
    // Get project items (GraphQL limit is 100, use pagination if needed)
    const projectQuery = `query { ${queryField}(login: "${PROJECT_OWNER}") { projectV2(number: ${PROJECT_NUMBER}) { id items(first: 100) { nodes { id content { ... on Issue { number } } } pageInfo { hasNextPage endCursor } } } } }`;
    
    try {
      const projectOutput = execSync(
        `gh api graphql -f query="${projectQuery.replace(/"/g, '\\"')}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      const projectData = JSON.parse(projectOutput);
      const projectId = projectData?.data?.[queryField]?.projectV2?.id;
      let existingItems = projectData?.data?.[queryField]?.projectV2?.items?.nodes || [];
      let pageInfo = projectData?.data?.[queryField]?.projectV2?.items?.pageInfo;
      
      // Handle pagination if there are more than 100 items
      while (pageInfo?.hasNextPage) {
        const paginatedQuery = `query { ${queryField}(login: "${PROJECT_OWNER}") { projectV2(number: ${PROJECT_NUMBER}) { items(first: 100, after: "${pageInfo.endCursor}") { nodes { id content { ... on Issue { number } } } pageInfo { hasNextPage endCursor } } } } }`;
        const paginatedOutput = execSync(
          `gh api graphql -f query="${paginatedQuery.replace(/"/g, '\\"')}"`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
        const paginatedData = JSON.parse(paginatedOutput);
        const nextItems = paginatedData?.data?.[queryField]?.projectV2?.items?.nodes || [];
        existingItems = existingItems.concat(nextItems);
        pageInfo = paginatedData?.data?.[queryField]?.projectV2?.items?.pageInfo;
      }
      
      if (!projectId) {
        throw new Error(`Project ${PROJECT_NUMBER} not found for ${PROJECT_OWNER} (${ownerType})`);
      }
      const existingIssueNumbers = new Set(
        existingItems
          .map(item => item.content?.number)
          .filter(Boolean)
      );
      
      console.log(`Project has ${existingItems.length} items`);
      
      // Add missing issues to project and update status for all issues
      let added = 0;
      let updated = 0;
      
      for (const issue of issues) {
        if (!existingIssueNumbers.has(issue.number)) {
          // Add missing issue
          try {
            execSync(
              `gh project item-add ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${REPO_NAME}/issues/${issue.number}"`,
              { stdio: 'ignore' }
            );
            console.log(`✅ Added issue #${issue.number} to project`);
            added++;
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`❌ Failed to add issue #${issue.number}: ${error.message}`);
          }
        }
        
        // Update ALL project fields based on issue labels AND body metadata
        // This ensures Board/Backlog/Current iteration/Roadmap views stay in sync
        try {
          const statusLabel = issue.labels.find(l => l.name.startsWith('status:'));
          const priorityLabel = issue.labels.find(l => l.name.startsWith('priority:'));
          
          // Extract dates and sprint from issue body
          let startDate = null;
          let targetDate = null;
          let iteration = null;
          
          if (issue.body) {
            // Extract Start Date
            const startDateMatch = issue.body.match(/\*\*Start Date\*\*: (\d{4}-\d{2}-\d{2})/);
            if (startDateMatch) {
              startDate = startDateMatch[1];
            }
            
            // Extract Target Date
            const targetDateMatch = issue.body.match(/\*\*Target Date\*\*: (\d{4}-\d{2}-\d{2})/);
            if (targetDateMatch) {
              targetDate = targetDateMatch[1];
            }
            
            // Extract Sprint/Iteration
            const sprintMatch = issue.body.match(/\*\*Sprint\*\*: (S\d+)/);
            if (sprintMatch) {
              iteration = sprintMatch[1];
            }
          }
          
          // ALWAYS update status field based on label (this controls Board columns)
          if (statusLabel) {
            const statusMap = {
              'status:backlog': 'Todo',
              'status:in-progress': 'In Progress',
              'status:review': 'In Review',
              'status:done': 'Done',
              'status:blocked': 'Blocked',
              'status:overdue': 'Todo'
            };
            
            const projectStatus = statusMap[statusLabel.name] || 'Todo';
            
            try {
              execSync(
                `gh project item-edit ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${REPO_NAME}/issues/${issue.number}" --field-status "${projectStatus}"`,
                { stdio: 'ignore' }
              );
              updated++;
              console.log(`✅ Issue #${issue.number}: ${statusLabel.name} → ${projectStatus}`);
              
              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
              console.error(`❌ Failed to update status for issue #${issue.number}: ${error.message}`);
            }
          }
          
          // Update priority field based on label
          if (priorityLabel) {
            const priorityMap = {
              'priority:critical': 'Critical',
              'priority:high': 'High',
              'priority:medium': 'Medium',
              'priority:low': 'Low'
            };
            
            const projectPriority = priorityMap[priorityLabel.name] || 'Medium';
            
            try {
              execSync(
                `gh project item-edit ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${REPO_NAME}/issues/${issue.number}" --field-priority "${projectPriority}"`,
                { stdio: 'ignore' }
              );
              updated++;
              
              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
              // Priority field might not exist, that's okay
            }
          }
          
          // Update Start date
          if (startDate) {
            try {
              execSync(
                `gh project item-edit ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${REPO_NAME}/issues/${issue.number}" --field-start-date "${startDate}"`,
                { stdio: 'ignore' }
              );
              updated++;
            } catch (error) {
              // Start date field might not exist, that's okay
            }
          }
          
          // Update Target date
          if (targetDate) {
            try {
              execSync(
                `gh project item-edit ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${REPO_NAME}/issues/${issue.number}" --field-target-date "${targetDate}"`,
                { stdio: 'ignore' }
              );
              updated++;
            } catch (error) {
              // Target date field might not exist, that's okay
            }
          }
          
          // Update Iteration
          if (iteration) {
            try {
              execSync(
                `gh project item-edit ${PROJECT_NUMBER} --owner ${PROJECT_OWNER} --url "${REPO_NAME}/issues/${issue.number}" --field-iteration "${iteration}"`,
                { stdio: 'ignore' }
              );
              updated++;
            } catch (error) {
              // Iteration field might not exist, that's okay
            }
          }
        } catch (error) {
          // Fields might not exist or have different names, that's okay
          // Silently continue
        }
      }
      
      console.log(`\n✅ Sync complete: ${added} issues added, ${updated} status fields updated`);
      console.log('Project views (Backlog/Board/Current iteration/Roadmap) are now synced');
      
    } catch (error) {
      console.error(`Failed to sync project: ${error.message}`);
      console.log('Note: Ensure GITHUB_PROJECT_NUMBER environment variable is set correctly');
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Helper to make setTimeout work in async function
function setTimeout(ms) {
  return new Promise(resolve => {
    const { setTimeout: st } = require('timers');
    st(resolve, ms);
  });
}

syncProjectIssues().catch(console.error);

