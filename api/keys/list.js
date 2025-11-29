import { connectToDatabase, getUserFromToken, formatTimeRemaining } from '../db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = req.headers.authorization;
    const email = getUserFromToken(token);

    if (!email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const panelId = req.query.panelId;

    try {
        const { db } = await connectToDatabase();
        const keysCollection = db.collection('keys');

        let query = { owner: email };
        if (panelId) {
            query.panelId = panelId;
        }

        const userKeys = await keysCollection.find(query).toArray();

        const keys = userKeys.map(k => {
            let status = '🟢 Ativa';
            let expiresIn = 'Não ativada';
            
            // Se nunca foi usada
            if (!k.firstUseAt) {
                status = '🟡 Não ativada';
                const durationDays = k.duration / 86400;
                expiresIn = durationDays >= 365 ? 'Lifetime' : `${durationDays}d (após ativação)`;
            } 
            // Se já foi usada
            else {
                if (k.expiresAt < Date.now()) {
                    status = '🔴 Expirada';
                    expiresIn = 'Expirada';
                } else {
                    expiresIn = formatTimeRemaining(k.expiresAt);
                }
            }

            return {
                key: k.key,
                panelId: k.panelId,
                panelName: k.panelName,
                active: k.active && (!k.expiresAt || k.expiresAt > Date.now()),
                expiresIn: expiresIn,
                status: status,
                uses: k.uses,
                maxUses: k.maxUses,
                hwid: k.hwid ? true : false,
                createdAt: new Date(k.createdAt).toLocaleDateString(),
                firstUseAt: k.firstUseAt ? new Date(k.firstUseAt).toLocaleDateString() : 'Nunca'
            };
        });

        return res.status(200).json({
            success: true,
            keys
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
}
