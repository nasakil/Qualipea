import { GRADES, normGrade } from './theme';

export const DEFAULT_PI_URL = 'http://192.168.137.31:8000';

export function normalizeUrl(raw) {
  let trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_PI_URL;
  if (!/^https?:\/\//i.test(trimmed)) trimmed = `http://${trimmed}`;
  // Strip accidental trailing route paths if user pasted e.g. http://192.168.137.31:8000/live
  return trimmed.replace(/\/(live|stream|video|status|health|capture|analyze|grade|predict|scan|result)(\/.*)?$/i, '');
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

/**
 * Builds a minimal, self-contained HTML page for WebView that displays the Pi 5
 * MJPEG `/stream` full-bleed with `object-fit: cover` and posts real frame-load,
 * error, and stall events back to React Native.
 */
export function buildStreamHtml(streamUrl) {
  const safeUrl = JSON.stringify(String(streamUrl || ''));
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #111613;
  }
  #feed {
    display: block;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    background: #111613;
  }
</style>
</head>
<body>
<img id="feed" alt="Live RPi camera stream" />
<script>
(function() {
  var img = document.getElementById('feed');
  var connected = false;
  var stopped = false;

  function send(type, detail) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, detail: detail || '' }));
      }
    } catch (_) {}
  }

  window.__stopQualiPeaStream = function() {
    stopped = true;
    try {
      img.onload = null;
      img.onerror = null;
      img.removeAttribute('src');
      img.src = '';
    } catch (_) {}
  };

  img.onload = function() {
    if (stopped) return;
    if (!connected) {
      connected = true;
      send('connected', img.naturalWidth + 'x' + img.naturalHeight);
    }
  };

  img.onerror = function() {
    if (stopped) return;
    connected = false;
    send('error', 'stream_load_failed');
  };

  // Start MJPEG stream
  img.src = ${safeUrl};

  // Guard for cached/immediate decode edge cases
  setTimeout(function() {
    if (!stopped && !connected && img.complete && img.naturalWidth > 0) {
      connected = true;
      send('connected', img.naturalWidth + 'x' + img.naturalHeight);
    }
  }, 400);
})();
</script>
</body>
</html>`;
}

function resolvePiUrl(base, rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^(https?:|data:|file:)/i.test(trimmed)) return trimmed;
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

function toDataUri(rawBase64) {
  if (!rawBase64 || typeof rawBase64 !== 'string') return null;
  const trimmed = rawBase64.trim();
  if (!trimmed) return null;
  if (/^data:image\//i.test(trimmed)) return trimmed;
  return `data:image/jpeg;base64,${trimmed}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
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

function normalizeBbox(raw) {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length >= 4) {
    const nums = raw.slice(0, 4).map(Number);
    if (nums.every(n => Number.isFinite(n))) return nums;
  }
  if (typeof raw === 'object') {
    const { x1, y1, x2, y2, x, y, w, h, width, height } = raw;
    if ([x1, y1, x2, y2].every(v => typeof v === 'number' && Number.isFinite(v))) {
      return [x1, y1, x2, y2];
    }
    const bw = typeof w === 'number' ? w : width;
    const bh = typeof h === 'number' ? h : height;
    if ([x, y, bw, bh].every(v => typeof v === 'number' && Number.isFinite(v))) {
      return [x, y, x + bw, y + bh];
    }
  }
  return null;
}

function normalizeKernels(rawKernels) {
  if (!Array.isArray(rawKernels) || rawKernels.length === 0) return null;
  const out = [];
  for (let i = 0; i < rawKernels.length; i++) {
    const k = rawKernels[i];
    if (!k || typeof k !== 'object') continue;
    const rawLabel = k.grade ?? k.class ?? k.label ?? k.predicted_class ?? k.prediction;
    if (rawLabel === undefined || rawLabel === null) continue;
    let conf = Number(k.confidence ?? k.score ?? k.probability);
    if (Number.isNaN(conf)) conf = null;
    else {
      if (conf > 1) conf = conf / 100;
      conf = Math.max(0, Math.min(1, conf));
    }
    const bbox = normalizeBbox(k.bbox ?? k.box ?? k.rect ?? k);
    out.push({
      id: k.id ?? (i + 1),
      grade: normGrade(rawLabel),
      rawLabel: String(rawLabel),
      confidence: conf,
      bbox,
    });
  }
  return out.length > 0 ? out : null;
}

function parsePredictionPayload(data, base, fallbackOriginalImg = null) {
  const rawGrade = data.grade ?? data.predicted_class ?? data.class ?? data.label ?? data.prediction;
  const g = normGrade(rawGrade);
  let c = Number(data.avg_confidence ?? data.confidence ?? data.score ?? data.probability ?? 0.88);
  if (Number.isNaN(c)) c = 0.88;
  if (c > 1) c = c / 100;
  c = Math.max(0, Math.min(1, c));

  // Annotated image with AI bounding boxes (from preview: true)
  const annotatedImg =
    toDataUri(data.preview_base64 || data.annotated_base64) ||
    resolvePiUrl(base, data.preview_url || data.annotated_image_url || data.annotated_url) ||
    null;

  // Clean original image (preserved so user can toggle Annotated <-> Original)
  let originalImg =
    resolvePiUrl(base, data.image_url || data.original_image_url) ||
    (data.capture_id ? piCaptureImageUrl(base, data.capture_id) : null) ||
    fallbackOriginalImg ||
    null;

  // Default to AI-annotated image when available; fall back to original
  const img = annotatedImg || originalImg || null;
  const kernels = normalizeKernels(data.kernels || data.detections || data.predictions);

  const imageWidth = Number(data.image_width ?? data.width ?? data.image_size?.[0]);
  const imageHeight = Number(data.image_height ?? data.height ?? data.image_size?.[1]);

  return {
    g,
    c,
    rv: c < 0.75,
    img,
    annotatedImg,
    originalImg,
    p: normalizeProbabilities(data, g, c),
    model: data.model || 'YOLO11n-cls',
    price: typeof (data.price ?? data.reference_price) === 'number' ? (data.price ?? data.reference_price) : null,
    priceSource: data.price_source || data.source || null,
    reason: data.reason || data.explanation || null,
    defects: Array.isArray(data.defects) ? data.defects : undefined,
    captureId: data.capture_id || null,
    gradeShare: typeof data.grade_share === 'number' ? data.grade_share : null,
    total: typeof data.total_kernels === 'number' ? data.total_kernels : (typeof data.total === 'number' ? data.total : (kernels ? kernels.length : null)),
    counts: data.counts || null,
    kernels,
    imageWidth: Number.isFinite(imageWidth) && imageWidth > 0 ? imageWidth : null,
    imageHeight: Number.isFinite(imageHeight) && imageHeight > 0 ? imageHeight : null,
    fromPi: true,
  };
}

/**
 * Step 2 of Pi flow: POST /capture
 * Grabs a full-res photo, runs quality checks, and returns capture_id + image_url + quality.
 */
export async function captureFromPi(baseUrl, options = {}) {
  const base = normalizeUrl(baseUrl);
  try {
    const res = await fetchWithTimeout(
      `${base}/capture`,
      { method: 'POST', headers: { Accept: 'application/json' }, signal: options.signal },
      20000
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || `Capture failed (HTTP ${res.status})` };
    }
    const imageUrl = resolvePiUrl(base, data.image_url) || piCaptureImageUrl(base, data.capture_id);
    return {
      ok: true,
      captureId: data.capture_id,
      imageUrl,
      quality: data.quality || null,
    };
  } catch (err) {
    return {
      ok: false,
      aborted: Boolean(options.signal?.aborted),
      error: err?.name === 'AbortError' ? 'Pi capture timed out' : (err?.message || 'Cannot reach Pi 5'),
    };
  }
}

/**
 * Step 4 of Pi flow: POST /analyze {"capture_id": "...", "preview": true}
 * Crops kernels, classifies with YOLO11n-cls, and returns majority grade + AI-annotated preview with bounding boxes.
 */
export async function analyzeCaptureOnPi(baseUrl, captureId, options = {}) {
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
        signal: options.signal,
      },
      45000
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || `Analyze failed (HTTP ${res.status})` };
    }
    return {
      ok: true,
      result: parsePredictionPayload(data, base, options.originalImg || piCaptureImageUrl(base, captureId)),
    };
  } catch (err) {
    return {
      ok: false,
      aborted: Boolean(options.signal?.aborted),
      error: err?.name === 'AbortError' ? 'Pi analysis timed out' : (err?.message || 'Cannot reach Pi 5'),
    };
  }
}

/**
 * One-shot helper if captureId wasn't captured beforehand: POST /capture -> POST /analyze.
 */
export async function scanFromPi(baseUrl, options = {}) {
  const cap = await captureFromPi(baseUrl, options);
  if (!cap.ok) return cap;
  return analyzeCaptureOnPi(baseUrl, cap.captureId, { ...options, originalImg: cap.imageUrl });
}

/**
 * Phone-camera upload flow: tries POST /grade (tray photo) first,
 * and falls back to POST /predict (single kernel) if /grade returns 422 (too few kernels).
 */
export async function classifyKernel(baseUrl, imageUri, options = {}) {
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
        { method: 'POST', body: form, headers: { Accept: 'application/json' }, signal: options.signal },
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
      if (options.signal?.aborted) {
        return { ok: false, aborted: true, error: 'Analysis cancelled' };
      }
      lastError = err?.name === 'AbortError' ? 'Inference timed out' : (err?.message || 'Upload failed');
    }
  }

  return { ok: false, error: lastError || 'Could not classify on Pi 5' };
}
