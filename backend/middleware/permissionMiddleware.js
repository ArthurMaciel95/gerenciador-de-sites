const Role = require('../models/Role');
const { checkPermission, getUserPermissions } = require('../utils/securePermissions');

// Middleware para verificar se o usuário tem uma permissão específica
const requirePermission = (permission) => {
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

// Middleware para verificar se o usuário tem qualquer uma das permissões
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    for (const permission of permissions) {
      const hasPermission = await checkPermission(
        req.user._id,
        permission,
        req.path,
        req.method,
        req
      );
      
      if (hasPermission) {
        return next();
      }
    }

    return res.status(403).json({ 
      message: 'Acesso negado - permissão insuficiente',
      requiredPermissions: permissions,
      userRole: req.user.role
    });
  };
};

// Middleware para verificar se o usuário tem todas as permissões
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    for (const permission of permissions) {
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
          requiredPermissions: permissions,
          userRole: req.user.role
        });
      }
    }

    next();
  };
};

// Middleware para verificar se é admin
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const hasPermission = await checkPermission(
    req.user._id,
    'system:settings',
    req.path,
    req.method,
    req
  );

  if (!hasPermission) {
    return res.status(403).json({ message: 'Acesso negado - requer permissão de admin' });
  }
  
  next();
};

// Middleware para verificar se é admin ou editor
const requireAdminOrEditor = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const hasPermission = await checkPermission(
    req.user._id,
    'sites:edit',
    req.path,
    req.method,
    req
  );

  if (!hasPermission) {
    return res.status(403).json({ message: 'Acesso negado - requer permissão de admin ou editor' });
  }
  
  next();
};

// Função para obter permissões do usuário (agora busca do banco)
const getUserPermissionsFromDB = async (userId) => {
  try {
    return await getUserPermissions(userId);
  } catch (error) {
    console.error('Erro ao obter permissões do usuário:', error);
    return [];
  }
};

// Função para obter role completo do usuário
const getUserRole = async (userRole) => {
  try {
    return await Role.findOne({ name: userRole, isActive: true });
  } catch (error) {
    console.error('Erro ao obter role do usuário:', error);
    return null;
  }
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireAdmin,
  requireAdminOrEditor,
  getUserPermissions: getUserPermissionsFromDB,
  getUserRole
}; 