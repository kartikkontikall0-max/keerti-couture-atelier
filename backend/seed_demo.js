/**
 * ============================================================
 * KEERTI COUTURE — DEMO SEED SCRIPT
 * ============================================================
 * Populates a SEPARATE demo database with realistic boutique data.
 * Safe to run repeatedly — clears and re-seeds on every run.
 *
 * Usage:
 *   node seed_demo.js
 *   (uses .env.demo by default)
 *
 * Or with a custom env:
 *   node -e "require('dotenv').config({path:'.env.demo'})" seed_demo.js
 *
 * NEVER run against your production MONGO_URI.
 * ============================================================
 */

'use strict';

// Load demo environment BEFORE anything else
require('dotenv').config({ path: '.env.demo' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { validateDemoSeedConfig } = require('./config/validateDemoSeed');

// Robust Guard: Validate database URI, host, database name, and environment
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/keerti_couture_demo';
const guard = validateDemoSeedConfig({
  nodeEnv: process.env.NODE_ENV,
  mongoUri: MONGO_URI,
  allowDemoSeed: process.env.ALLOW_DEMO_SEED === 'true' || process.env.DEMO_MODE === 'true'
});

if (!guard.safe) {
  console.error('\n❌ SAFETY GUARD FAILURE: Refusing to seed database.');
  console.error(`   ${guard.reason}\n`);
  process.exit(1);
}

// ── Import models directly (not via server to avoid side effects) ────────────
const Design = require('./models/Design');
const User = require('./models/User');
const Order = require('./models/Order');
const Appointment = require('./models/Appointment');
const Quotation = require('./models/Quotation');
const Service = require('./models/Service');

// ============================================================
// DEMO DATA DEFINITIONS
// ============================================================

// ── 1. USERS ────────────────────────────────────────────────
const DEMO_USERS = [
  {
    name: 'Keerti Admin',
    email: 'admin@keerticouture.demo',
    password: 'DemoAdmin@2026',
    phone: '9945804019',
    isAdmin: true,
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.demo',
    password: 'DemoCustomer@2026',
    phone: '9900112233',
    isAdmin: false,
  },
  {
    name: 'Anjali Nair',
    email: 'anjali.nair@example.demo',
    password: 'DemoCustomer@2026',
    phone: '9988774455',
    isAdmin: false,
  },
  {
    name: 'Meera Iyer',
    email: 'meera.iyer@example.demo',
    password: 'DemoCustomer@2026',
    phone: '9876543210',
    isAdmin: false,
  },
  {
    name: 'Divya Krishnan',
    email: 'divya.krishnan@example.demo',
    password: 'DemoCustomer@2026',
    phone: '9123456789',
    isAdmin: false,
  },
];

// ── 2. SERVICES ─────────────────────────────────────────────
const DEMO_SERVICES = [
  {
    name: 'Blouse Stitching (From Scratch)',
    price: 500,
    description: 'Custom tailored blouse stitched from your fabric with precise measurements.',
    estimatedTurnaround: '5-7 Days',
    isActive: true,
  },
  {
    name: 'Blouse Alteration',
    price: 250,
    description: 'Precision size and fit adjustments for existing blouses.',
    estimatedTurnaround: '2-3 Days',
    isActive: true,
  },
  {
    name: 'Zari / Zardosi Embroidery',
    price: 1500,
    description: 'Handcrafted gold and silver zari embroidery by master artisans.',
    estimatedTurnaround: '7-10 Days',
    isActive: true,
  },
  {
    name: 'Fall & Pico (Saree)',
    price: 100,
    description: 'Professional saree fall attachment and neat pico edge finishing.',
    estimatedTurnaround: '24-48 Hours',
    isActive: true,
  },
  {
    name: 'Lining Addition',
    price: 200,
    description: 'Premium cotton or satin lining added to your blouse for comfort.',
    estimatedTurnaround: '2-3 Days',
    isActive: true,
  },
  {
    name: 'Hand Embroidery',
    price: 2000,
    description: 'Intricate hand embroidery — thread work, resham, or cutwork detailing.',
    estimatedTurnaround: '10-14 Days',
    isActive: true,
  },
  {
    name: 'Mirror Work Embellishment',
    price: 1200,
    description: 'Traditional mirror work (shisha) hand-stitched onto blouse or dupatta.',
    estimatedTurnaround: '7-10 Days',
    isActive: true,
  },
  {
    name: 'Thread & Aari Work',
    price: 800,
    description: 'Intricate aari (chain stitch) and thread work embroidery.',
    estimatedTurnaround: '5-7 Days',
    isActive: true,
  },
  {
    name: 'Saree Fall Stitching',
    price: 150,
    description: 'Neat edge interlocking and structure addition for sarees.',
    estimatedTurnaround: '24-48 Hours',
    isActive: true,
  },
  {
    name: 'Urgent Priority Stitching',
    price: 700,
    description: 'Express stitching service with guaranteed 48-hour turnaround.',
    estimatedTurnaround: '48 Hours',
    isActive: true,
  },
];

// ── 3. DESIGNS (30 blouses across 6 categories) ─────────────
// Using reliable Unsplash photo IDs with Indian fashion context
const DEMO_DESIGNS = [
  // === BRIDAL BLOUSE (5) ===
  {
    name: 'Royal Zardosi Bridal',
    category: 'Bridal Blouse',
    price: 7500,
    neckStyle: 'Sweetheart',
    sleeveType: 'Short',
    backDesign: 'Deep V with Buttons',
    description: 'A magnificent bridal blouse adorned with heavy gold zardosi embroidery, crafted by master artisans. Features a romantic sweetheart neckline with hand-finished button closures. Perfect for the modern Indian bride who desires timeless grandeur on her special day.',
    images: [
      { url: '/images/catalog/royal_zardosi_bridal.jpg', public_id: 'atelier/royal_zardosi_bridal' }
    ],
  },
  {
    name: 'Heirloom Silk Bridal',
    category: 'Bridal Blouse',
    price: 8500,
    neckStyle: 'Round Neck',
    sleeveType: 'Elbow Length',
    backDesign: 'Back Open with Dori',
    description: 'An heirloom-quality bridal blouse in lustrous Kanchipuram silk, embellished with temple border motifs and delicate kundan stonework. The elegant elbow-length sleeves and dori tie-back create a silhouette of classic grace. A treasured piece worthy of your most sacred occasions.',
    images: [
      { url: '/images/catalog/heirloom_silk_bridal.jpg', public_id: 'atelier/heirloom_silk_bridal' }
    ],
  },
  {
    name: 'Velvet Bridal Couture',
    category: 'Bridal Blouse',
    price: 6800,
    neckStyle: 'Halter Neck',
    sleeveType: 'Sleeveless',
    backDesign: 'Deep U Back',
    description: 'Opulent royal-blue velvet bridal blouse with hand-applied sequin and bead embellishment. The sleeveless halter design frames the neck beautifully, while the deep U-back adds contemporary allure. Ideal for evening receptions and sangeet ceremonies.',
    images: [
      { url: '/images/catalog/velvet_bridal_couture.jpg', public_id: 'atelier/velvet_bridal_couture' }
    ],
  },
  {
    name: 'Gold Tissue Bridal Blouse',
    category: 'Bridal Blouse',
    price: 9200,
    neckStyle: 'Square Neck',
    sleeveType: 'Short',
    backDesign: 'Keyhole with Tassel',
    description: 'Exquisite tissue-gold bridal blouse featuring a regal square neckline bordered with antique gold zari. Hand-embroidered peacock motifs adorn the front, while a delicate keyhole back with silk tassels completes the look. The pinnacle of bridal craftsmanship.',
    images: [
      { url: '/images/catalog/gold_tissue_bridal.jpg', public_id: 'atelier/gold_tissue_bridal' }
    ],
  },
  {
    name: 'Lehenga Blouse Supreme',
    category: 'Bridal Blouse',
    price: 5500,
    neckStyle: 'V-Neck',
    sleeveType: '3/4th Sleeves',
    backDesign: 'Back Open with Buttons',
    description: 'A stunning bridal lehenga blouse with intricate mirror work and resham embroidery on pure organza. The flattering V-neckline and three-quarter sleeves create a balanced silhouette that photographs beautifully. Available in customized fabric colors.',
    images: [],
  },

  // === SILK BLOUSE (5) ===
  {
    name: 'Kanjivaram Silk Classic',
    category: 'Silk Blouse',
    price: 3200,
    neckStyle: 'Round Neck',
    sleeveType: 'Short',
    backDesign: 'Closed',
    description: 'A timeless Kanjivaram silk blouse in pure South Indian tradition. Tailored with precision to complement your Kanjivaram saree, featuring contrasting border trims and traditional hook closures. The definitive silk blouse for every wardrobe.',
    images: [
      { url: '/images/catalog/kanjivaram_silk_classic.jpg', public_id: 'atelier/kanjivaram_silk_classic' }
    ],
  },
  {
    name: 'Banarasi Silk Elegance',
    category: 'Silk Blouse',
    price: 2800,
    neckStyle: 'Boat Neck',
    sleeveType: 'Short',
    backDesign: 'Closed with Zip',
    description: 'A graceful Banarasi silk blouse with the signature brocade weave and butis. The classic boat neck frames the collarbone elegantly, while the concealed back zip ensures a smooth, contemporary finish. Perfect for Banarasi and Tussar sarees.',
    images: [
      { url: '/images/catalog/banarasi_silk_elegance.jpg', public_id: 'atelier/banarasi_silk_elegance' }
    ],
  },
  {
    name: 'Mysore Silk Couture',
    category: 'Silk Blouse',
    price: 2200,
    neckStyle: 'Square Neck',
    sleeveType: 'Cap Sleeve',
    backDesign: 'Closed',
    description: 'Refined Mysore silk blouse tailored from the finest GI-tagged fabric. The architectural square neckline and delicate cap sleeves create an elegant modern profile. Ideal for formal occasions and cultural events.',
    images: [],
  },
  {
    name: 'Tussar Raw Silk Drape',
    category: 'Silk Blouse',
    price: 1800,
    neckStyle: 'Cowl Neck',
    sleeveType: 'Short',
    backDesign: 'Open Back with Ties',
    description: 'A naturally textured Tussar raw silk blouse with a luxurious cowl neckline that drapes effortlessly. The open back with silk ties adds a romantic bohemian quality. The earthy gold tones complement both silk and cotton sarees beautifully.',
    images: [],
  },
  {
    name: 'Chanderi Silk Contemporary',
    category: 'Silk Blouse',
    price: 2500,
    neckStyle: 'V-Neck',
    sleeveType: 'Bell Sleeve',
    backDesign: 'Closed',
    description: 'Ethereally lightweight Chanderi silk blouse with fluttering bell sleeves and delicate block-printed motifs. The sharp V-neckline contrasts beautifully with the flowing sleeves. A perfect fusion of Madhya Pradesh heritage and contemporary fashion.',
    images: [],
  },

  // === TRADITIONAL (5) ===
  {
    name: 'Kasavu Temple Classic',
    category: 'Traditional',
    price: 1500,
    neckStyle: 'Round Neck',
    sleeveType: 'Short',
    backDesign: 'Closed',
    description: 'An authentic Kerala kasavu blouse in pure cream cotton with the traditional golden border. Tailored to complement the Kerala mundum neriyathum and kasavu sarees, this is a celebration of South Indian heritage and understated elegance.',
    images: [
      { url: '/images/catalog/kasavu_temple_classic.jpg', public_id: 'atelier/kasavu_temple_classic' }
    ],
  },
  {
    name: 'Pochampally Ikat Blouse',
    category: 'Traditional',
    price: 1800,
    neckStyle: 'Boat Neck',
    sleeveType: '3/4th Sleeves',
    backDesign: 'Closed',
    description: 'A vibrant Pochampally ikat blouse with the distinctive geometric double-ikat patterns of Telangana. Tailored from handloom-woven fabric, each blouse carries the unique imperfections that mark authentic handcraft. A celebration of Indian textile heritage.',
    images: [
      { url: '/images/catalog/pochampally_ikat.jpg', public_id: 'atelier/pochampally_ikat' }
    ],
  },
  {
    name: 'Bandhani Tie-Dye Festive',
    category: 'Traditional',
    price: 1400,
    neckStyle: 'Round Neck',
    sleeveType: 'Short',
    backDesign: 'Back Open with Buttons',
    description: 'Handcrafted Gujarati bandhani blouse in vibrant hues with the traditional circular dot patterns created by skilled tie-and-dye artisans. Perfect for Navratri, Diwali, and festive celebrations. Each piece is unique.',
    images: [
      { url: '/images/catalog/bandhani_tie_dye_festive.jpg', public_id: 'atelier/bandhani_tie_dye_festive' }
    ],
  },
  {
    name: 'Kalamkari Hand-Painted',
    category: 'Traditional',
    price: 2100,
    neckStyle: 'V-Neck',
    sleeveType: 'Short',
    backDesign: 'Closed',
    description: 'Exquisite hand-painted kalamkari blouse featuring mythological motifs from the Srikalahasti tradition. Each piece is painted by artisans using natural dyes and bamboo pens — truly wearable art. The fine V-neckline showcases the artwork magnificently.',
    images: [
      { url: '/images/catalog/kalamkari_hand_painted.jpg', public_id: 'atelier/kalamkari_hand_painted' }
    ],
  },
  {
    name: 'Chikankari Lucknowi',
    category: 'Traditional',
    price: 2600,
    neckStyle: 'Round Neck',
    sleeveType: 'Elbow Length',
    backDesign: 'Closed',
    description: 'Delicate white-on-white Lucknowi chikankari blouse with shadow work and intricate hand embroidery. This quintessential Nawabi craft is showcased on fine cotton voile, creating a blouse of refined understated beauty. Perfect for summer occasions.',
    images: [
      { url: '/images/catalog/chikankari_lucknowi.jpg', public_id: 'atelier/chikankari_lucknowi' }
    ],
  },

  // === PARTY WEAR (5) ===
  {
    name: 'Sequin Shimmer Celebration',
    category: 'Party Wear',
    price: 3500,
    neckStyle: 'Halter Neck',
    sleeveType: 'Sleeveless',
    backDesign: 'Deep V Back',
    description: 'A showstopping heavily-sequined party blouse that catches every light. The dramatic halter neckline and deep V-back create an elegant evening silhouette. Pair with a plain chiffon or georgette saree for maximum impact at cocktail parties and receptions.',
    images: [],
  },
  {
    name: 'Velvet Off-Shoulder',
    category: 'Party Wear',
    price: 2900,
    neckStyle: 'Off-Shoulder',
    sleeveType: 'Ruffle Sleeves',
    backDesign: 'Closed',
    description: 'Bold emerald velvet off-shoulder blouse with delicate ruffle detailing at the sleeves. This fashion-forward design pairs beautifully with solid-color sarees and lehengas for a modern festive look. Fully lined for comfort and structure.',
    images: [],
  },
  {
    name: 'Metallic Brocade Fête',
    category: 'Party Wear',
    price: 3100,
    neckStyle: 'Square Neck',
    sleeveType: 'Short',
    backDesign: 'Keyhole',
    description: 'Lustrous gold-on-black metallic brocade blouse with an architectural square neckline. The keyhole back adds a playful touch while the structured silhouette keeps the look polished. Perfect for Diwali parties and sangeet nights.',
    images: [],
  },
  {
    name: 'Organza Cape Blouse',
    category: 'Party Wear',
    price: 2700,
    neckStyle: 'Round Neck',
    sleeveType: 'Cape Style',
    backDesign: 'Closed',
    description: 'An ethereal organza cape-style blouse that creates a dramatic silhouette without overwhelming the saree. Delicately embellished with hand-applied crystals and pearl droplets. The modern cape silhouette is perfect for evening receptions and cocktail dinners.',
    images: [],
  },
  {
    name: 'Deep Cut Evening Blouse',
    category: 'Party Wear',
    price: 2400,
    neckStyle: 'Plunge Neck',
    sleeveType: 'Sleeveless',
    backDesign: 'Corset Back',
    description: 'A daring and sophisticated evening blouse with a plunge neckline and corset-style lace-up back. Crafted from heavy dupion silk with a hidden bust support. This is the blouse that transforms any saree into a red-carpet moment.',
    images: [],
  },

  // === MODERN (5) ===
  {
    name: 'Minimalist Crop Blouse',
    category: 'Modern',
    price: 1600,
    neckStyle: 'Round Neck',
    sleeveType: 'Cap Sleeve',
    backDesign: 'Closed',
    description: 'A clean, minimalist blouse in pure cotton with impeccable tailoring. No embellishment, no fuss — just perfect fit and structure. The cap sleeves and precise seams create a contemporary silhouette that pairs with any drape style. Wardrobe essential.',
    images: [
      { url: '/images/catalog/minimalist_crop_blouse.jpg', public_id: 'atelier/minimalist_crop_blouse' }
    ],
  },
  {
    name: 'Peplum Fusion Blouse',
    category: 'Modern',
    price: 2200,
    neckStyle: 'V-Neck',
    sleeveType: 'Short',
    backDesign: 'Closed with Zip',
    description: 'A fashion-forward peplum blouse that bridges Western and Indian aesthetics. The structured peplum flare complements a lehenga beautifully while the V-neckline keeps it sophisticated. A favorite for pre-wedding ceremonies and cocktail functions.',
    images: [
      { url: '/images/catalog/peplum_fusion_blouse.jpg', public_id: 'atelier/peplum_fusion_blouse' }
    ],
  },
  {
    name: 'Denim and Cotton Fusion',
    category: 'Modern',
    price: 1400,
    neckStyle: 'Collar Neck',
    sleeveType: '3/4th Sleeves',
    backDesign: 'Closed',
    description: 'A bold sartorial experiment — structured denim blouse designed for draping with cotton or linen sarees. The collar neckline and defined three-quarter sleeves create a smart-casual look. Ideal for the fashion-forward woman who breaks conventions.',
    images: [],
  },
  {
    name: 'Shirt-Style Blouse',
    category: 'Modern',
    price: 1800,
    neckStyle: 'Shirt Collar',
    sleeveType: 'Long Sleeves',
    backDesign: 'Closed',
    description: 'A sophisticated shirt-collar blouse with long sleeves and concealed buttons — the perfect fusion of Western tailoring and Indian draping tradition. Crafted from premium cotton poplin. A must-have for the professional woman who saree-drapes to work.',
    images: [],
  },
  {
    name: 'Indo-Western Blazer Blouse',
    category: 'Modern',
    price: 3400,
    neckStyle: 'Lapel Collar',
    sleeveType: 'Short',
    backDesign: 'Closed with Zip',
    description: 'A structural blazer-inspired blouse in textured suiting fabric with tailored lapels and a defined waist. This avant-garde design pairs spectacularly with draped silk sarees for a power dressing look. For the woman who leads.',
    images: [],
  },

  // === EMBROIDERED (5) ===
  {
    name: 'Resham Thread Florals',
    category: 'Embroidered',
    price: 2800,
    neckStyle: 'Round Neck',
    sleeveType: 'Short',
    backDesign: 'Closed',
    description: 'A romantic blouse embellished with hand-stitched resham thread floral motifs across the front and sleeves. The delicate craftsmanship takes over 40 hours to complete. The soft muted thread colors work beautifully on pastel and jewel-toned sarees.',
    images: [],
  },
  {
    name: 'Mirror Work Festive',
    category: 'Embroidered',
    price: 3200,
    neckStyle: 'Round Neck',
    sleeveType: 'Short',
    backDesign: 'Back Open',
    description: 'A vibrant Kutchi-style blouse with hundreds of hand-set tiny mirrors (shisha) creating a dazzling mosaic of reflected light. The bold red and orange base fabric is traditional and festive. Perfect for Navratri, Dussehra, and village-fair inspired aesthetics.',
    images: [],
  },
  {
    name: 'Pearl and Crystal Blouse',
    category: 'Embroidered',
    price: 4200,
    neckStyle: 'V-Neck',
    sleeveType: 'Cap Sleeve',
    backDesign: 'Deep V Back',
    description: 'A luxury blouse hand-embellished with freshwater pearls and Swarovski crystals in an art-deco geometric pattern. The cool ivory base fabric lets the embellishments take center stage. A statement piece for weddings and high-society events.',
    images: [],
  },
  {
    name: 'Kantha Stitch Heritage',
    category: 'Embroidered',
    price: 2400,
    neckStyle: 'Boat Neck',
    sleeveType: '3/4th Sleeves',
    backDesign: 'Closed',
    description: 'A soulful blouse featuring the ancient Bengali kantha stitch tradition — intricate running-stitch patterns of birds, flowers, and paisley motifs stitched by rural artisan collectives. Each piece carries the story of a tradition passed through generations.',
    images: [],
  },
  {
    name: 'Gota Patti Royal',
    category: 'Embroidered',
    price: 3800,
    neckStyle: 'Square Neck',
    sleeveType: 'Short',
    backDesign: 'Closed with Buttons',
    description: 'A regal Rajasthani gota patti blouse with strips of metallic ribbon embroidery in elaborate floral and paisley patterns. The shimmering gold and silver gota catches the light at every movement. Pure Jaipur craftsmanship for Rajasthani festive occasions.',
    images: [],
  },
];

// Time slots for appointments
const TIME_SLOTS = [
  '10:00 AM - 11:30 AM',
  '11:30 AM - 01:00 PM',
  '02:00 PM - 03:30 PM',
  '03:30 PM - 05:00 PM',
];

const CONSULT_TYPES = [
  'In-Store Atelier Fitting',
  'WhatsApp Video Call',
  'Bridal Trousseau Planning',
];

// Helper: generate dateKey from a Date object
function toDateKey(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Helper: future date offset
function futureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(10, 0, 0, 0);
  return d;
}

// Helper: past date offset
function pastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(10, 0, 0, 0);
  return d;
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function seedDemo() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║       KEERTI COUTURE — DEMO SEED SCRIPT         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log(`📦 Connecting to: ${MONGO_URI}\n`);

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── Step 1: Clear existing demo data ──────────────────────
  console.log('🧹 Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({}),
    Design.deleteMany({}),
    Order.deleteMany({}),
    Appointment.deleteMany({}),
    Quotation.deleteMany({}),
    Service.deleteMany({}),
  ]);
  console.log('   ✓ All collections cleared\n');

  // ── Step 2: Create Users ───────────────────────────────────
  console.log('👤 Creating demo users...');
  const createdUsers = [];
  for (const userData of DEMO_USERS) {
    const user = new User(userData);
    await user.save(); // triggers bcrypt pre-save hook
    createdUsers.push(user);
    const role = user.isAdmin ? '(Admin)' : '(Customer)';
    console.log(`   ✓ ${user.name} ${role} — ${user.email}`);
  }
  const adminUser = createdUsers[0];
  const customers = createdUsers.slice(1);
  console.log('');

  // ── Step 3: Create Services ────────────────────────────────
  console.log('🛠  Creating demo services...');
  const createdServices = await Service.insertMany(DEMO_SERVICES);
  console.log(`   ✓ ${createdServices.length} services created\n`);

  // ── Step 4: Create Designs ─────────────────────────────────
  console.log('👗 Creating 30 blouse designs...');
  const createdDesigns = await Design.insertMany(DEMO_DESIGNS);
  const categories = [...new Set(DEMO_DESIGNS.map(d => d.category))];
  for (const cat of categories) {
    const count = DEMO_DESIGNS.filter(d => d.category === cat).length;
    console.log(`   ✓ ${cat}: ${count} designs`);
  }
  console.log('');

  // ── Step 5: Create Sample Orders ──────────────────────────
  console.log('📦 Creating sample orders...');
  const orderStatusFlow = [
    'Order received',
    'Stitching started',
    'Stitching completed',
    'Ready for pickup',
    'Delivered',
  ];

  const sampleOrders = [
    {
      user: customers[0]._id,
      customerName: customers[0].name,
      phone: customers[0].phone,
      design: createdDesigns[0]._id, // Royal Zardosi Bridal
      customizationOptions: {
        neckStyle: 'Sweetheart',
        sleeveType: 'Short',
        backDesign: 'Deep V with Buttons',
        fabricColor: 'Deep Red',
        paddingOption: 'Yes',
        liningOption: 'Yes',
      },
      measurements: { bust: 36, waist: 30, shoulder: 14, armhole: 15, sleeveLength: 7, blouseLength: 15, frontNeckDepth: 7, backNeckDepth: 10 },
      extraServices: [
        { serviceId: String(createdServices[2]._id), name: 'Zari / Zardosi Embroidery', price: 1500 },
        { serviceId: String(createdServices[4]._id), name: 'Lining Addition', price: 200 },
      ],
      totalPrice: 7500 + 1500 + 200,
      status: 'Ready for pickup',
      paymentMethod: 'PayAtPickup',
      paymentStatus: 'Pending',
    },
    {
      user: customers[0]._id,
      customerName: customers[0].name,
      phone: customers[0].phone,
      design: createdDesigns[5]._id, // Kanjivaram Silk Classic
      customizationOptions: {
        neckStyle: 'Round Neck',
        sleeveType: 'Short',
        backDesign: 'Closed',
        fabricColor: 'Peacock Blue',
      },
      measurements: { bust: 36, waist: 30, shoulder: 14, armhole: 15, sleeveLength: 7, blouseLength: 15, frontNeckDepth: 6, backNeckDepth: 8 },
      extraServices: [],
      totalPrice: 3200,
      status: 'Delivered',
      paymentMethod: 'PayOnline',
      paymentStatus: 'Paid',
      isPaid: true,
      paidAt: pastDate(15),
      paymentEmailSent: true,
      razorpayOrderId: 'order_demo_rzp_001',
      razorpayPaymentId: 'pay_demo_rzp_001',
    },
    {
      user: customers[1]._id,
      customerName: customers[1].name,
      phone: customers[1].phone,
      design: createdDesigns[1]._id, // Heirloom Silk Bridal
      customizationOptions: {
        neckStyle: 'Round Neck',
        sleeveType: 'Elbow Length',
        backDesign: 'Back Open with Dori',
        fabricColor: 'Ivory',
        embroideryOption: 'Kundan Work',
      },
      measurements: { bust: 34, waist: 28, shoulder: 13.5, armhole: 14, sleeveLength: 12, blouseLength: 15, frontNeckDepth: 6, backNeckDepth: 9 },
      extraServices: [
        { serviceId: String(createdServices[5]._id), name: 'Hand Embroidery', price: 2000 },
      ],
      totalPrice: 8500 + 2000,
      status: 'Stitching started',
      paymentMethod: 'PayAdvance',
      paymentStatus: 'Partially Paid',
      advancePaid: true,
      advanceAmount: 5000,
      remainingAmount: 5500,
    },
    {
      user: customers[1]._id,
      customerName: customers[1].name,
      phone: customers[1].phone,
      design: createdDesigns[15]._id, // Sequin Shimmer Celebration
      customizationOptions: {
        neckStyle: 'Halter Neck',
        sleeveType: 'Sleeveless',
        backDesign: 'Deep V Back',
        fabricColor: 'Midnight Black',
      },
      measurements: { bust: 34, waist: 28, shoulder: 13.5, armhole: 14, sleeveLength: 0, blouseLength: 14, frontNeckDepth: 8, backNeckDepth: 12 },
      extraServices: [],
      totalPrice: 3500,
      status: 'Stitching completed',
      paymentMethod: 'PayAtPickup',
      paymentStatus: 'Pending',
    },
    {
      user: customers[2]._id,
      customerName: customers[2].name,
      phone: customers[2].phone,
      design: createdDesigns[10]._id, // Kasavu Temple Classic
      customizationOptions: {
        neckStyle: 'Round Neck',
        sleeveType: 'Short',
        backDesign: 'Closed',
        fabricColor: 'Cream',
      },
      measurements: { bust: 38, waist: 32, shoulder: 15, armhole: 16, sleeveLength: 7, blouseLength: 16, frontNeckDepth: 5, backNeckDepth: 7 },
      extraServices: [
        { serviceId: String(createdServices[3]._id), name: 'Fall & Pico (Saree)', price: 100 },
      ],
      totalPrice: 1500 + 100,
      status: 'Order received',
      paymentMethod: 'PayAtPickup',
      paymentStatus: 'Pending',
    },
    {
      user: customers[2]._id,
      customerName: customers[2].name,
      phone: customers[2].phone,
      design: createdDesigns[25]._id, // Resham Thread Florals
      customizationOptions: {
        neckStyle: 'Round Neck',
        sleeveType: 'Short',
        backDesign: 'Closed',
        fabricColor: 'Dusty Rose',
      },
      measurements: { bust: 38, waist: 32, shoulder: 15, armhole: 16, sleeveLength: 7, blouseLength: 15, frontNeckDepth: 6, backNeckDepth: 8 },
      extraServices: [
        { serviceId: String(createdServices[7]._id), name: 'Thread & Aari Work', price: 800 },
      ],
      totalPrice: 2800 + 800,
      status: 'Stitching started',
      paymentMethod: 'PayAdvance',
      paymentStatus: 'Partially Paid',
      advancePaid: true,
      advanceAmount: 2000,
      remainingAmount: 1600,
    },
    {
      user: customers[3]._id,
      customerName: customers[3].name,
      phone: customers[3].phone,
      design: createdDesigns[20]._id, // Minimalist Crop Blouse
      customizationOptions: {
        neckStyle: 'Round Neck',
        sleeveType: 'Cap Sleeve',
        backDesign: 'Closed',
        fabricColor: 'White',
      },
      measurements: { bust: 35, waist: 29, shoulder: 14, armhole: 14.5, sleeveLength: 4, blouseLength: 14, frontNeckDepth: 5, backNeckDepth: 7 },
      extraServices: [],
      totalPrice: 1600,
      status: 'Delivered',
      paymentMethod: 'PayOnline',
      paymentStatus: 'Paid',
      isPaid: true,
      paidAt: pastDate(30),
      paymentEmailSent: true,
      razorpayOrderId: 'order_demo_rzp_002',
      razorpayPaymentId: 'pay_demo_rzp_002',
    },
    {
      user: customers[3]._id,
      customerName: customers[3].name,
      phone: customers[3].phone,
      design: createdDesigns[3]._id, // Gold Tissue Bridal Blouse
      customizationOptions: {
        neckStyle: 'Square Neck',
        sleeveType: 'Short',
        backDesign: 'Keyhole with Tassel',
        fabricColor: 'Gold',
        paddingOption: 'Yes',
        liningOption: 'Yes',
      },
      measurements: { bust: 35, waist: 29, shoulder: 14, armhole: 14.5, sleeveLength: 7, blouseLength: 15, frontNeckDepth: 7, backNeckDepth: 9 },
      extraServices: [
        { serviceId: String(createdServices[2]._id), name: 'Zari / Zardosi Embroidery', price: 1500 },
        { serviceId: String(createdServices[6]._id), name: 'Mirror Work Embellishment', price: 1200 },
        { serviceId: String(createdServices[4]._id), name: 'Lining Addition', price: 200 },
      ],
      totalPrice: 9200 + 1500 + 1200 + 200,
      status: 'Stitching started',
      paymentMethod: 'PayAdvance',
      paymentStatus: 'Partially Paid',
      advancePaid: true,
      advanceAmount: 6000,
      remainingAmount: 6100,
    },
    {
      user: customers[0]._id,
      customerName: customers[0].name,
      phone: customers[0].phone,
      design: createdDesigns[14]._id, // Chikankari Lucknowi
      customizationOptions: {
        neckStyle: 'Round Neck',
        sleeveType: 'Elbow Length',
        backDesign: 'Closed',
        fabricColor: 'White',
      },
      measurements: { bust: 36, waist: 30, shoulder: 14, armhole: 15, sleeveLength: 12, blouseLength: 15, frontNeckDepth: 5, backNeckDepth: 7 },
      extraServices: [],
      totalPrice: 2600,
      status: 'Ready for pickup',
      paymentMethod: 'PayOnline',
      paymentStatus: 'Paid',
      isPaid: true,
      paidAt: pastDate(5),
      paymentEmailSent: true,
      razorpayOrderId: 'order_demo_rzp_003',
      razorpayPaymentId: 'pay_demo_rzp_003',
    },
    {
      user: customers[1]._id,
      customerName: customers[1].name,
      phone: customers[1].phone,
      design: createdDesigns[29]._id, // Gota Patti Royal
      customizationOptions: {
        neckStyle: 'Square Neck',
        sleeveType: 'Short',
        backDesign: 'Closed with Buttons',
        fabricColor: 'Royal Blue',
      },
      measurements: { bust: 34, waist: 28, shoulder: 13.5, armhole: 14, sleeveLength: 7, blouseLength: 15, frontNeckDepth: 6, backNeckDepth: 8 },
      extraServices: [
        { serviceId: String(createdServices[2]._id), name: 'Zari / Zardosi Embroidery', price: 1500 },
      ],
      totalPrice: 3800 + 1500,
      status: 'Order received',
      paymentMethod: 'PayAtPickup',
      paymentStatus: 'Pending',
    },
  ];

  const createdOrders = await Order.insertMany(sampleOrders);
  console.log(`   ✓ ${createdOrders.length} sample orders created`);
  for (const o of createdOrders) {
    console.log(`     → ${o.customerName}: ${o.status} (${o.paymentMethod} / ${o.paymentStatus})`);
  }
  console.log('');

  // ── Step 6: Create Sample Appointments ────────────────────
  console.log('📅 Creating sample appointments...');

  // Use distinct date+slot combinations to satisfy the unique partial index
  const apptData = [
    {
      user: customers[0]._id,
      customerName: customers[0].name,
      email: customers[0].email,
      phone: customers[0].phone,
      preferredDate: futureDate(7),
      dateKey: toDateKey(futureDate(7)),
      timeSlot: TIME_SLOTS[0],
      consultType: 'In-Store Atelier Fitting',
      status: 'Confirmed',
      notes: 'Coming for bridal blouse fitting. Have 3 sarees to try.',
      adminNotes: 'Confirmed. Bridal appointment — allocate extra time.',
    },
    {
      user: customers[1]._id,
      customerName: customers[1].name,
      email: customers[1].email,
      phone: customers[1].phone,
      preferredDate: futureDate(10),
      dateKey: toDateKey(futureDate(10)),
      timeSlot: TIME_SLOTS[1],
      consultType: 'WhatsApp Video Call',
      status: 'Pending',
      notes: 'Video call to discuss customization options before visiting.',
    },
    {
      user: customers[2]._id,
      customerName: customers[2].name,
      email: customers[2].email,
      phone: customers[2].phone,
      preferredDate: futureDate(14),
      dateKey: toDateKey(futureDate(14)),
      timeSlot: TIME_SLOTS[2],
      consultType: 'Bridal Trousseau Planning',
      status: 'Confirmed',
      notes: 'Planning trousseau for December wedding. Need 8-10 blouses.',
      adminNotes: 'Major trousseau order — prepare look book and fabric samples.',
    },
    {
      user: customers[3]._id,
      customerName: customers[3].name,
      email: customers[3].email,
      phone: customers[3].phone,
      preferredDate: futureDate(21),
      dateKey: toDateKey(futureDate(21)),
      timeSlot: TIME_SLOTS[0],
      consultType: 'In-Store Atelier Fitting',
      status: 'Pending',
      notes: 'First visit. Want to understand the customization process.',
    },
    {
      customerName: 'Lakshmi Reddy',
      email: 'lakshmi.reddy@example.demo',
      phone: '9887766554',
      preferredDate: pastDate(10),
      dateKey: toDateKey(pastDate(10)),
      timeSlot: TIME_SLOTS[3],
      consultType: 'In-Store Atelier Fitting',
      status: 'Completed',
      notes: 'Came for final fitting of bridal blouse.',
      adminNotes: 'Blouse fitted perfectly. Happy customer.',
    },
    {
      customerName: 'Sunita Patel',
      email: 'sunita.patel@example.demo',
      phone: '9776655443',
      preferredDate: pastDate(5),
      dateKey: toDateKey(pastDate(5)),
      timeSlot: TIME_SLOTS[1],
      consultType: 'WhatsApp Video Call',
      status: 'Completed',
      notes: 'Discussed measurements and design options over video.',
      adminNotes: 'Shared size guide. Customer to visit next week.',
    },
    {
      customerName: 'Rashmi Singh',
      email: 'rashmi.singh@example.demo',
      phone: '9665544332',
      preferredDate: pastDate(2),
      dateKey: toDateKey(pastDate(2)),
      timeSlot: TIME_SLOTS[0],
      consultType: 'Bridal Trousseau Planning',
      status: 'Cancelled',
      notes: 'Initially booked for trousseau consultation.',
      adminNotes: 'Customer cancelled — rescheduling for next month.',
    },
  ];

  // Set activeSlotKey for active appointments
  const activeStatuses = new Set(['Pending', 'Confirmed', 'Rescheduled']);
  const appointmentsToInsert = apptData.map(a => ({
    ...a,
    activeSlotKey: activeStatuses.has(a.status)
      ? `${a.dateKey}__${a.timeSlot.toLowerCase().trim()}`
      : null,
  }));

  const createdAppointments = await Appointment.insertMany(appointmentsToInsert);
  console.log(`   ✓ ${createdAppointments.length} appointments created`);
  for (const a of createdAppointments) {
    console.log(`     → ${a.customerName}: ${a.consultType} on ${a.dateKey} (${a.status})`);
  }
  console.log('');

  // ── Step 7: Create Sample Quotations ──────────────────────
  console.log('💬 Creating sample quotations...');

  const quotationData = [
    {
      user: customers[0]._id,
      customerName: customers[0].name,
      email: customers[0].email,
      phone: customers[0].phone,
      notes: 'I am getting married in December 2026 and need a complete bridal trousseau — 10 blouses in various styles including 2 heavy bridal pieces with zardosi embroidery, 3 silk blouses and 5 casual festive pieces. Looking for end-to-end service.',
      preferredFabric: 'Kanchipuram Silk / Pure Zari',
      estimatedBudget: '₹50,000 - ₹80,000',
      status: 'Quoted',
      quotedAmount: 65000,
      quotedTurnaround: '45-60 Days',
      adminFeedback: 'We can absolutely create a stunning trousseau for your December wedding! Our proposal includes 2 heavy zardosi bridal blouses, 3 Kanjivaram silk pieces, and 5 festive blouses. All measurements done in one comprehensive session. Delivery 2 weeks before your event.',
      referenceImages: [],
    },
    {
      user: customers[1]._id,
      customerName: customers[1].name,
      email: customers[1].email,
      phone: customers[1].phone,
      notes: 'Want a custom designer blouse inspired by the sabyasachi editorial in Vogue India September 2026 — heavy resham embroidery, specific shade of bottle green, deep back cut with dori tie. Happy to share reference images.',
      preferredFabric: 'Raw Silk / Tussar',
      estimatedBudget: '₹8,000 - ₹15,000',
      status: 'Accepted',
      quotedAmount: 11500,
      quotedTurnaround: '21 Days',
      adminFeedback: 'Wonderful choice! We specialize in Sabyasachi-inspired craftsmanship. The bottle green raw silk with heavy resham work will be stunning. We will source the exact shade and start the embroidery frame within 3 days of your advance.',
      customerResponse: 'Accepted! This sounds perfect. Sending the advance today.',
      customerResponseAt: pastDate(3),
      referenceImages: [],
    },
    {
      user: customers[2]._id,
      customerName: customers[2].name,
      email: customers[2].email,
      phone: customers[2].phone,
      notes: 'Need 3 matching blouses for my sisters-in-law for a family wedding — identical design, different sizes. All in the same dark maroon velvet with gold border. Need them in 2 weeks.',
      preferredFabric: 'Velvet',
      estimatedBudget: '₹6,000 - ₹10,000',
      status: 'Under Review',
      referenceImages: [],
    },
    {
      user: customers[3]._id,
      customerName: customers[3].name,
      email: customers[3].email,
      phone: customers[3].phone,
      notes: 'Looking for a modern structured blouse in black and gold — something that can work for both office and evening saree wearing. Minimal embellishment, focus on cut and tailoring. Open to suggestions.',
      preferredFabric: 'Suiting Fabric / Crepe',
      estimatedBudget: '₹3,000 - ₹5,000',
      status: 'Submitted',
      referenceImages: [],
    },
    {
      customerName: 'Kamla Devi',
      email: 'kamla.devi@example.demo',
      phone: '9554433221',
      notes: 'Wanted a simple cotton blouse with mirror work. Got a quote of ₹2800 which was above my budget. Went with another vendor.',
      preferredFabric: 'Cotton',
      estimatedBudget: '₹1,500 - ₹2,000',
      status: 'Declined',
      quotedAmount: 2800,
      quotedTurnaround: '7 Days',
      adminFeedback: 'We quoted ₹2,800 for the cotton blouse with hand-set mirror work (100+ mirrors). Our pricing reflects the artisan hours involved.',
      customerResponse: 'This is above my budget. Thank you for the detailed quote.',
      customerResponseAt: pastDate(20),
      referenceImages: [],
    },
  ];

  const createdQuotations = await Quotation.insertMany(quotationData);
  console.log(`   ✓ ${createdQuotations.length} quotations created`);
  for (const q of createdQuotations) {
    console.log(`     → ${q.customerName}: ${q.status}${q.quotedAmount ? ` (₹${q.quotedAmount.toLocaleString('en-IN')})` : ''}`);
  }
  console.log('');

  // ── Summary ───────────────────────────────────────────────
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║            DEMO SEED COMPLETE ✅                 ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Users         : ${String(createdUsers.length).padEnd(31)}║`);
  console.log(`║  Services      : ${String(createdServices.length).padEnd(31)}║`);
  console.log(`║  Designs       : ${String(createdDesigns.length).padEnd(31)}║`);
  console.log(`║  Orders        : ${String(createdOrders.length).padEnd(31)}║`);
  console.log(`║  Appointments  : ${String(createdAppointments.length).padEnd(31)}║`);
  console.log(`║  Quotations    : ${String(createdQuotations.length).padEnd(31)}║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  DEMO LOGIN CREDENTIALS                          ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Admin:                                          ║');
  console.log('║    Email   : admin@keerticouture.demo            ║');
  console.log('║    Password: DemoAdmin@2026                      ║');
  console.log('║  Customer:                                       ║');
  console.log('║    Email   : priya.sharma@example.demo           ║');
  console.log('║    Password: DemoCustomer@2026                   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB. Demo ready!\n');
}

seedDemo().catch(err => {
  console.error('\n❌ Seed script failed:', err.message);
  if (err.errors) {
    for (const [field, error] of Object.entries(err.errors)) {
      console.error(`   Field "${field}": ${error.message}`);
    }
  }
  process.exit(1);
});

