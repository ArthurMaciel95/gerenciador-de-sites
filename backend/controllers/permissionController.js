const UserPermission = require('../models/UserPermission');
const PermissionAudit = require('../models/PermissionAudit');
const User = require('../models/User');
const { grantPermission, revokePermission, getUserPermissions } = require('../utils/securePermissions');

// @desc    Get user permissions
// @route   GET /api/permissions/user/:userId
// @access  Private/Admin
const getUserPermissionsController = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário existe
    const user = await User.findById(userId).select('name email role');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Buscar permissões granulares
    const granularPermissions = await UserPermission.getActivePermissions(userId);
    
    // Buscar permissões baseadas em role
    const { getPermissionsByRole } = require('../utils/permissions');
    const rolePermissions = getPermissionsByRole(user.role);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      rolePermissions,
      granularPermissions,
      allPermissions: [...new Set([...rolePermissions, ...granularPermissions.map(p => p.permission)])]
    });
  } catch (error) {
    console.error('Erro ao buscar permissões do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Grant permission to user
// @route   POST /api/permissions/grant
// @access  Private/Admin
const grantPermissionController = async (req, res) => {
  try {
    const { userId, permission, reason, expiresAt } = req.body;
    const grantedBy = req.user._id;

    // Validar dados
    if (!userId || !permission) {
      return res.status(400).json({ message: 'userId e permission são obrigatórios' });
    }

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Conceder permissão
    const success = await grantPermission(userId, permission, grantedBy, reason, expiresAt);
    
    if (success) {
      res.json({ 
        message: 'Permissão concedida com sucesso',
        permission,
        userId
      });
    } else {
      res.status(500).json({ message: 'Erro ao conceder permissão' });
    }
  } catch (error) {
    console.error('Erro ao conceder permissão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Revoke permission from user
// @route   POST /api/permissions/revoke
// @access  Private/Admin
const revokePermissionController = async (req, res) => {
  try {
    const { userId, permission, reason } = req.body;
    const revokedBy = req.user._id;

    // Validar dados
    if (!userId || !permission) {
      return res.status(400).json({ message: 'userId e permission são obrigatórios' });
    }

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Revogar permissão
    const success = await revokePermission(userId, permission, revokedBy, reason);
    
    if (success) {
      res.json({ 
        message: 'Permissão revogada com sucesso',
        permission,
        userId
      });
    } else {
      res.status(404).json({ message: 'Permissão não encontrada ou já revogada' });
    }
  } catch (error) {
    console.error('Erro ao revogar permissão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get permission audit logs
// @route   GET /api/permissions/audit
// @access  Private/Admin
const getPermissionAuditController = async (req, res) => {
  try {
    const { userId, action, permission, limit = 100, page = 1 } = req.query;
    
    const query = {};
    if (userId) query.user = userId;
    if (action) query.action = action;
    if (permission) query.permission = permission;

    const skip = (page - 1) * limit;
    
    const auditLogs = await PermissionAudit.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('grantedBy', 'name email');

    const total = await PermissionAudit.countDocuments(query);

    res.json({
      auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get access denied attempts
// @route   GET /api/permissions/access-denied
// @access  Private/Admin
const getAccessDeniedController = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const accessDenied = await PermissionAudit.getAccessDenied(parseInt(limit));

    res.json({
      accessDenied,
      count: accessDenied.length
    });
  } catch (error) {
    console.error('Erro ao buscar tentativas de acesso negado:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Clean old audit logs
// @route   POST /api/permissions/clean-logs
// @access  Private/Admin
const cleanAuditLogsController = async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    
    const result = await PermissionAudit.cleanOldLogs(daysToKeep);

    res.json({
      message: 'Logs antigos removidos com sucesso',
      deletedCount: result.deletedCount,
      daysKept: daysToKeep
    });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  getUserPermissionsController,
  grantPermissionController,
  revokePermissionController,
  getPermissionAuditController,
  getAccessDeniedController,
  cleanAuditLogsController
}; 