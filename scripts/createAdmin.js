const { sequelize } = require('../config/database');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized.');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists.');
      return;
    }

    // Create admin user
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      fullName: 'Administrator',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Username: admin');
    console.log('🔐 Role: admin');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
};

// Run the script
createAdminUser(); 