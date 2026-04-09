import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.argv[2]) || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  const decoded = decodeURIComponent(req.url.split('?')[0]);
  // If URL ends with '/', serve index.html from that directory
  let urlPath = decoded.endsWith('/') ? decoded + 'index.html' : decoded;
  let filePath = join(__dirname, urlPath);
  let ext = extname(filePath);

  try {
    let data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    // Try appending /index.html for extensionless routes (e.g. /en)
    try {
      const fallback = join(__dirname, decoded, 'index.html');
      const data = await readFile(fallback);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
