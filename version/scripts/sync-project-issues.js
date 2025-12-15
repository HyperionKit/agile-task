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
  console.error('   Required scopes: repo, read:org, read:project, write:project');
  process.exit(1);
}

// Set token for gh CLI if not already set
if (process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
  process.env.GH_TOKEN = process.env.GITHUB_TOKEN;
}

const REPO_NAME = process.env.GITHUB_REPO_NAME || 'HyperionKit/agile-task';
const PROJECT_OWNER = process.env.GITHUB_PROJECT_OWNER || 'HyperionKit';
const PROJECT_NUMBER = process.env.GITHUB_PROJECT_NUMBER || '1';

async function syncProjectIssues() {
  try {
    console.log('Syncing GitHub Project views...');
    
    // Get all open issues
    const issuesOutput = execSync(
      `gh issue list --repo ${REPO_NAME} --state open --json number,title,labels --limit 200`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const issues = JSON.parse(issuesOutput);
    
    console.log(`Found ${issues.length} open issues`);
    
    // Get project items - use single line query
    const projectQuery = `query { organization(login: "${PROJECT_OWNER}") { projectV2(number: ${PROJECT_NUMBER}) { id items(first: 200) { nodes { id content { ... on Issue { number } } } } } } }`;
    
    try {
      const projectOutput = execSync(
        `gh api graphql -f query="${projectQuery.replace(/"/g, '\\"')}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      const projectData = JSON.parse(projectOutput);
      const projectId = projectData?.data?.organization?.projectV2?.id;
      const existingItems = projectData?.data?.organization?.projectV2?.items?.nodes || [];
      const existingIssueNumbers = new Set(
        existingItems
          .map(item => item.content?.number)
          .filter(Boolean)
      );
      
      console.log(`Project has ${existingItems.length} items`);
      
      // Add missing issues to project
      let added = 0;
      for (const issue of issues) {
        if (!existingIssueNumbers.has(issue.number)) {
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
      }
      
      console.log(`\n✅ Sync complete: ${added} issues added to project`);
      console.log('Project views (Backlog/Board/Current iteration/Roadmap) will automatically reflect these changes');
      
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

