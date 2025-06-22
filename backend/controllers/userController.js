const User = require('../models/User');
const Site = require('../models/Site');
const generateToken = require('../utils/generateToken');
const { getPermissionsByRole, getAllPermissions, permissionsByRole } = require('../utils/permissions');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar se o email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criar usuário com status pendente
    const user = new User({
      name,
      email,
      password,
      role: 'pending',
      approvalStatus: 'pending',
      isActive: false,
      sites: []
    });

    await user.save();

    // Retornar usuário sem senha
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Usuário registrado com sucesso! Aguarde a aprovação do administrador.',
      user: userResponse
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await User.findOne({ email }).populate('sites', 'name url');
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Verificar senha
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Verificar se usuário está aprovado
    if (user.approvalStatus !== 'approved') {
      return res.status(401).json({ 
        message: user.approvalStatus === 'pending' 
          ? 'Sua conta está aguardando aprovação do administrador' 
          : 'Sua conta foi rejeitada pelo administrador'
      });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({ message: 'Usuário desativado' });
    }

    // Gerar token JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Configurar cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    // Retornar dados do usuário (sem senha)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login realizado com sucesso',
      user: userResponse
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/SuperAdmin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('sites', 'name url')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/SuperAdmin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('sites', 'name url description')
      .populate('approvedBy', 'name email');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin
const updateUser = async (req, res) => {
  try {
    const { name, email, role, sites, isActive } = req.body;
    const userId = req.params.id;

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o email já existe (se foi alterado)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }
    }

    // Apenas admin pode alterar role
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem alterar roles' });
    }

    // Obter sites atuais do usuário
    const currentSites = user.sites.map(site => site.toString());

    // Atualizar usuário
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined && req.user.role === 'admin') updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sites !== undefined) updateData.sites = sites;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password').populate('sites', 'name url');

    // Gerenciar relacionamentos com sites
    if (sites !== undefined) {
      const newSites = sites.map(site => site.toString());
      
      // Remover usuário de sites que não estão mais na lista
      const sitesToRemove = currentSites.filter(siteId => !newSites.includes(siteId));
      for (const siteId of sitesToRemove) {
        await Site.findByIdAndUpdate(siteId, { $pull: { users: userId } });
      }

      // Adicionar usuário aos novos sites
      const sitesToAdd = newSites.filter(siteId => !currentSites.includes(siteId));
      for (const siteId of sitesToAdd) {
        await Site.findByIdAndUpdate(siteId, { $addToSet: { users: userId } });
      }
    }

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = async (req, res) => {
  res.clearCookie('authToken');
  res.json({ message: 'Logout realizado com sucesso' });
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Remover usuário de todos os sites
    await Site.updateMany(
      { users: userId },
      { $pull: { users: userId } }
    );

    // Deletar usuário
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Add a user to a site
// @route   POST /api/users/add-to-site
// @access  Private/SuperAdmin
const addUserToSite = async (req, res) => {
  try {
    const { userId, siteId } = req.body;

    // Verificar se usuário e site existem
    const user = await User.findById(userId);
    const site = await Site.findById(siteId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    if (!site) {
      return res.status(404).json({ message: 'Site não encontrado' });
    }

    // Adicionar usuário ao site
    await Site.findByIdAndUpdate(siteId, { $addToSet: { users: userId } });
    
    // Adicionar site ao usuário
    await User.findByIdAndUpdate(userId, { $addToSet: { sites: siteId } });

    res.json({ message: 'Usuário adicionado ao site com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar usuário ao site:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Remove a user from a site
// @route   POST /api/users/remove-from-site
// @access  Private/SuperAdmin
const removeUserFromSite = async (req, res) => {
  try {
    const { userId, siteId } = req.body;

    // Remover usuário do site
    await Site.findByIdAndUpdate(siteId, { $pull: { users: userId } });
    
    // Remover site do usuário
    await User.findByIdAndUpdate(userId, { $pull: { sites: siteId } });

    res.json({ message: 'Usuário removido do site com sucesso' });
  } catch (error) {
    console.error('Erro ao remover usuário do site:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Criar usuário pelo admin (sem aprovação necessária)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, sites } = req.body;

    // Verificar se o email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criar usuário
    const user = new User({
      name,
      email,
      password,
      role: role || 'viewer',
      approvalStatus: 'approved',
      isActive: true,
      sites: sites || []
    });

    await user.save();

    // Se sites foram especificados, adicionar o usuário a esses sites
    if (sites && sites.length > 0) {
      for (const siteId of sites) {
        await Site.findByIdAndUpdate(
          siteId,
          { $addToSet: { users: user._id } },
          { new: true }
        );
      }
    }

    // Retornar usuário sem senha
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: userResponse
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Obter usuários pendentes (admin)
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ approvalStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários pendentes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Aprovar usuário (admin)
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o usuário está pendente
    if (user.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Usuário não está pendente de aprovação' });
    }

    // Aprovar usuário
    const updateData = {
      approvalStatus: 'approved',
      approvedBy: req.user._id,
      approvedAt: new Date(),
      isActive: true
    };

    // Apenas admin pode definir role
    if (role && req.user.role === 'admin') {
      updateData.role = role;
    } else {
      updateData.role = 'viewer'; // Role padrão para usuários aprovados
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password').populate('sites', 'name url');

    res.json({
      message: 'Usuário aprovado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Rejeitar usuário (admin)
const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o usuário está pendente
    if (user.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Usuário não está pendente de aprovação' });
    }

    // Rejeitar usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        approvalStatus: 'rejected',
        isActive: false
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Usuário rejeitado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao rejeitar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Criar admin inicial (temporário - remover após primeiro uso)
const createInitialAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar se já existe um admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Já existe um usuário admin no sistema',
        existingAdmin: {
          name: existingAdmin.name,
          email: existingAdmin.email
        }
      });
    }

    // Verificar se o email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criar admin
    const admin = new User({
      name: name || 'Administrador',
      email,
      password,
      role: 'admin',
      approvalStatus: 'approved',
      isActive: true,
      sites: []
    });

    await admin.save();

    // Retornar admin sem senha
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      message: 'Admin criado com sucesso! Remova a rota /create-admin após o primeiro uso.',
      admin: adminResponse
    });
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    console.log('👤 getCurrentUser iniciado');
    console.log('🔍 req.user:', req.user);
    console.log('🔍 req.user._id:', req.user._id);
    
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('sites', 'name url')
      .populate('approvedBy', 'name email');

    console.log('👤 Usuário encontrado no banco:', user ? `ID: ${user._id}, Nome: ${user.name}` : 'null');

    if (!user) {
      console.log('❌ Usuário não encontrado no banco de dados');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Buscar o role no banco de dados para obter as permissões atuais
    const Role = require('../models/Role');
    const userRole = await Role.findOne({ name: user.role, isActive: true });
    
    let permissions = [];
    if (userRole) {
      permissions = userRole.permissions;
      console.log('✅ Permissões obtidas do banco:', permissions);
    } else {
      // Role não encontrado ou inativo - usar role padrão
      console.log('⚠️ Role não encontrado ou inativo, usando role padrão');
      
      // Verificar se existe um role padrão (viewer ou pending)
      const defaultRole = await Role.findOne({ 
        name: { $in: ['viewer', 'pending'] }, 
        isActive: true 
      });
      
      if (defaultRole) {
        // Atualizar o usuário para o role padrão
        user.role = defaultRole.name;
        await user.save();
        permissions = defaultRole.permissions;
        console.log(`✅ Usuário migrado para role padrão: ${defaultRole.name}`);
      } else {
        // Fallback para permissões mínimas
        permissions = ['profile:view'];
        console.log('⚠️ Nenhum role padrão encontrado, usando permissões mínimas');
      }
    }
    
    // Adicionar permissões ao objeto de resposta
    const userResponse = user.toObject();
    userResponse.permissions = permissions;

    console.log('✅ Retornando dados do usuário:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: permissions,
      sitesCount: user.sites.length
    });

    res.json(userResponse);
  } catch (error) {
    console.error('❌ Erro ao buscar perfil do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o email já existe (se foi alterado)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    // Se forneceu senha, verificar senha atual
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Senha atual incorreta' });
      }

      // Validar nova senha
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
      }

      // Hash da nova senha
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password').populate('sites', 'name url').populate('approvedBy', 'name email');

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get all available permissions
// @route   GET /api/users/permissions
// @access  Private
const getAllAvailablePermissions = async (req, res) => {
  try {
    const permissions = getAllPermissions();
    
    res.json({
      permissions,
      permissionsByRole,
      message: 'Permissões obtidas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  registerUser,
  createUser,
  loginUser,
  logoutUser,
  getAllUsers,
  getPendingUsers,
  getUserById,
  approveUser,
  rejectUser,
  updateUser,
  deleteUser,
  addUserToSite,
  removeUserFromSite,
  createInitialAdmin,
  getCurrentUser,
  updateProfile,
  getAllAvailablePermissions
}; 