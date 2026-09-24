import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { institutions } from './data.js';
import { parseFilters, InputError, timedQuery, present, compareQueries } from './report.js';

const dist = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

export function createApp(store) {
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    try {
      if (req.method !== 'GET') return send(405, { error: 'Only GET is supported.' });
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/health') return send(200, { ok: true, engine: store.engine });
      if (url.pathname === '/api/meta') return send(200, { institutions, engine: store.engine, totalResponses: store.totalResponses });
      if (url.pathname === '/api/report') {
        const filters = parseFilters(url.searchParams);
        const result = await timedQuery(store, filters);
        return send(200, { ...present(result.rows), filters, engine: store.engine, durationMs: result.durationMs });
      }
      if (url.pathname === '/api/compare') return send(200, { ...await compareQueries(store, parseFilters(url.searchParams)), engine: store.engine });
      if (url.pathname.startsWith('/api/')) return send(404, { error: 'Endpoint not found.' });
      const file = resolve(dist, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!file.startsWith(dist + sep) && file !== resolve(dist, 'index.html')) return send(404, { error: 'Not found.' });
      try {
        const data = await readFile(file);
        res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); res.end(data);
      } catch { send(404, { error: 'Page not found. Build the frontend with npm run build.' }); }
    } catch (error) {
      if (error instanceof InputError) return send(400, { error: error.message });
      console.error('Request failed:', error.message);
      send(500, { error: 'The report could not be loaded. Check the server connection and try again.' });
    }
  });
}
