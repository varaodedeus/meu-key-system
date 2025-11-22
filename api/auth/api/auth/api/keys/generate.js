import { users, allKeys, getUserFromToken, generateRandomKey } from '../db.js';

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

    const user = users.get(email);

    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    const { duration = 86400 } = req.body;

    const keyValue = generateRandomKey();
    
    const newKey = {
        key: keyValue,
        owner: email,
        createdAt: Date.now(),
        expiresAt: Date.now() + (duration * 1000),
        maxUses: 5,
        uses: 0,
        active: true,
        hwid: null
    };

    if (!user.keys) user.keys = [];
    user.keys.push(newKey);

    allKeys.set(keyValue, newKey);

    return res.status(200).json({
        success: true,
        key: keyValue,
        expiresIn: `${duration / 3600}h`
    });
}
