'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Globe, Settings, Eye, Edit, Crown, Clock, Check, X, Search } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGuard from '@/components/PermissionGuard';

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

type CurrentUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
};

// Componente auxiliar para renderizar ícones
const IconRenderer = ({ iconName, className }: { iconName: string; className?: string }) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    Shield: Shield,
    Crown: Crown,
    Edit: Edit,
    Eye: Eye,
    Clock: Clock,
    Users: Users,
    Settings: Settings,
    Globe: Globe
  };
  
  const Icon = iconMap[iconName] || Shield;
  return <Icon className={className} />;
};

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<OrganizedPermissions | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { hasPermission } = usePermissions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados em paralelo
        const [rolesRes, permissionsRes, userRes] = await Promise.all([
          fetch('/api/roles', { credentials: 'include' }),
          fetch('/api/roles/permissions', { credentials: 'include' }),
          fetch('/api/users/me', { credentials: 'include' })
        ]);

        if (!rolesRes.ok) throw new Error('Falha ao buscar roles');
        if (!permissionsRes.ok) throw new Error('Falha ao buscar permissões');
        if (!userRes.ok) throw new Error('Falha ao buscar usuário');
        
        const rolesData = await rolesRes.json();
        const permissionsData = await permissionsRes.json();
        const userData = await userRes.json();
        
        setRoles(rolesData);
        setAvailablePermissions(permissionsData);
        setCurrentUser(userData);
        
        // Selecionar o role do usuário atual por padrão
        const userRole = rolesData.find((r: Role) => r.name === userData.role);
        setSelectedRole(userRole || null);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRoleLabel = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role?.displayName || roleName;
  };

  const hasPermissionInRole = (role: Role, permission: string) => {
    return role.permissions.includes(permission);
  };

  // Filtro de busca
  const filteredRoles = roles.filter(role =>
    role?.displayName?.toLowerCase()?.includes(search.toLowerCase()) ||
    role.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Erro ao carregar permissões
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <PermissionGuard requiredPermission="system:permissions">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sistema de Permissões
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize as permissões de cada função no sistema
          </p>
        </div>

        {/* Informações do Usuário Atual */}
        {currentUser && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Sua Função Atual
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {getRoleLabel(currentUser.role)} - {roles.find(r => r.name === currentUser.role)?.description}
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    {currentUser.permissions.length} permissões ativas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600 dark:text-blue-300">
                  {currentUser.name}
                </div>
                <div className="text-xs text-blue-500 dark:text-blue-400">
                  {currentUser.email}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Roles */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Funções Disponíveis
            </h2>
            {/* Input de busca estilizado */}
            <div className="mb-4 relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar função..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
              />
            </div>
            <div className="space-y-3">
              {filteredRoles.length === 0 && (
                <div className="text-gray-400 text-center py-8">Nenhuma função encontrada</div>
              )}
              {filteredRoles.map((role) => (
                <div
                  key={role._id}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRole?._id === role._id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IconRenderer 
                        iconName={role.icon} 
                        className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" 
                      />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {role.displayName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {role.permissions.length} permissões
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${role.color}`}>
                      {role.name}
                    </span>
                  </div>
                  {role.isSystem && (
                    <div className="mt-2">
                      <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                        Sistema
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detalhes das Permissões */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Permissões - {selectedRole.displayName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedRole.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedRole.permissions.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      permissões
                    </div>
                  </div>
                </div>

                {/* Permissões por Categoria */}
                {availablePermissions && (
                  <div className="space-y-6">
                    {Object.entries(availablePermissions).map(([categoryKey, category]) => (
                      <div key={categoryKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                          {category.title}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(category.permissions).map(([permission, description]) => (
                            <div
                              key={permission}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                hasPermissionInRole(selectedRole, permission)
                                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                              }`}
                            >
                              <div className="flex items-center">
                                {hasPermissionInRole(selectedRole, permission) ? (
                                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                                ) : (
                                  <X className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {description}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {permission}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🛡️</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Selecione uma função
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Clique em uma função na lista para ver suas permissões detalhadas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
} 