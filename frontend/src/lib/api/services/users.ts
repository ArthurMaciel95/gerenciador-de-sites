import { apiClient } from '../client';

// Tipos para Usuários
export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: 'pending' | 'active' | 'rejected';
    isActive: boolean;
    sites: Site[];
    createdAt: string;
    updatedAt: string;
}

export interface Site {
    _id: string;
    name: string;
    url: string;
}

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: string;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    status?: 'pending' | 'active' | 'rejected';
    isActive?: boolean;
}

export interface UpdateProfileData {
    name?: string;
    email?: string;
    password?: string;
}

// Serviço de Usuários
export class UsersService {
    /**
     * Busca todos os usuários
     */
    async getAllUsers(): Promise<User[]> {
        return apiClient.get<User[]>('/users');
    }

    /**
     * Busca usuários pendentes
     */
    async getPendingUsers(): Promise<User[]> {
        return apiClient.get<User[]>('/users/pending');
    }

    /**
     * Busca um usuário por ID
     */
    async getUserById(id: string): Promise<User> {
        return apiClient.get<User>(`/users/${id}`);
    }

    /**
     * Busca o usuário atual
     */
    async getCurrentUser(): Promise<User> {
        return apiClient.get<User>('/users/me');
    }

    /**
     * Cria um novo usuário
     */
    async createUser(data: CreateUserData): Promise<{ message: string; user: User }> {
        return apiClient.post<{ message: string; user: User }>('/users', data);
    }

    /**
     * Atualiza um usuário
     */
    async updateUser(id: string, data: UpdateUserData): Promise<{ message: string; user: User }> {
        return apiClient.put<{ message: string; user: User }>(`/users/${id}`, data);
    }

    /**
     * Atualiza o perfil do usuário atual
     */
    async updateProfile(data: UpdateProfileData): Promise<{ message: string; user: User }> {
        return apiClient.put<{ message: string; user: User }>('/users/profile', data);
    }

    /**
     * Remove um usuário
     */
    async deleteUser(id: string): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/users/${id}`);
    }

    /**
     * Aprova um usuário pendente
     */
    async approveUser(id: string): Promise<{ message: string; user: User }> {
        return apiClient.post<{ message: string; user: User }>(`/users/${id}/approve`);
    }

    /**
     * Rejeita um usuário pendente
     */
    async rejectUser(id: string): Promise<{ message: string; user: User }> {
        return apiClient.post<{ message: string; user: User }>(`/users/${id}/reject`);
    }

    /**
     * Adiciona usuário a um site
     */
    async addUserToSite(userId: string, siteId: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>('/users/add-to-site', { userId, siteId });
    }

    /**
     * Remove usuário de um site
     */
    async removeUserFromSite(userId: string, siteId: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>('/users/remove-from-site', { userId, siteId });
    }
}

// Instância singleton do serviço
export const usersService = new UsersService(); 