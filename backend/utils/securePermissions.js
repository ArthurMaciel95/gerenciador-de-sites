const UserPermission = require('../models/UserPermission');
const PermissionAudit = require('../models/PermissionAudit');
const { getPermissionsByRole } = require('./permissions');

// Cache em memória para permissões (TTL de 5 minutos)
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para obter permissões de um usuário (com cache)
const getUserPermissions = async (userId) => {
  const cacheKey = `user_${userId}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.permissions;
  }

  // Buscar permissões granulares do banco
  const granularPermissions = await UserPermission.getActivePermissions(userId);
  const granularPerms = granularPermissions.map(p => p.permission);

  // Buscar role do usuário e suas permissões base
  const user = await require('../models/User').findById(userId);
  const rolePermissions = user ? getPermissionsByRole(user.role) : [];

  // Combinar permissões (granulares têm prioridade)
  const allPermissions = [...new Set([...rolePermissions, ...granularPerms])];

  // Cache das permissões
  permissionCache.set(cacheKey, {
    permissions: allPermissions,
    timestamp: Date.now()
  });

  return allPermissions;
};

// Função para verificar permissão com auditoria
const checkPermission = async (userId, permission, resource, method, req) => {
  const startTime = Date.now();
  
  try {
    // Verificar permissões granulares primeiro
    const hasGranularPermission = await UserPermission.hasPermission(userId, permission);
    
    if (hasGranularPermission) {
      await logPermissionCheck(userId, permission, resource, method, true, req, Date.now() - startTime);
      return true;
    }

    // Verificar permissões baseadas em role
    const user = await require('../models/User').findById(userId);
    if (!user) {
      await logPermissionCheck(userId, permission, resource, method, false, req, Date.now() - startTime, 'Usuário não encontrado');
      return false;
    }

    const rolePermissions = getPermissionsByRole(user.role);
    const hasRolePermission = rolePermissions.includes(permission);

    await logPermissionCheck(userId, permission, resource, method, hasRolePermission, req, Date.now() - startTime);
    return hasRolePermission;

  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    await logPermissionCheck(userId, permission, resource, method, false, req, Date.now() - startTime, error.message);
    return false;
  }
};

// Função para log de verificação de permissões
const logPermissionCheck = async (userId, permission, resource, method, success, req, responseTime, reason = null) => {

  try {
    const auditEntry = new PermissionAudit({
      user: userId,
      action: success ? 'CHECK' : 'ACCESS_DENIED',
      permission,
      resource,
      method,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      success,
      reason,
      metadata: {
        responseTime,
        timestamp: new Date()
      }
    });

    await auditEntry.save();
  } catch (error) {
    console.error('Erro ao salvar log de auditoria:', error);
  }
};

// Função para conceder permissão
const grantPermission = async (userId, permission, grantedBy, reason = null, expiresAt = null) => {
  try {
    // Verificar se já existe
    const existing = await UserPermission.findOne({
      user: userId,
      permission: permission,
      isActive: true
    });

    if (existing) {
      // Atualizar permissão existente
      existing.grantedBy = grantedBy;
      existing.reason = reason;
      existing.expiresAt = expiresAt;
      existing.isActive = true;
      await existing.save();
    } else {
      // Criar nova permissão
      const newPermission = new UserPermission({
        user: userId,
        permission,
        grantedBy,
        reason,
        expiresAt
      });
      await newPermission.save();
    }

    // Limpar cache
    permissionCache.delete(`user_${userId}`);

    // Log da ação
    await logPermissionCheck(userId, permission, 'GRANT_PERMISSION', 'POST', true, null, 0, reason);

    return true;
  } catch (error) {
    console.error('Erro ao conceder permissão:', error);
    return false;
  }
};

// Função para revogar permissão
const revokePermission = async (userId, permission, revokedBy, reason = null) => {
  try {
    const userPerm = await UserPermission.findOne({
      user: userId,
      permission: permission,
      isActive: true
    });

    if (userPerm) {
      userPerm.isActive = false;
      userPerm.reason = reason;
      await userPerm.save();

      // Limpar cache
      permissionCache.delete(`user_${userId}`);

      // Log da ação
      await logPermissionCheck(userId, permission, 'REVOKE_PERMISSION', 'DELETE', true, null, 0, reason);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao revogar permissão:', error);
    return false;
  }
};

// Função para limpar cache
const clearPermissionCache = (userId = null) => {
  if (userId) {
    permissionCache.delete(`user_${userId}`);
  } else {
    permissionCache.clear();
  }
};

// Middleware seguro para verificar permissões
const requireSecurePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const hasPermission = await checkPermission(
      req.user._id,
      permission,
      req.path,
      req.method,
      req
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: 'Acesso negado - permissão insuficiente',
        requiredPermission: permission,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = {
  getUserPermissions,
  checkPermission,
  grantPermission,
  revokePermission,
  clearPermissionCache,
  requireSecurePermission,
  logPermissionCheck
}; 