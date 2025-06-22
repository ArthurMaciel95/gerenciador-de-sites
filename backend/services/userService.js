const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserService {
  /**
   * Busca todos os usuários ativos
   * @returns {Promise<Array>} Lista de usuários
   */
  async getAllUsers() {
    return await User.find({ isActive: true })
      .populate('sites', 'name url')
      .select('-password')
      .sort({ createdAt: -1 });
  }

  /**
   * Busca usuários pendentes
   * @returns {Promise<Array>} Lista de usuários pendentes
   */
  async getPendingUsers() {
    return await User.find({ 
      isActive: true, 
      status: 'pending' 
    })
    .populate('sites', 'name url')
    .select('-password')
    .sort({ createdAt: -1 });
  }

  /**
   * Busca usuário por ID
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Usuário encontrado
   */
  async getUserById(userId) {
    return await User.findById(userId)
      .populate('sites', 'name url')
      .select('-password');
  }

  /**
   * Busca usuário atual
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Usuário encontrado
   */
  async getCurrentUser(userId) {
    return await User.findById(userId)
      .populate('sites', 'name url')
      .select('-password');
  }

  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Usuário criado
   */
  async createUser(userData) {
    // Verificar se o email já existe
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = new User({
      ...userData,
      password: hashedPassword
    });

    await user.save();
    return await this.getUserById(user._id);
  }

  /**
   * Atualiza um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} Usuário atualizado
   */
  async updateUser(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se o email já existe (se foi alterado)
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new Error('Email já cadastrado');
      }
    }

    // Criptografar nova senha se fornecida
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    )
    .populate('sites', 'name url')
    .select('-password');

    return updatedUser;
  }

  /**
   * Atualiza perfil do usuário atual
   * @param {string} userId - ID do usuário
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} Usuário atualizado
   */
  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Permitir apenas campos específicos para atualização de perfil
    const allowedFields = ['name', 'email', 'password'];
    const filteredData = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // Verificar se o email já existe (se foi alterado)
    if (filteredData.email && filteredData.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: filteredData.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new Error('Email já cadastrado');
      }
    }

    // Criptografar nova senha se fornecida
    if (filteredData.password) {
      const salt = await bcrypt.genSalt(10);
      filteredData.password = await bcrypt.hash(filteredData.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      filteredData,
      { new: true }
    )
    .populate('sites', 'name url')
    .select('-password');

    return updatedUser;
  }

  /**
   * Remove um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    await User.findByIdAndDelete(userId);
    return true;
  }

  /**
   * Aprova um usuário pendente
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Usuário aprovado
   */
  async approveUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.status !== 'pending') {
      throw new Error('Usuário não está pendente');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status: 'active' },
      { new: true }
    )
    .populate('sites', 'name url')
    .select('-password');

    return updatedUser;
  }

  /**
   * Rejeita um usuário pendente
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Usuário rejeitado
   */
  async rejectUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.status !== 'pending') {
      throw new Error('Usuário não está pendente');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status: 'rejected' },
      { new: true }
    )
    .populate('sites', 'name url')
    .select('-password');

    return updatedUser;
  }

  /**
   * Adiciona usuário a um site
   * @param {string} userId - ID do usuário
   * @param {string} siteId - ID do site
   * @returns {Promise<Object>} Usuário atualizado
   */
  async addUserToSite(userId, siteId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { sites: siteId } },
      { new: true }
    )
    .populate('sites', 'name url')
    .select('-password');

    return updatedUser;
  }

  /**
   * Remove usuário de um site
   * @param {string} userId - ID do usuário
   * @param {string} siteId - ID do site
   * @returns {Promise<Object>} Usuário atualizado
   */
  async removeUserFromSite(userId, siteId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { sites: siteId } },
      { new: true }
    )
    .populate('sites', 'name url')
    .select('-password');

    return updatedUser;
  }
}

module.exports = new UserService(); 