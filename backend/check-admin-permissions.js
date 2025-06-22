const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
require('dotenv').config();

async function checkAdminPermissions() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_privado');
    console.log('✅ Conectado ao MongoDB');

    // Verificar o role admin no banco
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      console.log('🔍 Role Admin encontrado:');
      console.log('   Nome:', adminRole.name);
      console.log('   Display Name:', adminRole.displayName);
      console.log('   Permissões:', adminRole.permissions);
      console.log('   Total de permissões:', adminRole.permissions.length);
      
      // Verificar se tem permissão de perfil
      if (adminRole.permissions.includes('profile:view')) {
        console.log('✅ Tem permissão profile:view');
      } else {
        console.log('❌ NÃO tem permissão profile:view');
      }
    } else {
      console.log('❌ Role admin não encontrado');
    }

    // Verificar usuário admin
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('\n👤 Usuário Admin:');
      console.log('   Nome:', adminUser.name);
      console.log('   Email:', adminUser.email);
      console.log('   Role:', adminUser.role);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdminPermissions(); 