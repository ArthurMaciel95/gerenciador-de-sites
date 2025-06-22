const Site = require('../models/Site');
const User = require('../models/User');
const { scrapeMetaTags } = require('../utils/metaScraper');

class SiteService {
  /**
   * Busca sites baseado no role do usuário
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<Array>} Lista de sites
   */
  async getSitesByUserRole(user) {
    const isAdmin = user.role === 'admin';
    
    if (isAdmin) {
      return await this.getAllActiveSites();
    } else {
      return await this.getSitesByUserAssociation(user);
    }
  }

  /**
   * Busca todos os sites ativos
   * @returns {Promise<Array>} Lista de todos os sites
   */
  async getAllActiveSites() {
    return await Site.find({ isActive: true })
      .populate('users', 'name email role')
      .sort({ createdAt: -1 });
  }

  /**
   * Busca sites associados ao usuário
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<Array>} Lista de sites associados
   */
  async getSitesByUserAssociation(user) {
    if (!user.sites || user.sites.length === 0) {
      return [];
    }

    return await Site.find({ 
      _id: { $in: user.sites },
      isActive: true 
    })
    .populate('users', 'name email role')
    .sort({ createdAt: -1 });
  }

  /**
   * Busca um site por ID
   * @param {string} siteId - ID do site
   * @returns {Promise<Object>} Site encontrado
   */
  async getSiteById(siteId) {
    return await Site.findById(siteId)
      .populate('users', 'name email role isActive');
  }

  /**
   * Cria um novo site
   * @param {Object} siteData - Dados do site
   * @param {Array} userIds - IDs dos usuários associados
   * @returns {Promise<Object>} Site criado
   */
  async createSite(siteData, userIds = []) {
    // Verificar se a URL já existe
    const existingSite = await Site.findOne({ url: siteData.url });
    if (existingSite) {
      throw new Error('URL já cadastrada');
    }

    // Fazer scraping das meta tags
    const metaData = await scrapeMetaTags(siteData.url);

    // Criar site
    const site = new Site({
      ...siteData,
      users: userIds,
      metaTitle: metaData.title,
      metaDescription: metaData.description,
      metaImage: metaData.image
    });

    await site.save();

    // Associar site aos usuários
    if (userIds.length > 0) {
      await this.associateSiteToUsers(site._id, userIds);
    }

    return await this.getSiteById(site._id);
  }

  /**
   * Atualiza um site
   * @param {string} siteId - ID do site
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} Site atualizado
   */
  async updateSite(siteId, updateData) {
    const site = await Site.findById(siteId);
    if (!site) {
      throw new Error('Site não encontrado');
    }

    // Verificar se a URL já existe (se foi alterada)
    if (updateData.url && updateData.url !== site.url) {
      const existingSite = await Site.findOne({ 
        url: updateData.url, 
        _id: { $ne: siteId } 
      });
      if (existingSite) {
        throw new Error('URL já cadastrada');
      }
    }

    // Fazer scraping das meta tags se a URL mudou
    if (updateData.url && updateData.url !== site.url) {
      const metaData = await scrapeMetaTags(updateData.url);
      updateData.metaTitle = metaData.title;
      updateData.metaDescription = metaData.description;
      updateData.metaImage = metaData.image;
    }

    // Gerenciar relacionamentos com usuários
    if (updateData.users !== undefined) {
      await this.manageSiteUsers(siteId, site.users, updateData.users);
    }

    const updatedSite = await Site.findByIdAndUpdate(
      siteId,
      updateData,
      { new: true }
    ).populate('users', 'name email role');

    return updatedSite;
  }

  /**
   * Remove um site
   * @param {string} siteId - ID do site
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteSite(siteId) {
    const site = await Site.findById(siteId);
    if (!site) {
      throw new Error('Site não encontrado');
    }

    // Remover site de todos os usuários associados
    await User.updateMany(
      { sites: siteId },
      { $pull: { sites: siteId } }
    );

    await Site.findByIdAndDelete(siteId);
    return true;
  }

  /**
   * Atualiza meta tags de um site
   * @param {string} siteId - ID do site
   * @returns {Promise<Object>} Site com meta tags atualizadas
   */
  async refreshMetaTags(siteId) {
    const site = await Site.findById(siteId);
    if (!site) {
      throw new Error('Site não encontrado');
    }

    const metaData = await scrapeMetaTags(site.url);
    
    const updatedSite = await Site.findByIdAndUpdate(
      siteId,
      {
        metaTitle: metaData.title,
        metaDescription: metaData.description,
        metaImage: metaData.image
      },
      { new: true }
    ).populate('users', 'name email role');

    return updatedSite;
  }

  /**
   * Associa site a usuários
   * @param {string} siteId - ID do site
   * @param {Array} userIds - IDs dos usuários
   */
  async associateSiteToUsers(siteId, userIds) {
    for (const userId of userIds) {
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { sites: siteId } }
      );
    }
  }

  /**
   * Gerencia usuários de um site
   * @param {string} siteId - ID do site
   * @param {Array} currentUsers - Usuários atuais
   * @param {Array} newUsers - Novos usuários
   */
  async manageSiteUsers(siteId, currentUsers, newUsers) {
    const currentUserIds = currentUsers.map(user => user.toString());
    const newUserIds = newUsers.map(user => user.toString());
    
    // Remover site de usuários que não estão mais na lista
    const usersToRemove = currentUserIds.filter(userId => !newUserIds.includes(userId));
    for (const userId of usersToRemove) {
      await User.findByIdAndUpdate(userId, { $pull: { sites: siteId } });
    }

    // Adicionar site aos novos usuários
    const usersToAdd = newUserIds.filter(userId => !currentUserIds.includes(userId));
    for (const userId of usersToAdd) {
      await User.findByIdAndUpdate(userId, { $addToSet: { sites: siteId } });
    }
  }
}

module.exports = new SiteService(); 