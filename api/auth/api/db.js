// Banco de dados em memória
// ATENÇÃO: Os dados são perdidos quando o servidor reinicia!
// Para dados permanentes, use: MongoDB Atlas, Supabase, ou Vercel KV

// Armazena usuários
export const users = new Map();

// Armazena todas as keys (para busca rápida)
export const allKeys = new Map();

// Função auxiliar para extrair email do token
export function getUserFromToken(token) {
    try {
        if (!token) return null;
        const cleanToken = token.replace('Bearer ', '');
        const decoded = Buffer.from(cleanToken, 'base64').toString();
        const email = decoded.split(':')[0];
        return email;
    } catch {
        return null;
    }
}

// Função para gerar key aleatória
export function generateRandomKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'KEY-';
    for (let i = 0; i < 16; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// Função para formatar tempo restante
export function formatTimeRemaining(expiresAt) {
    const now = Date.now();
    const diff = expiresAt - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m`;
}
