// Configuração base da API
export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
};

// Tipos de resposta da API
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Tipos de erro da API
export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

// Classe base para erros da API
export class ApiException extends Error {
    public status: number;
    public code?: string;

    constructor(message: string, status: number = 500, code?: string) {
        super(message);
        this.name = 'ApiException';
        this.status = status;
        this.code = code;
    }
} 