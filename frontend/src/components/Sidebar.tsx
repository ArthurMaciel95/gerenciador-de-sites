'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Shield, Settings, LogOut, User, Crown } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, canManageUsers, canManageSites } = usePermissions();

  const logoutHandler = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Definir itens de navegação baseados em permissões
  const getNavItems = () => {
    const items = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
      { name: 'Meu Perfil', href: '/dashboard/profile', icon: User, show: hasPermission('profile:view') },
      { name: 'Permissões', href: '/dashboard/permissions', icon: Shield, show: hasPermission('system:permissions') },
    ];

    // Adicionar itens condicionalmente baseado em permissões
    if (hasPermission('roles:view')) {
      items.push({ name: 'Roles', href: '/dashboard/roles', icon: Crown, show: true });
    }

    if (canManageUsers()) {
      items.push({ name: 'Usuários', href: '/dashboard/users', icon: Users, show: true });
    }

    if (canManageSites()) {
      items.push({ name: 'Sites', href: '/dashboard/sites', icon: LayoutDashboard, show: true });
    }

    if (hasPermission('system:settings')) {
      items.push({ name: 'Configurações', href: '/dashboard/settings', icon: Settings, show: true });
    }

    return items.filter(item => item.show);
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
        CMS
      </div>
      <nav className="flex-grow px-2 py-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-4 py-2 mt-2 text-sm font-semibold rounded-lg transition-colors duration-200
              ${
                pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="px-2 py-4 border-t border-gray-700">
         <button
          onClick={logoutHandler}
          className="w-full flex items-center px-4 py-2 mt-2 text-sm font-semibold text-left text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
} 