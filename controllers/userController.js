const User = require('../models/User');
const { validateUserUpdate } = require('../validators/userValidator');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách user (chỉ admin, phân trang)
 *     description: Chỉ admin mới có quyền lấy danh sách tất cả user.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Danh sách user
 *       403:
 *         description: Không có quyền truy cập
 */
// Get all users (with pagination)
const getAllUsers = async (req, res, next) => {
  try {
    const currentUser = req.currentUser;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {};
    switch (currentUser.role) {
      case 'superadmin':
        // Xem được mọi user
        break;
      case 'admin':
        whereClause.role = { [Op.ne]: 'superadmin' };
        break;
      case 'partner_company':
        whereClause.role = 'employee_partner';
        whereClause.company_id = currentUser.company_id;
        break;
      case 'employee_partner':
        whereClause.id = currentUser.id;
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view users.'
        });
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy thông tin user theo ID (admin hoặc chính user)
 *     description: Admin hoặc chính user mới có quyền xem thông tin user này.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thông tin user
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy user
 */
// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const currentUser = req.currentUser;
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Phân quyền xem user
    switch (currentUser.role) {
      case 'superadmin':
        // Xem được mọi user
        break;
      case 'admin':
        if (user.role === 'superadmin') {
          return res.status(403).json({
            success: false,
            message: 'Admin cannot view superadmin.'
          });
        }
        break;
      case 'partner_company':
        if (!(user.role === 'employee_partner' && user.company_id === currentUser.company_id)) {
          return res.status(403).json({
            success: false,
            message: 'Partner company can only view their own employee_partner.'
          });
        }
        break;
      case 'employee_partner':
        if (currentUser.id !== user.id) {
          return res.status(403).json({
            success: false,
            message: 'You can only view your own information.'
          });
        }
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this user.'
        });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật user (admin hoặc chính user)
 *     description: Admin có thể cập nhật mọi user. User thường chỉ được cập nhật thông tin của chính mình.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền cập nhật
 *       404:
 *         description: Không tìm thấy user
 */
// Update user
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { currentPassword, newPassword, ...fieldsToUpdate } = updateData;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Phân quyền update user
    const currentUser = req.currentUser;
    if (currentUser.role === 'superadmin') {
      // superadmin được sửa mọi user
    } else if (currentUser.role === 'admin') {
      if (user.role === 'superadmin' || user.role === 'admin') {
        if (currentUser.id !== user.id) {
          return res.status(403).json({
            success: false,
            message: 'Admin cannot update other admin or superadmin.'
          });
        }
      }
    } else if (currentUser.role === 'partner_company') {
      if (!(user.role === 'employee_partner' && user.company_id === currentUser.company_id)) {
        if (currentUser.id !== user.id) {
          return res.status(403).json({
            success: false,
            message: 'Partner company can only update their own employee_partner.'
          });
        }
      }
    } else {
      if (currentUser.id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this user.'
        });
      }
    }

    // Nếu không phải superadmin, không cho phép đổi role và isActive
    if (currentUser.role !== 'superadmin') {
      if ('role' in fieldsToUpdate || 'isActive' in fieldsToUpdate) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update role or isActive. Only superadmin can do this.'
        });
      }
    }

    // Check if user is trying to update email/username that already exists
    if (fieldsToUpdate.email && fieldsToUpdate.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: fieldsToUpdate.email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    if (fieldsToUpdate.username && fieldsToUpdate.username !== user.username) {
      const existingUser = await User.findOne({ where: { username: fieldsToUpdate.username } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Đổi mật khẩu nếu có newPassword
    if (newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      fieldsToUpdate.password = newPassword;
    }

    // Update user
    await user.update(fieldsToUpdate);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa user (chỉ admin)
 *     description: Chỉ admin mới có quyền xóa user. Admin không thể tự xóa chính mình.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         description: Không có quyền xóa
 *       404:
 *         description: Không tìm thấy user
 */
// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Phân quyền delete user
    const currentUser = req.currentUser;
    if (currentUser.role === 'superadmin') {
      // superadmin được xóa mọi user
    } else if (currentUser.role === 'admin') {
      if (user.role === 'superadmin' || user.role === 'admin') {
        if (currentUser.id !== user.id) {
          return res.status(403).json({
            success: false,
            message: 'Admin cannot delete other admin or superadmin.'
          });
        }
      }
    } else if (currentUser.role === 'partner_company') {
      if (!(user.role === 'employee_partner' && user.company_id === currentUser.company_id)) {
        if (currentUser.id !== user.id) {
          return res.status(403).json({
            success: false,
            message: 'Partner company can only delete their own employee_partner.'
          });
        }
      }
    } else {
      if (currentUser.id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this user.'
        });
      }
    }

    if (currentUser.id === user.id) {
      return res.status(403).json({
        success: false,
        message: 'Admin cannot delete their own account.'
      });
    }

    // Prevent deletion of admin user
    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/{id}/toggle-status:
 *   post:
 *     summary: Bật/tắt trạng thái hoạt động của user (chỉ admin)
 *     description: Chỉ admin mới có quyền bật/tắt trạng thái hoạt động của user. Admin không thể tự vô hiệu hóa chính mình.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Đổi trạng thái thành công
 *       403:
 *         description: Không có quyền thay đổi trạng thái
 *       404:
 *         description: Không tìm thấy user
 */
// Toggle user status
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Phân quyền toggle status
    const currentUser = req.currentUser;
    if (currentUser.role === 'superadmin') {
      // superadmin được bật/tắt mọi user
    } else if (currentUser.role === 'admin') {
      if (user.role === 'superadmin' || user.role === 'admin') {
        if (currentUser.id !== user.id) {
          return res.status(403).json({
            success: false,
            message: 'Admin cannot toggle status for other admin or superadmin.'
          });
        }
      }
    } else if (currentUser.role === 'partner_company') {
      if (!(user.role === 'employee_partner' && user.company_id === currentUser.company_id)) {
        if (currentUser.id !== user.id) {
          return res.status(403).json({
            success: false,
            message: 'Partner company can only toggle status for their own employee_partner.'
          });
        }
      }
    } else {
      if (currentUser.id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to toggle status for this user.'
        });
      }
    }

    // Không cho phép admin tự vô hiệu hóa chính mình
    if (currentUser.id === user.id) {
      return res.status(403).json({
        success: false,
        message: 'Admin cannot deactivate their own account.'
      });
    }

    await user.update({ isActive: !user.isActive });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Tìm kiếm user theo tên/email (chỉ admin)
 *     description: Chỉ admin mới có quyền tìm kiếm user.
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm user
 *       403:
 *         description: Không có quyền tìm kiếm
 */
// Search users
const searchUsers = async (req, res, next) => {
  try {
    const currentUser = req.currentUser;
    const { q, role, isActive } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Phân quyền tìm kiếm user
    switch (currentUser.role) {
      case 'superadmin':
        // Tìm được mọi user
        break;
      case 'admin':
        whereClause.role = { [Op.ne]: 'superadmin' };
        break;
      case 'partner_company':
        whereClause.role = 'employee_partner';
        whereClause.company_id = currentUser.company_id;
        break;
      case 'employee_partner':
        whereClause.id = currentUser.id;
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to search users.'
        });
    }

    // Search by query
    if (q) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { fullName: { [Op.iLike]: `%${q}%` } }
      ];
    }

    // Filter by role
    if (role) {
      whereClause.role = role;
    }

    // Filter by status
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  searchUsers
}; 