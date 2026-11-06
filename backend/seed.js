const Design = require('./models/Design');
const Service = require('./models/Service');
const User = require('./models/User');

const seedData = async () => {
  try {
    const designCount = await Design.countDocuments();
    if (designCount === 0) {
      console.log('[Seed] Seeding sample designs and services for development...');
      const dummyDesigns = [
        {
          name: 'Royal Bridal Blouse',
          category: 'Bridal Blouse',
          price: 5500,
          neckStyle: 'Sweetheart',
          sleeveType: 'Short',
          backDesign: 'Deep U',
          description: 'A luxurious handcrafted bridal blouse piece with intricate embroidery.',
          images: [{ url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80', public_id: 'sample_bridal_1' }]
        },
        {
          name: 'Elegant Designer Cut',
          category: 'Designer Blouse',
          price: 3200,
          neckStyle: 'Boat Neck',
          sleeveType: 'Sleeveless',
          backDesign: 'Keyhole',
          description: 'Contemporary designer wear for festive celebrations.',
          images: [{ url: 'https://images.unsplash.com/photo-1583391733958-d25e07fac0ec?auto=format&fit=crop&q=80', public_id: 'sample_designer_2' }]
        },
        {
          name: 'Classic Boat Neck',
          category: 'Boat Neck Blouse',
          price: 1800,
          neckStyle: 'Boat Neck',
          sleeveType: '3/4th Sleeves',
          backDesign: 'Closed',
          description: 'Timeless formal style tailored for silks and banarasis.',
          images: [{ url: 'https://images.unsplash.com/photo-1563172044-8da8f6bf744b?auto=format&fit=crop&q=80', public_id: 'sample_boat_3' }]
        },
        {
          name: 'Zardosi Work Blouse',
          category: 'Bridal Blouse',
          price: 8500,
          neckStyle: 'Round',
          sleeveType: 'Short',
          backDesign: 'Back Open',
          description: 'Heavy gold zardosi embroidery crafted by master artisans.',
          images: [{ url: 'https://images.unsplash.com/photo-1610996885374-1234c9884e60?auto=format&fit=crop&q=80', public_id: 'sample_zardosi_4' }]
        }
      ];
      await Design.insertMany(dummyDesigns);

      const dummyServices = [
        { name: 'Saree Piko', price: 150, description: 'Neat edge interlocking for sarees', estimatedTurnaround: '24-48 Hours', isActive: true },
        { name: 'Saree Fall Stitching', price: 250, description: 'Adds structure and elegant drape', estimatedTurnaround: '24-48 Hours', isActive: true },
        { name: 'Blouse Alteration', price: 300, description: 'Precision size and fit adjustments', estimatedTurnaround: '2-3 Days', isActive: true },
        { name: 'Urgent Stitching', price: 500, description: 'Priority delivery within 48 hours', estimatedTurnaround: '48 Hours', isActive: true }
      ];
      await Service.insertMany(dummyServices);

      console.log('[Seed] Sample catalog data seeded successfully.');
    }

    // Safe Admin Bootstrap: Only create an administrator if explicitly configured in environment
    const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : null;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (!existingAdmin) {
        const adminUser = new User({
          name: process.env.ADMIN_NAME || 'Master Administrator',
          email: adminEmail,
          password: adminPassword,
          isAdmin: true,
        });
        await adminUser.save();
        console.log(`[Seed] Administrator account initialized for: ${adminEmail}`);
      }
    } else {
      console.log('[Seed] No ADMIN_EMAIL/ADMIN_PASSWORD provided in environment. Run "node bootstrap_admin.js" to create an administrator.');
    }
  } catch (error) {
    console.error('[Seed] Data seeding error:', error.message);
  }
};

module.exports = seedData;
