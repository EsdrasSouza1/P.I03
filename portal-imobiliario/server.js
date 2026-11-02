// Servidor estático opcional para pré-visualizar o frontend localmente.
// Não contém API, autenticação nem conexão com banco de dados.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.PORT || 3000);
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp'
};

const allowedImageHost = 'www.ezequielbartarinimoveis.com.br';

function allowedPropertyImage(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== allowedImageHost) return false;
    if (url.pathname === '/mark.php') return /^fotos\/[\w.-]+$/.test(url.searchParams.get('imagem') || '') && /^fotos\/[\w.-]+$/.test(url.searchParams.get('logo') || '');
    return /^\/fotos\/(?:tn_)?[\w.-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname);
  } catch { return false; }
}

async function servePropertyImage(request, response, requestUrl) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const source = requestUrl.searchParams.get('url') || '';
  if (!allowedPropertyImage(source)) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Imagem não permitida');
    return;
  }
  try {
    let upstream = await fetch(source, {
      headers: { 'User-Agent': 'Mozilla/5.0 BartarinPreview/1.0' },
      signal: AbortSignal.timeout(12000),
      redirect: 'manual'
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      const redirectedUrl = location ? new URL(location, source).toString() : '';
      if (!allowedPropertyImage(redirectedUrl)) throw new Error('Redirecionamento externo bloqueado');
      upstream = await fetch(redirectedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 BartarinPreview/1.0' },
        signal: AbortSignal.timeout(12000),
        redirect: 'error'
      });
    }
    const contentType = upstream.headers.get('content-type')?.split(';')[0].toLowerCase();
    if (!upstream.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) throw new Error('Imagem indisponível');
    const image = Buffer.from(await upstream.arrayBuffer());
    if (image.length > 12 * 1024 * 1024) throw new Error('Imagem excede o limite de prévia');
    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': image.length,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : image);
  } catch {
    response.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }).end('Não foi possível carregar a foto do anúncio');
  }
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === '/_image') {
    await servePropertyImage(request, response, requestUrl);
    return;
  }
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const content = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Página não encontrada');
  }
}).listen(port, () => console.log(`Pré-visualização do frontend: http://localhost:${port}`));
