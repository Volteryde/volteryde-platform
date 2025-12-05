#!/usr/bin/env node

/**
 * Version Update Script for Volteryde Platform
 * 
 * This script synchronizes versions across all services in the monorepo
 * Usage: node scripts/update-version.js <version>
 */

const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('❌ Please provide a version number');
  console.log('Usage: node scripts/update-version.js <version>');
  process.exit(1);
}

// Validate semantic version format
const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
if (!semverRegex.test(version)) {
  console.error('❌ Invalid version format. Use semantic versioning (e.g., 1.2.3 or 1.2.3-beta.1)');
  process.exit(1);
}

const filesToUpdate = [
  'package.json',
  'services/volteryde-nest/package.json',
  'workers/temporal-workers/package.json',
  'apps/admin-dashboard/package.json',
  'apps/driver-app/package.json',
  'apps/support-app/package.json',
  'apps/docs-platform/package.json',
  'apps/bi-partner-app/package.json'
];

console.log(`🔄 Updating version to ${version}...\n`);

let updated = 0;
let failed = 0;

filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped (not found): ${file}`);
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    
    const oldVersion = json.version;
    json.version = version;
    
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
    console.log(`✅ Updated ${file}: ${oldVersion} → ${version}`);
    updated++;
  } catch (error) {
    console.error(`❌ Failed to update ${file}:`, error.message);
    failed++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Updated: ${updated}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`\n✨ Version update complete!`);
