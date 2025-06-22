const mongoose = require('mongoose');

const userPermissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permission: {
    type: String,
    required: true,
    enum: [
      // Permissões de Sites
      'sites:view', 'sites:view_all', 'sites:create', 'sites:edit', 'sites:delete',
      // Permissões de Usuários
      'users:view', 'users:create', 'users:edit', 'users:delete', 'users:approve', 'users:reject',
      // Permissões de Sistema
      'system:settings', 'system:permissions', 'system:logs', 'system:backup',
      // Permissões de Perfil
      'profile:view', 'profile:edit',
      // Permissões de Analytics
      'analytics:view', 'analytics:export',
      // Permissões de Logs
      'logs:view', 'logs:export'
    ]
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grantedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null // null = nunca expira
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para performance
userPermissionSchema.index({ user: 1, permission: 1 });
userPermissionSchema.index({ user: 1, isActive: 1 });
userPermissionSchema.index({ expiresAt: 1 });

// Método para verificar se a permissão está ativa e não expirou
userPermissionSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

// Método estático para buscar permissões ativas de um usuário
userPermissionSchema.statics.getActivePermissions = function(userId) {
  return this.find({
    user: userId,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).populate('grantedBy', 'name email');
};

// Método estático para verificar se usuário tem uma permissão específica
userPermissionSchema.statics.hasPermission = async function(userId, permission) {
  const userPerm = await this.findOne({
    user: userId,
    permission: permission,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  
  return !!userPerm;
};

module.exports = mongoose.model('UserPermission', userPermissionSchema); 