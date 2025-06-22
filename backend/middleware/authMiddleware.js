const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const Role = require('../models/Role.js');

const protect = async (req, res, next) => {
  let token;

  console.log('🔐 Auth middleware iniciado para:', req.method, req.path);
  console.log('🍪 Cookies recebidos:', req.cookies);
  
  token = req.cookies.authToken;
  
  console.log('🔑 Token extraído:', token ? 'Presente' : 'Ausente');

  if (token) {
    try {
      console.log('🔍 Verificando token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decodificado:', decoded);

      // Atacha o usuário ao objeto req, sem a senha
      console.log('👤 Buscando usuário com ID:', decoded.userId);
      req.user = await User.findById(decoded.userId).select('-password');
      console.log('👤 Usuário encontrado:', req.user ? `ID: ${req.user._id}, Nome: ${req.user.name}` : 'null');
      
      if (!req.user) {
        console.log('❌ Usuário não encontrado no banco');
        res.status(401);
        return res.json({ message: 'Usuário não encontrado' });
      }

      if (!req.user.isActive) {
        console.log('❌ Usuário inativo');
        res.status(401);
        return res.json({ message: 'Usuário desativado' });
      }

      // Buscar permissões do role do usuário
      console.log('🔍 Buscando permissões do role:', req.user.role);
      const userRole = await Role.findOne({ name: req.user.role, isActive: true });
      
      if (userRole) {
        req.user.permissions = userRole.permissions;
        console.log('✅ Permissões adicionadas ao req.user:', req.user.permissions);
      } else {
        console.log('⚠️ Role não encontrado, usando permissões mínimas');
        req.user.permissions = ['profile:view'];
      }
      
      console.log('✅ Autenticação bem-sucedida para:', req.user.name);
      next();
    } catch (error) {
      console.error('❌ Erro na verificação do token:', error.message);
      res.status(401);
      return res.json({ message: 'Token inválido' });
    }
  }

  if (!token) {
    console.log('❌ Nenhum token fornecido');
    res.status(401);
    return res.json({ message: 'Token não fornecido' });
  }
};

const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403); // 403 Forbidden
    return res.json({ message: 'Acesso negado - requer permissão de admin' });
  }
};

module.exports = { protect, superAdmin }; 