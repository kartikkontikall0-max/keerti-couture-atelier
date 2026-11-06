'use strict';

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const BACKUP_PATH = 'C:\\Users\\karti\\.gemini\\antigravity\\brain\\25efad69-a7fc-42a2-91ef-ba07f617a7b2\\db_backup_pre_rescue.json';

async function backup() {
  console.log('[Backup] Connecting to MongoDB...');
  await mongoose.connect('mongodb://localhost:27017/tailor_shop');
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const backupData = {
    database: 'tailor_shop',
    timestamp: new Date().toISOString(),
    collections: {},
  };

  for (const col of collections) {
    const docs = await db.collection(col.name).find({}).toArray();
    backupData.collections[col.name] = docs;
    console.log(`[Backup] Exported ${col.name}: ${docs.length} documents`);
  }

  await mongoose.disconnect();

  fs.writeFileSync(BACKUP_PATH, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`[Backup] Completed successfully. Saved to ${BACKUP_PATH}`);
}

backup().catch(err => {
  console.error('[Backup Error]', err);
  process.exit(1);
});

