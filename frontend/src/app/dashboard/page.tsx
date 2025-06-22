'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { usePermissions } from '@/hooks/usePermissions';

type Site = {
  _id: string;
  name: string;
  url: string;
  metaTitle: string;
  metaDescription: string;
  metaImage: string;
  users?: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
};

const initialFormState = {
  name: '',
  url: '',
};

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  
  const { hasPermission, canManageSites } = usePermissions();

  const fetchSites = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando sites no dashboard...');
      
      const res = await fetch('/api/sites');
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao buscar os sites');
      }
      
      const data = await res.json();
      console.log('✅ Sites recebidos:', data.length, 'sites');
      console.log('📋 Detalhes dos sites:', data.map((site: Site) => ({
        id: site._id,
        name: site.name,
        url: site.url,
        users: site.users?.length || 0
      })));
      
      setSites(data);
    } catch (err: any) {
      console.error('❌ Erro ao buscar sites:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao criar site');
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchSites(); // Refresh the list
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

      fetchSites(); // Refresh the list
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleRefreshMeta = async (siteId: string) => {
    try {
      const res = await fetch(`/api/sites/${siteId}/refresh-meta`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao atualizar meta tags');
      }

      fetchSites(); // Refresh the list
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (loading) {
    return <div>Carregando sites...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erro: {error}</div>;
  }

  return (
    <>
      {/* Modal de Criação de Site - apenas se tiver permissão */}
      {hasPermission('sites:create') && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Novo Site">
          <form onSubmit={handleCreateSite} className="space-y-4">
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
                placeholder="https://exemplo.com"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Criar Site
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Visão Geral dos Sites
          </h1>
          {hasPermission('sites:create') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Criar Site
            </button>
          )}
        </div>
        
        {sites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏠</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum site encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {hasPermission('sites:create') 
                ? 'Crie um site para começar!' 
                : 'Você não tem sites associados. Entre em contato com o administrador.'}
            </p>
            {hasPermission('sites:create') && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Criar Primeiro Site
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <div
                key={site._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Preview Image */}
                {site.metaImage && (
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                    <img
                      src={site.metaImage}
                      alt={site.metaTitle || site.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Erro ao carregar imagem:', site.metaImage);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🖼️</div>
                        <div className="text-sm">Imagem não disponível</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Site Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {site.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 truncate">
                    {site.url}
                  </p>
                  
                  {site.metaTitle && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Título:</strong> {site.metaTitle}
                    </p>
                  )}
                  
                  {site.metaDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {site.metaDescription}
                    </p>
                  )}

                  {/* User Count */}
                  {site.users && site.users.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {site.users.length} usuário(s) associado(s)
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <a
                      href={`/dashboard/sites/${site._id}`}
                      className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 text-center"
                    >
                      Gerenciar
                    </a>
                    {hasPermission('sites:edit') && (
                      <button
                        onClick={() => handleRefreshMeta(site._id)}
                        className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
                      >
                        Atualizar Meta
                      </button>
                    )}
                    
                    {hasPermission('sites:delete') && (
                      <button
                        onClick={() => handleDeleteSite(site._id)}
                        className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                      >
                        Deletar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 