import { connectToDatabase, getUserFromToken, generateRandomKey } from '../db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = req.headers.authorization;
    const email = getUserFromToken(token);

    if (!email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { duration = 86400, panelId } = req.body;

    if (!panelId) {
        return res.status(400).json({ error: 'Panel ID is required' });
    }

    try {
        const { db } = await connectToDatabase();
        const panelsCollection = db.collection('panels');
        const keysCollection = db.collection('keys');

        // Verificar se painel existe e pertence ao usuário
        const panel = await panelsCollection.findOne({ libraryId: panelId, owner: email });

        if (!panel) {
            return res.status(404).json({ error: 'Panel not found' });
        }

        const keyValue = generateRandomKey();
        
        const newKey = {
            key: keyValue,
            panelId,
            panelName: panel.name,
            owner: email,
            createdAt: Date.now(),
            expiresAt: Date.now() + (duration * 1000),
            maxUses: 999,
            uses: 0,
            active: true,
            hwid: null
        };

        await keysCollection.insertOne(newKey);

        return res.status(200).json({
            success: true,
            key: keyValue,
            expiresIn: duration >= 31536000 ? 'Lifetime' : `${duration / 86400}d`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
}
