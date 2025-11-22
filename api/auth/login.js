import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

        return res.status(200).json({
            success: true,
            token,
            user: {
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
}
