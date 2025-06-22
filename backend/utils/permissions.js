// Sistema de permissões do backend
const permissions = {
  // Permissões de Sites
  'sites:view': 'Visualizar sites associados',
  'sites:view_all': 'Visualizar todos os sites',
  'sites:create': 'Criar sites',
  'sites:edit': 'Editar sites',
  'sites:delete': 'Deletar sites',

  // Permissões de Usuários
  'users:view': 'Visualizar usuários',
  'users:create': 'Criar usuários',
  'users:edit': 'Editar usuários',
  'users:delete': 'Deletar usuários',
  'users:approve': 'Aprovar usuários',
  'users:reject': 'Rejeitar usuários',
  'users:manage': 'Gerenciar usuários',

  // Permissões de Sistema
  'system:settings': 'Configurações do sistema',
  'system:permissions': 'Visualizar permissões',
  'system:logs': 'Visualizar logs do sistema',
  'system:backup': 'Fazer backup do sistema',

  // Permissões de Perfil
  'profile:view': 'Visualizar perfil',
  'profile:edit': 'Editar perfil',

  // Permissões de Analytics
  'analytics:view': 'Visualizar analytics',
  'analytics:export': 'Exportar dados de analytics',

  // Permissões de Logs
  'logs:view': 'Visualizar logs',
  'logs:export': 'Exportar logs',

  // Permissões de Roles
  'roles:view': 'Visualizar roles',
  'roles:create': 'Criar roles',
  'roles:edit': 'Editar roles',
  'roles:delete': 'Deletar roles',
  'roles:manage': 'Gerenciar roles',

  // Permissões de Settings (legacy - manter para compatibilidade)
  'settings:view': 'Visualizar configurações',
  'settings:edit': 'Editar configurações'
};

// Mapeamento de permissões por role
const permissionsByRole = {
  admin: [
    'sites:view', 'sites:view_all', 'sites:create', 'sites:edit', 'sites:delete',
    'users:view', 'users:create', 'users:edit', 'users:delete', 'users:approve', 'users:reject', 'users:manage',
    'system:settings', 'system:permissions', 'system:logs', 'system:backup',
    'profile:view', 'profile:edit',
    'analytics:view', 'analytics:export',
    'logs:view', 'logs:export',
    'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'roles:manage',
    'settings:view', 'settings:edit'
  ],
  editor: [
    'sites:view', 'sites:view_all', 'sites:create', 'sites:edit',
    'users:view',
    'system:permissions',
    'profile:view', 'profile:edit',
    'analytics:view',
    'logs:view'
  ],
  viewer: [
    'sites:view',
    'system:permissions',
    'profile:view', 'profile:edit'
  ],
  pending: []
};

// Função para obter permissões de um role
const getPermissionsByRole = (role) => {
  return permissionsByRole[role] || [];
};

// Função para verificar se um role tem uma permissão específica
const hasPermission = (role, permission) => {
  const rolePermissions = getPermissionsByRole(role);
  return rolePermissions.includes(permission);
};

// Função para obter todas as permissões disponíveis
const getAllPermissions = () => {
  return permissions;
};

// Função para obter descrição de uma permissão
const getPermissionDescription = (permission) => {
  return permissions[permission] || 'Permissão não definida';
};

module.exports = {
  permissions,
  permissionsByRole,
  getPermissionsByRole,
  hasPermission,
  getAllPermissions,
  getPermissionDescription
}; 