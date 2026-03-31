const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  deleteUser,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// All user management routes require admin access
router.use(authenticate, authorize('admin'));

// GET /api/users
router.get('/', getUsers);

// PATCH /api/users/:id/role
router.patch('/:id/role', updateUserRole);

// DELETE /api/users/:id
router.delete('/:id', deleteUser);

module.exports = router;
