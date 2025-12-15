#!/usr/bin/env node
/**
 * Sets up all required GitHub labels for task issues
 * Usage: node setup-labels.js [--dry-run]
 */

const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const REPO_NAME = 'HyperionKit/agile-task';

const LABELS = [
  // Priority labels
  { name: 'priority:critical', color: 'd73a4a', description: 'P0 - Critical priority' },
  { name: 'priority:high', color: 'e99695', description: 'P1 - High priority' },
  { name: 'priority:medium', color: 'fbca04', description: 'P2 - Medium priority' },
  { name: 'priority:low', color: '0e8a16', description: 'P3 - Low priority' },
  
  // Status labels
  { name: 'status:backlog', color: 'ededed', description: 'Task in backlog' },
  { name: 'status:in-progress', color: '0052cc', description: 'Task in progress' },
  { name: 'status:review', color: 'fbca04', description: 'Task under review' },
  { name: 'status:done', color: '0e8a16', description: 'Task completed' },
  { name: 'status:blocked', color: 'd73a4a', description: 'Task blocked' },
  { name: 'status:overdue', color: 'b60205', description: 'Task overdue' },
  
  // Category labels
  { name: 'category:hyperagent', color: '1d76db', description: 'HyperAgent related' },
  { name: 'category:sdk', color: '0e8a16', description: 'SDK related' },
  { name: 'category:account-abstraction', color: '5319e7', description: 'Account Abstraction related' },
  { name: 'category:security', color: 'b60205', description: 'Security related' },
  { name: 'category:frontend', color: 'c2e0c6', description: 'Frontend/UI related' },
  
  // Month labels
  { name: 'month:1', color: 'bfd4f2', description: 'Month 1 (October 2025)' },
  { name: 'month:2', color: 'bfd4f2', description: 'Month 2 (November 2025)' },
  { name: 'month:3', color: 'bfd4f2', description: 'Month 3 (December 2025)' },
  { name: 'month:4', color: 'bfd4f2', description: 'Month 4 (January 2026)' },
  { name: 'month:5', color: 'bfd4f2', description: 'Month 5 (February 2026)' },
  { name: 'month:6', color: 'bfd4f2', description: 'Month 6 (March 2026)' },
  
  // Type label
  { name: 'type:task', color: '7057ff', description: 'Task from PRD' }
];

function createLabel(label) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would create label: ${label.name} (${label.color})`);
    return;
  }
  
  try {
    const cmd = `gh label create "${label.name}" --repo ${REPO_NAME} --color "${label.color}" --description "${label.description}" --force`;
    execSync(cmd, { stdio: 'ignore' });
    console.log(`✅ Created label: ${label.name}`);
  } catch (error) {
    // Label might already exist, that's fine
    console.log(`⚠️  Label ${label.name} already exists or error: ${error.message}`);
  }
}

console.log(`Setting up ${LABELS.length} labels for ${REPO_NAME}...`);
if (DRY_RUN) {
  console.log('[DRY RUN MODE - No changes will be made]');
}

LABELS.forEach(createLabel);

console.log('\n✅ Label setup complete!');

