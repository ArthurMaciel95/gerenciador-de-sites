const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  permissions: [{
    type: String,
    required: true,
    enum: [
      // Permissões de Sites
      'sites:view', 'sites:view_all', 'sites:create', 'sites:edit', 'sites:delete',
      // Permissões de Usuários
      'users:view', 'users:create', 'users:edit', 'users:delete', 'users:approve', 'users:reject', 'users:manage',
      // Permissões de Sistema
      'system:settings', 'system:permissions', 'system:logs', 'system:backup',
      // Permissões de Perfil
      'profile:view', 'profile:edit',
      // Permissões de Analytics
      'analytics:view', 'analytics:export',
      // Permissões de Logs
      'logs:view', 'logs:export',
      // Permissões de Roles
      'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'roles:manage',
      // Permissões de Settings (legacy - manter para compatibilidade)
      'settings:view', 'settings:edit'
    ]
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false // true para roles do sistema (admin, editor, viewer)
  },
  color: {
    type: String,
    default: 'bg-gray-100 text-gray-800'
  },
  icon: {
    type: String,
    default: 'Shield'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices para melhor performance
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isSystem: 1 });

// Método para verificar se o role tem uma permissão específica
roleSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Método para adicionar permissão
roleSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this;
};

// Método para remover permissão
roleSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this;
};

// Método estático para buscar role por nome
roleSchema.statics.findByName = function(name) {
  return this.findOne({ name: name, isActive: true });
};

// Método estático para buscar roles padrão
roleSchema.statics.findDefaultRoles = function() {
  return this.find({ isDefault: true, isActive: true });
};

// Método estático para buscar roles do sistema
roleSchema.statics.findSystemRoles = function() {
  return this.find({ isSystem: true, isActive: true });
};

// Método estático para buscar roles customizados
roleSchema.statics.findCustomRoles = function() {
  return this.find({ isSystem: false, isActive: true });
};

// Middleware para não permitir edição de roles do sistema
roleSchema.pre('save', function(next) {
  if (this.isModified('isSystem') && this.isSystem) {
    return next(new Error('Não é possível modificar roles do sistema'));
  }
  next();
});

module.exports = mongoose.model('Role', roleSchema); 