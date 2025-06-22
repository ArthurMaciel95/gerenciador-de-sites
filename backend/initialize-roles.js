const mongoose = require('mongoose');
const Role = require('./models/Role');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_privado', {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const initializeRoles = async () => {
  try {
    console.log('Inicializando roles padrão...');

    // Verificar se já existem roles do sistema
    const existingSystemRoles = await Role.find({ isSystem: true });
    if (existingSystemRoles.length > 0) {
      console.log('Roles do sistema já existem:');
      existingSystemRoles.forEach(role => {
        console.log(`- ${role.name}: ${role.displayName}`);
      });
      return;
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
      const role = new Role(roleData);
      await role.save();
      createdRoles.push(role);
      console.log(`✅ Role criado: ${role.displayName} (${role.name})`);
    }

    console.log('\n🎉 Roles do sistema inicializados com sucesso!');
    console.log(`Total de roles criados: ${createdRoles.length}`);
    
    createdRoles.forEach(role => {
      console.log(`- ${role.displayName}: ${role.permissions.length} permissões`);
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar roles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Conexão com MongoDB fechada');
  }
};

// Executar o script
connectDB().then(() => {
  initializeRoles();
});

module.exports = { initializeRoles }; 