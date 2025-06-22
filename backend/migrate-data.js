const mongoose = require('mongoose');
require('dotenv').config();

const Site = require('./models/Site');
const User = require('./models/User');

async function migrateData() {
  try {
    console.log('Starting data migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_privado');
    console.log('Connected to MongoDB');
    
    // Check if there are any sites with the old schema (with owner field)
    const oldSites = await Site.find({ owner: { $exists: true } });
    console.log(`Found ${oldSites.length} sites with old schema`);
    
    if (oldSites.length > 0) {
      for (const site of oldSites) {
        console.log(`Migrating site: ${site.name}`);
        
        // Create a new site with the new schema
        const newSite = new Site({
          name: site.name,
          url: site.url,
          description: site.description || '',
          users: site.owner ? [site.owner] : [],
          metaTitle: site.metaTitle || '',
          metaDescription: site.metaDescription || '',
          metaImage: site.metaImage || '',
          isActive: true,
          createdAt: site.createdAt || new Date(),
          updatedAt: new Date()
        });
        
        await newSite.save();
        console.log(`✅ Migrated site: ${site.name}`);
        
        // Remove the old site
        await Site.findByIdAndDelete(site._id);
        console.log(`🗑️ Removed old site: ${site.name}`);
      }
    }
    
    // Check if there are any users with the old schema
    const oldUsers = await User.find({ role: { $in: ['SUPER_ADMIN', 'SITE_ADMIN'] } });
    console.log(`Found ${oldUsers.length} users with old roles`);
    
    if (oldUsers.length > 0) {
      for (const user of oldUsers) {
        console.log(`Migrating user: ${user.name}`);
        
        // Update user role to new schema
        let newRole = 'viewer';
        if (user.role === 'SUPER_ADMIN') {
          newRole = 'admin';
        } else if (user.role === 'SITE_ADMIN') {
          newRole = 'editor';
        }
        
        await User.findByIdAndUpdate(user._id, {
          role: newRole,
          isActive: true,
          updatedAt: new Date()
        });
        
        console.log(`✅ Updated user role: ${user.name} -> ${newRole}`);
      }
    }
    
    console.log('✅ Migration completed successfully');
    
    // Show final counts
    const finalSites = await Site.countDocuments();
    const finalUsers = await User.countDocuments();
    
    console.log(`Final counts - Sites: ${finalSites}, Users: ${finalUsers}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateData(); 