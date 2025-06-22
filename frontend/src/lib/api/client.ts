import { API_CONFIG, ApiException } from './config';

// Cliente HTTP base
class ApiClient {
    private baseURL: string;
    private timeout: number;
    private defaultHeaders: Record<string, string>;

    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.timeout = API_CONFIG.timeout;
        this.defaultHeaders = API_CONFIG.headers;
    }

    /**
     * Obtém o token de autenticação
     */
    private getAuthToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }

    /**
     * Cria headers para a requisição
     */
    private createHeaders(customHeaders?: Record<string, string>): Record<string, string> {
        const token = this.getAuthToken();
        const headers = { ...this.defaultHeaders, ...customHeaders };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Faz uma requisição HTTP
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.createHeaders(options.headers as Record<string, string>);

        const config: RequestInit = {
            ...options,
            headers,
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = 'Erro na requisição';
                let errorData: any = {};

                try {
                    errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Se não conseguir parsear o JSON, usa a mensagem padrão
                }

                throw new ApiException(errorMessage, response.status, errorData.code);
            }

            // Se a resposta for vazia, retorna null
            if (response.status === 204) {
                return null as T;
            }

            // Tenta fazer parse do JSON
            try {
                return await response.json();
            } catch {
                // Se não conseguir parsear, retorna a resposta como texto
                return response.text() as T;
            }
        } catch (error) {
            if (error instanceof ApiException) {
                throw error;
            }

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new ApiException('Timeout na requisição', 408);
                }
                throw new ApiException(error.message, 500);
            }

            throw new ApiException('Erro desconhecido', 500);
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const url = params ? this.buildUrlWithParams(endpoint, params) : endpoint;
        return this.request<T>(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    /**
     * Constrói URL com parâmetros de query
     */
    private buildUrlWithParams(endpoint: string, params: Record<string, any>): string {
        const url = new URL(endpoint, this.baseURL);

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });

        return url.pathname + url.search;
    }
}

// Instância singleton do cliente
export const apiClient = new ApiClient(); 