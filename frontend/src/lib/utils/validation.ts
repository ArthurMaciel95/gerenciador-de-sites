// Tipos de validação
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
}

export interface ValidationRules {
    [key: string]: ValidationRule;
}

export interface ValidationErrors {
    [key: string]: string;
}

// Funções de validação
export const validators = {
    required: (value: any): string | null => {
        if (value === null || value === undefined || value === '') {
            return 'Este campo é obrigatório';
        }
        return null;
    },

    minLength: (value: string, min: number): string | null => {
        if (value && value.length < min) {
            return `Mínimo de ${min} caracteres`;
        }
        return null;
    },

    maxLength: (value: string, max: number): string | null => {
        if (value && value.length > max) {
            return `Máximo de ${max} caracteres`;
        }
        return null;
    },

    pattern: (value: string, pattern: RegExp, message: string): string | null => {
        if (value && !pattern.test(value)) {
            return message;
        }
        return null;
    },

    email: (value: string): string | null => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailPattern.test(value)) {
            return 'Email inválido';
        }
        return null;
    },

    url: (value: string): string | null => {
        try {
            if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                return 'URL deve começar com http:// ou https://';
            }
            new URL(value);
            return null;
        } catch {
            return 'URL inválida';
        }
    },

    password: (value: string): string | null => {
        if (value && value.length < 6) {
            return 'Senha deve ter pelo menos 6 caracteres';
        }
        return null;
    },
};

// Padrões comuns
export const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/.+/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
};

// Função principal de validação
export function validateField(value: any, rules: ValidationRule): string | null {
    // Validação obrigatória
    if (rules.required) {
        const requiredError = validators.required(value);
        if (requiredError) return requiredError;
    }

    // Se o valor está vazio e não é obrigatório, não valida mais
    if (!value) return null;

    // Validações de string
    if (typeof value === 'string') {
        if (rules.minLength) {
            const minError = validators.minLength(value, rules.minLength);
            if (minError) return minError;
        }

        if (rules.maxLength) {
            const maxError = validators.maxLength(value, rules.maxLength);
            if (maxError) return maxError;
        }

        if (rules.pattern) {
            const patternError = validators.pattern(value, rules.pattern, 'Formato inválido');
            if (patternError) return patternError;
        }
    }

    // Validação customizada
    if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) return customError;
    }

    return null;
}

// Validar formulário completo
export function validateForm(data: any, rules: ValidationRules): ValidationErrors {
    const errors: ValidationErrors = {};

    Object.keys(rules).forEach(field => {
        const value = data[field];
        const fieldRules = rules[field];
        const error = validateField(value, fieldRules);

        if (error) {
            errors[field] = error;
        }
    });

    return errors;
}

// Verificar se o formulário é válido
export function isFormValid(errors: ValidationErrors): boolean {
    return Object.keys(errors).length === 0;
}

// Regras de validação comuns
export const commonRules = {
    name: {
        required: true,
        minLength: 2,
        maxLength: 100,
    },

    email: {
        required: true,
        pattern: patterns.email,
    },

    password: {
        required: true,
        minLength: 6,
    },

    url: {
        required: true,
        pattern: patterns.url,
    },

    description: {
        maxLength: 500,
    },
}; 