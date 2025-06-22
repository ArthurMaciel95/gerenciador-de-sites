const Role = require('../models/Role');
const User = require('../models/User');
const { getAllPermissions } = require('../utils/permissions');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(roles);
  } catch (error) {
    console.error('Erro ao buscar roles:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private/Admin
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!role) {
      return res.status(404).json({ message: 'Role não encontrado' });
    }

    res.json(role);
  } catch (error) {
    console.error('Erro ao buscar role:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Private/Admin
const createRole = async (req, res) => {
  try {
    const { name, displayName, description, permissions, color, icon } = req.body;
    const createdBy = req.user._id;

    // Verificar se o nome já existe
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: 'Nome do role já existe' });
    }

    const role = new Role({
      name,
      displayName,
      description,
      permissions: permissions || [],
      color,
      icon,
      createdBy,
      isSystem: false
    });

    await role.save();

    const populatedRole = await Role.findById(role._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Role criado com sucesso',
      role: populatedRole
    });
  } catch (error) {
    console.error('Erro ao criar role:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
const updateRole = async (req, res) => {
  try {
    const { displayName, description, permissions, color, icon } = req.body;
    const updatedBy = req.user._id;

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role não encontrado' });
    }

    // Para roles do sistema, permitir edição mas com restrições
    if (role.isSystem) {
      // Não permitir alterar o nome do role do sistema
      if (req.body.name && req.body.name !== role.name) {
        return res.status(403).json({ 
          message: 'Não é possível alterar o nome de roles do sistema' 
        });
      }

      // Verificar se o usuário tem permissão para editar roles do sistema
      if (!req.user.permissions || !req.user.permissions.includes('roles:edit')) {
        return res.status(403).json({ 
          message: 'Você não tem permissão para editar roles do sistema' 
        });
      }

      console.log(`⚠️ Editando role do sistema: ${role.name} por usuário: ${req.user.email}`);
    }

    // Atualizar campos
    if (displayName !== undefined) role.displayName = displayName;
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    if (color !== undefined) role.color = color;
    if (icon !== undefined) role.icon = icon;
    
    role.updatedBy = updatedBy;

    await role.save();

    const updatedRole = await Role.findById(role._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json({
      message: 'Role atualizado com sucesso',
      role: updatedRole
    });
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
const deleteRole = async (req, res) => {
  try {
    const { migrateToRole } = req.body; // Novo parâmetro para migração
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ message: 'Role não encontrado' });
    }

    // Não permitir exclusão de roles do sistema
    if (role.isSystem) {
      return res.status(403).json({ message: 'Não é possível excluir roles do sistema' });
    }

    // Verificar se há usuários usando este role
    const usersWithRole = await User.countDocuments({ role: role.name });
    
    if (usersWithRole > 0) {
      // Se foi fornecido um role para migração
      if (migrateToRole) {
        const targetRole = await Role.findOne({ name: migrateToRole, isActive: true });
        if (!targetRole) {
          return res.status(400).json({ 
            message: `Role de destino '${migrateToRole}' não encontrado ou inativo`
          });
        }

        // Migrar usuários para o novo role
        await User.updateMany(
          { role: role.name },
          { role: migrateToRole }
        );

        console.log(`✅ ${usersWithRole} usuário(s) migrado(s) de '${role.name}' para '${migrateToRole}'`);
      } else {
        // Se não foi fornecido role para migração, retornar erro com sugestões
        const availableRoles = await Role.find({ 
          name: { $ne: role.name }, 
          isActive: true 
        }).select('name displayName');

        return res.status(400).json({ 
          message: `Não é possível excluir o role. Existem ${usersWithRole} usuário(s) usando este role.`,
          usersCount: usersWithRole,
          availableRoles: availableRoles,
          suggestion: 'Use o parâmetro migrateToRole para migrar usuários para outro role antes de excluir.'
        });
      }
    }

    // Marcar como inativo em vez de deletar
    role.isActive = false;
    await role.save();

    res.json({ 
      message: 'Role desativado com sucesso',
      usersMigrated: usersWithRole > 0 ? usersWithRole : 0,
      migratedTo: migrateToRole || null
    });
  } catch (error) {
    console.error('Erro ao deletar role:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get all available permissions
// @route   GET /api/roles/permissions
// @access  Private/Admin
const getAvailablePermissions = async (req, res) => {
  try {
    const permissions = getAllPermissions();
    
    // Organizar permissões por categoria
    const organizedPermissions = {
      sites: {
        title: 'Sites',
        permissions: {
          'sites:view': permissions['sites:view'],
          'sites:view_all': permissions['sites:view_all'],
          'sites:create': permissions['sites:create'],
          'sites:edit': permissions['sites:edit'],
          'sites:delete': permissions['sites:delete']
        }
      },
      users: {
        title: 'Usuários',
        permissions: {
          'users:view': permissions['users:view'],
          'users:create': permissions['users:create'],
          'users:edit': permissions['users:edit'],
          'users:delete': permissions['users:delete'],
          'users:approve': permissions['users:approve'],
          'users:reject': permissions['users:reject']
        }
      },
      system: {
        title: 'Sistema',
        permissions: {
          'system:settings': permissions['system:settings'],
          'system:permissions': permissions['system:permissions'],
          'system:logs': permissions['system:logs'],
          'system:backup': permissions['system:backup']
        }
      },
      profile: {
        title: 'Perfil',
        permissions: {
          'profile:view': permissions['profile:view'],
          'profile:edit': permissions['profile:edit']
        }
      },
      analytics: {
        title: 'Analytics',
        permissions: {
          'analytics:view': permissions['analytics:view'],
          'analytics:export': permissions['analytics:export']
        }
      },
      logs: {
        title: 'Logs',
        permissions: {
          'logs:view': permissions['logs:view'],
          'logs:export': permissions['logs:export']
        }
      },
      roles: {
        title: 'Roles',
        permissions: {
          'roles:view': permissions['roles:view'],
          'roles:create': permissions['roles:create'],
          'roles:edit': permissions['roles:edit'],
          'roles:delete': permissions['roles:delete']
        }
      }
    };

    res.json(organizedPermissions);
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get role statistics
// @route   GET /api/roles/:id/stats
// @access  Private/Admin
const getRoleStats = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role não encontrado' });
    }

    // Contar usuários com este role
    const userCount = await User.countDocuments({ role: role.name });

    // Contar usuários ativos com este role
    const activeUserCount = await User.countDocuments({ 
      role: role.name, 
      isActive: true,
      approvalStatus: 'approved'
    });

    // Contar usuários pendentes com este role
    const pendingUserCount = await User.countDocuments({ 
      role: role.name, 
      approvalStatus: 'pending'
    });

    res.json({
      role: {
        _id: role._id,
        name: role.name,
        displayName: role.displayName,
        permissions: role.permissions
      },
      stats: {
        totalUsers: userCount,
        activeUsers: activeUserCount,
        pendingUsers: pendingUserCount,
        permissionCount: role.permissions.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do role:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Initialize default roles
// @route   POST /api/roles/initialize
// @access  Private/Admin
const initializeDefaultRoles = async (req, res) => {
  try {
    const createdBy = req.user._id;

    // Verificar se já existem roles do sistema
    const existingSystemRoles = await Role.find({ isSystem: true });
    if (existingSystemRoles.length > 0) {
      return res.status(400).json({ 
        message: 'Roles do sistema já foram inicializados',
        existingRoles: existingSystemRoles.map(r => r.name)
      });
    }

    const defaultRoles = [
      {
        name: 'admin',
        displayName: 'Administrador',
        description: 'Acesso completo ao sistema',
        permissions: [
          'sites:view', 'sites:create', 'sites:edit', 'sites:delete',
          'users:view', 'users:create', 'users:edit', 'users:delete', 'users:approve', 'users:reject',
          'system:settings', 'system:permissions', 'system:logs', 'system:backup',
          'profile:view', 'profile:edit',
          'analytics:view', 'analytics:export',
          'logs:view', 'logs:export',
          'roles:view', 'roles:create', 'roles:edit', 'roles:delete'
        ],
        color: 'bg-red-100 text-red-800',
        icon: 'Crown',
        isSystem: true,
        isDefault: true
      },
      {
        name: 'editor',
        displayName: 'Editor',
        description: 'Pode editar sites e gerenciar conteúdo',
        permissions: [
          'sites:view', 'sites:create', 'sites:edit',
          'users:view',
          'system:permissions',
          'profile:view', 'profile:edit',
          'analytics:view',
          'logs:view'
        ],
        color: 'bg-yellow-100 text-yellow-800',
        icon: 'Edit',
        isSystem: true,
        isDefault: true
      },
      {
        name: 'viewer',
        displayName: 'Visualizador',
        description: 'Apenas visualização de sites associados',
        permissions: [
          'sites:view',
          'system:permissions',
          'profile:view', 'profile:edit'
        ],
        color: 'bg-green-100 text-green-800',
        icon: 'Eye',
        isSystem: true,
        isDefault: true
      },
      {
        name: 'pending',
        displayName: 'Pendente',
        description: 'Aguardando aprovação do administrador',
        permissions: [],
        color: 'bg-gray-100 text-gray-800',
        icon: 'Clock',
        isSystem: true,
        isDefault: false
      }
    ];

    const createdRoles = [];
    for (const roleData of defaultRoles) {
      const role = new Role({
        ...roleData,
        createdBy
      });
      await role.save();
      createdRoles.push(role);
    }

    res.status(201).json({
      message: 'Roles do sistema inicializados com sucesso',
      roles: createdRoles
    });
  } catch (error) {
    console.error('Erro ao inicializar roles:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAvailablePermissions,
  getRoleStats,
  initializeDefaultRoles
}; 