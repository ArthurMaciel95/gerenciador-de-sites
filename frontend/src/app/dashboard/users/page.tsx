'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import PermissionGuard from '@/components/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';

// Definindo um tipo para o objeto de usuário para melhor organização
type User = {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'pending';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  sites: Array<{
    _id: string;
    name: string;
    url: string;
  }>;
  isActive: boolean;
  createdAt: string;
};

type Site = {
  _id: string;
  name: string;
  url: string;
};

const initialFormState = {
  name: '',
  email: '',
  password: '',
  role: 'viewer' as 'admin' | 'editor' | 'viewer' | 'pending',
  sites: [] as string[],
  isActive: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // State for the user form (both create and edit)
  const [formData, setFormData] = useState(initialFormState);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const { hasPermission, isAdmin } = usePermissions();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, sitesRes, pendingRes, currentUserRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/sites'),
        fetch('/api/users/pending'),
        fetch('/api/users/me'),
      ]);

      if (!usersRes.ok) {
        const errorData = await usersRes.json();
        throw new Error(errorData.message || 'Falha ao buscar usuários');
      }
      if (!sitesRes.ok) throw new Error('Falha ao buscar sites');
      if (!pendingRes.ok) throw new Error('Falha ao buscar usuários pendentes');
      if (!currentUserRes.ok) throw new Error('Falha ao buscar usuário atual');
      
      const usersData = await usersRes.json();
      const sitesData = await sitesRes.json();
      const pendingData = await pendingRes.json();
      const currentUserData = await currentUserRes.json();
      
      // Filtrar o usuário logado da lista de usuários
      const filteredUsers = usersData.filter((user: User) => user._id !== currentUserData._id);
      
      setUsers(filteredUsers);
      setSites(sitesData);
      setPendingUsers(pendingData);
      setCurrentUser(currentUserData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSiteSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, sites: selectedOptions }));
  };

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUserId(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Não preencher a senha por segurança
      role: user.role === 'pending' ? 'viewer' : user.role,
      sites: user.sites.map(site => site._id),
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const openApprovalModal = (user: User) => {
    setSelectedUser(user);
    setIsApprovalModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
  };

  const closeApprovalModal = () => {
    setIsApprovalModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
    const method = editingUserId ? 'PUT' : 'POST';

    // Se estiver editando e a senha estiver vazia, não a envie
    const body = { ...formData };
    if (editingUserId && !body.password) {
      delete (body as any).password;
    }
    
    try {
      console.log('Submitting user data:', { url, method, body });
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        // Check if response is JSON or HTML
        const contentType = res.headers.get('content-type');
        console.log('Response content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Falha ao ${editingUserId ? 'atualizar' : 'criar'} usuário`);
        } else {
          // Response is HTML (probably an error page)
          const htmlText = await res.text();
          console.error('Received HTML response:', htmlText.substring(0, 500));
          throw new Error(`Erro do servidor (${res.status}): Recebido HTML em vez de JSON. Verifique se o backend está rodando.`);
        }
      }
      
      const responseData = await res.json();
      console.log('Success response:', responseData);
      
      closeModal();
      fetchData(); // Refresh user list
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      alert(`Erro: ${err.message}`);
    }
  };

  const handleApproveUser = async (role: string = 'viewer') => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/users/${selectedUser._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao aprovar usuário');
      }

      closeApprovalModal();
      fetchData(); // Refresh user list
      alert('Usuário aprovado com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleRejectUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/users/${selectedUser._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejeitado pelo administrador' }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao rejeitar usuário');
      }

      closeApprovalModal();
      fetchData(); // Refresh user list
      alert('Usuário rejeitado com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao deletar usuário');
      }
      
      fetchData(); // Refresh user list
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
    <PermissionGuard requiredPermission="users:view">
      <>
        {/* Modal de criação/edição de usuário */}
        {hasPermission('users:create') && (
          <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUserId ? "Editar Usuário" : "Criar Novo Usuário"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
               <div>
                <label>Senha</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={editingUserId ? "Deixe em branco para não alterar" : ""} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
               <div>
                <label>Sites</label>
                <select multiple name="sites" value={formData.sites} onChange={handleSiteSelection} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[100px]">
                  {sites.map(site => (
                    <option key={site._id} value={site._id}>{site.name} - {site.url}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Segure Ctrl (ou Cmd) para selecionar mais de um.</p>
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
                  Usuário ativo
                </label>
              </div>
              <div className="flex justify-end pt-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </Modal>
        )}

        {/* Modal de aprovação */}
        <Modal isOpen={isApprovalModalOpen} onClose={closeApprovalModal} title="Aprovar Usuário">
          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Informações do Usuário</h3>
                <p><strong>Nome:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Data de Registro:</strong> {new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Definir Role
                </label>
                <select id="approvalRole" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeApprovalModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectUser()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Rejeitar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const role = (document.getElementById('approvalRole') as HTMLSelectElement).value;
                    handleApproveUser(role);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Aprovar
                </button>
              </div>
            </div>
          )}
        </Modal>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gerenciamento de Usuários
            </h1>
            {hasPermission('users:create') && (
              <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Criar Usuário
              </button>
            )}
          </div>

          {/* Seção de Usuários Pendentes */}
          {hasPermission('users:approve') && pendingUsers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Usuários Pendentes de Aprovação ({pendingUsers.length})
              </h2>
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-yellow-50 dark:bg-yellow-900/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data de Registro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {pendingUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openApprovalModal(user)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                          >
                            Aprovar/Rejeitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lista de Todos os Usuários */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sites</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Criado em</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        user.role === 'editor' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        user.role === 'pending' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.approvalStatus === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        user.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {user.approvalStatus === 'approved' ? 'Aprovado' :
                         user.approvalStatus === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-300">
                        {user.sites.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.sites.slice(0, 2).map((site) => (
                              <span key={site._id} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded">
                                {site.name}
                              </span>
                            ))}
                            {user.sites.length > 2 && (
                              <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded">
                                +{user.sites.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Nenhum site</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.approvalStatus === 'pending' ? (
                        <button
                          onClick={() => openApprovalModal(user)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                        >
                          Aprovar
                        </button>
                      ) : (
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        >
                          Editar
                        </button>
                      )}
                      {hasPermission('users:delete') && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Deletar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    </PermissionGuard>
  );
} 