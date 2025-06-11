"use strict";
const functions = require('firebase-functions');
const next = require('next');
const nextjsDistDir = './.next';
const dev = process.env.NODE_ENV !== 'production';
const app = next({
    dev,
    conf: {
        distDir: nextjsDistDir,
    },
});
const handle = app.getRequestHandler();
exports.nextjsFunc = functions
    .runWith({
    memory: '2GB',
    timeoutSeconds: 540,
})
    .https
    .onRequest(async (req, res) => {
    console.log('Firebase function executing...');
    console.log('Request URL:', req.url);
    try {
        // Prepare the Next.js app
        await app.prepare();
        // Handle the request
        return handle(req, res);
    }
    catch (error) {
        console.error('Error in nextjsFunc:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=index.js.map