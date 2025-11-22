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

    const { key } = req.body;

    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }

    try {
        const { db } = await connectToDatabase();
        const keysCollection = db.collection('keys');

        const foundKey = await keysCollection.findOne({ key, owner: email });

        if (!foundKey) {
            return res.status(404).json({ error: 'Key not found' });
        }

        await keysCollection.updateOne(
            { key },
            { $set: { hwid: null } }
        );

        return res.status(200).json({
            success: true,
            message: 'HWID reset successfully'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
}
