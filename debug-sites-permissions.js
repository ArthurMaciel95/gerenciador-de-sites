const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function debugSitesPermissions() {
  try {
    console.log('🔍 Debugando permissões de sites...\n');

    // 1. Login como editor
    console.log('1️⃣ Login como editor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'editor@example.com',
      password: 'editor123'
    }, { withCredentials: true });
    
    const cookies = loginResponse.headers['set-cookie'];
    console.log('✅ Editor logado');

    // 2. Verificar perfil do usuário
    console.log('\n2️⃣ Verificando perfil do usuário...');
    const profileResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Cookie: cookies }
    });
    
    const user = profileResponse.data;
    console.log('👤 Usuário:', {
      id: user._id,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      sites: user.sites
    });

    // 3. Verificar se tem sites:view
    const hasViewPermission = user.permissions && user.permissions.includes('sites:view');
    const hasViewAllPermission = user.permissions && user.permissions.includes('sites:view_all');
    
    console.log('\n3️⃣ Verificando permissões:');
    console.log('   sites:view:', hasViewPermission ? '✅ SIM' : '❌ NÃO');
    console.log('   sites:view_all:', hasViewAllPermission ? '✅ SIM' : '❌ NÃO');

    // 4. Buscar sites
    console.log('\n4️⃣ Buscando sites...');
    const sitesResponse = await axios.get(`${BASE_URL}/sites`, {
      headers: { Cookie: cookies }
    });
    
    console.log('📊 Sites retornados:', sitesResponse.data.length);
    sitesResponse.data.forEach(site => {
      console.log(`   - ${site.name} (${site.url})`);
    });

    // 5. Verificar sites associados ao usuário
    console.log('\n5️⃣ Verificando sites associados ao usuário...');
    console.log('🔗 Sites associados:', user.sites);
    
    const returnedSiteIds = sitesResponse.data.map(site => site._id);
    const associatedSiteIds = user.sites.map(site => site._id || site);
    
    console.log('📋 Sites retornados pela API:', returnedSiteIds);
    console.log('🔗 Sites associados ao usuário:', associatedSiteIds);
    
    // 6. Comparar
    console.log('\n6️⃣ Comparando...');
    const extraSites = returnedSiteIds.filter(id => !associatedSiteIds.includes(id));
    const missingSites = associatedSiteIds.filter(id => !returnedSiteIds.includes(id));
    
    if (extraSites.length > 0) {
      console.log('❌ PROBLEMA: Sites extras retornados:', extraSites);
    } else {
      console.log('✅ OK: Nenhum site extra retornado');
    }
    
    if (missingSites.length > 0) {
      console.log('⚠️ Sites associados não retornados:', missingSites);
    } else {
      console.log('✅ OK: Todos os sites associados foram retornados');
    }

    // 7. Verificar se deveria ter acesso
    console.log('\n7️⃣ Análise de permissões:');
    if (user.role === 'admin') {
      console.log('👑 Admin: Deve ver todos os sites');
    } else if (hasViewAllPermission) {
      console.log('🔍 sites:view_all: Deve ver todos os sites');
    } else if (hasViewPermission) {
      console.log('👁️ sites:view: Deve ver apenas sites associados');
    } else {
      console.log('❌ Sem permissões: Não deveria ver nenhum site');
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

debugSitesPermissions(); 