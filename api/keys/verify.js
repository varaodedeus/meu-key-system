import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
    // CORS headers importantes para Roblox
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Aceitar GET e POST
    let key, hwid, panelId;

    if (req.method === 'GET') {
        key = req.query.key;
        hwid = req.query.hwid;
        panelId = req.query.panelId;
    } else {
        key = req.body?.key;
        hwid = req.body?.hwid;
        panelId = req.body?.panelId;
    }

    if (!key) {
        return res.status(200).json({ valid: false, error: 'Key not provided' });
    }

    if (!panelId) {
        return res.status(200).json({ valid: false, error: 'Panel ID not provided' });
    }

    try {
        const { db } = await connectToDatabase();
        const keysCollection = db.collection('keys');

        const foundKey = await keysCollection.findOne({ key, panelId });

        if (!foundKey) {
            return res.status(200).json({ valid: false, error: 'Invalid key' });
        }

        if (foundKey.expiresAt < Date.now()) {
            await keysCollection.updateOne({ key }, { $set: { active: false } });
            return res.status(200).json({ valid: false, error: 'Key expired' });
        }

        if (foundKey.hwid && foundKey.hwid !== hwid) {
            return res.status(200).json({ valid: false, error: 'Key linked to another device' });
        }

        if (foundKey.uses >= foundKey.maxUses) {
            await keysCollection.updateOne({ key }, { $set: { active: false } });
            return res.status(200).json({ valid: false, error: 'Key usage limit reached' });
        }

        await keysCollection.updateOne(
            { key },
            { 
                $set: { hwid: hwid || foundKey.hwid, lastUsed: Date.now() },
                $inc: { uses: 1 }
            }
        );

        const hoursRemaining = Math.floor((foundKey.expiresAt - Date.now()) / (1000 * 60 * 60));

        return res.status(200).json({
            valid: true,
            message: 'Key is valid!',
            data: {
                panelName: foundKey.panelName,
                usesRemaining: foundKey.maxUses - foundKey.uses - 1,
                expiresIn: hoursRemaining > 24 ? Math.floor(hoursRemaining/24) + 'd' : hoursRemaining + 'h'
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(200).json({ valid: false, error: 'Server error' });
    }
}
