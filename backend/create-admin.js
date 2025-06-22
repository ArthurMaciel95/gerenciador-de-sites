const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
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

const createAdminUser = async () => {
  try {
    console.log('🔧 Criando usuário admin...');

    // Primeiro, verificar se os roles existem
    let adminRole = await Role.findOne({ name: 'admin' });
    
    if (!adminRole) {
      console.log('⚠️ Role admin não encontrado. Criando roles padrão...');
      
      // Criar roles padrão
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

      for (const roleData of defaultRoles) {
        const role = new Role(roleData);
        await role.save();
        console.log(`✅ Role criado: ${role.displayName}`);
      }

      adminRole = await Role.findOne({ name: 'admin' });
    }

    // Verificar se já existe um usuário admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️ Usuário admin já existe:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      name: 'Administrador',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      approvalStatus: 'approved'
    });

    await adminUser.save();
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Senha: admin123');
    console.log('👤 Role: admin');
    console.log('\n🎯 Agora você pode:');
    console.log('1. Fazer login com admin@example.com / admin123');
    console.log('2. Acessar a página de Roles no menu lateral');
    console.log('3. Configurar permissões dos roles');

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexão com MongoDB fechada');
  }
};

// Executar o script
connectDB().then(() => {
  createAdminUser();
}); 