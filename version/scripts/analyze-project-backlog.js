#!/usr/bin/env node
/**
 * Analyze GitHub Project backlog to check field completion
 * Usage: node analyze-project-backlog.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { execSync } = require('child_process');

const REPO_NAME = process.env.GITHUB_REPO_NAME || 'HyperionKit/agile-task';
const PROJECT_OWNER = process.env.GITHUB_PROJECT_OWNER || 'HyperionKit';
const PROJECT_NUMBER = process.env.GITHUB_PROJECT_NUMBER || 1;

const queryField = 'user';

// Get all project items with field values
// Note: assignees and labels are connections, need to use nodes
const itemsQuery = `query { ${queryField}(login: "${PROJECT_OWNER}") { projectV2(number: ${PROJECT_NUMBER}) { items(first: 200) { nodes { id content { ... on Issue { number title assignees(first: 10) { nodes { login } } labels(first: 20) { nodes { name } } } } fieldValues(first: 30) { nodes { ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2Field { name } } } ... on ProjectV2ItemFieldNumberValue { number field { ... on ProjectV2Field { name } } } ... on ProjectV2ItemFieldDateValue { date field { ... on ProjectV2Field { name } } } ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2Field { name } } } ... on ProjectV2ItemFieldIterationValue { title field { ... on ProjectV2Field { name } } } } } } pageInfo { hasNextPage endCursor } } } } } } }`;

try {
  console.log('Fetching project backlog data...\n');
  
  const output = execSync(
    `gh api graphql -f query="${itemsQuery.replace(/"/g, '\\"')}"`,
    { encoding: 'utf-8', stdio: 'pipe', shell: true }
  );
  
  const data = JSON.parse(output);
  const items = data?.data?.[queryField]?.projectV2?.items?.nodes || [];
  
  console.log(`Total items in project: ${items.length}\n`);
  console.log('='.repeat(80));
  console.log('BACKLOG ANALYSIS');
  console.log('='.repeat(80));
  
  // Analyze field completion
  const stats = {
    total: items.length,
    title: { filled: 0, empty: 0 },
    assignees: { filled: 0, empty: 0 },
    status: { filled: 0, empty: 0 },
    iteration: { filled: 0, empty: 0 },
    estimate: { filled: 0, empty: 0 },
    startDate: { filled: 0, empty: 0 },
    targetDate: { filled: 0, empty: 0 }
  };
  
  const details = [];
  
  items.forEach((item, index) => {
    const issue = item.content;
    const fields = item.fieldValues?.nodes || [];
    
    // Extract assignees (handle nested structure)
    const assigneesList = issue.assignees?.nodes || issue.assignees || [];
    const assigneeNames = assigneesList.map(a => a.login || a).join(', ') || 'None';
    
    // Extract field values
    const status = fields.find(f => f.field?.name === 'Status' || f.field?.name === 'status');
    const iteration = fields.find(f => f.field?.name === 'Iteration' || f.field?.name === 'iteration');
    const estimate = fields.find(f => f.field?.name === 'Estimate' || f.field?.name === 'estimate');
    const startDate = fields.find(f => (f.field?.name === 'Start date' || f.field?.name === 'Start Date') && f.date);
    const targetDate = fields.find(f => (f.field?.name === 'Target date' || f.field?.name === 'Target Date') && f.date);
    
    // Count filled/empty
    if (issue.title) stats.title.filled++; else stats.title.empty++;
    if (assigneesList.length > 0) stats.assignees.filled++; else stats.assignees.empty++;
    if (status && status.name) stats.status.filled++; else stats.status.empty++;
    if (iteration && iteration.title) stats.iteration.filled++; else stats.iteration.empty++;
    if (estimate && estimate.number) stats.estimate.filled++; else stats.estimate.empty++;
    if (startDate && startDate.date) stats.startDate.filled++; else stats.startDate.empty++;
    if (targetDate && targetDate.date) stats.targetDate.filled++; else stats.targetDate.empty++;
    
    // Store details for first 20 items
    if (index < 20) {
      details.push({
        number: issue.number,
        title: issue.title,
        assignees: assigneeNames,
        status: status?.name || 'Empty',
        iteration: iteration?.title || 'Empty',
        estimate: estimate?.number || 'Empty',
        startDate: startDate?.date || 'Empty',
        targetDate: targetDate?.date || 'Empty'
      });
    }
  });
  
  // Print statistics
  console.log('\nFIELD COMPLETION STATISTICS:');
  console.log('-'.repeat(80));
  console.log(`Title:        ${stats.title.filled.toString().padStart(4)} filled | ${stats.title.empty.toString().padStart(4)} empty (${((stats.title.filled/stats.total)*100).toFixed(1)}%)`);
  console.log(`Assignees:    ${stats.assignees.filled.toString().padStart(4)} filled | ${stats.assignees.empty.toString().padStart(4)} empty (${((stats.assignees.filled/stats.total)*100).toFixed(1)}%)`);
  console.log(`Status:       ${stats.status.filled.toString().padStart(4)} filled | ${stats.status.empty.toString().padStart(4)} empty (${((stats.status.filled/stats.total)*100).toFixed(1)}%)`);
  console.log(`Iteration:    ${stats.iteration.filled.toString().padStart(4)} filled | ${stats.iteration.empty.toString().padStart(4)} empty (${((stats.iteration.filled/stats.total)*100).toFixed(1)}%)`);
  console.log(`Estimate:     ${stats.estimate.filled.toString().padStart(4)} filled | ${stats.estimate.empty.toString().padStart(4)} empty (${((stats.estimate.filled/stats.total)*100).toFixed(1)}%)`);
  console.log(`Start Date:   ${stats.startDate.filled.toString().padStart(4)} filled | ${stats.startDate.empty.toString().padStart(4)} empty (${((stats.startDate.filled/stats.total)*100).toFixed(1)}%)`);
  console.log(`Target Date:  ${stats.targetDate.filled.toString().padStart(4)} filled | ${stats.targetDate.empty.toString().padStart(4)} empty (${((stats.targetDate.filled/stats.total)*100).toFixed(1)}%)`);
  
  // Print sample details
  console.log('\n' + '='.repeat(80));
  console.log('SAMPLE ITEMS (First 20):');
  console.log('='.repeat(80));
  
  details.forEach((item, index) => {
    console.log(`\n${index + 1}. Issue #${item.number}: ${item.title}`);
    console.log(`   Assignees:  ${item.assignees}`);
    console.log(`   Status:     ${item.status}`);
    console.log(`   Iteration:  ${item.iteration}`);
    console.log(`   Estimate:   ${item.estimate}`);
    console.log(`   Start Date: ${item.startDate}`);
    console.log(`   Target Date: ${item.targetDate}`);
  });
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY:');
  console.log('='.repeat(80));
  console.log(`Total Issues: ${stats.total}`);
  console.log(`\nFully Filled Fields (>90%):`);
  const fullyFilled = [];
  if (stats.title.filled/stats.total > 0.9) fullyFilled.push('Title');
  if (stats.assignees.filled/stats.total > 0.9) fullyFilled.push('Assignees');
  if (stats.status.filled/stats.total > 0.9) fullyFilled.push('Status');
  if (stats.iteration.filled/stats.total > 0.9) fullyFilled.push('Iteration');
  if (stats.estimate.filled/stats.total > 0.9) fullyFilled.push('Estimate');
  if (stats.startDate.filled/stats.total > 0.9) fullyFilled.push('Start Date');
  if (stats.targetDate.filled/stats.total > 0.9) fullyFilled.push('Target Date');
  console.log(fullyFilled.length > 0 ? fullyFilled.join(', ') : 'None');
  
  console.log(`\nEmpty Fields (>50% empty):`);
  const emptyFields = [];
  if (stats.title.empty/stats.total > 0.5) emptyFields.push('Title');
  if (stats.assignees.empty/stats.total > 0.5) emptyFields.push('Assignees');
  if (stats.status.empty/stats.total > 0.5) emptyFields.push('Status');
  if (stats.iteration.empty/stats.total > 0.5) emptyFields.push('Iteration');
  if (stats.estimate.empty/stats.total > 0.5) emptyFields.push('Estimate');
  if (stats.startDate.empty/stats.total > 0.5) emptyFields.push('Start Date');
  if (stats.targetDate.empty/stats.total > 0.5) emptyFields.push('Target Date');
  console.log(emptyFields.length > 0 ? emptyFields.join(', ') : 'None');
  
  console.log(`\nPartially Filled (10-90%):`);
  const partialFields = [];
  if (stats.title.filled/stats.total >= 0.1 && stats.title.filled/stats.total <= 0.9) partialFields.push('Title');
  if (stats.assignees.filled/stats.total >= 0.1 && stats.assignees.filled/stats.total <= 0.9) partialFields.push('Assignees');
  if (stats.status.filled/stats.total >= 0.1 && stats.status.filled/stats.total <= 0.9) partialFields.push('Status');
  if (stats.iteration.filled/stats.total >= 0.1 && stats.iteration.filled/stats.total <= 0.9) partialFields.push('Iteration');
  if (stats.estimate.filled/stats.total >= 0.1 && stats.estimate.filled/stats.total <= 0.9) partialFields.push('Estimate');
  if (stats.startDate.filled/stats.total >= 0.1 && stats.startDate.filled/stats.total <= 0.9) partialFields.push('Start Date');
  if (stats.targetDate.filled/stats.total >= 0.1 && stats.targetDate.filled/stats.total <= 0.9) partialFields.push('Target Date');
  console.log(partialFields.length > 0 ? partialFields.join(', ') : 'None');
  
} catch (error) {
  console.error('❌ Error analyzing project:', error.message);
  process.exit(1);
}
