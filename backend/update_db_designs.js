'use strict';

const mongoose = require('mongoose');

const catalogUpdates = {
  'Royal Zardosi Bridal': [{ url: '/images/catalog/royal_zardosi_bridal.jpg', public_id: 'atelier/royal_zardosi_bridal' }],
  'Heirloom Silk Bridal': [{ url: '/images/catalog/heirloom_silk_bridal.jpg', public_id: 'atelier/heirloom_silk_bridal' }],
  'Velvet Bridal Couture': [{ url: '/images/catalog/velvet_bridal_couture.jpg', public_id: 'atelier/velvet_bridal_couture' }],
  'Gold Tissue Bridal Blouse': [{ url: '/images/catalog/gold_tissue_bridal.jpg', public_id: 'atelier/gold_tissue_bridal' }],
  'Lehenga Blouse Supreme': [],
  'Kanjivaram Silk Classic': [{ url: '/images/catalog/kanjivaram_silk_classic.jpg', public_id: 'atelier/kanjivaram_silk_classic' }],
  'Banarasi Silk Elegance': [{ url: '/images/catalog/banarasi_silk_elegance.jpg', public_id: 'atelier/banarasi_silk_elegance' }],
  'Mysore Silk Couture': [],
  'Tussar Raw Silk Drape': [],
  'Chanderi Silk Contemporary': [],
  'Kasavu Temple Classic': [{ url: '/images/catalog/kasavu_temple_classic.jpg', public_id: 'atelier/kasavu_temple_classic' }],
  'Pochampally Ikat Blouse': [{ url: '/images/catalog/pochampally_ikat.jpg', public_id: 'atelier/pochampally_ikat' }],
  'Bandhani Tie-Dye Festive': [{ url: '/images/catalog/bandhani_tie_dye_festive.jpg', public_id: 'atelier/bandhani_tie_dye_festive' }],
  'Kalamkari Hand-Painted': [{ url: '/images/catalog/kalamkari_hand_painted.jpg', public_id: 'atelier/kalamkari_hand_painted' }],
  'Chikankari Lucknowi': [{ url: '/images/catalog/chikankari_lucknowi.jpg', public_id: 'atelier/chikankari_lucknowi' }],
  'Sequin Shimmer Celebration': [],
  'Velvet Off-Shoulder': [],
  'Metallic Brocade Fête': [],
  'Organza Cape Blouse': [],
  'Deep Cut Evening Blouse': [],
  'Minimalist Crop Blouse': [{ url: '/images/catalog/minimalist_crop_blouse.jpg', public_id: 'atelier/minimalist_crop_blouse' }],
  'Peplum Fusion Blouse': [{ url: '/images/catalog/peplum_fusion_blouse.jpg', public_id: 'atelier/peplum_fusion_blouse' }],
  'Denim and Cotton Fusion': [],
  'Shirt-Style Blouse': [],
  'Indo-Western Blazer Blouse': [],
  'Resham Thread Florals': [],
  'Mirror Work Festive': [],
  'Pearl and Crystal Blouse': [],
  'Kantha Stitch Heritage': [],
  'Gota Patti Royal': [],
};

async function updateDatabase(dbUri, dbName) {
  console.log(`\n[DB Update] Connecting to ${dbName} (${dbUri})...`);
  await mongoose.connect(dbUri);
  const db = mongoose.connection.db;
  const designsCol = db.collection('designs');

  const allDesigns = await designsCol.find({}).toArray();
  console.log(`[DB Update] Found ${allDesigns.length} designs in ${dbName}.`);

  let updatedCount = 0;
  for (const design of allDesigns) {
    if (catalogUpdates.hasOwnProperty(design.name)) {
      const newImages = catalogUpdates[design.name];
      await designsCol.updateOne(
        { _id: design._id },
        { $set: { images: newImages } }
      );
      console.log(`  ✓ Updated "${design.name}" (_id: ${design._id}) -> ${newImages.length > 0 ? newImages[0].url : '[Honest Placeholder]'}`);
      updatedCount++;
    } else {
      console.warn(`  ⚠ No update defined for "${design.name}"`);
    }
  }

  console.log(`[DB Update] Successfully updated ${updatedCount} designs in ${dbName}.`);
  await mongoose.disconnect();
}

(async () => {
  try {
    await updateDatabase('mongodb://localhost:27017/tailor_shop', 'tailor_shop');
    await updateDatabase('mongodb://localhost:27017/keerti_couture_demo', 'keerti_couture_demo');
    console.log('\n[Done] All MongoDB design records updated successfully.');
  } catch (err) {
    console.error('Fatal error updating database:', err);
    process.exit(1);
  }
})();

