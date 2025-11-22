import { connectToDatabase } from '../db.js';

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

    try {
        const { db } = await connectToDatabase();
        const keysCollection = db.collection('keys');

        const foundKey = await keysCollection.findOne({ key });

        if (!foundKey) {
            return res.status(200).json({ valid: false, error: 'Key not found' });
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

        // Atualizar key
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
                owner: foundKey.owner,
                usesRemaining: foundKey.maxUses - foundKey.uses - 1,
                expiresIn: `${hoursRemaining}h`
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ valid: false, error: 'Database error' });
    }
}
