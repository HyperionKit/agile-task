# Creating GitHub Project Iterations 1-7

GitHub Projects v2 doesn't provide an API for creating iterations. They must be created manually in the GitHub UI.

## Quick Check

Run the script to see which iterations are missing:
```bash
npm run issue:create-iterations
```

The script will:
- ✅ Check all iterations 1-7
- ✅ Skip iterations that already exist
- 📋 Show instructions only for missing iterations

## All Iterations (1-7)

| Iteration | Start Date | End Date | Duration |
|-----------|------------|----------|----------|
| Iteration (1) | 2025-12-15 | 2025-12-29 | 14 days |
| Iteration 2 | 2025-12-29 | 2026-01-12 | 14 days |
| Iteration 3 | 2026-01-12 | 2026-01-26 | 14 days |
| Iteration 4 | 2026-01-26 | 2026-02-09 | 14 days |
| Iteration 5 | 2026-02-09 | 2026-02-23 | 14 days |
| Iteration 6 | 2026-02-23 | 2026-03-09 | 14 days |
| Iteration 7 | 2026-03-09 | 2026-03-23 | 14 days |

## Manual Steps (for missing iterations only)

1. **Navigate to Project Settings**:
   - Go to: https://github.com/orgs/HyperionKit/projects/1 (or your project URL)
   - Click the **"..."** menu (top right) → **"Settings"**

2. **Find Iteration Field**:
   - Scroll to find the **"Iteration"** field
   - Click on the field name to edit

3. **Add Missing Iterations**:
   - Click **"Add iteration"** for each missing iteration
   - Use the dates from the table above

4. **Save Changes**:
   - Click **"Save changes"** after adding all missing iterations

5. **Sync Project**:
   - Run: `npm run issue:sync-project`
   - This will match tasks to all iterations based on dates

## After Creating Iterations

Once all iterations 1-7 exist, the sync script will automatically:
- Match tasks to iterations based on due dates
- Match tasks to iterations based on month numbers (Month 3 → Iteration 3)
- Fill empty iteration fields for all tasks
- Skip iterations that already exist (no duplicates)

