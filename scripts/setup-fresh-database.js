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

    // 2. Tạo công ty chủ tool
    console.log('\n2. Tạo công ty chủ tool...');
    const ownerCompany = await Company.create({
      name: 'ToolCorp',
      address: '1 Main St',
      phone: '0999999999',
      email: 'owner@toolcorp.com',
      type: 'owner'
    });
    console.log('✅ Công ty chủ tool đã được tạo:', ownerCompany.name);

    // 3. Tạo công ty đối tác
    console.log('\n3. Tạo công ty đối tác...');
    const partnerCompany = await Company.create({
      name: 'Demo Partner',
      address: '123 Demo St',
      phone: '0123456789',
      email: 'company@example.com',
      type: 'partner'
    });
    console.log('✅ Công ty đối tác đã được tạo:', partnerCompany.name);

    // 4. Tạo các vị trí cho từng công ty
    console.log('\n4. Tạo các vị trí cho từng công ty...');
    const ownerManagerPosition = await UserPosition.create({ position: 'manager', company_id: ownerCompany.id });
    const partnerManagerPosition = await UserPosition.create({ position: 'manager', company_id: partnerCompany.id });
    const partnerEmployeePosition = await UserPosition.create({ position: 'employee', company_id: partnerCompany.id });
    console.log('✅ Đã tạo các vị trí cho công ty chủ tool và đối tác');

    // 5. Tạo user manager cho công ty chủ tool
    console.log('\n5. Tạo user manager cho công ty chủ tool...');
    const ownerManager = await User.create({
      username: 'tooladmin',
      email: 'tooladmin@toolcorp.com',
      password: 'tooladmin123',
      fullName: 'ToolCorp Admin',
      user_position_id: ownerManagerPosition.id
    });
    console.log('✅ User manager công ty chủ tool đã được tạo:', ownerManager.email);

    // 6. Tạo manager cho công ty đối tác
    console.log('\n6. Tạo manager cho công ty đối tác...');
    const partnerManager = await User.create({
      username: 'partner1',
      email: 'partner1@gmail.com',
      password: 'partner123456',
      fullName: 'Partner Company 1',
      user_position_id: partnerManagerPosition.id
    });
    console.log('✅ Manager công ty đối tác đã được tạo:', partnerManager.email);

    // 7. Tạo employee cho công ty đối tác
    console.log('\n7. Tạo employee cho công ty đối tác...');
    const employee = await User.create({
      username: 'employee1',
      email: 'employee1@gmail.com',
      password: 'employee123456',
      fullName: 'Employee Partner 1',
      user_position_id: partnerEmployeePosition.id
    });
    console.log('✅ Employee công ty đối tác đã được tạo:', employee.email);

    // 8. Tạo tài khoản demo employee cho công ty đối tác
    console.log('\n8. Tạo tài khoản demo employee cho công ty đối tác...');
    const demoUser = await User.create({
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'user123456',
      fullName: 'User 1',
      user_position_id: partnerEmployeePosition.id
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