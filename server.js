const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const musicDir = path.join(os.homedir(), 'Music');
const port = 8080;

// Ensure directory exists
if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
}

let clients = [];

// Watch the directory for changes
// fs.watch can be slightly unstable on Windows, so we'll add debounce logic
let watchTimeout = null;
fs.watch(musicDir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.toLowerCase().endsWith('.mp3')) {
        // Log to see what's happening
        // log(`Watch event: ${eventType} on ${filename}`);

        if (watchTimeout) clearTimeout(watchTimeout);
        watchTimeout = setTimeout(() => {
            log(`File system change detected: ${eventType} ${filename}. Notifying clients.`);
            clients.forEach(c => c.write('data: update\n\n'));
        }, 2000); // 2 second debounce
    }
});

const logFile = path.join(__dirname, 'server.log');
const log = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    console.log(msg);
};

const server = http.createServer((req, res) => {
    // CORS headers just in case
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 1. Server-Sent Events endpoint
    if (req.url === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        clients.push(res);
        req.on('close', () => {
            clients = clients.filter(c => c !== res);
        });
        return;
    }

    // 2. Library list endpoint
    if (req.url === '/api/library') {
        const getAllFiles = (dirPath, arrayOfFiles) => {
            const files = fs.readdirSync(dirPath);
            arrayOfFiles = arrayOfFiles || [];
            files.forEach((file) => {
                const fullPath = path.join(dirPath, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
                } else if (file.toLowerCase().endsWith('.mp3')) {
                    // Store relative path from musicDir
                    arrayOfFiles.push(path.relative(musicDir, fullPath));
                }
            });
            return arrayOfFiles;
        };

        try {
            const mp3s = getAllFiles(musicDir);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(mp3s));
        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // 3. Serve Music files with Range support
    if (req.url.startsWith('/music/')) {
        const decoded = decodeURIComponent(req.url.replace('/music/', ''));
        const filePath = path.join(musicDir, decoded);

        fs.stat(filePath, (err, stat) => {
            if (err) {
                res.writeHead(404);
                return res.end('Not found');
            }
            const fileSize = stat.size;

            if (req.method === 'HEAD') {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': 'audio/mpeg',
                    'Accept-Ranges': 'bytes'
                });
                return res.end();
            }

            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

                // Clamp end to file size
                if (end >= fileSize) end = fileSize - 1;

                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(filePath, { start, end });
                log(`Range: ${range} -> Serving ${chunksize} bytes for ${decoded}`);

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'audio/mpeg',
                });

                file.on('error', (err) => {
                    log(`Stream Error: ${err.message}`);
                    res.end();
                });

                file.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': 'audio/mpeg',
                    'Accept-Ranges': 'bytes'
                });
                fs.createReadStream(filePath).pipe(res);
            }
        });
        return;
    }

    // 4. Serve static frontend files
    let staticPath = '.' + req.url;
    // Remove query params if any
    staticPath = staticPath.split('?')[0];
    if (staticPath === './') staticPath = './index.html';

    // Safety check: ensure file path doesn't escape directory
    if (!path.resolve(staticPath).startsWith(process.cwd())) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    const ext = path.extname(staticPath);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(staticPath, (err, content) => {
        if (err) {
            if (err.code == 'ENOENT') {
                res.writeHead(404);
                res.end('404');
            }
            else {
                res.writeHead(500);
                res.end('500');
            }
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

});

server.listen(port, () => {
    log(`Server running at http://localhost:${port}/`);
    log(`Music directory: ${musicDir}`);
});
