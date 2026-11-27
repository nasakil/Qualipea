import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Image, ActivityIndicator, Platform, StyleSheet, AppState } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { GOLD, GC } from '../theme';
import { normalizeUrl, piLiveUrl, piStreamUrl, buildStreamHtml, captureFromPi } from '../api';
import { Kernel, Btn, Brk } from '../components';
import { useApp } from '../AppContext';
import { sfx } from '../sound';

const SIM_PRESETS = [
  ['auto', 'Auto', '#9db5a7'],
  ['Extra Class', 'EX', GC['Extra Class']],
  ['Class I', 'I', GC['Class I']],
  ['Class II', 'II', GC['Class II']],
  ['Defect', 'DF', GC['Defect']],
  ['low', 'Low?', GOLD],
];

const CONNECT_TIMEOUT_MS = 8500;
const RECONNECT_DELAYS_MS = [2000, 3500, 5000, 8000];

const LIVE_PAGE_BRIDGE_JS = `
(function() {
  try {
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.background = '#111613';
    if (document.body) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.background = '#111613';
    }
    var send = function(type, detail) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, detail: detail || '' }));
      }
    };
    var img = document.querySelector('img');
    window.__stopQualiPeaStream = function() {
      try {
        var imgs = document.querySelectorAll('img');
        for (var i = 0; i < imgs.length; i++) {
          imgs[i].onload = null;
          imgs[i].onerror = null;
          imgs[i].removeAttribute('src');
          imgs[i].src = '';
        }
      } catch (_) {}
    };
    if (img) {
      img.style.width = '100vw';
      img.style.height = '100vh';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
      var notified = false;
      var notifyConnected = function() {
        if (notified) return;
        notified = true;
        send('connected', img.naturalWidth + 'x' + img.naturalHeight);
      };
      if (img.complete && img.naturalWidth > 0) {
        notifyConnected();
      } else {
        img.addEventListener('load', notifyConnected);
        img.addEventListener('error', function() { send('error', 'live_img_failed'); });
        setTimeout(function() {
          if (!notified && img.complete && img.naturalWidth > 0) notifyConnected();
        }, 500);
      }
    } else {
      send('error', 'live_no_stream_img');
    }
  } catch (e) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', detail: 'bridge_exception' }));
    }
  }
})();
true;
`;

export default function Scanner() {
  const { demo, piUrl, setScr, goTab, cap, setCap, photo, setPhoto, scan, analyze, toast, anim, demoSim, setDemoSim } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);
  const [torch, setTorch] = useState(false);
  const [camSource, setCamSource] = useState('pi'); // 'pi' (RPi Cam default) or 'phone'
  const [streamKey, setStreamKey] = useState(() => Date.now());
  const [streamMode, setStreamMode] = useState('mjpeg'); // 'mjpeg' (/stream in controlled HTML) -> fallback 'live' (/live)
  const [streamState, setStreamState] = useState('connecting'); // 'connecting' | 'connected' | 'reconnecting' | 'error'
  const [streamErrorMsg, setStreamErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isAppActive, setIsAppActive] = useState(() => AppState.currentState === 'active');
  const [piCaptureId, setPiCaptureId] = useState(null);
  const [piQuality, setPiQuality] = useState(null);

  const camRef = useRef(null);
  const webViewRef = useRef(null);
  const connectTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const streamStateRef = useRef(streamState);
  const streamModeRef = useRef(streamMode);
  const retryCountRef = useRef(retryCount);
  const flash = useRef(new Animated.Value(0)).current;

  streamStateRef.current = streamState;
  streamModeRef.current = streamMode;
  retryCountRef.current = retryCount;

  const isRpi = !demo && camSource === 'pi';
  const isPhone = !demo && camSource === 'phone';
  const shouldStream = isRpi && !cap && isAppActive;

  const normalizedPi = useMemo(() => normalizeUrl(piUrl), [piUrl]);
  const liveSrc = useMemo(() => piLiveUrl(normalizedPi, streamKey), [normalizedPi, streamKey]);
  const streamSrc = useMemo(() => piStreamUrl(normalizedPi, streamKey), [normalizedPi, streamKey]);
  const streamHtml = useMemo(() => buildStreamHtml(streamSrc), [streamSrc]);

  const clearTimers = useCallback(() => {
    if (connectTimerRef.current) {
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const stopWebViewStream = useCallback(() => {
    try {
      webViewRef.current?.injectJavaScript('window.__stopQualiPeaStream && window.__stopQualiPeaStream(); true;');
      webViewRef.current?.stopLoading?.();
    } catch (_) { }
  }, []);

  const startFreshStream = useCallback((mode = 'mjpeg', nextRetryCount = 0) => {
    clearTimers();
    stopWebViewStream();
    setStreamMode(mode);
    setRetryCount(nextRetryCount);
    setStreamErrorMsg('');
    setStreamState(nextRetryCount > 0 ? 'reconnecting' : 'connecting');
    setStreamKey(Date.now() + Math.floor(Math.random() * 1000));
  }, [clearTimers, stopWebViewStream]);

  const scheduleReconnect = useCallback((reason) => {
    clearTimers();
    stopWebViewStream();

    // If primary /stream failed on first attempt before ever connecting, immediately try /live fallback once
    if (Platform.OS !== 'web' && streamModeRef.current === 'mjpeg' && retryCountRef.current === 0) {
      setStreamMode('live');
      setStreamState('connecting');
      setStreamErrorMsg('');
      setStreamKey(Date.now() + Math.floor(Math.random() * 1000));
      return;
    }

    const nextRetry = retryCountRef.current + 1;
    const delay = RECONNECT_DELAYS_MS[Math.min(nextRetry - 1, RECONNECT_DELAYS_MS.length - 1)];
    setRetryCount(nextRetry);
    setStreamErrorMsg(reason || 'Camera stream disconnected');
    setStreamState(nextRetry >= 2 ? 'error' : 'reconnecting');

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      setStreamMode('mjpeg');
      setStreamState('reconnecting');
      setStreamKey(Date.now() + Math.floor(Math.random() * 1000));
    }, delay);
  }, [clearTimers, stopWebViewStream]);

  // Pause RPi stream when app backgrounds and restore when returning to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const active = nextState === 'active';
      setIsAppActive(active);
      if (!active) {
        clearTimers();
        stopWebViewStream();
      }
    });
    return () => sub.remove();
  }, [clearTimers, stopWebViewStream]);

  // Reset stream cleanly whenever Pi URL or camera source changes
  useEffect(() => {
    if (shouldStream) {
      startFreshStream('mjpeg', 0);
    } else {
      clearTimers();
      stopWebViewStream();
    }
    return () => {
      clearTimers();
      stopWebViewStream();
    };
  }, [shouldStream, normalizedPi, clearTimers, stopWebViewStream, startFreshStream]);

  // Guard against hung TCP connections / stalled initial frames
  useEffect(() => {
    if (!shouldStream) return;
    if (streamState !== 'connecting' && streamState !== 'reconnecting') return;
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);

    connectTimerRef.current = setTimeout(() => {
      connectTimerRef.current = null;
      if (streamStateRef.current !== 'connected') {
        scheduleReconnect('Timed out waiting for camera frames');
      }
    }, CONNECT_TIMEOUT_MS);

    return () => {
      if (connectTimerRef.current) {
        clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
    };
  }, [shouldStream, streamKey, streamState, scheduleReconnect]);

  const handleStreamConnected = useCallback(() => {
    if (connectTimerRef.current) {
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setRetryCount(0);
    setStreamErrorMsg('');
    setStreamState('connected');
  }, []);

  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event?.nativeEvent?.data || '{}');
      if (data.type === 'connected') {
        handleStreamConnected();
      } else if (data.type === 'error') {
        scheduleReconnect('Unable to load live stream from Pi 5');
      }
    } catch (_) { }
  }, [handleStreamConnected, scheduleReconnect]);

  const triggerFlash = () => {
    if (!anim) return;
    flash.setValue(0.85);
    Animated.timing(flash, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };

  const refreshStream = () => {
    sfx('tap');
    startFreshStream('mjpeg', 0);
  };

  const handleCapture = async () => {
    if (taking) return;
    sfx('shutter');
    triggerFlash();
    if (demo) {
      setCap(true);
      return;
    }
    if (isRpi) {
      // Step 2: POST /capture -> full-res frozen photo + real quality checks
      try {
        setTaking(true);
        const res = await captureFromPi(piUrl);
        if (res.ok) {
          clearTimers();
          stopWebViewStream();
          setPiCaptureId(res.captureId);
          setPiQuality(res.quality);
          setPhoto(res.imageUrl);
          setCap(true);
          if (res.quality && !res.quality.ready) {
            toast('Quality check warning — review photo or retake');
          }
        } else {
          toast(res.error || 'Could not capture from Pi 5');
        }
      } finally {
        setTaking(false);
      }
      return;
    }
    if (!camRef.current) {
      toast('Camera not ready yet');
      return;
    }
    try {
      setTaking(true);
      const pic = await camRef.current.takePictureAsync({ quality: 0.85 });
      if (pic && pic.uri) {
        setPhoto(pic.uri);
        setCap(true);
      } else {
        toast('Could not capture photo');
      }
    } catch (e) {
      toast('Camera capture failed');
    } finally {
      setTaking(false);
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    setPiCaptureId(null);
    setPiQuality(null);
    setCap(false);
  };

  const needsPermission = isPhone && (!permission || !permission.granted);
  const showStreamErrorOverlay = isRpi && !cap && streamState === 'error';
  const showStreamLoadingOverlay = isRpi && !cap && (streamState === 'connecting' || streamState === 'reconnecting');

  const qualityLabel = (() => {
    if (cap && isRpi && piQuality) {
      const s = piQuality.sharp ? '✓ Sharp' : '✗ Blurry';
      const l = piQuality.well_lit ? '✓ Lit' : '✗ Lighting';
      const k = piQuality.kernels_found
        ? `✓ ${piQuality.kernels_detected} kernels`
        : `✗ ${piQuality.kernels_detected} kernels`;
      return `${s}   ·   ${l}   ·   ${k}`;
    }
    if (cap) return '✓ Sharp   ✓ Centered   ✓ Ready to grade';
    if (demo) return 'LED 100%   ·   Focus locked   ·   Lid closed';
    if (isRpi) {
      if (streamState === 'connected') return 'Live feed active · Tap shutter to capture tray';
      if (streamState === 'reconnecting') return 'Reconnecting to Raspberry Pi 5 camera…';
      if (streamState === 'error') return 'Camera preview offline · Tap Retry or capture anyway';
      return 'Connecting to Raspberry Pi 5 camera…';
    }
    return 'Center tray or kernel inside the frame';
  })();

  const piHostLabel = normalizedPi.replace(/^https?:\/\//, '');

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f0c', paddingTop: 56 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, alignItems: 'center' }}>
        <Pressable
          onPress={() => {
            sfx('tap');
            clearTimers();
            stopWebViewStream();
            setScr('home', -1);
          }}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed && anim ? 0.94 : 1 }],
          })}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>

        {!demo ? (
          <View style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 99,
            padding: 3,
            gap: 3,
          }}>
            {[['pi', 'RPi Cam'], ['phone', 'Phone']].map(([k, lbl]) => {
              const active = camSource === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => {
                    if (camSource === k) return;
                    sfx('tap');
                    clearTimers();
                    stopWebViewStream();
                    setCap(false);
                    setPhoto(null);
                    setPiCaptureId(null);
                    setPiQuality(null);
                    setCamSource(k);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 99,
                    backgroundColor: active ? GOLD : 'transparent',
                  }}
                >
                  <Text style={{
                    color: active ? '#1d1403' : '#d5e6dc',
                    fontFamily: 'OpenRunde-Bold',
                    fontSize: 12,
                  }}>
                    {lbl}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 18 }}>
            Scanner (Demo)
          </Text>
        )}

        {isRpi && !cap ? (
          <Pressable
            onPress={refreshStream}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed && anim ? 0.94 : 1 }],
            })}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
          </Pressable>
        ) : isPhone && !needsPermission && !cap ? (
          <Pressable
            onPress={() => { sfx('tap'); setTorch(t => !t); }}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: torch ? GOLD : 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed && anim ? 0.94 : 1 }],
            })}
          >
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={20} color={torch ? '#1d1403' : '#fff'} />
          </Pressable>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      <View style={{
        flex: 1,
        margin: 18,
        borderRadius: 30,
        backgroundColor: '#181d1a',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {needsPermission ? (
          <View style={{ alignItems: 'center', paddingHorizontal: 28, gap: 14 }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 22,
              backgroundColor: 'rgba(227,166,59,0.16)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="camera-outline" size={32} color={GOLD} />
            </View>
            <Text style={{ color: '#fff', fontSize: 19, fontFamily: 'OpenRunde-Bold', textAlign: 'center' }}>
              Camera access needed
            </Text>
            <Text style={{ color: '#a9beb2', fontSize: 14, fontFamily: 'OpenRunde-Regular', textAlign: 'center', lineHeight: 20 }}>
              Allow camera access to photograph peanut kernels and save them to your grading history.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={{
                marginTop: 4,
                backgroundColor: GOLD,
                paddingHorizontal: 22,
                paddingVertical: 12,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: '#241803', fontFamily: 'OpenRunde-Bold', fontSize: 15 }}>Allow camera</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {isRpi && (
              cap && photo ? (
                <Image
                  source={{ uri: photo }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : shouldStream ? (
                Platform.OS === 'web' ? (
                  <Image
                    key={streamKey}
                    source={{ uri: streamSrc }}
                    onError={() => scheduleReconnect('Unable to load MJPEG stream')}
                    onLoad={handleStreamConnected}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <WebView
                      ref={webViewRef}
                      key={`${streamMode}-${streamKey}`}
                      originWhitelist={['*']}
                      source={
                        streamMode === 'mjpeg'
                          ? { html: streamHtml, baseUrl: normalizedPi }
                          : { uri: liveSrc }
                      }
                      injectedJavaScript={streamMode === 'live' ? LIVE_PAGE_BRIDGE_JS : undefined}
                      javaScriptEnabled
                      cacheEnabled={false}
                      mixedContentMode="always"
                      allowsInlineMediaPlayback
                      mediaPlaybackRequiresUserAction={false}
                      scrollEnabled={false}
                      bounces={false}
                      overScrollMode="never"
                      onMessage={handleWebViewMessage}
                      onError={() => scheduleReconnect('Connection to RPi 5 camera failed')}
                      onHttpError={(e) => scheduleReconnect(`Camera stream HTTP ${e?.nativeEvent?.statusCode || 'error'}`)}
                      onRenderProcessGone={() => scheduleReconnect('Camera renderer restarted')}
                      onContentProcessDidTerminate={() => scheduleReconnect('Camera renderer restarted')}
                      containerStyle={StyleSheet.absoluteFill}
                      style={{ flex: 1, backgroundColor: '#111613' }}
                    />
                  </View>
                )
              ) : null
            )}

            {isPhone && (
              cap && photo ? (
                <Image
                  source={{ uri: photo }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <CameraView
                  ref={camRef}
                  facing="back"
                  enableTorch={torch}
                  style={StyleSheet.absoluteFill}
                />
              )
            )}

            {showStreamLoadingOverlay && (
              <View style={[StyleSheet.absoluteFill, {
                backgroundColor: 'rgba(10,16,12,0.72)',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 28,
                gap: 10,
              }]}>
                <ActivityIndicator color={GOLD} size="large" />
                <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 16, textAlign: 'center' }}>
                  {streamState === 'reconnecting' ? 'Reconnecting to RPi Camera…' : 'Starting live camera…'}
                </Text>
                <Text style={{ color: '#9fb5a8', fontFamily: 'OpenRunde-Regular', fontSize: 12.5, textAlign: 'center' }}>
                  {streamMode === 'mjpeg' ? `${piHostLabel}/stream` : `${piHostLabel}/live`}
                </Text>
              </View>
            )}

            {showStreamErrorOverlay && (
              <View style={[StyleSheet.absoluteFill, {
                backgroundColor: 'rgba(10,16,12,0.88)',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 28,
                gap: 10,
              }]}>
                <Ionicons name="videocam-off-outline" size={38} color={GOLD} />
                <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 17, textAlign: 'center' }}>
                  Waiting for RPi Camera stream
                </Text>
                <Text style={{ color: '#9fb5a8', fontFamily: 'OpenRunde-Regular', fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
                  {streamErrorMsg ? `${streamErrorMsg}. ` : ''}
                  Make sure api_server.py is running at {piHostLabel} on the same Wi-Fi. Auto-reconnecting…
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <Pressable
                    onPress={refreshStream}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 13.5 }}>Retry stream</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      sfx('tap');
                      clearTimers();
                      stopWebViewStream();
                      goTab('set');
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: GOLD,
                    }}
                  >
                    <Text style={{ color: '#1d1403', fontFamily: 'OpenRunde-Bold', fontSize: 13.5 }}>Edit Pi IP</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, {
                backgroundColor: '#fff',
                opacity: flash,
                zIndex: 10,
              }]}
            />

            {!(showStreamErrorOverlay || showStreamLoadingOverlay) && (
              <View pointerEvents="none" style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
                <Brk s={38} c={cap ? (piQuality && !piQuality.ready ? GOLD : GC.A) : GOLD} />
                {demo && <Kernel g={demoSim === 'auto' || demoSim === 'low' ? 'Class II' : demoSim} size={136} />}
                {!cap && anim && (
                  <Animated.View style={{
                    position: 'absolute',
                    left: 6,
                    right: 6,
                    height: 3,
                    backgroundColor: GOLD,
                    transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] }) }],
                  }} />
                )}
              </View>
            )}

            <View style={{
              position: 'absolute',
              top: 16,
              backgroundColor: '#000a',
              paddingHorizontal: 13,
              paddingVertical: 6,
              borderRadius: 99,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
              {isRpi && !cap && (
                <View style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: streamState === 'connected' ? GC.A : streamState === 'error' ? GC.C : GOLD,
                }} />
              )}
              <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 12.5 }}>
                {cap
                  ? (piQuality && !piQuality.ready ? '⚠ Check photo quality' : '✓ Image captured')
                  : demo
                    ? (demoSim === 'auto' ? 'Live preview (Demo)' : `Simulate: ${demoSim === 'low' ? 'Low confidence' : demoSim}`)
                    : isRpi
                      ? `${streamState === 'connected' ? 'Live' : streamState === 'error' ? 'Offline' : 'Connecting'} · ${piHostLabel}`
                      : (torch ? 'Phone camera · Torch on' : 'Phone camera')}
              </Text>
            </View>

            {demo && !cap && (
              <View style={{
                position: 'absolute',
                bottom: 14,
                left: 12,
                right: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 6,
              }}>
                {SIM_PRESETS.map(([key, label, col]) => {
                  const active = demoSim === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => { sfx('tap'); setDemoSim(key); }}
                      style={{
                        paddingHorizontal: 11,
                        paddingVertical: 6,
                        borderRadius: 99,
                        backgroundColor: active ? col : 'rgba(8,18,12,0.78)',
                        borderWidth: 1,
                        borderColor: active ? col : 'rgba(255,255,255,0.16)',
                      }}
                    >
                      <Text style={{
                        color: active ? (key === 'low' ? '#1b1303' : '#fff') : '#d6e6dc',
                        fontFamily: 'OpenRunde-Bold',
                        fontSize: 11.5,
                      }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>

      <View style={{ padding: 24, paddingBottom: 44, gap: 14, alignItems: 'center' }}>
        <Text style={{
          color: cap && piQuality && !piQuality.ready ? '#ffd27d' : '#cfe8d8',
          fontSize: 13,
          fontFamily: 'OpenRunde-Medium',
          backgroundColor: '#ffffff14',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 99,
          overflow: 'hidden',
        }}>
          {qualityLabel}
        </Text>

        {cap ? (
          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <Btn t="Retake" kind="sec" onPress={handleRetake} />
            <Btn t="Analyze" kind="gold" onPress={() => analyze(camSource, piCaptureId)} />
          </View>
        ) : (
          <Pressable
            disabled={needsPermission || taking}
            onPress={handleCapture}
            style={({ pressed }) => ({
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 4,
              borderColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: needsPermission ? 0.35 : 1,
              transform: [{ scale: pressed && anim ? 0.93 : 1 }],
            })}
          >
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {taking && <ActivityIndicator color="#0a0f0c" />}
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}
