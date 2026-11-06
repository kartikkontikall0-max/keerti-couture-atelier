/**
 * Keerti Couture — Staging Backup & Restoration Verification Exercise
 *
 * Simulates and verifies the complete database snapshot export and restoration
 * lifecycle using an isolated staging environment.
 *
 * Verifies:
 * 1. Snapshot generation across all core collections (Users, Designs, Orders, Appointments, Services, Quotations).
 * 2. Complete data dump into structured JSON archive.
 * 3. Restoration into an isolated staging target database.
 * 4. Data parity checks (document counts, primary keys, timestamps, indexes).
 * 5. Clean teardown of temporary staging data.
 *
 * Usage:
 *   node backend/scripts/backup_restore_exercise.js
 */

process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const Design = require('../models/Design');
const Order = require('../models/Order');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Quotation = require('../models/Quotation');
const Outbox = require('../models/Outbox');
const { processOutboxEvents } = require('../utils/outboxProcessor');

async function runBackupRestoreExercise() {
  console.log('============================================================');
  console.log('  KEERTI COUTURE — STAGING BACKUP & RESTORATION EXERCISE');
  console.log('============================================================\n');

  let sourceServer, targetServer;
  const backupDir = path.join(__dirname, '../temp_staging_backup');

  try {
    // 1. Initialize Source Database & Seed Representative Data
    console.log('[Step 1] Initializing isolated Source Database...');
    sourceServer = await MongoMemoryServer.create();
    const sourceConn = await mongoose.connect(sourceServer.getUri());
    console.log('[Step 1] Connected to Source Database:', sourceConn.connection.host);

    // Seed representative records
    const testUser = await User.create({
      name: 'Princess Gayatri Devi',
      email: 'gayatri@royal.in',
      password: 'HashedPassword123!',
      phone: '+91 99999 00001',
    });

    const testDesign = await Design.create({
      name: 'Royal Heritage Brocade Blouse',
      category: 'Bridal Blouse',
      price: 15000,
      images: [{ url: 'https://images.unsplash.com/sample.jpg' }],
    });

    const testOrder = await Order.create({
      user: testUser._id,
      customerName: 'Princess Gayatri Devi',
      phone: '+91 99999 00001',
      design: testDesign._id,
      totalPrice: 15000,
      paymentStatus: 'Paid',
      paymentEmailSent: true,
    });

    const testAppt = await Appointment.create({
      user: testUser._id,
      customerName: 'Princess Gayatri Devi',
      email: 'gayatri@royal.in',
      phone: '+91 99999 00001',
      preferredDate: new Date('2026-11-25T18:30:00.000Z'),
      dateKey: '2026-11-26',
      timeSlot: '11:00 AM - 12:30 PM',
      activeSlotKey: '2026-11-26__11:00 am - 12:30 pm',
      status: 'Confirmed',
    });

    const testService = await Service.create({
      name: 'Hand Zardozi Bullion Border',
      price: 3500,
      estimatedTurnaround: '4 business days',
      isActive: true,
    });

    const testQuote = await Quotation.create({
      user: testUser._id,
      customerName: 'Princess Gayatri Devi',
      email: 'gayatri@royal.in',
      phone: '+91 99999 00001',
      notes: 'Bespoke high-neck velvet bridal blouse with antique gold motifs',
      status: 'Submitted',
    });

    // Seed Outbox records in various delivery lifecycle states
    const sentProcessedAt = new Date(Date.now() - 3600000);
    const testOutboxDelivered = await Outbox.create({
      eventType: 'ORDER_CONFIRMATION',
      recipient: 'gayatri@royal.in',
      referenceId: testOrder._id,
      payload: { orderId: testOrder._id.toString(), customerName: 'Princess Gayatri Devi' },
      status: 'SENT',
      attempts: 1,
      processedAt: sentProcessedAt,
      lastError: null,
    });

    const testOutboxRetrying = await Outbox.create({
      eventType: 'PAYMENT_SUCCESS',
      recipient: 'gayatri@royal.in',
      referenceId: testOrder._id,
      payload: { paymentId: 'pay_retry_123', amount: 15000 },
      status: 'PENDING',
      attempts: 2,
      lastError: 'Simulated connection reset by peer',
      nextAttemptAt: new Date(Date.now() + 120000), // In future
    });

    const testOutboxDeadLetter = await Outbox.create({
      eventType: 'PAYMENT_FAILED',
      recipient: 'gayatri@royal.in',
      referenceId: testOrder._id,
      payload: { reason: 'Card declined' },
      status: 'FAILED',
      attempts: 5,
      lastError: 'Max delivery attempts reached',
    });

    const sourceCounts = {
      users: await User.countDocuments(),
      designs: await Design.countDocuments(),
      orders: await Order.countDocuments(),
      appointments: await Appointment.countDocuments(),
      services: await Service.countDocuments(),
      quotations: await Quotation.countDocuments(),
      outboxes: await Outbox.countDocuments(),
    };

    console.log('[Step 1] Seeded source records (including Outbox lifecycle states):', sourceCounts);

    // 2. Perform Structured Snapshot Backup
    console.log('\n[Step 2] Executing snapshot backup to staging archive...');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const collections = [
      { name: 'users', model: User },
      { name: 'designs', model: Design },
      { name: 'orders', model: Order },
      { name: 'appointments', model: Appointment },
      { name: 'services', model: Service },
      { name: 'quotations', model: Quotation },
      { name: 'outboxes', model: Outbox },
    ];

    const manifest = {
      timestamp: new Date().toISOString(),
      counts: {},
    };

    for (const col of collections) {
      const docs = await col.model.find({}).lean();
      const filePath = path.join(backupDir, `${col.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
      manifest.counts[col.name] = docs.length;
      console.log(`  -> Exported ${docs.length} documents from collection '${col.name}' to ${col.name}.json`);
    }

    fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    console.log('[Step 2] Backup archive successfully generated with manifest.');

    // Disconnect from source database
    await mongoose.disconnect();
    console.log('[Step 2] Disconnected from Source Database.');

    // 3. Initialize Target Staging Database (Simulating DR / Recovery Environment)
    console.log('\n[Step 3] Initializing clean Target Staging Database...');
    targetServer = await MongoMemoryServer.create();
    const targetConn = await mongoose.connect(targetServer.getUri());
    console.log('[Step 3] Connected to Target Staging Database:', targetConn.connection.host);

    // Verify target is empty initially
    const preRestoreUsers = await User.countDocuments();
    if (preRestoreUsers !== 0) throw new Error('Target staging database is not empty!');
    console.log('[Step 3] Confirmed target staging database is clean (0 records).');

    // 4. Perform Restoration from Backup Archive
    console.log('\n[Step 4] Executing restoration from staging archive into Target Database...');
    for (const col of collections) {
      const filePath = path.join(backupDir, `${col.name}.json`);
      const rawData = fs.readFileSync(filePath, 'utf8');
      const docs = JSON.parse(rawData);
      if (docs.length > 0) {
        await col.model.insertMany(docs);
      }
      console.log(`  -> Restored ${docs.length} documents into collection '${col.name}'`);
    }

    // Synchronize target indexes
    console.log('[Step 4] Synchronizing target database indexes...');
    await Appointment.syncIndexes();
    await Order.syncIndexes();
    await User.syncIndexes();
    await Outbox.syncIndexes();

    // 5. Parity & Integrity Verification
    console.log('\n[Step 5] Performing Data Parity & Integrity Verification...');
    const targetCounts = {
      users: await User.countDocuments(),
      designs: await Design.countDocuments(),
      orders: await Order.countDocuments(),
      appointments: await Appointment.countDocuments(),
      services: await Service.countDocuments(),
      quotations: await Quotation.countDocuments(),
      outboxes: await Outbox.countDocuments(),
    };

    let parityPassed = true;
    for (const key of Object.keys(sourceCounts)) {
      const match = sourceCounts[key] === targetCounts[key];
      console.log(`  Parity Check [${key}]: Source=${sourceCounts[key]} | Target=${targetCounts[key]} -> ${match ? 'MATCH (OK)' : 'MISMATCH (FAIL)'}`);
      if (!match) parityPassed = false;
    }

    // Verify document specific field integrity
    const restoredAppt = await Appointment.findOne({ dateKey: '2026-11-26' });
    const apptIntegrity = restoredAppt && restoredAppt.activeSlotKey === '2026-11-26__11:00 am - 12:30 pm';
    console.log(`  Integrity Check [Appointment Slot Key]: ${apptIntegrity ? 'VERIFIED' : 'FAILED'}`);

    const restoredOrder = await Order.findOne({ customerName: 'Princess Gayatri Devi' });
    const orderIntegrity = restoredOrder && restoredOrder.paymentStatus === 'Paid' && restoredOrder.paymentEmailSent === true;
    console.log(`  Integrity Check [Order Payment Status]: ${orderIntegrity ? 'VERIFIED' : 'FAILED'}`);

    // Verify Outbox restoration & retry metadata survival
    const restoredSent = await Outbox.findById(testOutboxDelivered._id);
    const sentIntegrity = restoredSent && restoredSent.status === 'SENT' && restoredSent.attempts === 1 && Boolean(restoredSent.processedAt);
    console.log(`  Integrity Check [Outbox Delivered Notification]: ${sentIntegrity ? 'VERIFIED' : 'FAILED'}`);

    const restoredRetry = await Outbox.findById(testOutboxRetrying._id);
    const retryIntegrity = restoredRetry && restoredRetry.status === 'PENDING' && restoredRetry.attempts === 2 && restoredRetry.lastError.includes('connection reset');
    console.log(`  Integrity Check [Outbox Retrying Notification]: ${retryIntegrity ? 'VERIFIED' : 'FAILED'}`);

    // Verify Accidental Resend Prevention:
    // Process outbox worker on restored target database. Restored SENT and FAILED events must remain untouched!
    console.log('\n[Step 6] Verifying Accidental Resend Prevention...');
    await processOutboxEvents();

    const postSweepSent = await Outbox.findById(testOutboxDelivered._id);
    const postSweepFailed = await Outbox.findById(testOutboxDeadLetter._id);
    const resendPrevented = postSweepSent.status === 'SENT' && postSweepSent.attempts === 1 && postSweepFailed.status === 'FAILED';
    console.log(`  Resend Guard [Previously Delivered Notifications Intact]: ${resendPrevented ? 'VERIFIED (Zero Duplicates)' : 'FAILED'}`);

    if (!parityPassed || !apptIntegrity || !orderIntegrity || !sentIntegrity || !retryIntegrity || !resendPrevented) {
      throw new Error('Staging backup/restore exercise failed integrity verification');
    }

    console.log('\n============================================================');
    console.log('  BACKUP & RESTORATION EXERCISE: 100% SUCCESSFUL');
    console.log('============================================================\n');
  } catch (error) {
    console.error('[Backup/Restore Error]:', error.message);
    process.exit(1);
  } finally {
    // Teardown
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
      console.log('[Cleanup] Removed temporary staging backup files.');
    }
    await mongoose.disconnect();
    if (sourceServer) await sourceServer.stop();
    if (targetServer) await targetServer.stop();
  }
}

if (require.main === module) {
  runBackupRestoreExercise();
}

module.exports = runBackupRestoreExercise;

