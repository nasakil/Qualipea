import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Image, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GR, GC, GRADES, normGrade, pc, LT, DK, Th, AnimCtx } from './theme';
import { GN, SEED, buildWhySummary, suggestDefects } from './data';
import { Kernel, Card, Txt } from './components';
import { sfx, setSfx, initAudio } from './sound';
import { DEFAULT_PI_URL, normalizeUrl, checkPiHealth, scanFromPi, classifyKernel } from './api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const CONNECT_STEPS = [
  'Finding your chamber',
  'Opening a secure link',
  'Checking camera and LED',
];

const STORE_KEY = '@qualipea_state_v1';

export function AppProvider({ children }) {
  const sys = useColorScheme();
  const [dark, setDark] = useState(sys === 'dark');
  const T = dark ? DK : LT;

  const [scr, setScrState] = useState('splash');
  const [navDir, setNavDir] = useState(0);
  const [oi, setOi] = useState(0);
  const [demo, setDemo] = useState(true);
  const [dev, setDev] = useState(0);
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
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (typeof saved.dark === 'boolean') setDark(saved.dark);
          if (typeof saved.anim === 'boolean') setAnim(saved.anim);
          if (typeof saved.snd === 'boolean') { setSnd(saved.snd); setSfx(saved.snd) }
          if (typeof saved.demo === 'boolean') setDemo(saved.demo);
          if (typeof saved.seenOnb === 'boolean') setSeenOnb(saved.seenOnb);
          if (typeof saved.skipPrep === 'boolean') setSkipPrep(saved.skipPrep);
          if (typeof saved.piUrl === 'string' && saved.piUrl.trim()) setPiUrl(saved.piUrl);
          if (Array.isArray(saved.hr)) {
            setHr(saved.hr.map(item => ({
              ...item,
              g: normGrade(item.g),
              x: item.x ? normGrade(item.x) : undefined,
            })));
          }
        }
      } catch (_) { }
      finally {
        hydrated.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORE_KEY, JSON.stringify({ dark, anim, snd, demo, seenOnb, skipPrep, piUrl, hr })).catch(() => { });
  }, [dark, anim, snd, demo, seenOnb, skipPrep, piUrl, hr]);

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

  useEffect(() => { initAudio() }, []);

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

  const toast = (t, keep) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setMsg(t);
    if (!keep) {
      toastTimer.current = setTimeout(() => setMsg(null), 1900);
    }
  };

  const close = () => setSheet(null);
  const toggleDemo = () => { setDemo(d => !d); setDev(0) };
  const toggleSnd = () => setSnd(v => { setSfx(!v); return !v });
  const toggleAnim = () => setAnim(v => !v);

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
      sfx('err');
      setSheet({
        ic: 'alert-circle-outline',
        bad: 1,
        title: 'Can’t reach the Pi 5',
        body: `Could not connect to ${res.url} (${res.error}). Make sure you’re on the same Wi-Fi, or scan with your phone camera.`,
        btns: [
          ['Phone camera', 'gold', () => { close(); setScr('prep', 1) }],
          ['Retry', 'sec', () => { close(); connect(cb) }],
        ],
      });
      return;
    }

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

  const completeOnboarding = () => {
    setSeenOnb(true);
    setScr('home', 1);
  };

  const openCam = () => { setCap(false); setPhoto(null); setScr('cam', 1) };
  const startScan = () => {
    const goNext = () => (skipPrep ? openCam() : setScr('prep', 1));
    if (!demo) return goNext();
    return dev === 1 ? goNext() : connect(goNext);
  };

  const makeFallbackResult = (img, preset = 'auto') => {
    if (preset === 'low') {
      const base = {
        g: 'Class II',
        c: 0.66,
        rv: true,
        img: img || null,
        p: { 'Extra Class': 0.04, 'Class I': 0.10, 'Class II': 0.66, 'Defect': 0.20 },
      };
      return { ...base, defects: suggestDefects(base), autoDefects: true, defectsConfirmed: false };
    }
    const g = GRADES.includes(preset)
      ? preset
      : (() => { const r = Math.random(); return r < .28 ? 'Extra Class' : r < .56 ? 'Class I' : r < .80 ? 'Class II' : 'Defect' })();
    const c = preset === 'Extra Class' ? 0.95 : preset === 'Class I' ? 0.89 : preset === 'Class II' ? 0.82 : preset === 'Defect' ? 0.91 : (.66 + Math.random() * .31);
    const o = GRADES.filter(x => x !== g);
    const rem = Math.max(0, 1 - c);
    const w1 = 0.55;
    const w2 = 0.30;
    const w3 = 0.15;
    const base = {
      g,
      c,
      rv: c < .75,
      img: img || null,
      p: { [g]: c, [o[0]]: rem * w1, [o[1]]: rem * w2, [o[2]]: rem * w3 },
    };
    return { ...base, defects: suggestDefects(base), autoDefects: true, defectsConfirmed: false };
  };

  const analyze = async (source = 'pi') => {
    setPs(0);
    setScr('proc', 1);

    if (demo) {
      const nextCur = makeFallbackResult(null, demoSim);
      setCur(nextCur);
      [1, 2, 3, 4].forEach(i => setTimeout(() => { setPs(i); sfx('step', i - 1) }, i * 650));
      setTimeout(() => {
        setTab('p');
        setPd(false);
        setScr('res', 1);
        sfx(nextCur.g, nextCur.c);
        if (nextCur.rv) setTimeout(() => sfx('flag'), 750);
        setTimeout(() => setPd(true), 1300);
      }, 3100);
      return;
    }

    // Real mode: trigger GET /scan on Raspberry Pi 5 (default RPi Cam) or POST /predict (Phone fallback)
    setPs(1);
    sfx('step', 0);
    setTimeout(() => { setPs(2); sfx('step', 1) }, 450);

    const piRes = (source === 'phone' && photo)
      ? await classifyKernel(piUrl, photo)
      : await scanFromPi(piUrl);
    setPs(3);
    sfx('step', 2);

    let finalCur;
    if (piRes.ok) {
      setDev(1);
      finalCur = {
        ...piRes.result,
        img: piRes.result.img || photo || null,
        defects: suggestDefects(piRes.result),
        autoDefects: true,
        defectsConfirmed: false,
      };
    } else {
      finalCur = makeFallbackResult(photo || null);
      toast(piRes.error || 'Pi 5 server offline · using local estimate');
    }

    setCur(finalCur);
    setTimeout(() => {
      setPs(4);
      sfx('step', 3);
      setTimeout(() => {
        setTab('p');
        setPd(false);
        setScr('res', 1);
        sfx(finalCur.g, finalCur.c);
        if (finalCur.rv) setTimeout(() => sfx('flag'), 750);
        setTimeout(() => setPd(true), 900);
      }, 420);
    }, 380);
  };

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      const entry = {
        id: 'scan-' + Date.now(),
        g: cur.g,
        c: cur.c,
        d: 0,
        tm: 'Just now',
        ts: Date.now(),
        r: cur.rv,
        img: cur.img || null,
        p: cur.p || null,
        defects: cur.defects || [],
        kg: cur.kg || null,
        price: cur.price || null,
        reason: cur.reason || null,
      };
      setHist([entry, ...hist]);
      sfx('save');
      setSheet({
        ok: 1,
        title: 'Result saved',
        body: `${cur.g} was added to your history${cur.rv ? ', flagged for expert review' : ''}.`,
        btns: [
          ['Scan another', 'sec', () => { close(); startScan() }],
          ['View history', '', () => { close(); goTab('hist') }],
        ],
      });
    }, 900);
  };

  const askExit = () => setSheet({
    ic: 'exit-outline',
    bad: 1,
    title: 'Exit QualiPea?',
    body: 'You’ll return to the splash screen and the Pi will disconnect.',
    btns: [
      ['Stay', 'sec', close],
      ['Exit', 'red', () => { close(); setDev(0); setOi(0); setScr('splash', -1) }],
    ],
  });

  const askDiscard = () => setSheet({
    ic: 'flag-outline',
    title: 'Discard this result?',
    body: 'This scan hasn’t been saved yet.',
    btns: [
      ['Keep it', 'sec', close],
      ['Discard', 'red', () => { close(); setScr('home', -1) }],
    ],
  });

  const fix = (i, x) => {
    const h = [...hist];
    h[i] = { ...h[i], x: x === h[i].g ? undefined : x };
    setHist(h);
    detail(i, h);
  };

  const openRecommendations = (scanObj, histIdx = null, fromHistory = false) => {
    if (!scanObj) return;
    const autoList = Array.isArray(scanObj.defects) ? scanObj.defects : suggestDefects(scanObj);
    const payload = { ...scanObj, g: normGrade(scanObj.g), defects: autoList, histIdx, fromHistory };
    setRecScan(payload);
    close();
    const g = normGrade(scanObj.x || scanObj.g);
    if (g === 'Extra Class' || scanObj.defectsConfirmed) {
      setScr('recs', 1);
    } else {
      setScr('defects', 1);
    }
  };

  const saveScanDefects = (defects) => {
    setRecScan(prev => prev ? { ...prev, defects, defectsConfirmed: true } : prev);
    if (recScan && recScan.histIdx !== null && recScan.histIdx !== undefined) {
      const next = [...hist];
      if (next[recScan.histIdx]) {
        next[recScan.histIdx] = { ...next[recScan.histIdx], defects, defectsConfirmed: true };
        setHist(next);
      }
    } else if (cur) {
      setCur(prev => prev ? { ...prev, defects, defectsConfirmed: true } : prev);
    }
  };

  const saveScanKg = (kg) => {
    setRecScan(prev => prev ? { ...prev, kg } : prev);
    if (recScan && recScan.histIdx !== null && recScan.histIdx !== undefined) {
      const next = [...hist];
      if (next[recScan.histIdx]) {
        next[recScan.histIdx] = { ...next[recScan.histIdx], kg };
        setHist(next);
      }
    } else if (cur) {
      setCur(prev => prev ? { ...prev, kg } : prev);
    }
  };

  const confirmDelete = (i) => {
    const h = hist[i];
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
    const next = hist.filter((_, idx) => idx !== i);
    setHist(next);
    close();
    toast('Scan deleted');
  };

  const detail = (i, list = hist) => {
    const h = list[i];
    if (!h) return;
    const scannedLabel = h.d ? ['', 'Yesterday', 'Earlier'][h.d] : (h.tm === 'Just now' || h.tm === 'Now' ? 'Just now' : 'Today ' + h.tm);
    const why = buildWhySummary(h);
    const rows = [
      ['Confidence', pc(h.c) + '%'],
      ['Scanned', scannedLabel],
      ['Model', h.model || 'yolo11n-cls 1.0.0'],
      ['Status', h.r ? 'Flagged for review' : 'Confident'],
      ...(h.x ? [['Expert class', h.x]] : []),
      ...(h.kg ? [['Batch weight', `${h.kg} kg`]] : []),
    ];
    setSheet({
      node: (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <Pressable
            onPress={() => { if (h.img) { sfx('tap'); setZoomImg(h.img) } }}
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
              shadowOpacity: dark ? .35 : .08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            {h.img ? (
              <Image source={{ uri: h.img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Kernel g={h.g} size={76} rot={-18} />
            )}
          </Pressable>
          {h.img && <Txt s={11.5} c={T.mute} style={{ marginTop: 5 }}>Tap photo to zoom</Txt>}
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
                    onPress={() => { sfx('tap'); fix(i, x) }}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 99,
                      backgroundColor: active ? GR : (dark ? '#142119' : T.bg),
                      borderWidth: 1,
                      borderColor: active ? T.g2 : T.line,
                      transform: [{ scale: pressed && anim ? .96 : 1 }],
                    })}
                  >
                    <Text style={{ fontFamily:'OpenRunde-Bold', fontSize: 13, color: active ? '#fff' : T.mute }}>{x}</Text>
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
    openRecommendations, saveScanDefects, saveScanKg, confirmDelete,
    sys, dark, setDark, T,
    scr, setScr, goTab, navDir,
    oi, setOi, demo, setDemo, dev, setDev,
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
