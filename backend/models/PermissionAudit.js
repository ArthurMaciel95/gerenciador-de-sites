const mongoose = require('mongoose');

const permissionAuditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['GRANT', 'REVOKE', 'EXPIRE', 'CHECK', 'ACCESS_DENIED']
  },
  permission: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true // Ex: '/api/users', '/api/sites', etc.
  },
  method: {
    type: String,
    required: true // GET, POST, PUT, DELETE
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  success: {
    type: Boolean,
    required: true
  },
  reason: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para auditoria e análise
permissionAuditSchema.index({ user: 1, timestamp: -1 });
permissionAuditSchema.index({ action: 1, timestamp: -1 });
permissionAuditSchema.index({ permission: 1, timestamp: -1 });
permissionAuditSchema.index({ success: 1, timestamp: -1 });

// Método estático para buscar auditoria de um usuário
permissionAuditSchema.statics.getUserAudit = function(userId, limit = 100) {
  return this.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name email');
};

// Método estático para buscar tentativas de acesso negado
permissionAuditSchema.statics.getAccessDenied = function(limit = 100) {
  return this.find({ 
    action: 'ACCESS_DENIED',
    success: false 
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name email');
};

// Método estático para limpar logs antigos (manutenção)
permissionAuditSchema.statics.cleanOldLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({ timestamp: { $lt: cutoffDate } });
};

module.exports = mongoose.model('PermissionAudit', permissionAuditSchema); 