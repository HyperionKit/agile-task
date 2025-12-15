#!/usr/bin/env node

/**
 * Create GitHub Project iterations (4-7) based on date ranges
 * Aligns with existing iteration structure (2-week sprints)
 */

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

const PROJECT_OWNER = process.env.GITHUB_PROJECT_OWNER || 'HyperionKit';
const PROJECT_NUMBER = process.env.GITHUB_PROJECT_NUMBER || '1';

// Determine if owner is user or organization
function getProjectOwnerType(owner) {
  try {
    const output = execSync(
      `gh api graphql -f query="{ organization(login: \\"${owner}\\") { id } }"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const data = JSON.parse(output);
    if (data?.data?.organization?.id) {
      return 'organization';
    }
  } catch (e) {
    // Not an organization, assume user
  }
  return 'user';
}

// Get project ID and iteration field ID
async function getProjectAndIterationField() {
  const ownerType = getProjectOwnerType(PROJECT_OWNER);
  const queryField = ownerType === 'organization' ? 'organization' : 'user';
  
  // Get project ID
  const projectQuery = `query { ${queryField}(login: "${PROJECT_OWNER}") { projectV2(number: ${PROJECT_NUMBER}) { id fields(first: 30) { nodes { ... on ProjectV2IterationField { id name configuration { iterations { id title startDate duration } } } } } } } } }`;
  
  try {
    const output = execSync(
      `gh api graphql -f query="${projectQuery.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', stdio: 'pipe', shell: true }
    );
    const data = JSON.parse(output);
    const projectId = data?.data?.[queryField]?.projectV2?.id;
    const fields = data?.data?.[queryField]?.projectV2?.fields?.nodes || [];
    
    const iterationField = fields.find(f => f.name && f.name.toLowerCase() === 'iteration');
    
    if (!projectId) {
      throw new Error(`Project ${PROJECT_NUMBER} not found`);
    }
    
    if (!iterationField) {
      throw new Error('Iteration field not found in project');
    }
    
    return { projectId, iterationField };
  } catch (error) {
    console.error(`❌ Failed to get project: ${error.message}`);
    throw error;
  }
}

// Create a new iteration using REST API
// Note: GitHub Projects v2 iterations must be created via REST API
async function createIteration(projectId, iterationFieldId, title, startDate, duration = 14) {
  // Calculate end date
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + duration);
  const endDate = end.toISOString().split('T')[0];
  
  // Use REST API: POST projects/{project_id}/iterations
  // Note: Remove leading slash to avoid path rewriting on Windows
  try {
    const output = execSync(
      `gh api -X POST projects/${projectId}/iterations -f title="${title}" -f start_date="${startDate}" -f end_date="${endDate}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    const data = JSON.parse(output);
    
    if (data.id || data.title) {
      console.log(`✅ Created iteration: ${title} (${startDate} to ${endDate})`);
      return true;
    } else {
      console.error(`❌ Failed to create iteration: ${title}`);
      console.error(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`❌ Error creating iteration ${title}: ${error.message}`);
    if (error.stdout) {
      try {
        const errorData = JSON.parse(error.stdout);
        console.error(`   Details: ${JSON.stringify(errorData, null, 2)}`);
      } catch (e) {
        console.error(`   Output: ${error.stdout.substring(0, 200)}`);
      }
    }
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Checking GitHub Project iterations 1-7...\n');
    
    const { projectId, iterationField } = await getProjectAndIterationField();
    
    console.log(`✅ Found project ID: ${projectId}`);
    console.log(`✅ Found iteration field: ${iterationField.name}\n`);
    
    // Check existing iterations
    const existingIterations = iterationField.configuration?.iterations || [];
    console.log(`Existing iterations: ${existingIterations.length}`);
    existingIterations.forEach(iter => {
      console.log(`  - ${iter.title} (${iter.startDate}, ${iter.duration || 14} days)`);
    });
    
    // Create a map of existing iterations by number
    const existingIterationMap = new Map();
    existingIterations.forEach(iter => {
      // Extract iteration number from title (e.g., "Iteration 3" -> 3, "Iteration" -> 1)
      const titleLower = iter.title.toLowerCase();
      let iterNum = null;
      
      if (titleLower === 'iteration' || titleLower === 'iteration 1') {
        iterNum = 1;
      } else {
        const match = titleLower.match(/iteration\s*(\d+)/);
        if (match) {
          iterNum = parseInt(match[1]);
        }
      }
      
      if (iterNum) {
        existingIterationMap.set(iterNum, iter);
      }
    });
    
    // Define all iterations 1-7 with their expected dates
    // Based on existing structure: Iteration (2025-12-15), Iteration 2 (2025-12-29), Iteration 3 (2026-01-12)
    const allIterations = [
      { number: 1, title: 'Iteration', startDate: '2025-12-15', duration: 14 },
      { number: 2, title: 'Iteration 2', startDate: '2025-12-29', duration: 14 },
      { number: 3, title: 'Iteration 3', startDate: '2026-01-12', duration: 14 },
      { number: 4, title: 'Iteration 4', startDate: '2026-01-26', duration: 14 },
      { number: 5, title: 'Iteration 5', startDate: '2026-02-09', duration: 14 },
      { number: 6, title: 'Iteration 6', startDate: '2026-02-23', duration: 14 },
      { number: 7, title: 'Iteration 7', startDate: '2026-03-09', duration: 14 }
    ];
    
    // Find missing iterations
    const missingIterations = [];
    const existingIterationsList = [];
    
    for (const iter of allIterations) {
      if (existingIterationMap.has(iter.number)) {
        const existing = existingIterationMap.get(iter.number);
        existingIterationsList.push({
          number: iter.number,
          title: existing.title,
          startDate: existing.startDate,
          duration: existing.duration || 14
        });
      } else {
        missingIterations.push(iter);
      }
    }
    
    console.log(`\n📊 Iteration Status:`);
    console.log(`   ✅ Existing: ${existingIterationsList.length}/7`);
    existingIterationsList.forEach(iter => {
      console.log(`      - ${iter.title} (${iter.startDate})`);
    });
    
    if (missingIterations.length > 0) {
      console.log(`   ❌ Missing: ${missingIterations.length}/7`);
      missingIterations.forEach(iter => {
        console.log(`      - ${iter.title} (${iter.startDate})`);
      });
    } else {
      console.log(`   ✅ All iterations 1-7 exist!`);
    }
    
    // Display instructions for manual creation (only for missing iterations)
    if (missingIterations.length > 0) {
      console.log(`\n⚠️  GitHub Projects v2 doesn't provide an API for creating iterations.`);
      console.log(`   They must be created manually in the GitHub UI.\n`);
      
      console.log(`📋 Manual Creation Steps for Missing Iterations:\n`);
      console.log(`   1. Go to: https://github.com/orgs/${PROJECT_OWNER}/projects/${PROJECT_NUMBER}`);
      console.log(`   2. Click "..." menu (top right) → "Settings"`);
      console.log(`   3. Find "Iteration" field and click to edit`);
      console.log(`   4. Click "Add iteration" for each missing iteration below:\n`);
      
      missingIterations.forEach(iter => {
        const endDate = new Date(iter.startDate);
        endDate.setDate(endDate.getDate() + iter.duration);
        const endDateStr = endDate.toISOString().split('T')[0];
        console.log(`   ${iter.title}:`);
        console.log(`     Start: ${iter.startDate}`);
        console.log(`     End: ${endDateStr}`);
        console.log(`     Duration: ${iter.duration} days\n`);
      });
      
      console.log(`   5. Click "Save changes" after adding all missing iterations\n`);
      
      console.log(`✅ After creating missing iterations, run:`);
      console.log(`   npm run issue:sync-project`);
      console.log(`\n   This will automatically match tasks to iterations based on dates.`);
    } else {
      console.log(`\n✅ All iterations 1-7 already exist!`);
      console.log(`\n   Run: npm run issue:sync-project`);
      console.log(`   This will sync tasks to existing iterations.`);
    }
    
  } catch (error) {
    console.error(`\n❌ Failed to create iterations: ${error.message}`);
    process.exit(1);
  }
}

main();

