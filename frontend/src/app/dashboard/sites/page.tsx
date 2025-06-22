'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import PermissionGuard from '@/components/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';

type Site = {
  _id: string;
  name: string;
  url: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaImage?: string;
  users: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  isActive: boolean;
  createdAt: string;
};

const initialFormState = {
  name: '',
  url: '',
  description: '',
  isActive: true,
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);

  const { hasPermission, canViewAllSites, canViewAssociatedSites, isAdmin } = usePermissions();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sitesRes, usersRes] = await Promise.all([
        fetch('/api/sites', { credentials: 'include' }),
        fetch('/api/users', { credentials: 'include' }),
      ]);

      if (!sitesRes.ok) throw new Error('Falha ao buscar sites');
      if (!usersRes.ok) throw new Error('Falha ao buscar usuários');
      
      const sitesData = await sitesRes.json();
      const usersData = await usersRes.json();
      
      setSites(sitesData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openCreateModal = () => {
    setEditingSiteId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (site: Site) => {
    setEditingSiteId(site._id);
    setFormData({
      name: site.name,
      url: site.url,
      description: site.description || '',
      isActive: site.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSiteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingSiteId ? `/api/sites/${editingSiteId}` : '/api/sites';
    const method = editingSiteId ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Falha ao ${editingSiteId ? 'atualizar' : 'criar'} site`);
      }
      
      closeModal();
      fetchData(); // Refresh sites list
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Tem certeza que deseja deletar este site?')) return;
    
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao deletar site');
      }
      
      fetchData(); // Refresh sites list
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const refreshMetaTags = async (siteId: string) => {
    try {
      const res = await fetch(`/api/sites/${siteId}/refresh-meta`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao atualizar meta tags');
      }
      
      fetchData(); // Refresh sites list
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erro: {error}</div>;
  }

  return (
    <PermissionGuard requiredPermissions={['sites:view', 'sites:view_all']} requireAny={true}>
      <>
        {/* Modal de criação/edição de site */}
        {hasPermission('sites:create') && (
          <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSiteId ? "Editar Site" : "Criar Novo Site"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label>URL</label>
                <input type="url" name="url" value={formData.url} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label>Descrição</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Site ativo
                </label>
              </div>
              <div className="flex justify-end pt-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </Modal>
        )}

        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gerenciamento de Sites
            </h1>
            {hasPermission('sites:create') && (
              <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Criar Site
              </button>
            )}
          </div>

          {/* Informação sobre tipo de acesso */}
          <div className="mb-6">
            {isAdmin() ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Acesso Completo (Admin)
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <p>Como administrador, você tem acesso a todos os sites do sistema ({sites.length} sites encontrados).</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : canViewAllSites() ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                      Acesso Completo
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <p>Você tem permissão para visualizar todos os sites do sistema ({sites.length} sites encontrados).</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : canViewAssociatedSites() ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Acesso Limitado
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>Você pode visualizar apenas os sites associados ao seu usuário ({sites.length} sites encontrados).</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Sem Acesso
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>Você não tem permissão para visualizar sites.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <div key={site._id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{site.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      site.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {site.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>URL:</strong> {site.url}
                  </p>
                  
                  {site.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {site.description}
                    </p>
                  )}

                  {/* Meta Tags Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Meta Tags</h4>
                    <div className="space-y-2">
                      {site.metaTitle && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          <strong>Title:</strong> {site.metaTitle}
                        </p>
                      )}
                      {site.metaDescription && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          <strong>Description:</strong> {site.metaDescription}
                        </p>
                      )}
                      {site.metaImage && (
                        <div className="flex items-center space-x-2">
                          <img src={site.metaImage} alt="Meta" className="w-8 h-8 rounded object-cover" />
                          <span className="text-xs text-gray-600 dark:text-gray-300">Meta Image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Users */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Usuários ({site.users.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {site.users.slice(0, 3).map((user) => (
                        <span key={user._id} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded">
                          {user.name}
                        </span>
                      ))}
                      {site.users.length > 3 && (
                        <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded">
                          +{site.users.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/sites/${site._id}`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                      >
                        Ver Detalhes
                      </Link>
                      {hasPermission('sites:edit') && (
                        <button
                          onClick={() => openEditModal(site)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => refreshMetaTags(site._id)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                        title="Atualizar meta tags"
                      >
                        🔄
                      </button>
                      {hasPermission('sites:delete') && (
                        <button
                          onClick={() => handleDeleteSite(site._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                        >
                          Deletar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sites.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🌐</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum site encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {hasPermission('sites:create') 
                  ? 'Crie seu primeiro site para começar.' 
                  : 'Entre em contato com o administrador para adicionar sites.'}
              </p>
            </div>
          )}
        </div>
      </>
    </PermissionGuard>
  );
} 