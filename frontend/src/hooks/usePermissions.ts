import { useState, useEffect } from 'react';

export type Permission =
    // Permissões de Sites
    | 'sites:view'
    | 'sites:view_all'
    | 'sites:create'
    | 'sites:edit'
    | 'sites:delete'

    // Permissões de Usuários
    | 'users:view'
    | 'users:create'
    | 'users:edit'
    | 'users:delete'
    | 'users:approve'
    | 'users:reject'
    | 'users:manage'

    // Permissões de Sistema
    | 'system:settings'
    | 'system:permissions'
    | 'system:logs'
    | 'system:backup'

    // Permissões de Perfil
    | 'profile:view'
    | 'profile:edit'

    // Permissões de Analytics
    | 'analytics:view'
    | 'analytics:export'

    // Permissões de Logs
    | 'logs:view'
    | 'logs:export'

    // Permissões de Roles
    | 'roles:view'
    | 'roles:create'
    | 'roles:edit'
    | 'roles:delete'
    | 'roles:manage'

    // Permissões de Settings (legacy - manter para compatibilidade)
    | 'settings:view'
    | 'settings:edit';

export type Role = 'admin' | 'editor' | 'viewer' | 'pending';

export const usePermissions = () => {
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserPermissions = async () => {
            try {
                const response = await fetch('/api/users/me', { credentials: 'include' });

                if (response.ok) {
                    const userData = await response.json();
                    const role = userData.role as Role;
                    const permissions = userData.permissions || [];

                    setUserRole(role);
                    setUserPermissions(permissions);
                } else {
                    console.error('Failed to fetch user data:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Erro ao buscar permissões do usuário:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserPermissions();
    }, []);

    const hasPermission = (permission: Permission): boolean => {
        return userPermissions.includes(permission);
    };

    const hasAnyPermission = (permissions: Permission[]): boolean => {
        return permissions.some(permission => hasPermission(permission));
    };

    const hasAllPermissions = (permissions: Permission[]): boolean => {
        return permissions.every(permission => hasPermission(permission));
    };

    const isAdmin = (): boolean => {
        return userRole === 'admin';
    };

    const isEditor = (): boolean => {
        return userRole === 'editor';
    };

    const isViewer = (): boolean => {
        return userRole === 'viewer';
    };

    const isPending = (): boolean => {
        return userRole === 'pending';
    };

    const canManageUsers = (): boolean => {
        return hasPermission('users:view') || hasPermission('users:create') || hasPermission('users:edit');
    };

    const canManageSites = (): boolean => {
        return hasPermission('sites:create') || hasPermission('sites:edit') || hasPermission('sites:delete');
    };

    const canViewAllSites = (): boolean => {
        return hasPermission('sites:view_all');
    };

    const canViewAssociatedSites = (): boolean => {
        return hasPermission('sites:view');
    };

    return {
        userRole,
        userPermissions,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAdmin,
        isEditor,
        isViewer,
        isPending,
        canManageUsers,
        canManageSites,
        canViewAllSites,
        canViewAssociatedSites
    };
}; 