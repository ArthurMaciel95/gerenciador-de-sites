'use client';

import { useState, useEffect, useCallback } from 'react';
import { sitesService, Site, CreateSiteData, UpdateSiteData } from '@/lib/api/services/sites';
import { ApiException } from '@/lib/api/config';

interface UseSitesReturn {
    sites: Site[];
    loading: boolean;
    error: string | null;
    refreshSites: () => Promise<void>;
    createSite: (data: CreateSiteData) => Promise<Site>;
    updateSite: (id: string, data: UpdateSiteData) => Promise<Site>;
    deleteSite: (id: string) => Promise<void>;
    refreshMetaTags: (id: string) => Promise<Site>;
}

export function useSites(): UseSitesReturn {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Buscar sites
    const fetchSites = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await sitesService.getAllSites();
            setSites(data);
        } catch (err) {
            const errorMessage = err instanceof ApiException ? err.message : 'Erro ao buscar sites';
            setError(errorMessage);
            console.error('Erro ao buscar sites:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Criar site
    const createSite = useCallback(async (data: CreateSiteData): Promise<Site> => {
        try {
            setError(null);
            const response = await sitesService.createSite(data);
            await fetchSites(); // Recarregar lista
            return response.site;
        } catch (err) {
            const errorMessage = err instanceof ApiException ? err.message : 'Erro ao criar site';
            setError(errorMessage);
            throw err;
        }
    }, [fetchSites]);

    // Atualizar site
    const updateSite = useCallback(async (id: string, data: UpdateSiteData): Promise<Site> => {
        try {
            setError(null);
            const response = await sitesService.updateSite(id, data);

            // Atualizar site na lista local
            setSites(prevSites =>
                prevSites.map(site =>
                    site._id === id ? response.site : site
                )
            );

            return response.site;
        } catch (err) {
            const errorMessage = err instanceof ApiException ? err.message : 'Erro ao atualizar site';
            setError(errorMessage);
            throw err;
        }
    }, []);

    // Remover site
    const deleteSite = useCallback(async (id: string): Promise<void> => {
        try {
            setError(null);
            await sitesService.deleteSite(id);

            // Remover site da lista local
            setSites(prevSites => prevSites.filter(site => site._id !== id));
        } catch (err) {
            const errorMessage = err instanceof ApiException ? err.message : 'Erro ao remover site';
            setError(errorMessage);
            throw err;
        }
    }, []);

    // Atualizar meta tags
    const refreshMetaTags = useCallback(async (id: string): Promise<Site> => {
        try {
            setError(null);
            const response = await sitesService.refreshMetaTags(id);

            // Atualizar site na lista local
            setSites(prevSites =>
                prevSites.map(site =>
                    site._id === id ? response.site : site
                )
            );

            return response.site;
        } catch (err) {
            const errorMessage = err instanceof ApiException ? err.message : 'Erro ao atualizar meta tags';
            setError(errorMessage);
            throw err;
        }
    }, []);

    // Carregar sites na montagem do componente
    useEffect(() => {
        fetchSites();
    }, [fetchSites]);

    return {
        sites,
        loading,
        error,
        refreshSites: fetchSites,
        createSite,
        updateSite,
        deleteSite,
        refreshMetaTags,
    };
} 