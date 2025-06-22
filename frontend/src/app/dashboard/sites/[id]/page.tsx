'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Modal from '@/components/Modal';
import PermissionGuard from '@/components/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';

interface Site {
  _id: string;
  name: string;
  url: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  metaImage: string;
  users: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const initialFormState = {
  name: '',
  url: '',
  description: '',
  isActive: true
};

export default function SiteManagementPage() {
  const params = useParams();
  const siteId = params.id as string;
  
  const [site, setSite] = useState<Site | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddUsersModalOpen, setIsAddUsersModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { hasPermission } = usePermissions();

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      console.log('Fetching site data for ID:', siteId);
      
      const res = await fetch(`/api/sites/${siteId}`);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Site data received:', data);
      
      setSite(data);
      setFormData({
        name: data.name,
        url: data.url,
        description: data.description || '',
        isActive: data.isActive
      });
    } catch (err: any) {
      console.error('Error fetching site data:', err);
      setError(err.message || 'Erro ao carregar dados do site');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        console.error('Erro ao buscar usuários:', res.statusText);
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err.message);
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchSiteData();
      fetchUsers();
    }
  }, [siteId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao atualizar site');
      }

      setIsEditModalOpen(false);
      fetchSiteData(); // Refresh the site data
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleAddUser = async (userId: string) => {
    try {
      const res = await fetch('/api/sites/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId, userId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao adicionar usuário');
      }

      fetchSiteData();
      alert('Usuário adicionado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao adicionar usuário:', err.message);
      alert('Erro ao adicionar usuário');
    }
  };

  const handleAddMultipleUsers = async () => {
    if (selectedUsers.length === 0) {
      alert('Selecione pelo menos um usuário');
      return;
    }

    try {
      // Adicionar usuários um por vez
      for (const userId of selectedUsers) {
        const res = await fetch('/api/sites/add-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ siteId, userId }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Erro ao adicionar usuário');
        }
      }

      fetchSiteData();
      setIsAddUsersModalOpen(false);
      setSelectedUsers([]);
      alert(`${selectedUsers.length} usuário(s) adicionado(s) com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao adicionar usuários:', err.message);
      alert(`Erro ao adicionar usuários: ${err.message}`);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário do site?')) return;

    try {
      const res = await fetch('/api/sites/remove-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId, userId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao remover usuário');
      }

      fetchSiteData();
      alert('Usuário removido com sucesso!');
    } catch (err: any) {
      console.error('Erro ao remover usuário:', err.message);
      alert('Erro ao remover usuário');
    }
  };

  const handleRefreshMeta = async () => {
    try {
      const res = await fetch(`/api/sites/${siteId}/refresh-meta`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao atualizar meta tags');
      }

      // Recarregar dados do site
      const siteRes = await fetch(`/api/sites/${siteId}`);
      if (siteRes.ok) {
        const siteData = await siteRes.json();
        setSite(siteData);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const availableUsers = users.filter(user => 
      !site?.users.some(siteUser => siteUser._id === user._id)
    );
    const availableUserIds = availableUsers.map(user => user._id);
    
    if (selectedUsers.length === availableUserIds.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(availableUserIds);
    }
  };

  // Filtrar usuários disponíveis (não associados ao site)
  const availableUsers = users.filter(user => 
    !site?.users.some(siteUser => siteUser._id === user._id) &&
    (searchTerm === '' || 
     user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'viewer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Erro ao carregar site
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Site não encontrado
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          O site que você está procurando não existe ou foi removido.
        </p>
      </div>
    );
  }

  return (
    <PermissionGuard requiredPermission="sites:view">
      <>
        {/* Modal de Edição do Site */}
        {hasPermission('sites:edit') && (
          <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Site">
            <form onSubmit={handleUpdateSite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Site</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Site Ativo
                </label>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Modal de Adicionar Usuários */}
        {hasPermission('sites:edit') && (
          <Modal 
            isOpen={isAddUsersModalOpen} 
            onClose={() => {
              setIsAddUsersModalOpen(false);
              setSelectedUsers([]);
              setSearchTerm('');
            }} 
            title="Adicionar Usuários ao Site"
          >
            <div className="space-y-4">
              {/* Barra de Pesquisa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pesquisar Usuários
                </label>
                <input
                  type="text"
                  placeholder="Digite o nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Seletor de Todos */}
              {availableUsers.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === availableUsers.length && availableUsers.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                      Selecionar Todos ({availableUsers.length})
                    </label>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUsers.length} selecionado(s)
                  </span>
                </div>
              )}

              {/* Lista de Usuários */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                {availableUsers.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {availableUsers.map((user) => (
                      <div key={user._id} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleUserSelection(user._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                              {user.role === 'admin' ? 'Administrador' : 
                               user.role === 'editor' ? 'Editor' : 
                               user.role === 'viewer' ? 'Visualizador' : user.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Nenhum usuário encontrado com essa pesquisa' : 'Todos os usuários já estão associados a este site'}
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end pt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUsersModalOpen(false);
                    setSelectedUsers([]);
                    setSearchTerm('');
                  }}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddMultipleUsers}
                  disabled={selectedUsers.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Adicionar {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                </button>
              </div>
            </div>
          </Modal>
        )}

        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{site.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Gerenciamento do Site</p>
            </div>
            <div className="flex space-x-2">
              {hasPermission('sites:edit') && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Editar Site
                </button>
              )}
              {hasPermission('sites:edit') && (
                <button
                  onClick={handleRefreshMeta}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                >
                  Atualizar Meta Tags
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações do Site */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Informações do Site</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome</label>
                  <p className="text-gray-900 dark:text-white">{site.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">URL</label>
                  <p className="text-gray-900 dark:text-white">
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {site.url}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descrição</label>
                  <p className="text-gray-900 dark:text-white">{site.description || 'Sem descrição'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    site.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {site.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Meta Tags</label>
                  <div className="mt-2 space-y-2">
                    {site.metaTitle && (
                      <div>
                        <span className="text-xs text-gray-500">Título:</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{site.metaTitle}</p>
                      </div>
                    )}
                    {site.metaDescription && (
                      <div>
                        <span className="text-xs text-gray-500">Descrição:</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{site.metaDescription}</p>
                      </div>
                    )}
                    {site.metaImage && (
                      <div>
                        <span className="text-xs text-gray-500">Imagem:</span>
                        <img src={site.metaImage} alt="Meta" className="mt-1 w-20 h-20 object-cover rounded" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações de Analytics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Configurações de Analytics</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Google Analytics ID</label>
                  <input
                    type="text"
                    placeholder="G-XXXXXXXXXX"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Facebook Pixel ID</label>
                  <input
                    type="text"
                    placeholder="XXXXXXXXXX"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>

          {/* Seção de Logs (futuro) */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Logs em Tempo Real</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Esta funcionalidade será implementada em breve para mostrar logs em tempo real do site.
            </p>
          </div>

          {/* Usuários Associados */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Usuários Associados ({site.users.length})
              </h2>
              {hasPermission('sites:edit') && (
                <button
                  onClick={() => setIsAddUsersModalOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + Adicionar Usuários
                </button>
              )}
            </div>

            {site.users.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {site.users.map((user) => (
                  <div key={user._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-300">{user.email}</p>
                      </div>
                      {hasPermission('sites:edit') && (
                        <button
                          onClick={() => handleRemoveUser(user._id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      user.role === 'editor' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Nenhum usuário associado a este site
              </p>
            )}
          </div>
        </div>
      </>
    </PermissionGuard>
  );
} 