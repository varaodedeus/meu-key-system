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

    try {
        const { db } = await connectToDatabase();
        const keysCollection = db.collection('keys');

        const userKeys = await keysCollection.find({ owner: email }).toArray();

        const keys = userKeys.map(k => ({
            key: k.key,
            active: k.active && k.expiresAt > Date.now(),
            expiresIn: formatTimeRemaining(k.expiresAt),
            uses: k.uses,
            maxUses: k.maxUses,
            hwid: k.hwid ? true : false,
            createdAt: new Date(k.createdAt).toLocaleDateString()
        }));

        return res.status(200).json({
            success: true,
            keys
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
}
