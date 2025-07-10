const { sequelize } = require('../config/database');
const { User, Company } = require('../models');
const { UserPosition } = require('../models/Company');

async function setupFreshDatabase() {
  try {
    console.log('🚀 Bắt đầu setup database mới từ đầu...');

    // 1. Sync tất cả models để tạo bảng
    console.log('\n1. Tạo tất cả bảng...');
    await sequelize.sync({ force: true });
    console.log('✅ Tất cả bảng đã được tạo thành công');

    // 2. Tạo công ty mẫu
    console.log('\n2. Tạo công ty mẫu...');
    const company = await Company.create({
      name: 'Demo Company',
      address: '123 Demo St',
      phone: '0123456789',
      email: 'company@example.com'
    });
    console.log('✅ Công ty mẫu đã được tạo:', company.name);

    // 3. Tạo các vị trí mẫu cho công ty
    console.log('\n3. Tạo các vị trí mẫu cho công ty...');
    const managerPosition = await UserPosition.create({ position: 'manager', company_id: company.id });
    const employeePosition = await UserPosition.create({ position: 'employee', company_id: company.id });
    console.log('✅ Đã tạo các vị trí: manager, employee');

    // 4. Tạo tài khoản manager (partner_company)
    console.log('\n4. Tạo tài khoản manager...');
    const manager = await User.create({
      username: 'partner1',
      email: 'partner1@gmail.com',
      password: 'partner123456',
      fullName: 'Partner Company 1',
      user_position_id: managerPosition.id
    });
    console.log('✅ Manager đã được tạo:', manager.email);

    // 5. Tạo employee
    console.log('\n5. Tạo employee...');
    const employee = await User.create({
      username: 'employee1',
      email: 'employee1@gmail.com',
      password: 'employee123456',
      fullName: 'Employee Partner 1',
      user_position_id: employeePosition.id
    });
    console.log('✅ Employee đã được tạo:', employee.email);

    // 6. Tạo tài khoản demo employee
    console.log('\n6. Tạo tài khoản demo employee...');
    const demoUser = await User.create({
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'user123456',
      fullName: 'User 1',
      user_position_id: employeePosition.id
    });
    console.log('✅ Tài khoản demo đã được tạo:', demoUser.email);
    console.log('Demo user UUID:', demoUser.id);

    console.log('\n🎉 Database setup hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi khi setup database:', error);
  } finally {
    await sequelize.close();
  }
}

setupFreshDatabase(); 