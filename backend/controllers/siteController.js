const User = require('../models/User');
const { hasPermission } = require('../utils/permissions');
const siteService = require('../services/siteService');

// @desc    Create a new site
// @route   POST /api/sites
// @access  Private
const createSite = async (req, res) => {
  try {
    const { name, url, description, users } = req.body;

    const site = await siteService.createSite(
      { name, url, description },
      users || []
    );

    res.status(201).json({
      message: 'Site criado com sucesso',
      site
    });
  } catch (error) {
    console.error('Erro ao criar site:', error);
    
    if (error.message === 'URL já cadastrada') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get all sites
// @route   GET /api/sites
// @access  Private
const getSites = async (req, res) => {
  try {
    console.log('🏠 getSites iniciado');
    console.log('👤 Usuário:', req.user ? `ID: ${req.user._id}, Role: ${req.user.role}` : 'no user');
    console.log(req.user);
    
    // Verificar se é admin
    const isAdmin = req.user.role === 'admin';
    
    // Verificar permissões do usuário usando o sistema estático
    const canViewAllSites = hasPermission(req.user.role, 'sites:view_all');
    const canViewSites = hasPermission(req.user.role, 'sites:view');
    
    console.log('🔐 Permissões:', {
      canViewAllSites,
      canViewSites,
      userRole: req.user.role,
      isAdmin
    });
    
    // Se não tem nenhuma permissão, negar acesso
    if (!canViewAllSites && !canViewSites) {
      console.log('❌ Usuário não tem permissão para visualizar sites');
      return res.status(403).json({ 
        message: 'Acesso negado - permissão insuficiente para visualizar sites',
        requiredPermissions: ['sites:view', 'sites:view_all'],
        userRole: req.user.role
      });
    }
    
    // Usar o serviço para buscar sites
    const sites = await siteService.getSitesByUserRole(req.user);
    
    console.log('📊 Sites encontrados:', sites.length);
    console.log('📋 Sites:', sites.map(site => ({
      id: site._id,
      name: site.name,
      url: site.url,
      users: site.users.map(u => ({ id: u._id, name: u.name, role: u.role }))
    })));
    
    res.json(sites);
  } catch (error) {
    console.error('❌ Erro ao buscar sites:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Get single site by ID
// @route   GET /api/sites/:id
// @access  Private
const getSiteById = async (req, res) => {
  try {
    console.log('getSiteById - requested site ID:', req.params.id);
    console.log('getSiteById - user:', req.user ? req.user._id : 'no user');
    
    const site = await siteService.getSiteById(req.params.id);

    console.log('getSiteById - site found:', site ? site._id : 'not found');

    if (!site) {
      console.log('getSiteById - site not found');
      return res.status(404).json({ message: 'Site não encontrado' });
    }

    console.log('getSiteById - returning site data');
    res.json(site);
  } catch (error) {
    console.error('getSiteById - error:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Update a site
// @route   PUT /api/sites/:id
// @access  Private
const updateSite = async (req, res) => {
  try {
    const { name, url, description, users, isActive } = req.body;
    const siteId = req.params.id;

    const updatedSite = await siteService.updateSite(siteId, {
      name, url, description, users, isActive
    });

    res.json({
      message: 'Site atualizado com sucesso',
      site: updatedSite
    });
  } catch (error) {
    console.error('Erro ao atualizar site:', error);
    
    if (error.message === 'Site não encontrado') {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message === 'URL já cadastrada') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Delete a site
// @route   DELETE /api/sites/:id
// @access  Private
const deleteSite = async (req, res) => {
  try {
    const siteId = req.params.id;

    await siteService.deleteSite(siteId);

    res.json({ message: 'Site removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover site:', error);
    
    if (error.message === 'Site não encontrado') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Refresh meta tags
// @route   POST /api/sites/:id/refresh-meta
// @access  Private
const refreshMetaTags = async (req, res) => {
  try {
    const siteId = req.params.id;

    const updatedSite = await siteService.refreshMetaTags(siteId);

    res.json({
      message: 'Meta tags atualizadas com sucesso',
      site: updatedSite
    });
  } catch (error) {
    console.error('Erro ao atualizar meta tags:', error);
    
    if (error.message === 'Site não encontrado') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Add user to site
// @route   POST /api/sites/add-user
// @access  Private
const addUserToSite = async (req, res) => {
  try {
    const { userId, siteId } = req.body;

    await siteService.associateSiteToUsers(siteId, [userId]);

    res.json({ message: 'Usuário adicionado ao site com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar usuário ao site:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// @desc    Remove user from site
// @route   POST /api/sites/remove-user
// @access  Private
const removeUserFromSite = async (req, res) => {
  try {
    const { userId, siteId } = req.body;

    await User.findByIdAndUpdate(userId, { $pull: { sites: siteId } });

    res.json({ message: 'Usuário removido do site com sucesso' });
  } catch (error) {
    console.error('Erro ao remover usuário do site:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  refreshMetaTags,
  addUserToSite,
  removeUserFromSite
}; 