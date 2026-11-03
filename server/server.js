import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiPlugin } from './apiPlugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = process.env.PORT || 5173;

const plugin = apiPlugin();
const mockServer = {
  middlewares: {
    use: (fn) => {
      mockServer.handler = fn;
    },
  },
};
plugin.configureServer(mockServer);

const server = http.createServer((req, res) => {
  // Try api middleware first
  mockServer.handler(req, res, () => {
    // Serve static files from dist
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webm': 'video/webm',
        '.mp4': 'video/mp4',
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ChatWorld server listening at http://0.0.0.0:${PORT}`);
});
