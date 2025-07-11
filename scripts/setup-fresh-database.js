const { sequelize } = require('../config/database');
const { User } = require('../models');

async function setupFreshDatabase() {
  try {
    console.log('🚀 Starting fresh database setup...');

    // 1. Sync all models to create tables
    console.log('\n1. Creating all tables...');
    await sequelize.sync({ force: true });
    console.log('✅ All tables created successfully');

    // 2. Create admin account
    console.log('\n2. Creating admin account...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@gmail.com',
      password: 'admin123456', // Will be hashed automatically
      fullName: 'System Administrator',
      role: 'admin'
    });
    console.log('✅ Admin account created:', adminUser.email);

    // 3. Create demo user account
    console.log('\n3. Creating demo user account...');
    const demoUser = await User.create({
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'user123456', // Will be hashed automatically
      fullName: 'User 1',
      role: 'user'
    });
    console.log('✅ Demo user account created:', demoUser.email);
    console.log('Demo user UUID:', demoUser.id);

    console.log('\n🎉 Database setup completed!');
  } catch (error) {
    console.error('❌ Error during database setup:', error);
  } finally {
    await sequelize.close();
  }
}

setupFreshDatabase(); 