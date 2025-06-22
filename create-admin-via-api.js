const axios = require('axios');

async function createAdminViaAPI() {
  try {
    console.log('🔧 Criando usuário admin via API...');
    
    const adminData = {
      name: 'Administrador',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      sites: [],
      isActive: true
    };
    
    const response = await axios.post('http://localhost:3001/api/users/create-admin', adminData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🎉 Usuário admin criado com sucesso!');
    console.log('📋 Credenciais de acesso:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Senha: ${adminData.password}`);
    console.log(`   Role: ${adminData.role}`);
    console.log('');
    console.log('🔐 IMPORTANTE: Altere a senha após o primeiro login!');
    console.log('⚠️ Lembre-se de remover a rota /create-admin após o primeiro uso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('💡 Dica: Verifique se o email não já existe.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Dica: Certifique-se de que o backend está rodando na porta 3001.');
      console.log('   Execute: cd backend && npm run dev');
    }
  }
}

createAdminViaAPI(); 