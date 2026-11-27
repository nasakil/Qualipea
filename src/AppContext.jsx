import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, Image, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GR, GC, GRADES, normGrade, pc, LT, DK, Th, AnimCtx } from './theme';
import { GN, SEED, buildWhySummary, suggestDefects } from './data';
import { Kernel, Card, Txt } from './components';
import { sfx, setSfx, initAudio } from './sound';
import { DEFAULT_PI_URL, normalizeUrl, checkPiHealth, scanFromPi, analyzeCaptureOnPi, classifyKernel } from './api';
import {
  persistScanImages,
  deleteLocalScanImages,
  sanitizeScansForStorage,
  getDayBucket,
  formatScanTime,
} from './storage';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const CONNECT_STEPS = [
  'Finding your chamber',
  'Opening a secure link',
  'Checking camera and LED',
];

const STORE_KEY = '@qualipea_state_v1';

function makeScanId(ts = Date.now(), captureId = null) {
  if (captureId) return `scan-${captureId}`;
  return `scan-${ts}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeStoredScan(item) {
  if (!item || typeof item !== 'object') return null;
  const g = normGrade(item.g);
  const c = typeof item.c === 'number' && Number.isFinite(item.c) ? item.c : 0.85;
  const annotatedImg = item.annotatedImg || null;
  const originalImg = item.originalImg || (item.img && item.img !== annotatedImg ? item.img : null);
  const img = item.img || annotatedImg || originalImg || null;
  const flagged = Boolean(item.r ?? item.rv ?? (c < 0.75));
  return {
    ...item,
    id: item.id || makeScanId(item.ts || Date.now(), item.captureId),
    g,
    c,
    r: flagged,
    rv: flagged,
    x: item.x ? normGrade(item.x) : undefined,
    img,
    annotatedImg,
    originalImg,
    saved: true,
  };
}

function dedupeScans(list) {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenCaptures = new Set();
  const out = [];
  for (const raw of list) {
    const item = normalizeStoredScan(raw);
    if (!item) continue;
    if (seenIds.has(item.id)) continue;
    if (item.captureId && seenCaptures.has(item.captureId)) continue;
    seenIds.add(item.id);
    if (item.captureId) seenCaptures.add(item.captureId);
    out.push(item);
  }
  return out;
}

function buildScanRecord(raw, existing = null) {
  const ts = typeof raw.ts === 'number' ? raw.ts : (existing?.ts || Date.now());
  const id = raw.id || existing?.id || makeScanId(ts, raw.captureId || existing?.captureId);
  const g = normGrade(raw.g || existing?.g);
  const c = typeof raw.c === 'number' && Number.isFinite(raw.c) ? raw.c : (existing?.c ?? 0.85);
  const flagged = Boolean(raw.rv ?? raw.r ?? existing?.r ?? (c < 0.75));
  const annotatedImg = raw.annotatedImg ?? existing?.annotatedImg ?? null;
  const originalImg = raw.originalImg ?? existing?.originalImg ?? (raw.img && raw.img !== annotatedImg ? raw.img : null);
  const img = annotatedImg || raw.img || originalImg || existing?.img || null;

  return {
    ...(existing || {}),
    ...raw,
    id,
    ts,
    d: 0,
    tm: formatScanTime({ ts }),
    g,
    c,
    r: flagged,
    rv: flagged,
    x: raw.x !== undefined ? (raw.x ? normGrade(raw.x) : undefined) : existing?.x,
    img,
    annotatedImg,
    originalImg,
    p: raw.p || existing?.p || null,
    model: raw.model || existing?.model || 'YOLO11n-cls',
    price: raw.price ?? existing?.price ?? null,
    priceSource: raw.priceSource ?? existing?.priceSource ?? null,
    reason: raw.reason ?? existing?.reason ?? null,
    defects: Array.isArray(raw.defects) ? raw.defects : (existing?.defects || []),
    defectsConfirmed: raw.defectsConfirmed ?? existing?.defectsConfirmed ?? false,
    kg: raw.kg ?? existing?.kg ?? null,
    captureId: raw.captureId ?? existing?.captureId ?? null,
    gradeShare: raw.gradeShare ?? existing?.gradeShare ?? null,
    total: raw.total ?? existing?.total ?? null,
    counts: raw.counts ?? existing?.counts ?? null,
    kernels: Array.isArray(raw.kernels) ? raw.kernels : (existing?.kernels || null),
    imageWidth: raw.imageWidth ?? existing?.imageWidth ?? null,
    imageHeight: raw.imageHeight ?? existing?.imageHeight ?? null,
    fromPi: raw.fromPi ?? existing?.fromPi ?? false,
    imagesDurable: raw.imagesDurable ?? existing?.imagesDurable ?? true,
    saved: true,
  };
}

function upsertScanInList(list, incoming) {
  const idx = list.findIndex(item =>
    item.id === incoming.id ||
    (incoming.captureId && item.captureId && item.captureId === incoming.captureId)
  );
  if (idx >= 0) {
    const merged = buildScanRecord(incoming, list[idx]);
    const next = [...list];
    next[idx] = merged;
    return { next, record: merged };
  }
  const created = buildScanRecord(incoming);
  return { next: [created, ...list], record: created };
}

export function AppProvider({ children }) {
  const sys = useColorScheme();
  const [dark, setDark] = useState(sys === 'dark');
  const T = dark ? DK : LT;

  const [scr, setScrState] = useState('splash');
  const [navDir, setNavDir] = useState(0);
  const [oi, setOi] = useState(0);
  const [demo, setDemo] = useState(true);
  const [dev, setDev] = useState(0);
  const [piInfo, setPiInfo] = useState(null);
  const [hd, setHd] = useState(SEED);
  const [hr, setHr] = useState([]);
  const [cur, setCur] = useState(null);
  const [cap, setCap] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [tab, setTab] = useState('p');
  const [pd, setPd] = useState(false);
  const [ps, setPs] = useState(0);
  const [filt, setFilt] = useState('All');
  const [sheet, setSheet] = useState(null);
  const [msg, setMsg] = useState(null);
  const [dg, setDg] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [persistError, setPersistError] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [snd, setSnd] = useState(true);
  const [anim, setAnim] = useState(true);
  const [piUrl, setPiUrl] = useState(DEFAULT_PI_URL);
  const [recScan, setRecScan] = useState(null);
  const [zoomImg, setZoomImg] = useState(null);
  const [demoSim, setDemoSim] = useState('auto');
  const [seenOnb, setSeenOnb] = useState(false);
  const [skipPrep, setSkipPrep] = useState(false);

  const hist = demo ? hd : hr;
  const setHist = demo ? setHd : setHr;
  const tabs = ['home', 'hist', 'dash', 'set'];
  const ob = useRef(null);
  const scan = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);

  // Refs to guarantee async workflows never read stale closures
  const hydratedRef = useRef(false);
  const persistQueueRef = useRef(Promise.resolve());
  const analyzeTokenRef = useRef(0);
  const analyzeAbortRef = useRef(null);
  const analyzeTimersRef = useRef([]);
  const stateRef = useRef({});
  stateRef.current = { dark, anim, snd, demo, seenOnb, skipPrep, piUrl, hr, hd, cur, recScan, photo, demoSim, persistError };

  const clearAnalyzeTimers = useCallback(() => {
    analyzeTimersRef.current.forEach(t => clearTimeout(t));
    analyzeTimersRef.current = [];
  }, []);

  const cancelInFlightAnalysis = useCallback(() => {
    analyzeTokenRef.current += 1;
    clearAnalyzeTimers();
    if (analyzeAbortRef.current) {
      try { analyzeAbortRef.current.abort(); } catch (_) { }
      analyzeAbortRef.current = null;
    }
  }, [clearAnalyzeTimers]);

  const scheduleAnalyzeTimer = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      analyzeTimersRef.current = analyzeTimersRef.current.filter(x => x !== id);
      fn();
    }, ms);
    analyzeTimersRef.current.push(id);
    return id;
  }, []);

  const persistStateNow = useCallback((overrides = {}) => {
    const task = async () => {
      if (!hydratedRef.current) return { ok: true };
      const s = { ...stateRef.current, ...overrides };
      const payload = {
        dark: s.dark,
        anim: s.anim,
        snd: s.snd,
        demo: s.demo,
        seenOnb: s.seenOnb,
        skipPrep: s.skipPrep,
        piUrl: s.piUrl,
        hr: sanitizeScansForStorage(s.hr),
        hd: sanitizeScansForStorage(s.hd),
      };
      try {
        await AsyncStorage.setItem(STORE_KEY, JSON.stringify(payload));
        setPersistError(null);
        return { ok: true };
      } catch (err) {
        const errMsg = err?.message || 'Unable to save scans to local storage';
        setPersistError(errMsg);
        return { ok: false, error: errMsg };
      }
    };
    const nextPromise = persistQueueRef.current.then(task, task);
    persistQueueRef.current = nextPromise.catch(() => { });
    return nextPromise;
  }, []);

  // Hydrate persisted app preferences & scan history on startup
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (typeof saved.dark === 'boolean') setDark(saved.dark);
          if (typeof saved.anim === 'boolean') setAnim(saved.anim);
          if (typeof saved.snd === 'boolean') { setSnd(saved.snd); setSfx(saved.snd); }
          if (typeof saved.demo === 'boolean') setDemo(saved.demo);
          if (typeof saved.seenOnb === 'boolean') setSeenOnb(saved.seenOnb);
          if (typeof saved.skipPrep === 'boolean') setSkipPrep(saved.skipPrep);
          if (typeof saved.piUrl === 'string' && saved.piUrl.trim()) {
            const migratedUrl = saved.piUrl.trim() === 'http://192.168.137.31:5000'
              ? DEFAULT_PI_URL
              : saved.piUrl;
            setPiUrl(migratedUrl);
          }
          if (Array.isArray(saved.hr)) {
            setHr(prev => dedupeScans([...prev, ...saved.hr]));
          }
          if (Array.isArray(saved.hd)) {
            setHd(dedupeScans(saved.hd));
          }
        }
      } catch (_) {
        // Ignore corrupt storage on boot; future writes will overwrite cleanly
      } finally {
        hydratedRef.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  // Keep AsyncStorage continuously synchronized after hydration
  useEffect(() => {
    if (!hydrated) return;
    persistStateNow();
  }, [hydrated, dark, anim, snd, demo, seenOnb, skipPrep, piUrl, hr, hd, persistStateNow]);

  const setScr = (next, dir = 0) => {
    setNavDir(dir);
    setScrState(next);
  };

  const goTab = (next) => {
    const curIdx = tabs.indexOf(scr);
    const nextIdx = tabs.indexOf(next);
    const dir = curIdx >= 0 && nextIdx >= 0 ? (nextIdx > curIdx ? 1 : nextIdx < curIdx ? -1 : 0) : 0;
    setScr(next, dir);
  };

  useEffect(() => { initAudio(); }, []);

  useEffect(() => {
    if (!anim) {
      scan.stopAnimation();
      scan.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, scan]);

  useEffect(() => () => cancelInFlightAnalysis(), [cancelInFlightAnalysis]);

  const toast = (t, keep) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setMsg(t);
    if (!keep) {
      toastTimer.current = setTimeout(() => setMsg(null), 1900);
    }
  };

  const close = () => setSheet(null);
  const toggleDemo = () => {
    cancelInFlightAnalysis();
    setDemo(d => !d);
    setDev(0);
  };
  const toggleSnd = () => setSnd(v => { setSfx(!v); return !v; });
  const toggleAnim = () => setAnim(v => !v);

  const upsertScanRecord = useCallback((incoming, isDemoMode = stateRef.current.demo) => {
    const targetList = isDemoMode ? stateRef.current.hd : stateRef.current.hr;
    const { next, record } = upsertScanInList(targetList, incoming);
    if (isDemoMode) {
      stateRef.current = { ...stateRef.current, hd: next };
      setHd(next);
    } else {
      stateRef.current = { ...stateRef.current, hr: next };
      setHr(next);
    }
    return { next, record };
  }, []);

  const retryPersist = useCallback(async () => {
    setSaving(true);
    try {
      const s = stateRef.current;
      // Retry persisting any non-durable images on the current or recent real scans
      let nextHr = s.hr;
      if (Array.isArray(nextHr) && nextHr.some(item => item.imagesDurable === false)) {
        nextHr = await Promise.all(
          nextHr.map(item => (item.imagesDurable === false ? persistScanImages(item) : item))
        );
        stateRef.current = { ...stateRef.current, hr: nextHr };
        setHr(nextHr);
        if (s.cur) {
          const updatedCur = nextHr.find(x => x.id === s.cur.id);
          if (updatedCur) setCur(updatedCur);
        }
      }
      const res = await persistStateNow({ hr: nextHr });
      if (res.ok) {
        sfx('save');
        toast('Scans saved locally');
      } else {
        sfx('err');
        toast('Still unable to save — check storage space');
      }
      return res;
    } finally {
      setSaving(false);
    }
  }, [persistStateNow]);

  const connect = async (cb) => {
    if (dev === 2) return;
    const targetUrl = normalizeUrl(piUrl);
    setDev(2);
    setSheet({
      load: 1,
      lock: 1,
      title: 'Connecting to Pi 5',
      body: demo
        ? 'Keep the chamber powered and on the same Wi-Fi.'
        : `Connecting to ${targetUrl}…`,
      steps: CONNECT_STEPS,
      stepIdx: 0,
    });

    if (demo) {
      setTimeout(() => {
        setSheet(prev => prev && prev.load ? { ...prev, stepIdx: 1 } : prev);
        sfx('step', 0);
      }, 550);
      setTimeout(() => {
        setSheet(prev => prev && prev.load ? { ...prev, stepIdx: 2 } : prev);
        sfx('step', 1);
      }, 1300);
      setTimeout(() => {
        setSheet(prev => prev && prev.load ? { ...prev, stepIdx: 3 } : prev);
        sfx('step', 2);
        setTimeout(() => {
          setDev(1);
          close();
          toast('Pi 5 connected (Demo)');
          sfx('connect');
          cb && cb();
        }, 420);
      }, 2050);
      return;
    }

    // Real Raspberry Pi 5 HTTP health check
    setTimeout(() => {
      setSheet(prev => prev && prev.load ? { ...prev, stepIdx: 1 } : prev);
      sfx('step', 0);
    }, 320);

    const res = await checkPiHealth(targetUrl);
    if (!res.ok) {
      setDev(0);
      setPiInfo(null);
      sfx('err');
      setSheet({
        ic: 'alert-circle-outline',
        bad: 1,
        title: 'Can’t reach the Pi 5',
        body: `Could not connect to ${res.url} (${res.error}). You can still test the camera preview, or switch to Demo mode for simulated grading.`,
        btns: [
          ['Switch to Demo', 'gold', () => { close(); setDemo(true); setDev(1); toast('Demo mode enabled'); }],
          ['Retry', 'sec', () => { close(); connect(cb); }],
        ],
      });
      return;
    }

    const d = res.data || {};
    setPiInfo({
      online: true,
      cameraReady: d.camera_ready !== false,
      cameraBackend: d.camera_backend || 'picamera2',
      classesCount: d.classes ? Object.keys(d.classes).length : 4,
      minKernels: d.min_kernels || 5,
    });

    setSheet(prev => prev && prev.load ? { ...prev, stepIdx: 2 } : prev);
    sfx('step', 1);
    setTimeout(() => {
      setSheet(prev => prev && prev.load ? { ...prev, stepIdx: 3 } : prev);
      sfx('step', 2);
      setTimeout(() => {
        setDev(1);
        close();
        toast('Pi 5 connected');
        sfx('connect');
        cb && cb();
      }, 350);
    }, 450);
  };

  const refreshPiStatus = async () => {
    if (demo) return;
    const res = await checkPiHealth(normalizeUrl(piUrl));
    if (res.ok) {
      const d = res.data || {};
      setDev(1);
      setPiInfo({
        online: true,
        cameraReady: d.camera_ready !== false,
        cameraBackend: d.camera_backend || 'picamera2',
        classesCount: d.classes ? Object.keys(d.classes).length : 4,
        minKernels: d.min_kernels || 5,
      });
    } else {
      setDev(0);
      setPiInfo(null);
    }
  };

  const completeOnboarding = () => {
    setSeenOnb(true);
    setScr('home', 1);
  };

  const openCam = () => {
    cancelInFlightAnalysis();
    setCap(false);
    setPhoto(null);
    setScr('cam', 1);
  };

  const startScan = () => {
    const goNext = () => (skipPrep ? openCam() : setScr('prep', 1));
    if (!demo) return goNext();
    return dev === 1 ? goNext() : connect(goNext);
  };

  const makeFallbackResult = (img, preset = 'auto') => {
    const buildDemoCounts = (probs, total = 24) => {
      const counts = {};
      let sum = 0;
      GRADES.forEach((k, idx) => {
        if (idx === GRADES.length - 1) {
          counts[k] = Math.max(0, total - sum);
        } else {
          const n = Math.round((probs[k] || 0) * total);
          counts[k] = n;
          sum += n;
        }
      });
      return counts;
    };
    if (preset === 'low') {
      const p = { 'Extra Class': 0.04, 'Class I': 0.10, 'Class II': 0.66, 'Defect': 0.20 };
      const total = 18;
      const base = {
        g: 'Class II',
        c: 0.66,
        rv: true,
        img: img || null,
        p,
        total,
        counts: buildDemoCounts(p, total),
      };
      return { ...base, defects: suggestDefects(base), autoDefects: true, defectsConfirmed: false };
    }
    const g = GRADES.includes(preset)
      ? preset
      : (() => { const r = Math.random(); return r < 0.28 ? 'Extra Class' : r < 0.56 ? 'Class I' : r < 0.80 ? 'Class II' : 'Defect'; })();
    const c = preset === 'Extra Class' ? 0.95 : preset === 'Class I' ? 0.89 : preset === 'Class II' ? 0.82 : preset === 'Defect' ? 0.91 : (0.66 + Math.random() * 0.31);
    const o = GRADES.filter(x => x !== g);
    const rem = Math.max(0, 1 - c);
    const w1 = 0.55;
    const w2 = 0.30;
    const w3 = 0.15;
    const p = { [g]: c, [o[0]]: rem * w1, [o[1]]: rem * w2, [o[2]]: rem * w3 };
    const total = preset === 'Extra Class' ? 24 : preset === 'Class I' ? 22 : preset === 'Class II' ? 20 : preset === 'Defect' ? 16 : 20;
    const base = {
      g,
      c,
      rv: c < 0.75,
      img: img || null,
      p,
      total,
      counts: buildDemoCounts(p, total),
    };
    return { ...base, defects: suggestDefects(base), autoDefects: true, defectsConfirmed: false };
  };

  const analyze = async (source = 'pi', captureId = null) => {
    cancelInFlightAnalysis();
    const token = analyzeTokenRef.current;
    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    const isDemoMode = stateRef.current.demo;
    const activePiUrl = stateRef.current.piUrl;
    const activePhoto = stateRef.current.photo;

    setPs(0);
    setScr('proc', 1);

    if (isDemoMode) {
      const rawDemo = makeFallbackResult(null, stateRef.current.demoSim);
      const demoRecord = buildScanRecord({
        ...rawDemo,
        ts: Date.now(),
        model: 'YOLO11n-cls (Demo)',
        fromPi: false,
      });

      [1, 2, 3, 4].forEach(i =>
        scheduleAnalyzeTimer(() => {
          if (analyzeTokenRef.current !== token) return;
          setPs(i);
          sfx('step', i - 1);
        }, i * 650)
      );

      scheduleAnalyzeTimer(async () => {
        if (analyzeTokenRef.current !== token) return;
        const { next, record } = upsertScanRecord(demoRecord, true);
        setCur(record);
        await persistStateNow({ hd: next });
        if (analyzeTokenRef.current !== token) return;
        setTab('p');
        setPd(false);
        setScr('res', 1);
        sfx(record.g, record.c);
        if (record.rv) scheduleAnalyzeTimer(() => sfx('flag'), 750);
        scheduleAnalyzeTimer(() => setPd(true), 1300);
      }, 3100);
      return;
    }

    // Real mode: POST /analyze with capture_id (RPi Cam) or POST /grade -> /predict (Phone fallback)
    setPs(1);
    sfx('step', 0);
    scheduleAnalyzeTimer(() => {
      if (analyzeTokenRef.current !== token) return;
      setPs(2);
      sfx('step', 1);
    }, 450);

    const piRes = (source === 'phone' && activePhoto)
      ? await classifyKernel(activePiUrl, activePhoto, { signal: controller.signal })
      : captureId
        ? await analyzeCaptureOnPi(activePiUrl, captureId, { signal: controller.signal, originalImg: activePhoto })
        : await scanFromPi(activePiUrl, { signal: controller.signal });

    // Exclude cancelled / superseded analyses immediately
    if (analyzeTokenRef.current !== token || piRes.aborted) {
      return;
    }

    setPs(3);
    sfx('step', 2);

    if (!piRes.ok) {
      // Failed scan: never persist to history or storage
      setDev(0);
      setPiInfo(null);
      sfx('err');
      setScr('cam', -1);
      setSheet({
        ic: 'alert-circle-outline',
        bad: 1,
        title: 'Cannot grade without Pi 5',
        body: `${piRes.error || 'Raspberry Pi 5 server & YOLO11n-cls model are unreachable.'}\n\nConnect your Pi 5 on the same Wi-Fi, or switch to Demo mode to test offline.`,
        btns: [
          ['Use Demo mode', 'gold', () => { close(); setDemo(true); setDev(1); toast('Demo mode enabled'); }],
          ['Edit Pi IP', 'sec', () => { close(); goTab('set'); }],
        ],
      });
      return;
    }

    setDev(1);
    const ts = Date.now();
    const rawRecord = buildScanRecord({
      ...piRes.result,
      ts,
      originalImg: piRes.result.originalImg || activePhoto || null,
      img: piRes.result.annotatedImg || piRes.result.img || activePhoto || null,
      defects: Array.isArray(piRes.result.defects) ? piRes.result.defects : suggestDefects(piRes.result),
      autoDefects: true,
      defectsConfirmed: true,
      fromPi: true,
    });

    // Store annotated & original images in durable local app storage so history works when Pi disconnects
    const durableRecord = await persistScanImages(rawRecord);
    if (analyzeTokenRef.current !== token) return;

    // Immediately upsert into shared AppContext state and persist via AsyncStorage
    const { next, record } = upsertScanRecord(durableRecord, false);
    setCur(record);
    const saveRes = await persistStateNow({ hr: next });
    if (analyzeTokenRef.current !== token) return;

    scheduleAnalyzeTimer(() => {
      if (analyzeTokenRef.current !== token) return;
      setPs(4);
      sfx('step', 3);
      scheduleAnalyzeTimer(() => {
        if (analyzeTokenRef.current !== token) return;
        setTab('p');
        setPd(false);
        setScr('res', 1);
        sfx(record.g, record.c);
        if (!saveRes.ok) {
          toast('Scan shown, but local save failed — tap Retry');
        }
        if (record.rv) scheduleAnalyzeTimer(() => sfx('flag'), 750);
        scheduleAnalyzeTimer(() => setPd(true), 900);
      }, 420);
    }, 320);
  };

  /**
   * Idempotent save/update for the active scan result.
   * Updates the existing persisted scan record in place (preventing duplicates)
   * and retries durable local storage if an earlier write failed.
   */
  const save = async () => {
    const activeCur = stateRef.current.cur;
    const isDemoMode = stateRef.current.demo;
    if (!activeCur || saving) return;

    setSaving(true);
    try {
      let target = activeCur;
      if (!isDemoMode && (!target.imagesDurable || (typeof target.img === 'string' && /^https?:|^data:/i.test(target.img)))) {
        target = await persistScanImages(target);
      }

      const { next, record } = upsertScanRecord(target, isDemoMode);
      setCur(record);
      const res = await persistStateNow(isDemoMode ? { hd: next } : { hr: next });

      if (!res.ok) {
        sfx('err');
        setSheet({
          ic: 'cloud-offline-outline',
          bad: 1,
          title: 'Could not save scan',
          body: `${res.error || 'Local storage write failed.'} Your scan is still on screen — tap Retry to save it.`,
          btns: [
            ['Close', 'sec', close],
            ['Retry save', 'gold', () => { close(); save(); }],
          ],
        });
        return;
      }

      sfx('save');
      setSheet({
        ok: 1,
        title: 'Result saved',
        body: `${record.g} is saved in your history${record.rv ? ', flagged for expert review' : ''}.`,
        btns: [
          ['Scan another', 'sec', () => { close(); startScan(); }],
          ['View history', '', () => { close(); goTab('hist'); }],
        ],
      });
    } finally {
      setSaving(false);
    }
  };

  const askExit = () => setSheet({
    ic: 'exit-outline',
    bad: 1,
    title: 'Exit QualiPea?',
    body: 'You’ll return to the splash screen and the Pi will disconnect.',
    btns: [
      ['Stay', 'sec', close],
      ['Exit', 'red', () => {
        cancelInFlightAnalysis();
        close();
        setDev(0);
        setOi(0);
        setScr('splash', -1);
      }],
    ],
  });

  const askDiscard = () => {
    const activeCur = stateRef.current.cur;
    if (activeCur?.saved && !stateRef.current.persistError) {
      setScr('home', -1);
      return;
    }
    setSheet({
      ic: 'cloud-offline-outline',
      title: 'Scan not saved to storage',
      body: 'Local storage failed while saving this scan. Retry saving or return home?',
      btns: [
        ['Retry save', 'gold', () => { close(); retryPersist(); }],
        ['Return home', 'sec', () => { close(); setScr('home', -1); }],
      ],
    });
  };

  const updateScanFieldsById = useCallback((targetId, fallbackIdx, patch) => {
    const isDemoMode = stateRef.current.demo;
    const list = isDemoMode ? stateRef.current.hd : stateRef.current.hr;
    let idx = targetId ? list.findIndex(item => item.id === targetId) : -1;
    if (idx < 0 && fallbackIdx !== null && fallbackIdx !== undefined && list[fallbackIdx]) {
      idx = fallbackIdx;
    }
    if (idx < 0) return { next: list, updated: null, idx: -1 };

    const updated = { ...list[idx], ...patch };
    const next = [...list];
    next[idx] = updated;

    if (isDemoMode) {
      stateRef.current = { ...stateRef.current, hd: next };
      setHd(next);
    } else {
      stateRef.current = { ...stateRef.current, hr: next };
      setHr(next);
    }

    if (stateRef.current.cur && stateRef.current.cur.id === updated.id) {
      setCur(prev => (prev && prev.id === updated.id ? { ...prev, ...patch } : prev));
    }
    if (stateRef.current.recScan && stateRef.current.recScan.id === updated.id) {
      setRecScan(prev => (prev && prev.id === updated.id ? { ...prev, ...patch } : prev));
    }

    persistStateNow(isDemoMode ? { hd: next } : { hr: next });
    return { next, updated, idx };
  }, [persistStateNow]);

  const fix = (i, x) => {
    const list = stateRef.current.demo ? stateRef.current.hd : stateRef.current.hr;
    const target = list[i];
    if (!target) return;
    const nextX = x === target.g ? undefined : x;
    const { next, idx } = updateScanFieldsById(target.id, i, { x: nextX });
    if (idx >= 0) detail(idx, next);
  };

  const openRecommendations = (scanObj, histIdx = null, fromHistory = false) => {
    if (!scanObj) return;
    const autoList = Array.isArray(scanObj.defects) ? scanObj.defects : suggestDefects(scanObj);
    const payload = { ...scanObj, g: normGrade(scanObj.g), defects: autoList, histIdx, fromHistory };
    setRecScan(payload);
    close();
    setScr('recs', 1);
  };

  const openDefectEditor = (scanObj, returnTo = 'res', histIdx = null, fromHistory = false) => {
    if (!scanObj) return;
    const autoList = Array.isArray(scanObj.defects) ? scanObj.defects : suggestDefects(scanObj);
    const payload = { ...scanObj, g: normGrade(scanObj.g), defects: autoList, histIdx, fromHistory, returnTo };
    setRecScan(payload);
    close();
    setScr('defects', 1);
  };

  const saveScanDefects = (defects) => {
    const activeRec = stateRef.current.recScan;
    const activeCur = stateRef.current.cur;
    const targetId = activeRec?.id || activeCur?.id || null;
    const fallbackIdx = activeRec?.histIdx ?? null;

    setRecScan(prev => (prev ? { ...prev, defects, defectsConfirmed: true } : prev));
    const { idx } = updateScanFieldsById(targetId, fallbackIdx, { defects, defectsConfirmed: true });
    if (idx < 0 && activeCur) {
      setCur(prev => (prev ? { ...prev, defects, defectsConfirmed: true } : prev));
    }
  };

  const saveScanKg = (kg) => {
    const activeRec = stateRef.current.recScan;
    const activeCur = stateRef.current.cur;
    const targetId = activeRec?.id || activeCur?.id || null;
    const fallbackIdx = activeRec?.histIdx ?? null;

    setRecScan(prev => (prev ? { ...prev, kg } : prev));
    const { idx } = updateScanFieldsById(targetId, fallbackIdx, { kg });
    if (idx < 0 && activeCur) {
      setCur(prev => (prev ? { ...prev, kg } : prev));
    }
  };

  const confirmDelete = (i) => {
    const list = stateRef.current.demo ? stateRef.current.hd : stateRef.current.hr;
    const h = list[i];
    if (!h) return;
    setSheet({
      ic: 'trash-outline',
      bad: 1,
      title: 'Delete this scan?',
      body: `${GN[h.g][0]} (${pc(h.c)}%) will be permanently removed from your history. This can’t be undone.`,
      btns: [
        ['Cancel', 'sec', () => detail(i)],
        ['Delete', 'red', () => removeScan(i)],
      ],
    });
  };

  const removeScan = (i) => {
    const isDemoMode = stateRef.current.demo;
    const list = isDemoMode ? stateRef.current.hd : stateRef.current.hr;
    const target = list[i];
    if (!target) return;
    const next = list.filter((_, idx) => idx !== i);
    if (isDemoMode) {
      stateRef.current = { ...stateRef.current, hd: next };
      setHd(next);
    } else {
      stateRef.current = { ...stateRef.current, hr: next };
      setHr(next);
    }
    deleteLocalScanImages(target);
    if (stateRef.current.cur && stateRef.current.cur.id === target.id) {
      setCur(null);
    }
    persistStateNow(isDemoMode ? { hd: next } : { hr: next });
    close();
    toast('Scan deleted');
  };

  const detail = (i, listArg = null) => {
    const list = listArg || (stateRef.current.demo ? stateRef.current.hd : stateRef.current.hr);
    const h = list[i];
    if (!h) return;
    const bucket = getDayBucket(h);
    const timeStr = formatScanTime(h);
    const scannedLabel = bucket === 0
      ? (timeStr === 'Just now' || timeStr === 'Now' ? 'Just now' : `Today ${timeStr}`)
      : bucket === 1
        ? `Yesterday ${timeStr}`
        : timeStr || 'Earlier';
    const why = buildWhySummary(h);
    const displayImg = h.annotatedImg || h.img || h.originalImg || null;
    const rows = [
      ['Confidence', pc(h.c) + '%'],
      ['Scanned', scannedLabel],
      ...(typeof h.total === 'number' ? [['Kernels', `${h.total} pcs`]] : []),
      ['Model', h.model || 'yolo11n-cls 1.0.0'],
      ['Status', h.r ? 'Flagged for review' : 'Confident'],
      ...(h.x ? [['Expert class', h.x]] : []),
      ...(h.kg ? [['Batch weight', `${h.kg} kg`]] : []),
    ];
    setSheet({
      node: (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <Pressable
            onPress={() => {
              if (displayImg) {
                sfx('tap');
                setZoomImg({
                  img: displayImg,
                  annotatedImg: h.annotatedImg || null,
                  originalImg: h.originalImg || null,
                  kernels: h.kernels || null,
                  imageWidth: h.imageWidth || null,
                  imageHeight: h.imageHeight || null,
                  initialMode: h.annotatedImg ? 'annotated' : 'original',
                });
              }
            }}
            style={{
              width: 104,
              height: 104,
              borderRadius: 26,
              backgroundColor: dark ? '#26231d' : '#f1ece2',
              borderWidth: 1,
              borderColor: T.line,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginTop: 4,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: dark ? 0.35 : 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            {displayImg ? (
              <Image source={{ uri: displayImg }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Kernel g={h.g} size={76} rot={-18} />
            )}
          </Pressable>
          {displayImg && <Txt s={11.5} c={T.mute} style={{ marginTop: 5 }}>Tap photo to zoom</Txt>}
          <Txt s={26} w="800" style={{ textAlign: 'center', marginTop: 10 }}>{GN[h.g][0]}</Txt>
          <Txt s={14} c={T.mute} style={{ textAlign: 'center', marginTop: 3 }}>{why.headline}</Txt>

          <Card style={{
            width: '100%',
            marginTop: 14,
            backgroundColor: dark ? '#0f1913' : T.bg,
            borderWidth: 1,
            borderColor: T.line,
            borderRadius: 22,
            paddingVertical: 4,
            paddingHorizontal: 16,
            shadowOpacity: 0,
            elevation: 0,
          }}>
            {rows.map(([a, b], idx) => (
              <View
                key={a}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 11,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: T.line,
                }}
              >
                <Txt s={14} c={T.mute}>{a}</Txt>
                <Txt s={14} w="700">{b}</Txt>
              </View>
            ))}
          </Card>

          <View style={{ width: '100%', marginTop: 14 }}>
            <Txt s={15} w="700">Expert correction</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 8 }}>
              {GRADES.map(x => {
                const active = h.x === x;
                return (
                  <Pressable
                    key={x}
                    onPress={() => { sfx('tap'); fix(i, x); }}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 99,
                      backgroundColor: active ? GR : (dark ? '#142119' : T.bg),
                      borderWidth: 1,
                      borderColor: active ? T.g2 : T.line,
                      transform: [{ scale: pressed && anim ? 0.96 : 1 }],
                    })}
                  >
                    <Text style={{ fontFamily: 'OpenRunde-Bold', fontSize: 13, color: active ? '#fff' : T.mute }}>{x}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Txt s={12} c={T.mute}>The model’s original prediction is always kept.</Txt>
          </View>
        </View>
      ),
      btns: [
        ['Delete', 'red', () => confirmDelete(i)],
        ['Advice & Calc', 'gold', () => openRecommendations(h, i, true)],
      ],
    });
  };

  const runDiag = async () => {
    if (dg >= 0 || dev === 2) return;
    let i = 0;
    setDg(0);
    let piReachable = dev === 1;
    if (!demo) {
      checkPiHealth(piUrl).then(r => {
        piReachable = r.ok;
        setDev(r.ok ? 1 : 0);
      });
    }
    const iv = setInterval(() => {
      i++;
      if (i >= 4) {
        clearInterval(iv);
        setDg(-1);
        toast(piReachable ? 'Diagnostics passed' : 'Pi 5 chamber is offline');
      } else {
        setDg(i);
      }
    }, 550);
  };

  const value = {
    snd, toggleSnd, anim, toggleAnim,
    piUrl, setPiUrl, recScan, setRecScan, zoomImg, setZoomImg, demoSim, setDemoSim,
    seenOnb, setSeenOnb, skipPrep, setSkipPrep, completeOnboarding,
    openRecommendations, openDefectEditor, saveScanDefects, saveScanKg, confirmDelete,
    persistError, retryPersist, hydrated,
    sys, dark, setDark, T,
    scr, setScr, goTab, navDir,
    oi, setOi, demo, setDemo, dev, setDev, piInfo, refreshPiStatus,
    hd, setHd, hr, setHr, cur, setCur, cap, setCap, photo, setPhoto,
    tab, setTab, pd, setPd, ps, setPs, filt, setFilt,
    sheet, setSheet, msg, setMsg, dg, setDg, saving, setSaving,
    hist, setHist, tabs, ob, scan,
    toast, close, connect, toggleDemo, startScan, openCam, analyze, save,
    askExit, askDiscard, fix, detail, runDiag,
  };

  return (
    <Th.Provider value={T}>
      <AnimCtx.Provider value={anim}>
        <Ctx.Provider value={value}>{children}</Ctx.Provider>
      </AnimCtx.Provider>
    </Th.Provider>
  );
}
