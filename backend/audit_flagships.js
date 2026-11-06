'use strict';

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Design = require(path.join(__dirname, 'models/Design'));

async function inspectFlagships() {
  await mongoose.connect(process.env.MONGO_URI);
  const ids = [
    { id: '6aed6521007cf4fbee56d498', expected: 'Pochampally Ikat Blouse' },
    { id: '6aed6521007cf4fbee56d489', expected: 'Banarasi Silk Elegance' },
    { id: '6aed6521007cf4fbee56d486', expected: 'Kanjivaram Silk Classic' },
  ];

  for (const item of ids) {
    const d = await Design.findById(item.id);
    console.log(`\n========================================`);
    console.log(`FLAGSHIP: ${d ? d.name : 'NOT FOUND'} (Expected: ${item.expected})`);
    console.log(`ID: ${item.id}`);
    if (d) {
      console.log(`Category: ${d.category}`);
      console.log(`Price: ₹${d.price}`);
      console.log(`Neckline: ${d.neckStyle}`);
      console.log(`Sleeve: ${d.sleeveType}`);
      console.log(`Back: ${d.backDesign}`);
      console.log(`Description: ${d.description}`);
      console.log(`Images:`, d.images);
    }
    console.log(`========================================`);
  }
  await mongoose.disconnect();
}

inspectFlagships().catch(console.error);
