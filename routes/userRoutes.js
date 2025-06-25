const express = require('express');
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  toggleUserStatus, 
  searchUsers 
} = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateUserUpdate } = require('../validators/userValidator');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/', authorizeRoles(['admin']), getAllUsers);
router.get('/search', authorizeRoles(['admin']), searchUsers);
router.get('/:id', getUserById);
router.put('/:id', validateUserUpdate, updateUser);
router.patch('/:id/toggle-status', authorizeRoles(['admin']), toggleUserStatus);
router.delete('/:id', authorizeRoles(['admin']), deleteUser);

module.exports = router; 