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

    // Validate pathname before issuing a token — reject any path separators or non-CSV/XLSX names
    const pathname = body?.payload?.pathname || '';
    if (/[/\\]/.test(pathname) || !/^[\w\-]+\.(csv|xlsx)$/i.test(pathname)) {
        res.status(400).json({ error: 'Invalid file name. Only .csv and .xlsx files are accepted.' });
        return;
    }

    try {
        const jsonResponse = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: [
                    'text/csv',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ],
                maximumSizeInBytes: 20 * 1024 * 1024, // 20 MB — well above any real Teletrax export
                addRandomSuffix: false,
                allowOverwrite: true,
                access: 'public',
            }),
            onUploadCompleted: async () => {},
        });

        res.status(200).json(jsonResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
