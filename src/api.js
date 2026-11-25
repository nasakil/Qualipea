import { GRADES, normGrade } from './theme';

export const DEFAULT_PI_URL = 'http://192.168.137.31:8000';

export function normalizeUrl(raw) {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_PI_URL;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

export function piLiveUrl(baseUrl, nonce = Date.now()) {
  return `${normalizeUrl(baseUrl)}/live?t=${nonce}`;
}

export function piStreamUrl(baseUrl, nonce = Date.now()) {
  return `${normalizeUrl(baseUrl)}/stream?t=${nonce}`;
}

export function piCaptureImageUrl(baseUrl, captureId) {
  return `${normalizeUrl(baseUrl)}/capture/${encodeURIComponent(captureId)}/image.jpg`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkPiHealth(baseUrl) {
  const base = normalizeUrl(baseUrl);
  const paths = ['/status', '/health', '/'];
  let lastError = null;

  for (const p of paths) {
    try {
      const res = await fetchWithTimeout(`${base}${p}`, { method: 'GET' }, 4500);
      if (res.ok) {
        let data = null;
        try { data = await res.json(); } catch (_) { }
        return { ok: true, url: base, endpoint: p, data };
      }
      if (res.status === 404 || res.status === 405) {
        return { ok: true, url: base, endpoint: p, data: null };
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err?.name === 'AbortError' ? 'Connection timed out' : (err?.message || 'Network error');
    }
  }
  return { ok: false, url: base, error: lastError || 'Unable to reach Raspberry Pi 5' };
}

function normalizeProbabilities(data, g, c) {
  const src = data?.percentages || data?.probabilities || data?.probs || data?.scores || null;
  if (src && typeof src === 'object') {
    const out = {};
    let found = 0;
    for (const [rawKey, rawVal] of Object.entries(src)) {
      const v = Number(rawVal);
      if (Number.isNaN(v)) continue;
      const mapped = normGrade(rawKey);
      const frac = v > 1 ? v / 100 : v;
      out[mapped] = (out[mapped] || 0) + frac;
      found++;
    }
    if (found >= 2) {
      GRADES.forEach(k => { if (typeof out[k] !== 'number') out[k] = 0; });
      return out;
    }
  }
  const rem = Math.max(0, 1 - c);
  const others = GRADES.filter(x => x !== g);
  return {
    [g]: c,
    [others[0]]: rem * 0.55,
    [others[1]]: rem * 0.30,
    [others[2]]: rem * 0.15,
  };
}

function parsePredictionPayload(data, base, fallbackImg = null) {
  const rawGrade = data.grade ?? data.predicted_class ?? data.class ?? data.label ?? data.prediction;
  const g = normGrade(rawGrade);
  let c = Number(data.avg_confidence ?? data.confidence ?? data.score ?? data.probability ?? 0.88);
  if (Number.isNaN(c)) c = 0.88;
  if (c > 1) c = c / 100;
  c = Math.max(0, Math.min(1, c));

  let img = fallbackImg;
  if (data.preview_base64) {
    img = `data:image/jpeg;base64,${data.preview_base64}`;
  } else if (data.image_url) {
    img = /^https?:\/\//i.test(data.image_url)
      ? data.image_url
      : `${base}${data.image_url.startsWith('/') ? '' : '/'}${data.image_url}`;
  } else if (data.capture_id) {
    img = piCaptureImageUrl(base, data.capture_id);
  }

  return {
    g,
    c,
    rv: c < 0.75,
    img,
    p: normalizeProbabilities(data, g, c),
    model: data.model || 'YOLO11n-cls',
    price: typeof (data.price ?? data.reference_price) === 'number' ? (data.price ?? data.reference_price) : null,
    priceSource: data.price_source || data.source || null,
    reason: data.reason || data.explanation || null,
    defects: Array.isArray(data.defects) ? data.defects : undefined,
    captureId: data.capture_id || null,
    gradeShare: typeof data.grade_share === 'number' ? data.grade_share : null,
    total: typeof data.total_kernels === 'number' ? data.total_kernels : (typeof data.total === 'number' ? data.total : null),
    counts: data.counts || null,
    kernels: Array.isArray(data.kernels) ? data.kernels : null,
    fromPi: true,
  };
}

/**
 * Step 2 of Pi flow: POST /capture
 * Grabs a full-res photo, runs quality checks, and returns capture_id + image_url + quality.
 */
export async function captureFromPi(baseUrl) {
  const base = normalizeUrl(baseUrl);
  try {
    const res = await fetchWithTimeout(
      `${base}/capture`,
      { method: 'POST', headers: { Accept: 'application/json' } },
      20000
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || `Capture failed (HTTP ${res.status})` };
    }
    const imageUrl = data.image_url
      ? (/^https?:\/\//i.test(data.image_url) ? data.image_url : `${base}${data.image_url.startsWith('/') ? '' : '/'}${data.image_url}`)
      : piCaptureImageUrl(base, data.capture_id);
    return {
      ok: true,
      captureId: data.capture_id,
      imageUrl,
      quality: data.quality || null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err?.name === 'AbortError' ? 'Pi capture timed out' : (err?.message || 'Cannot reach Pi 5'),
    };
  }
}

/**
 * Step 4 of Pi flow: POST /analyze {"capture_id": "...", "preview": true}
 * Crops kernels, classifies with YOLO11n-cls, and returns majority grade + annotated preview.
 */
export async function analyzeCaptureOnPi(baseUrl, captureId) {
  const base = normalizeUrl(baseUrl);
  try {
    const res = await fetchWithTimeout(
      `${base}/analyze`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ capture_id: captureId, preview: true }),
      },
      45000
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || `Analyze failed (HTTP ${res.status})` };
    }
    return {
      ok: true,
      result: parsePredictionPayload(data, base, piCaptureImageUrl(base, captureId)),
    };
  } catch (err) {
    return {
      ok: false,
      error: err?.name === 'AbortError' ? 'Pi analysis timed out' : (err?.message || 'Cannot reach Pi 5'),
    };
  }
}

/**
 * One-shot helper if captureId wasn't captured beforehand: POST /capture -> POST /analyze.
 */
export async function scanFromPi(baseUrl) {
  const cap = await captureFromPi(baseUrl);
  if (!cap.ok) return cap;
  return analyzeCaptureOnPi(baseUrl, cap.captureId);
}

/**
 * Phone-camera upload flow: tries POST /grade (tray photo) first,
 * and falls back to POST /predict (single kernel) if /grade returns 422 (too few kernels).
 */
export async function classifyKernel(baseUrl, imageUri) {
  const base = normalizeUrl(baseUrl);
  const endpoints = ['/grade', '/predict'];
  let lastError = null;

  for (const ep of endpoints) {
    try {
      const form = new FormData();
      form.append('image', { uri: imageUri, name: 'kernel.jpg', type: 'image/jpeg' });
      form.append('preview', 'true');

      const res = await fetchWithTimeout(
        `${base}${ep}`,
        { method: 'POST', body: form, headers: { Accept: 'application/json' } },
        30000
      );

      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && ep === '/grade') {
        lastError = data.error || 'Too few kernels for tray grade';
        continue; // fall back to single-kernel /predict
      }
      if (res.status === 404 || res.status === 405) continue;
      if (!res.ok) {
        lastError = data.error || `HTTP ${res.status}`;
        continue;
      }

      return {
        ok: true,
        result: parsePredictionPayload(data, base, imageUri),
      };
    } catch (err) {
      lastError = err?.name === 'AbortError' ? 'Inference timed out' : (err?.message || 'Upload failed');
    }
  }

  return { ok: false, error: lastError || 'Could not classify on Pi 5' };
}
