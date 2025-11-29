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

        // ✅ PRIMEIRA VEZ USANDO A KEY
        if (!foundKey.firstUseAt) {
            const now = Date.now();
            const expiresAt = now + (foundKey.duration * 1000);

            await keysCollection.updateOne(
                { key },
                { 
                    $set: { 
                        hwid: hwid || null,
                        firstUseAt: now,
                        expiresAt: expiresAt,
                        lastUsed: now
                    },
                    $inc: { uses: 1 }
                }
            );

            const hoursRemaining = Math.floor((expiresAt - now) / (1000 * 60 * 60));

            return res.status(200).json({
                valid: true,
                message: 'Key ativada com sucesso! Timer iniciado.',
                data: {
                    panelName: foundKey.panelName,
                    usesRemaining: foundKey.maxUses - 1,
                    expiresIn: hoursRemaining > 24 ? Math.floor(hoursRemaining/24) + 'd' : hoursRemaining + 'h',
                    firstUse: true
                }
            });
        }

        // ✅ KEY JÁ FOI USADA ANTES

        // Verificar expiração
        if (foundKey.expiresAt < Date.now()) {
            await keysCollection.updateOne({ key }, { $set: { active: false } });
            return res.status(200).json({ valid: false, error: 'Key expired' });
        }

        // Verificar HWID
        if (foundKey.hwid && foundKey.hwid !== hwid) {
            return res.status(200).json({ vali
