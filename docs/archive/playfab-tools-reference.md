# PlayFab Development Tools Reference
## Space Force Mission Control 2050

**Date**: 2025-09-07  
**Purpose**: Complete reference of available PlayFab exploration and management tools

---

## Overview

The `scripts/` directory contains 20+ specialized tools for PlayFab API exploration, data management, and debugging. These tools provide deep insights into PlayFab capabilities and can be used to enhance leaderboard implementations.

---

## 🔍 API Exploration Scripts

### Core API Investigation
- **`explore-playfab-api.ts`** - Primary PlayFab API explorer using secret key
  - Explores all available Admin and Client endpoints
  - Tests API connectivity and data retrieval
  - Usage: `npx tsx scripts/explore-playfab-api.ts`

- **`playfab-endpoints-deep-dive.ts`** - Comprehensive endpoint exploration
  - Deep dive into all PlayFab API categories (Admin, Client, Server, Economy)
  - Tests endpoint availability and response formats
  - Usage: `npx tsx scripts/playfab-endpoints-deep-dive.ts`

- **`playfab-endpoint-reference.ts`** - Complete endpoint documentation
  - Generates comprehensive list of available PlayFab endpoints
  - Documents endpoint purposes and usage patterns
  - Usage: `npx tsx scripts/playfab-endpoint-reference.ts`

### CloudScript Analysis
- **`investigate-cloudscript.ts`** - CloudScript function investigation
  - Analyzes existing CloudScript functions and their capabilities
  - Identifies available server-side logic for leaderboards
  - Usage: `npx tsx scripts/investigate-cloudscript.ts`

- **`upload-cloudscript.ts`** - CloudScript deployment tool
  - Uploads and manages CloudScript functions
  - Useful for adding leaderboard calculation functions
  - Usage: `npx tsx scripts/upload-cloudscript.ts`

---

## 📊 Data Management Scripts

### Task and Puzzle Data
- **`sync-tasks-to-playfab.cjs`** - Main game task synchronization
  - Uploads 155 Space Force tasks to PlayFab Title Data
  - Consolidates JSON files into `AllTasks` key
  - Usage: `node scripts/sync-tasks-to-playfab.cjs`

- **`upload-officer-tasks.cjs`** - Officer Track puzzle management
  - Manages 1,920 ARC-AGI puzzles across batch keys
  - Handles training, training2, evaluation, evaluation2 datasets
  - Usage: `node scripts/upload-officer-tasks.cjs`

- **`migrate-tasks-to-playfab.ts`** - Task migration utilities
  - Legacy script for initial PlayFab migration
  - Useful for understanding data structure transformations
  - Usage: `npx tsx scripts/migrate-tasks-to-playfab.ts`

### Data Verification
- **`test-playfab-tasks.cjs`** - Task data verification
  - Tests task retrieval from PlayFab Title Data
  - Validates data structure and completeness
  - Usage: `node scripts/test-playfab-tasks.cjs`

- **`check-playfab-data.cjs`** - Comprehensive data validation
  - Checks all PlayFab data sources for consistency
  - Validates leaderboard statistics and player data
  - Usage: `node scripts/check-playfab-data.cjs`

---

## 🐛 Debugging and Testing Scripts

### PlayFab Integration Debugging
- **`debug-playfab-simple.js`** - Basic PlayFab connectivity testing
  - Simple connectivity and authentication testing
  - First-line debugging for PlayFab issues
  - Usage: `node scripts/debug-playfab-simple.js`

- **`debug-playfab-mismatch.js`** - Data inconsistency detection
  - Identifies mismatches between expected and actual data
  - Useful for leaderboard data integrity checking
  - Usage: `node scripts/debug-playfab-mismatch.js`

### Officer Track Specific Debugging
- **`debug-playfab-puzzle-search.cjs`** - ARC puzzle search debugging
  - Tests Officer Track puzzle loading and search functionality
  - Validates puzzle ID resolution and batch key access
  - Usage: `node scripts/debug-playfab-puzzle-search.cjs`

- **`test-officer-track-e2e.cjs`** - End-to-end Officer Track testing
  - Complete Officer Track workflow validation
  - Tests authentication, puzzle loading, and validation
  - Usage: `node scripts/test-officer-track-e2e.cjs`

### Puzzle Analysis
- **`check-impossible-puzzles.js`** - Puzzle difficulty analysis
  - Identifies potentially unsolvable or extremely difficult puzzles
  - Useful for leaderboard difficulty categorization
  - Usage: `node scripts/check-impossible-puzzles.js`

- **`check-all-puzzles.js`** - Comprehensive puzzle validation
  - Validates all ARC puzzles for completeness and structure
  - Ensures puzzle data integrity for leaderboards
  - Usage: `node scripts/check-all-puzzles.js`

---

## ⚙️ Utility Scripts

### File Management
- **`generate-file-manifests.cjs`** - File inventory generation
  - Creates manifests of all data files and their contents
  - Useful for tracking data changes and versions
  - Usage: `node scripts/generate-file-manifests.cjs`

### Testing and Validation
- **`test-story-wrapper.ts`** - Story system testing
  - Tests narrative wrapper functionality
  - Validates task presentation and story integration
  - Usage: `npx tsx scripts/test-story-wrapper.ts`

- **`test-id-logic.js`** - ID resolution testing
  - Tests puzzle and task ID resolution logic
  - Ensures consistent ID handling across systems
  - Usage: `node scripts/test-id-logic.js`

### Enhancement Tools
- **`enhance-tasks.js`** - Task enhancement utilities
  - Adds metadata and categorization to existing tasks
  - Useful for creating category-based leaderboards
  - Usage: `node scripts/enhance-tasks.js`

- **`suggest-cloudscript-validation.js`** - CloudScript optimization
  - Suggests CloudScript functions for improved validation
  - Useful for server-side leaderboard logic
  - Usage: `node scripts/suggest-cloudscript-validation.js`

---

## 📖 Documentation Scripts

### Reference Generation
- **`README.md`** (in scripts directory) - Script documentation
  - Comprehensive guide to all available scripts
  - Migration process documentation
  - Usage instructions and examples

---

## 🚀 Leaderboard Development Usage

### For API Understanding
1. **Start with**: `playfab-endpoint-reference.ts` - understand available APIs
2. **Deep dive**: `playfab-endpoints-deep-dive.ts` - test endpoint capabilities
3. **Explore data**: `explore-playfab-api.ts` - examine current data structures

### For Data Validation
1. **Check main data**: `check-playfab-data.cjs` - validate leaderboard statistics
2. **Test connectivity**: `debug-playfab-simple.js` - ensure API access
3. **Verify puzzles**: `check-all-puzzles.js` - ensure Officer Track integrity

### For Development Support
1. **CloudScript analysis**: `investigate-cloudscript.ts` - understand server functions
2. **Data structure**: `test-playfab-tasks.cjs` - understand data organization
3. **E2E testing**: `test-officer-track-e2e.cjs` - validate complete workflows

### For Debugging Issues
1. **Basic connectivity**: `debug-playfab-simple.js`
2. **Data mismatches**: `debug-playfab-mismatch.js`
3. **Officer Track issues**: `debug-playfab-puzzle-search.cjs`

---

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Primary PlayFab configuration
VITE_PLAYFAB_TITLE_ID=19FACB
PLAYFAB_SECRET_KEY=[your-secret-key-from-playfab-game-manager]

# Optional for enhanced features
VITE_ARC_EXPLAINER_URL=https://arc-explainer-production.up.railway.app
```

### Prerequisites
- Node.js 18+ (for .cjs scripts)
- tsx (for TypeScript scripts): `npm install -g tsx`
- dotenv support for environment variables

### Running Scripts
```bash
# TypeScript scripts
npx tsx scripts/[script-name].ts

# JavaScript/CommonJS scripts  
node scripts/[script-name].cjs
node scripts/[script-name].js
```

---

## 💡 Best Practices for Leaderboard Development

### Script Usage Workflow
1. **Before development**: Run exploration scripts to understand current data
2. **During development**: Use debugging scripts to validate functionality
3. **After changes**: Run verification scripts to ensure data integrity

### Data Safety
- Always test with debugging scripts before making data changes
- Use verification scripts after any PlayFab configuration changes
- Keep backups of working configurations

### Performance Optimization
- Use exploration scripts to understand API rate limits
- Test caching strategies with debugging scripts
- Validate bulk operations with data management scripts

---

## 🔮 Future Enhancement Opportunities

### Additional Scripts Needed for Advanced Leaderboards
- **Temporal leaderboard management**: Scripts for daily/weekly/monthly resets
- **Social feature testing**: Friend system and social leaderboard validation
- **Performance analytics**: Event data aggregation for advanced rankings
- **A/B testing support**: Multiple leaderboard configuration testing

### Integration Opportunities
- **Automated testing pipelines**: Integrate scripts into CI/CD
- **Monitoring and alerts**: Use scripts for production data validation
- **Development tooling**: IDE integration for rapid PlayFab development

---

**Summary**: The scripts directory provides a comprehensive toolkit for PlayFab development, covering API exploration, data management, debugging, and validation. These tools are essential for understanding the rich data sources available for advanced leaderboard implementations and ensuring robust, production-ready features.