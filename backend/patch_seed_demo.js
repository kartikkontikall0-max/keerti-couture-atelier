'use strict';

const fs = require('fs');
const path = require('path');

const seedFile = path.join(__dirname, 'seed_demo.js');
let content = fs.readFileSync(seedFile, 'utf8');

const updatedDemoDesignsStr = `const DEMO_DESIGNS = [
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
];`;

const startMarker = 'const DEMO_DESIGNS = [';
const endMarker = '];\n\n// Time slots for appointments';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + updatedDemoDesignsStr + content.slice(endIndex + 2);
  fs.writeFileSync(seedFile, content, 'utf8');
  console.log('Successfully patched seed_demo.js with verified images and honest placeholders.');
} else {
  console.error('Markers not found in seed_demo.js!');
  process.exit(1);
}

