import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CLIENT_DIR = join(__dirname, 'dist', 'client');

// Importa o handler do servidor TanStack Start
const serverModule = await import('./dist/server/server.js');
const worker = serverModule.default;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Serve arquivos estáticos de dist/client/
function tryServeStatic(req, res) {
  const urlPath = new URL(req.url, 'http://localhost').pathname;
  const filePath = join(CLIENT_DIR, urlPath);

  if (!existsSync(filePath) || !statSync(filePath).isFile()) return false;

  const ext = extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  const content = readFileSync(filePath);

  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': content.length,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  res.end(content);
  return true;
}

// Servidor HTTP que converte requisições Node.js para Web Fetch e encaminha ao TanStack
const server = createServer(async (req, res) => {
  // Tenta servir arquivo estático primeiro
  if (tryServeStatic(req, res)) return;

  // Converte requisição HTTP do Node para Web Request
  const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }

  const webRequest = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  try {
    const webResponse = await worker.fetch(webRequest, {}, {});

    // Converte Web Response de volta para resposta HTTP do Node
    const resHeaders = {};
    webResponse.headers.forEach((value, key) => { resHeaders[key] = value; });
    res.writeHead(webResponse.status, resHeaders);

    if (webResponse.body) {
      const reader = webResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error) {
    console.error('Erro no servidor:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>Erro Interno do Servidor</h1>');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Com Amor Vestuário rodando em http://0.0.0.0:${PORT}`);
});
