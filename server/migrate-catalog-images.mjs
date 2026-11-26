#!/usr/bin/env node
/**
 * One-time safe Redis catalog migration for VPS:
 * 1. Reads catalog_bouquets from local Redis (127.0.0.1:6379).
 * 2. Writes full backup to /opt/sophiya-api/backup_catalog_pre_webp.json (chmod 600).
 * 3. Materializes any embedded data:image/*;base64 strings into /var/www/sophiya/bouquets-cloud/ files.
 * 4. Updates catalog_bouquets and sophiya_catalog_v2 in Redis and verifies shrunk byte size.
 */
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CLOUD_DIR = process.env.BOUQUETS_CLOUD_DIR || '/var/www/sophiya/bouquets-cloud';
const BACKUP_PATH = process.env.CATALOG_BACKUP_PATH || '/opt/sophiya-api/backup_catalog_pre_webp.json';

const MIME_TO_EXT = {
  jpeg: 'jpg',
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
  avif: 'avif',
  'svg+xml': 'svg',
};

function parseRespAt(buf, offset = 0) {
  if (offset >= buf.length) return { done: false };
  const crlf = buf.indexOf('\r\n', offset);
  if (crlf === -1) return { done: false };
  const prefix = String.fromCharCode(buf[offset]);
  const header = buf.slice(offset + 1, crlf).toString('utf8');
  const nextLine = crlf + 2;
  if (prefix === '+') return { done: true, value: header, next: nextLine };
  if (prefix === '-') return { done: true, error: header, next: nextLine };
  if (prefix === ':') return { done: true, value: Number(header), next: nextLine };
  if (prefix === '$') {
    const len = Number(header);
    if (len === -1) return { done: true, value: null, next: nextLine };
    const end = nextLine + len;
    if (buf.length < end + 2) return { done: false };
    return { done: true, value: buf.slice(nextLine, end).toString('utf8'), next: end + 2 };
  }
  return { done: true, value: null, next: nextLine };
}

function sendResp(args) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(6379, '127.0.0.1');
    socket.setTimeout(15000);
    const chunks = [];
    let settled = false;
    const done = (err, val) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {}
      if (err) reject(err);
      else resolve(val);
    };
    socket.on('timeout', () => done(new Error('Redis timeout')));
    socket.on('error', done);
    socket.on('connect', () => {
      socket.write(`*${args.length}\r\n`);
      for (const a of args) {
        const b = Buffer.from(String(a), 'utf8');
        socket.write(`$${b.length}\r\n`);
        socket.write(b);
        socket.write('\r\n');
      }
    });
    socket.on('data', (c) => {
      chunks.push(c);
      const parsed = parseRespAt(Buffer.concat(chunks), 0);
      if (parsed.done) {
        if (parsed.error) done(new Error(parsed.error));
        else done(null, parsed.value);
      }
    });
  });
}

function materializeImage(dataUri, bouquetId, idx) {
  if (typeof dataUri !== 'string' || !dataUri.startsWith('data:image/')) return { url: dataUri, converted: false };
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/s);
  if (!match) return { url: dataUri, converted: false };
  const rawExt = match[1].toLowerCase();
  const ext = MIME_TO_EXT[rawExt] || rawExt.replace(/[^a-z0-9]/g, '') || 'webp';
  const buf = Buffer.from(match[2], 'base64');
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const safeId = String(bouquetId || 'bouquet').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeId}_${idx}_${hash}.${ext}`;
  fs.writeFileSync(path.resolve(CLOUD_DIR, fileName), buf);
  return { url: `/bouquets-cloud/${fileName}`, converted: true };
}

async function main() {
  fs.mkdirSync(CLOUD_DIR, { recursive: true });
  const raw = await sendResp(['GET', 'catalog_bouquets']);
  if (!raw) {
    console.log('[migrate-catalog] catalog_bouquets is empty, nothing to migrate.');
    return;
  }
  const beforeBytes = Buffer.byteLength(raw, 'utf8');
  const items = JSON.parse(raw);
  if (!Array.isArray(items) || items.length === 0) {
    console.log('[migrate-catalog] catalog_bouquets is not a non-empty array, aborting.');
    return;
  }

  fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
  fs.writeFileSync(BACKUP_PATH, raw, { mode: 0o600 });

  let convertedCount = 0;
  const migrated = items.map((item, i) => {
    if (!item || typeof item !== 'object') return item;
    const copy = { ...item };
    const bId = copy.id || `item_${i}`;
    if (typeof copy.image === 'string' && copy.image.startsWith('data:image/')) {
      const res = materializeImage(copy.image, bId, 0);
      copy.image = res.url;
      if (res.converted) {
        copy.hasRealPhoto = true;
        convertedCount++;
      }
    }
    if (Array.isArray(copy.images)) {
      copy.images = copy.images.map((img, idx) => {
        const res = materializeImage(img, bId, idx);
        if (res.converted) convertedCount++;
        return res.url;
      });
    }
    return copy;
  });

  const serialized = JSON.stringify(migrated);
  const afterBytes = Buffer.byteLength(serialized, 'utf8');

  await sendResp(['SET', 'catalog_bouquets', serialized]);
  await sendResp(['SET', 'sophiya_catalog_v2', serialized]);

  console.log(
    JSON.stringify({
      ok: true,
      bouquets: migrated.length,
      convertedImages: convertedCount,
      beforeBytes,
      afterBytes,
      backupPath: BACKUP_PATH,
    })
  );
}

main().catch((err) => {
  console.error('[migrate-catalog] Fatal error:', err);
  process.exit(1);
});
