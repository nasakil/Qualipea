import { Platform } from 'react-native';

let FileSystem = null;
if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system');
  } catch (_) {
    FileSystem = null;
  }
}

const SCANS_DIR_NAME = 'qualipea-scans';
const MAX_INLINE_DATA_URI_LEN = 220_000;

function sanitizeName(raw) {
  return String(raw || 'scan')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);
}

function getScansDirectory() {
  if (!FileSystem || !FileSystem.Directory || !FileSystem.Paths?.document) return null;
  try {
    const dir = new FileSystem.Directory(FileSystem.Paths.document, SCANS_DIR_NAME);
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
    return dir;
  } catch (_) {
    return null;
  }
}

export function isDurableLocalUri(uri) {
  return typeof uri === 'string' && uri.includes(`/${SCANS_DIR_NAME}/`);
}

function extractDataUri(uri) {
  const match = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/s.exec(uri);
  if (!match) return null;
  const subtype = match[1].toLowerCase();
  const ext = subtype === 'png' ? 'png' : subtype === 'webp' ? 'webp' : 'jpg';
  return { ext, base64: match[2] };
}

async function withTimeout(promise, ms = 10000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Image persistence timed out')), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Persists a scan image (data URI, remote Pi HTTP URL, or temp file:// URI)
 * into durable local app storage so historical photos survive app restarts
 * and remain accessible when the Raspberry Pi 5 is offline.
 */
export async function persistImageLocally(uri, filenameBase) {
  if (!uri || typeof uri !== 'string') return { uri: null, durable: true };
  if (Platform.OS === 'web' || !FileSystem) {
    return { uri, durable: true };
  }

  const dir = getScansDirectory();
  if (!dir) {
    return { uri, durable: false, error: 'Local storage directory unavailable' };
  }

  // Already persisted in our durable directory
  if (isDurableLocalUri(uri)) {
    try {
      const existing = new FileSystem.File(uri);
      if (existing.exists) return { uri, durable: true };
    } catch (_) { }
  }

  const safeBase = sanitizeName(filenameBase);

  // 1. Base64 data URI (e.g. preview_base64 annotated image from Pi 5)
  if (uri.startsWith('data:image/')) {
    const parsed = extractDataUri(uri);
    if (!parsed) return { uri, durable: false, error: 'Invalid base64 image' };
    try {
      const dest = new FileSystem.File(dir, `${safeBase}.${parsed.ext}`);
      await dest.write(parsed.base64, { encoding: 'base64' });
      return { uri: dest.uri, durable: true };
    } catch (err) {
      return { uri, durable: false, error: err?.message || 'Failed to write image' };
    }
  }

  // 2. Remote HTTP(S) image from Raspberry Pi 5
  if (/^https?:\/\//i.test(uri)) {
    try {
      const dest = new FileSystem.File(dir, `${safeBase}.jpg`);
      const downloaded = await withTimeout(
        FileSystem.File.downloadFileAsync(uri, dest, { idempotent: true }),
        12000
      );
      if (downloaded?.uri && downloaded.exists) {
        return { uri: downloaded.uri, durable: true };
      }
      return { uri, durable: false, error: 'Downloaded image missing' };
    } catch (err) {
      return { uri, durable: false, error: err?.message || 'Failed to download image' };
    }
  }

  // 3. Local file:// URI (e.g. expo-camera temporary cache photo)
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    try {
      const extMatch = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const dest = new FileSystem.File(dir, `${safeBase}.${ext === 'png' || ext === 'webp' ? ext : 'jpg'}`);
      const src = new FileSystem.File(uri);
      await src.copy(dest, { overwrite: true });
      return { uri: dest.uri, durable: true };
    } catch (err) {
      return { uri, durable: false, error: err?.message || 'Failed to copy local photo' };
    }
  }

  return { uri, durable: true };
}

/**
 * Persists both annotated and original images for a scan record in parallel.
 */
export async function persistScanImages(scan) {
  if (!scan) return scan;
  const idBase = sanitizeName(scan.id || `scan_${Date.now()}`);
  const rawAnnotated = scan.annotatedImg || null;
  const rawOriginal = scan.originalImg || (scan.img && scan.img !== rawAnnotated ? scan.img : null);

  const [annRes, origRes] = await Promise.all([
    rawAnnotated ? persistImageLocally(rawAnnotated, `${idBase}_annotated`) : Promise.resolve({ uri: null, durable: true }),
    rawOriginal ? persistImageLocally(rawOriginal, `${idBase}_original`) : Promise.resolve({ uri: null, durable: true }),
  ]);

  const annotatedImg = annRes.uri || rawAnnotated || null;
  const originalImg = origRes.uri || rawOriginal || null;
  const img = annotatedImg || originalImg || scan.img || null;

  return {
    ...scan,
    img,
    annotatedImg,
    originalImg,
    imagesDurable: Boolean(annRes.durable && origRes.durable),
  };
}

/**
 * Removes locally persisted image files owned by a deleted scan record.
 */
export function deleteLocalScanImages(scan) {
  if (!scan || Platform.OS === 'web' || !FileSystem) return;
  const uris = new Set([scan.img, scan.annotatedImg, scan.originalImg].filter(isDurableLocalUri));
  uris.forEach((uri) => {
    try {
      const f = new FileSystem.File(uri);
      if (f.exists) f.delete();
    } catch (_) { }
  });
}

/**
 * Strips oversized inline base64 data URIs before writing to AsyncStorage on native
 * so Android SQLite CursorWindow limits cannot corrupt persisted history.
 */
export function sanitizeScansForStorage(scans) {
  if (!Array.isArray(scans)) return [];
  if (Platform.OS === 'web') return scans;
  const guardUri = (u) => {
    if (typeof u !== 'string') return null;
    if (u.startsWith('data:') && u.length > MAX_INLINE_DATA_URI_LEN) return null;
    return u;
  };
  return scans.map((item) => {
    const annotatedImg = guardUri(item.annotatedImg);
    const originalImg = guardUri(item.originalImg);
    const img = guardUri(item.img) || annotatedImg || originalImg || null;
    return {
      ...item,
      img,
      annotatedImg,
      originalImg,
    };
  });
}

/**
 * Computes calendar days elapsed since a scan timestamp (0 = today, 1 = yesterday, ...).
 * Falls back to legacy `scan.d` for seed records without `ts`.
 */
export function getDaysAgo(scan, nowMs = Date.now()) {
  if (!scan) return 0;
  if (typeof scan.ts === 'number' && Number.isFinite(scan.ts)) {
    const now = new Date(nowMs);
    const then = new Date(scan.ts);
    const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
    const diff = Math.round((startNow - startThen) / 86_400_000);
    return Math.max(0, diff);
  }
  return typeof scan.d === 'number' && Number.isFinite(scan.d) ? Math.max(0, scan.d) : 0;
}

/**
 * Maps a scan into History section buckets: 0 (Today), 1 (Yesterday), 2 (Earlier).
 */
export function getDayBucket(scan, nowMs = Date.now()) {
  const days = getDaysAgo(scan, nowMs);
  if (days <= 0) return 0;
  if (days === 1) return 1;
  return 2;
}

/**
 * Formats a human-readable scan time label from `scan.ts` (falling back to `scan.tm`).
 */
export function formatScanTime(scan, nowMs = Date.now()) {
  if (!scan) return '';
  if (typeof scan.ts === 'number' && Number.isFinite(scan.ts)) {
    const deltaMs = nowMs - scan.ts;
    if (deltaMs >= 0 && deltaMs < 60_000) return 'Just now';
    const d = new Date(scan.ts);
    const days = getDaysAgo(scan, nowMs);
    if (days <= 1) {
      try {
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      } catch (_) {
        const hh = d.getHours();
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
    }
    try {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (_) {
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
  }
  return scan.tm || 'Just now';
}
