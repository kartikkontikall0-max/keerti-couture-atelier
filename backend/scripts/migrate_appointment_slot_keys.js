/**
 * Keerti Couture — Appointment Slot Key Migration & Index Sync Script
 *
 * Backfills legacy appointment documents with:
 * 1. `dateKey` ('YYYY-MM-DD' in Asia/Kolkata timezone)
 * 2. `activeSlotKey` (`${dateKey}__${timeSlot}`) for active appointments ('Pending', 'Confirmed', 'Rescheduled')
 * 3. Clears `activeSlotKey` to null for 'Cancelled' and 'Completed' appointments
 * 4. Syncs the partial unique index to guarantee zero future double-bookings
 *
 * Usage:
 *   node backend/scripts/migrate_appointment_slot_keys.js
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const Appointment = require('../models/Appointment');
const { getAtelierDateKey } = require('../utils/timezone');

async function migrateAppointmentSlotKeys() {
  console.log('============================================================');
  console.log('  KEERTI COUTURE — APPOINTMENT SLOT KEY MIGRATION');
  console.log('============================================================\n');

  try {
    await connectDB();
    console.log('[Migration] Database connection established.');

    // 1. Fetch all appointments requiring backfill
    const appointments = await Appointment.find({});
    console.log(`[Migration] Scanning ${appointments.length} appointment records...`);

    let updatedCount = 0;
    let collisionCount = 0;
    const claimedKeys = new Set();
    const claimedKeyOwners = {};
    const collisionsReport = [];

    for (const appt of appointments) {
      let needsSave = false;

      // Backfill dateKey if missing
      if (!appt.dateKey && appt.preferredDate) {
        appt.dateKey = getAtelierDateKey(appt.preferredDate);
        needsSave = true;
      }

      const isActive = ['Pending', 'Confirmed', 'Rescheduled'].includes(appt.status);
      if (isActive) {
        const slot = (appt.timeSlot || '').toLowerCase().trim();
        const targetSlotKey = `${appt.dateKey}__${slot}`;

        // Detect potential legacy collision
        if (claimedKeys.has(targetSlotKey)) {
          collisionCount++;
          const primaryId = claimedKeyOwners[targetSlotKey];
          console.warn(`[Migration Warning] Legacy collision detected on slot: ${targetSlotKey}`);
          console.warn(`   -> Retained Appt ID: ${primaryId}`);
          console.warn(`   -> Colliding Appt ID: ${appt._id} (${appt.customerName}, Phone: ${appt.phone})`);
          
          // Reconcile: Nullify activeSlotKey and add actionable concierge note
          appt.activeSlotKey = null;
          appt.adminNotes = (appt.adminNotes ? appt.adminNotes + ' | ' : '') +
            `[MIGRATION CONFLICT] Colliding legacy booking on slot ${targetSlotKey}. Reconciled: Requires concierge manual rescheduling.`;
          needsSave = true;

          collisionsReport.push({
            slotKey: targetSlotKey,
            primaryApptId: primaryId.toString(),
            collidingApptId: appt._id.toString(),
            customer: appt.customerName,
            phone: appt.phone,
            status: appt.status,
            reconciliation: 'activeSlotKey nullified; flagged for concierge rescheduling',
          });
        } else {
          claimedKeys.add(targetSlotKey);
          claimedKeyOwners[targetSlotKey] = appt._id;
          if (appt.activeSlotKey !== targetSlotKey) {
            appt.activeSlotKey = targetSlotKey;
            needsSave = true;
          }
        }
      } else {
        if (appt.activeSlotKey !== null) {
          appt.activeSlotKey = null;
          needsSave = true;
        }
      }

      if (needsSave) {
        await Appointment.collection.updateOne(
          { _id: appt._id },
          {
            $set: {
              dateKey: appt.dateKey,
              activeSlotKey: appt.activeSlotKey,
              adminNotes: appt.adminNotes,
            },
          }
        );
        updatedCount++;
      }
    }

    console.log(`\n[Migration] Backfill completed. Updated ${updatedCount} records.`);
    if (collisionsReport.length > 0) {
      console.log('\n[Migration Reconciliation Report]');
      console.table(collisionsReport);
    } else {
      console.log('[Migration] Zero collisions detected in dataset.');
    }

    // 2. Sync and verify indexes
    console.log('\n[Migration] Synchronizing database indexes...');
    await Appointment.syncIndexes();

    const indexes = await Appointment.collection.indexes();
    const activeSlotIndex = indexes.find(idx => idx.key && idx.key.activeSlotKey === 1);
    console.log('[Migration] Verifying unique partial index on { activeSlotKey: 1 }...');
    if (activeSlotIndex && activeSlotIndex.unique && activeSlotIndex.partialFilterExpression) {
      console.log('  ✓ Partial unique index active: { activeSlotKey: 1 }');
      console.log('  ✓ Unique constraint: true');
      console.log('  ✓ Partial filter:', JSON.stringify(activeSlotIndex.partialFilterExpression));
    } else {
      throw new Error('Partial unique index verification failed!');
    }

    console.log('\nMigration finished cleanly.\n');
  } catch (error) {
    console.error('[Migration Error]:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Migration] Database disconnected.');
  }
}

if (require.main === module) {
  migrateAppointmentSlotKeys();
}

module.exports = migrateAppointmentSlotKeys;

