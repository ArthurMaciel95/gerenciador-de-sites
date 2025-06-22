// Formatação de datas
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options,
    };

    return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
    return formatDate(date, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'agora mesmo';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
    }

    return formatDate(dateObj);
}

// Formatação de URLs
export function formatUrl(url: string): string {
    if (!url) return '';

    // Remove protocolo se existir
    let formatted = url.replace(/^https?:\/\//, '');

    // Remove www se existir
    formatted = formatted.replace(/^www\./, '');

    // Limita o tamanho
    if (formatted.length > 50) {
        formatted = formatted.substring(0, 47) + '...';
    }

    return formatted;
}

export function getDomainFromUrl(url: string): string {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

// Formatação de texto
export function truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function capitalizeFirst(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function formatRole(role: string): string {
    const roleMap: Record<string, string> = {
        admin: 'Administrador',
        editor: 'Editor',
        viewer: 'Visualizador',
        pending: 'Pendente',
    };

    return roleMap[role] || capitalizeFirst(role);
}

export function formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
        active: 'Ativo',
        pending: 'Pendente',
        rejected: 'Rejeitado',
        inactive: 'Inativo',
    };

    return statusMap[status] || capitalizeFirst(status);
}

// Formatação de números
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('pt-BR').format(num);
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
    }).format(value);
}

// Formatação de tamanhos de arquivo
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Formatação de CPF/CNPJ
export function formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);

    if (match) {
        return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }

    return cpf;
}

export function formatCNPJ(cnpj: string): string {
    const cleaned = cnpj.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);

    if (match) {
        return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
    }

    return cnpj;
}

// Formatação de telefone
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }

    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }

    return phone;
}

// Formatação de CEP
export function formatCEP(cep: string): string {
    const cleaned = cep.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{5})(\d{3})$/);

    if (match) {
        return `${match[1]}-${match[2]}`;
    }

    return cep;
} 