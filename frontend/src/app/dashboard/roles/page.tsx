'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import Select from '@/components/Select';
import PermissionGuard from '@/components/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { Shield, Edit, Trash2, Plus, Users, Settings } from 'lucide-react';

type Role = {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  color: string;
  icon: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
};

type PermissionCategory = {
  title: string;
  permissions: Record<string, string>;
};

type OrganizedPermissions = {
  sites: PermissionCategory;
  users: PermissionCategory;
  system: PermissionCategory;
  profile: PermissionCategory;
  analytics: PermissionCategory;
  logs: PermissionCategory;
  roles: PermissionCategory;
};

const initialFormState = {
  name: '',
  displayName: '',
  description: '',
  permissions: [] as string[],
  color: 'bg-gray-100 text-gray-800',
  icon: 'Shield'
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<OrganizedPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const { hasPermission } = usePermissions();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        fetch('/api/roles', { credentials: 'include' }),
        fetch('/api/roles/permissions', { credentials: 'include' })
      ]);

      if (!rolesRes.ok) throw new Error('Falha ao buscar roles');
      if (!permissionsRes.ok) throw new Error('Falha ao buscar permissões');
      
      const rolesData = await rolesRes.json();
      const permissionsData = await permissionsRes.json();
      
      setRoles(rolesData);
      setAvailablePermissions(permissionsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const openCreateModal = () => {
    setEditingRoleId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRoleId(role._id);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
      color: role.color,
      icon: role.icon
    });
    setIsModalOpen(true);
  };

  const openPermissionsModal = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoleId(null);
  };

  const closePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setSelectedRole(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingRoleId ? `/api/roles/${editingRoleId}` : '/api/roles';
    const method = editingRoleId ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Falha ao ${editingRoleId ? 'atualizar' : 'criar'} role`);
      }
      
      closeModal();
      fetchData(); // Refresh roles list
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja deletar este role?')) return;
    
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao deletar role');
      }
      
      fetchData(); // Refresh roles list
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const initializeDefaultRoles = async () => {
    if (!confirm('Isso irá criar os roles padrão do sistema (admin, editor, viewer, pending). Continuar?')) return;
    
    try {
      const res = await fetch('/api/roles/initialize', {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao inicializar roles');
      }
      
      fetchData(); // Refresh roles list
      alert('Roles padrão inicializados com sucesso!');
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
    <PermissionGuard requiredPermission="roles:view">
      <>
        {/* Modal de criação/edição de role */}
        {hasPermission('roles:create') && (
          <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRoleId ? "Editar Role" : "Criar Novo Role"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="Nome"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={editingRoleId !== null}
                  helperText={editingRoleId ? "Nome não pode ser alterado" : undefined}
                />
              </div>
              
              <div>
                <Input
                  label="Nome de Exibição"
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <Textarea
                  label="Descrição"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <Select
                  label="Cor"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  options={[
                    { value: 'bg-red-100 text-red-800', label: 'Vermelho' },
                    { value: 'bg-blue-100 text-blue-800', label: 'Azul' },
                    { value: 'bg-green-100 text-green-800', label: 'Verde' },
                    { value: 'bg-yellow-100 text-yellow-800', label: 'Amarelo' },
                    { value: 'bg-purple-100 text-purple-800', label: 'Roxo' },
                    { value: 'bg-gray-100 text-gray-800', label: 'Cinza' }
                  ]}
                />
              </div>
              
              <div>
                <Select
                  label="Ícone"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Shield', label: 'Shield' },
                    { value: 'Crown', label: 'Crown' },
                    { value: 'Edit', label: 'Edit' },
                    { value: 'Eye', label: 'Eye' },
                    { value: 'Clock', label: 'Clock' },
                    { value: 'Users', label: 'Users' },
                    { value: 'Settings', label: 'Settings' }
                  ]}
                />
              </div>

              {/* Seção de Permissões */}
              {availablePermissions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Permissões ({formData.permissions.length} selecionadas)
                  </label>
                  <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    {Object.entries(availablePermissions).map(([categoryKey, category]) => (
                      <div key={categoryKey} className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-b-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {category.title}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(category.permissions).map(([permission, description]) => (
                            <label key={permission} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission)}
                                onChange={() => handlePermissionToggle(permission)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                {description}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione as permissões que este role deve ter
                  </p>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </Modal>
        )}

        {/* Modal de permissões */}
        <Modal isOpen={isPermissionsModalOpen} onClose={closePermissionsModal} title={`Permissões - ${selectedRole?.displayName}`}>
          {selectedRole && availablePermissions && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Informações do Role</h3>
                <p><strong>Nome:</strong> {selectedRole.displayName}</p>
                <p><strong>Descrição:</strong> {selectedRole.description}</p>
                <p><strong>Permissões atuais:</strong> {selectedRole.permissions.length}</p>
              </div>
              
              <div className="space-y-4">
                {Object.entries(availablePermissions).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">{category.title}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(category.permissions).map(([permission, description]) => (
                        <div key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            id={permission}
                            checked={selectedRole.permissions.includes(permission)}
                            disabled
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={permission} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            {description}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-4">
                <button onClick={closePermissionsModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Fechar</button>
              </div>
            </div>
          )}
        </Modal>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gerenciamento de Roles
            </h1>
            <div className="flex space-x-2">
              {roles.length === 0 && (
                <button 
                  onClick={initializeDefaultRoles}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Inicializar Roles Padrão
                </button>
              )}
              {hasPermission('roles:create') && (
                <button onClick={openCreateModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Criar Role
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role._id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <Shield className="w-6 h-6 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.displayName}</h3>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${role.color}`}>
                      {role.name}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {role.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Permissões ({role.permissions.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <span key={permission} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded">
                          {permission}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded">
                          +{role.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openPermissionsModal(role)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                      >
                        Ver Permissões
                      </button>
                      {hasPermission('roles:edit') && !role.isSystem && (
                        <button
                          onClick={() => openEditModal(role)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4 inline mr-1" />
                          Editar
                        </button>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {role.isSystem && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Sistema</span>
                      )}
                      {hasPermission('roles:delete') && !role.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(role._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Deletar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {roles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🛡️</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum role encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Clique em "Inicializar Roles Padrão" para criar os roles básicos do sistema.
              </p>
            </div>
          )}
        </div>
      </>
    </PermissionGuard>
  );
} 