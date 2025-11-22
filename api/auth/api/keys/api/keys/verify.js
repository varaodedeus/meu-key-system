import { allKeys, users } from '../db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ valid: false, error: 'Method not allowed' });
    }

    const { key, hwid } = req.body;

    if (!key) {
        return res.status(200).json({ valid: false, error: 'Key not provided' });
    }

    let foundKey = allKeys.get(key);

    if (!foundKey) {
        for (const [email, user] of users.entries()) {
            if (!user.keys) continue;
            const k = user.keys.find(k => k.key === key);
            if (k) {
                foundKey = k;
                break;
            }
        }
    }

    if (!foundKey) {
        return res.status(200).json({ valid: false, error: 'Key not found' });
    }

    if (foundKey.expiresAt < Date.now()) {
        foundKey.active = false;
        return res.status(200).json({ valid: false, error: 'Key expired' });
    }

    if (foundKey.hwid && foundKey.hwid !== hwid) {
        return res.status(200).json({ valid: false, error: 'Key linked to another device' });
    }

    if (!foundKey.hwid && hwid) {
        foundKey.hwid = hwid;
    }

    if (foundKey.uses >= foundKey.maxUses) {
        foundKey.active = false;
        return res.status(200).json({ valid: false, error: 'Key usage limit reached' });
    }

    foundKey.uses++;
    foundKey.lastUsed = Date.now();

    const hoursRemaining = Math.floor((foundKey.expiresAt - Date.now()) / (1000 * 60 * 60));

    return res.status(200).json({
        valid: true,
        message: 'Key is valid!',
        data: {
            owner: foundKey.owner,
            usesRemaining: foundKey.maxUses - foundKey.uses,
            expiresIn: `${hoursRemaining}h`
        }
    });
}
