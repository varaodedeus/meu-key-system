import { users } from '../db.js';

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

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (users.has(email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    users.set(email, {
        username,
        email,
        password,
        keys: [],
        createdAt: new Date().toISOString()
    });

    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    return res.status(201).json({
        success: true,
        token,
        message: 'Account created successfully'
    });
}
