import { connectToDatabase, getUserFromToken, generateLibraryId } from '../db.js';

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

    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Panel name is required' });
    }

    const panelName = name.trim();

    if (panelName.length < 3 || panelName.length > 30) {
        return res.status(400).json({ error: 'Name must be 3-30 characters' });
    }

    try {
        const { db } = await connectToDatabase();
        const panelsCollection = db.collection('panels');

        // Verificar se nome já existe (global, não pode repetir)
        const existingPanel = await panelsCollection.findOne({ 
            name: { $regex: new RegExp(`^${panelName}$`, 'i') } 
        });

        if (existingPanel) {
            return res.status(400).json({ error: 'Panel name already exists. Choose another name.' });
        }

        // Gerar Library ID único
        let libraryId;
        let isUnique = false;
        
        while (!isUnique) {
            libraryId = generateLibraryId();
            const existingId = await panelsCollection.findOne({ libraryId });
            if (!existingId) isUnique = true;
        }

        // Criar painel
        const newPanel = {
            name: panelName,
            libraryId,
            owner: email,
            keys: [],
            createdAt: Date.now()
        };

        await panelsCollection.insertOne(newPanel);

        return res.status(201).json({
            success: true,
            panel: {
                name: panelName,
                libraryId
            },
            message: 'Panel created successfully'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database error' });
    }
}
