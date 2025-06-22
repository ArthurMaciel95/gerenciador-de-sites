const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const {
  getSites,
  getAllSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  refreshMetaTags,
  addUserToSite,
  removeUserFromSite
} = require('../controllers/siteController');

// Rotas protegidas com permissões
router.get('/', protect, requirePermission('sites:view'), getSites);
router.get('/:id', protect, requirePermission('sites:view'), getSiteById);
router.post('/', protect, requirePermission('sites:create'), createSite);
router.put('/:id', protect, requirePermission('sites:edit'), updateSite);
router.delete('/:id', protect, requirePermission('sites:delete'), deleteSite);

// Rota para atualizar meta tags
router.post('/:id/refresh-meta', protect, requirePermission('sites:edit'), refreshMetaTags);

// Rotas para gerenciar relacionamentos com usuários
router.post('/add-user', protect, requirePermission('sites:edit'), addUserToSite);
router.post('/remove-user', protect, requirePermission('sites:edit'), removeUserFromSite);

module.exports = router; 