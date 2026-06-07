import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Read body from IncomingMessage stream
    const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error('Invalid JSON')); }
        });
        req.on('error', reject);
    });

    try {
        const jsonResponse = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: [
                    'text/csv',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/octet-stream',
                ],
                addRandomSuffix: false,
                allowOverwrite: true,
                // Public store required for client-side PUT uploads
                access: 'public',
            }),
            onUploadCompleted: async () => {},
        });

        res.status(200).json(jsonResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
