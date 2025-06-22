import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Esta função pode ser marcada como `async` se você usar `await` dentro dela.
export function middleware(request: NextRequest) {
    // Tenta obter o token do cookie
    const token = request.cookies.get('authToken');
    console.log('Middleware: Token found:', token);
    // Se não houver token e o usuário tentar acessar uma rota protegida,
    // redireciona para a página de login.
    if (!token) {
        console.log('Middleware: No token found, redirecting to login.');
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Se houver um token, permite que a requisição continue.
    console.log('Middleware: Token found, allowing access.');
    return NextResponse.next();
}

// O "matcher" define em quais rotas o middleware será executado.
export const config = {
    matcher: '/dashboard/:path*',
}; 