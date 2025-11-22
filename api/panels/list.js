import { connectToDatabase, getUserFromToken } from '../db.js';

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

    try {
        const { db } = await connectToDatabase();
        const panelsCollection = db.collection('panels');
        const keysCollection = db.collection('keys');

        const userPanels = await panelsCollection.find({ owner: email }).toArray();

        const panels = [];

        for (const p of userPanels) {
            const keyCount = await keysCollection.countDocuments({ panelId: p.libraryId });
            panels.push({
                name: p.name,
                libraryId: p.libraryId,
                keyCount: keyCount,
                createdAt: new Date(p.createdAt).toLocaleDateString()
            });
        }

        return res.status(200).json({
            success: true,
            panels
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
}
