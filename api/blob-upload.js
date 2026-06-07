import { handleUpload } from '@vercel/blob/client';

export default async function handler(request) {
    const body = await request.json();

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: [
                    'text/csv',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/octet-stream',
                ],
                addRandomSuffix: true,
            }),
            onUploadCompleted: async () => {
                // Nothing to do — Flask processes and deletes the blob immediately
            },
        });

        return Response.json(jsonResponse);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
    }
}
