import { apiClient } from '../client';

// Tipos para Sites
export interface Site {
    _id: string;
    name: string;
    url: string;
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: string;
    isActive: boolean;
    users: User[];
    createdAt: string;
    updatedAt: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export interface CreateSiteData {
    name: string;
    url: string;
    description?: string;
    users?: string[];
}

export interface UpdateSiteData {
    name?: string;
    url?: string;
    description?: string;
    users?: string[];
    isActive?: boolean;
}

// Serviço de Sites
export class SitesService {
    /**
     * Busca todos os sites
     */
    async getAllSites(): Promise<Site[]> {
        return apiClient.get<Site[]>('/sites');
    }

    /**
     * Busca um site por ID
     */
    async getSiteById(id: string): Promise<Site> {
        return apiClient.get<Site>(`/sites/${id}`);
    }

    /**
     * Cria um novo site
     */
    async createSite(data: CreateSiteData): Promise<{ message: string; site: Site }> {
        return apiClient.post<{ message: string; site: Site }>('/sites', data);
    }

    /**
     * Atualiza um site
     */
    async updateSite(id: string, data: UpdateSiteData): Promise<{ message: string; site: Site }> {
        return apiClient.put<{ message: string; site: Site }>(`/sites/${id}`, data);
    }

    /**
     * Remove um site
     */
    async deleteSite(id: string): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/sites/${id}`);
    }

    /**
     * Atualiza meta tags de um site
     */
    async refreshMetaTags(id: string): Promise<{ message: string; site: Site }> {
        return apiClient.post<{ message: string; site: Site }>(`/sites/${id}/refresh-meta`);
    }

    /**
     * Adiciona usuário a um site
     */
    async addUserToSite(userId: string, siteId: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>('/sites/add-user', { userId, siteId });
    }

    /**
     * Remove usuário de um site
     */
    async removeUserFromSite(userId: string, siteId: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>('/sites/remove-user', { userId, siteId });
    }
}

// Instância singleton do serviço
export const sitesService = new SitesService(); 