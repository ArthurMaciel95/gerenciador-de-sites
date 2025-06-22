const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAvailablePermissions,
  getRoleStats,
  initializeDefaultRoles
} = require('../controllers/roleController');

// Rotas protegidas com permissões
router.get('/', protect, requirePermission('roles:view'), getAllRoles);
router.get('/permissions', protect, requirePermission('roles:view'), getAvailablePermissions);
router.get('/:id', protect, requirePermission('roles:view'), getRoleById);
router.get('/:id/stats', protect, requirePermission('roles:view'), getRoleStats);

// Rotas de criação e edição
router.post('/', protect, requirePermission('roles:create'), createRole);
router.put('/:id', protect, requirePermission('roles:edit'), updateRole);
router.delete('/:id', protect, requirePermission('roles:delete'), deleteRole);

// Rota para inicializar roles padrão
router.post('/initialize', protect, requirePermission('roles:create'), initializeDefaultRoles);

module.exports = router; 