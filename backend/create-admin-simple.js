const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_privado');
    console.log('✅ Conectado ao MongoDB');

    // Verificar se já existe um admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️ Admin já existe:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.name}`);
      return;
    }

    // Criar senha hash
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Criar admin
    const admin = new User({
      name: 'Administrador',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      approvalStatus: 'approved'
    });

    await admin.save();
    console.log('✅ Admin criado com sucesso!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Senha: admin123');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin(); 