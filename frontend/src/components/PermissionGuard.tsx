'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAny?: boolean; // true = qualquer uma das permissões, false = todas as permissões
  fallback?: ReactNode;
  showLoading?: boolean;
}

export default function PermissionGuard({
  children,
  requiredPermission,
  requiredPermissions,
  requireAny = true,
  fallback,
  showLoading = true
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Mostrar loading se solicitado
  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Verificar permissão única
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">🚫</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Acesso Negado
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }

  // Verificar múltiplas permissões
  if (requiredPermissions) {
    const hasAccess = requireAny 
      ? hasAnyPermission(requiredPermissions)
      : hasAllPermissions(requiredPermissions);

    if (!hasAccess) {
      return fallback || (
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Você não tem as permissões necessárias para acessar esta página.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
} 