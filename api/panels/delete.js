import { connectToDatabase, getUserFromToken } from '../db.js';

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

    const { libraryId } = req.body;

    if (!libraryId) {
        return res.status(400).json({ error: 'Library ID is required' });
    }

    try {
        const { db } = await connectToDatabase();
        const panelsCollection = db.collection('panels');
        const keysCollection = db.collection('keys');

        // Verificar se painel existe e pertence ao usuário
        const panel = await panelsCollection.findOne({ libraryId, owner: email });

        if (!panel) {
            return res.status(404).json({ error: 'Panel not found' });
        }

        // Deletar todas as keys do painel
        await keysCollection.deleteMany({ panelId: libraryId });

        // Deletar o painel
        await panelsCollection.deleteOne({ libraryId });

        return res.status(200).json({
            success: true,
            message: 'Panel and all keys deleted'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
}
