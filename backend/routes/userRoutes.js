const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission, requireAdmin } = require('../middleware/permissionMiddleware');
const {
  registerUser,
  createUser,
  loginUser,
  logoutUser,
  getAllUsers,
  getPendingUsers,
  getUserById,
  approveUser,
  rejectUser,
  updateUser,
  deleteUser,
  addUserToSite,
  removeUserFromSite,
  createInitialAdmin,
  getCurrentUser,
  updateProfile,
  getAllAvailablePermissions
} = require('../controllers/userController');

// Rotas públicas
router.post('/register', registerUser); // Registro público (requer aprovação)
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Rota temporária para criar admin inicial (remover após primeiro uso)
router.post('/create-admin', createInitialAdmin);

// Rotas de perfil do usuário logado
router.get('/me', protect, requirePermission('profile:view'), getCurrentUser);
router.put('/profile', protect, requirePermission('profile:edit'), updateProfile);

// Rota para obter todas as permissões disponíveis
router.get('/permissions', protect, requirePermission('system:permissions'), getAllAvailablePermissions);

// Rotas protegidas com permissões
router.get('/', protect, requirePermission('users:view'), getAllUsers);
router.get('/pending', protect, requirePermission('users:view'), getPendingUsers); // Usuários pendentes
router.get('/:id', protect, requirePermission('users:view'), getUserById);
router.put('/:id', protect, requirePermission('users:edit'), updateUser);
router.delete('/:id', protect, requirePermission('users:delete'), deleteUser);

// Rotas de aprovação (apenas admin)
router.post('/:userId/approve', protect, requirePermission('users:approve'), approveUser);
router.post('/:userId/reject', protect, requirePermission('users:reject'), rejectUser);

// Rota para criar usuário pelo admin (sem aprovação necessária)
router.post('/', protect, requirePermission('users:create'), createUser);

// Rotas para gerenciar relacionamentos com sites
router.post('/add-to-site', protect, requirePermission('users:edit'), addUserToSite);
router.post('/remove-from-site', protect, requirePermission('users:edit'), removeUserFromSite);

module.exports = router; 