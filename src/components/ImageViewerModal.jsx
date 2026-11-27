import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { GC, GS, GOLD, normGrade, pc } from '../theme';
import { useApp } from '../AppContext';
import { sfx } from '../sound';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.8;
const DOUBLE_TAP_DELAY = 290;
const DOUBLE_TAP_DIST = 36;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function normalizeViewerPayload(zoomImg) {
  if (!zoomImg) return null;
  if (typeof zoomImg === 'string') {
    return {
      annotatedImg: null,
      originalImg: zoomImg,
      img: zoomImg,
      kernels: null,
      imageWidth: null,
      imageHeight: null,
      initialMode: 'annotated',
    };
  }
  const annotatedImg = zoomImg.annotatedImg || null;
  const originalImg = zoomImg.originalImg || (zoomImg.img && zoomImg.img !== annotatedImg ? zoomImg.img : null);
  const img = zoomImg.img || annotatedImg || originalImg || null;
  return {
    annotatedImg,
    originalImg,
    img,
    kernels: Array.isArray(zoomImg.kernels) ? zoomImg.kernels : null,
    imageWidth: zoomImg.imageWidth || null,
    imageHeight: zoomImg.imageHeight || null,
    initialMode: zoomImg.initialMode || (annotatedImg ? 'annotated' : 'original'),
  };
}

export function BoundingBoxOverlay({ kernels, fitW, fitH, natW, natH }) {
  if (!Array.isArray(kernels) || kernels.length === 0 || !fitW || !fitH) return null;
  const validBoxes = kernels.filter(k => Array.isArray(k?.bbox) && k.bbox.length === 4);
  if (validBoxes.length === 0) return null;

  const srcW = natW || fitW;
  const srcH = natH || fitH;

  return (
    <Svg width={fitW} height={fitH} style={StyleSheet.absoluteFill} pointerEvents="none">
      {validBoxes.map((k, idx) => {
        const [rx1, ry1, rx2, ry2] = k.bbox;
        const isNorm = rx2 <= 1.05 && ry2 <= 1.05 && rx1 >= 0 && ry1 >= 0;
        const x1 = (isNorm ? rx1 * fitW : (rx1 / srcW) * fitW);
        const y1 = (isNorm ? ry1 * fitH : (ry1 / srcH) * fitH);
        const x2 = (isNorm ? rx2 * fitW : (rx2 / srcW) * fitW);
        const y2 = (isNorm ? ry2 * fitH : (ry2 / srcH) * fitH);
        const bw = Math.max(2, x2 - x1);
        const bh = Math.max(2, y2 - y1);
        const g = normGrade(k.grade || k.class || k.label);
        const color = GC[g] || GOLD;
        const confText = typeof k.confidence === 'number' ? ` ${pc(k.confidence)}%` : '';
        const label = `${GS[g] || g}${confText}`;
        const pillW = Math.max(38, label.length * 6.5 + 10);
        const pillH = 16;
        const pillY = y1 >= pillH + 2 ? y1 - pillH - 2 : y1 + 2;
        const pillX = clamp(x1, 1, Math.max(1, fitW - pillW - 1));

        return (
          <G key={k.id ?? idx}>
            <Rect
              x={x1}
              y={y1}
              width={bw}
              height={bh}
              rx={4}
              stroke={color}
              strokeWidth={2}
              fill="transparent"
            />
            <Rect
              x={pillX}
              y={pillY}
              width={pillW}
              height={pillH}
              rx={4}
              fill={color}
            />
            <SvgText
              x={pillX + 5}
              y={pillY + 11.5}
              fill="#ffffff"
              fontSize={9.5}
              fontWeight="700"
            >
              {label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function ImageViewerModal() {
  const { zoomImg, setZoomImg } = useApp();
  const payload = useMemo(() => normalizeViewerPayload(zoomImg), [zoomImg]);

  const initialWindow = Dimensions.get('window');
  const [stage, setStage] = useState({ width: initialWindow.width, height: initialWindow.height });
  const [natSize, setNatSize] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState('annotated'); // 'annotated' | 'original'
  const [displayScale, setDisplayScale] = useState(1);

  const animScale = useRef(new Animated.Value(1)).current;
  const animTx = useRef(new Animated.Value(0)).current;
  const animTy = useRef(new Animated.Value(0)).current;

  // Mutable live transform state for zero-lag gesture math
  const tfRef = useRef({ scale: 1, tx: 0, ty: 0 });
  const fitRef = useRef({ fitW: initialWindow.width, fitH: initialWindow.width, stageW: initialWindow.width, stageH: initialWindow.height });
  const gestureRef = useRef({
    touchCount: 0,
    startScale: 1,
    startTx: 0,
    startTy: 0,
    startX: 0,
    startY: 0,
    pinchDist: 0,
    pinchMidX: 0,
    pinchMidY: 0,
    moved: false,
    grantTime: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
  });

  const hasVectorBoxes = Boolean(
    payload?.kernels?.some(k => Array.isArray(k?.bbox) && k.bbox.length === 4)
  );
  const hasDistinctAnnotated = Boolean(
    payload?.annotatedImg && payload?.originalImg && payload.annotatedImg !== payload.originalImg
  );
  const canToggleMode = hasDistinctAnnotated || (hasVectorBoxes && Boolean(payload?.originalImg || payload?.img));

  const activeUri = useMemo(() => {
    if (!payload) return null;
    if (viewMode === 'original') {
      return payload.originalImg || payload.img || payload.annotatedImg;
    }
    return payload.annotatedImg || payload.img || payload.originalImg;
  }, [payload, viewMode]);

  const showVectorOverlay = Boolean(
    viewMode === 'annotated' &&
    !payload?.annotatedImg &&
    hasVectorBoxes
  );

  // Reset mode & transform when opening a new image
  useEffect(() => {
    if (!payload) return;
    setViewMode(payload.initialMode || (payload.annotatedImg || hasVectorBoxes ? 'annotated' : 'original'));
    tfRef.current = { scale: 1, tx: 0, ty: 0 };
    animScale.setValue(1);
    animTx.setValue(0);
    animTy.setValue(0);
    setDisplayScale(1);
    if (payload.imageWidth && payload.imageHeight) {
      setNatSize({ width: payload.imageWidth, height: payload.imageHeight });
    } else {
      setNatSize({ width: 0, height: 0 });
    }
  }, [payload, hasVectorBoxes, animScale, animTx, animTy]);

  // Measure natural image dimensions to preserve original aspect ratio
  useEffect(() => {
    if (!activeUri) return;
    let cancelled = false;
    Image.getSize(
      activeUri,
      (w, h) => {
        if (!cancelled && w > 0 && h > 0) {
          setNatSize({ width: w, height: h });
        }
      },
      () => { }
    );
    return () => { cancelled = true; };
  }, [activeUri]);

  const { fitW, fitH } = useMemo(() => {
    const sw = Math.max(1, stage.width);
    const sh = Math.max(1, stage.height);
    if (natSize.width > 0 && natSize.height > 0) {
      const imgRatio = natSize.width / natSize.height;
      const stageRatio = sw / sh;
      if (imgRatio > stageRatio) {
        return { fitW: sw, fitH: sw / imgRatio };
      }
      return { fitW: sh * imgRatio, fitH: sh };
    }
    const side = Math.min(sw, sh * 0.8);
    return { fitW: side, fitH: side };
  }, [stage.width, stage.height, natSize.width, natSize.height]);

  fitRef.current = { fitW, fitH, stageW: stage.width, stageH: stage.height };

  const clampTranslation = useCallback((tx, ty, scale) => {
    const { fitW: fw, fitH: fh, stageW: sw, stageH: sh } = fitRef.current;
    const maxTx = Math.max(0, (fw * scale - sw) / 2);
    const maxTy = Math.max(0, (fh * scale - sh) / 2);
    return {
      tx: clamp(tx, -maxTx, maxTx),
      ty: clamp(ty, -maxTy, maxTy),
    };
  }, []);

  const applyTransformImmediate = useCallback((scale, tx, ty) => {
    const clampedScale = clamp(scale, MIN_SCALE, MAX_SCALE);
    const bounded = clampTranslation(tx, ty, clampedScale);
    tfRef.current = { scale: clampedScale, tx: bounded.tx, ty: bounded.ty };
    animScale.setValue(clampedScale);
    animTx.setValue(bounded.tx);
    animTy.setValue(bounded.ty);
    setDisplayScale(Math.round(clampedScale * 10) / 10);
  }, [animScale, animTx, animTy, clampTranslation]);

  const animateToTransform = useCallback((targetScale, targetTx, targetTy) => {
    const s = clamp(targetScale, MIN_SCALE, MAX_SCALE);
    const bounded = s <= 1.01 ? { tx: 0, ty: 0 } : clampTranslation(targetTx, targetTy, s);
    tfRef.current = { scale: s, tx: bounded.tx, ty: bounded.ty };
    setDisplayScale(Math.round(s * 10) / 10);
    Animated.parallel([
      Animated.spring(animScale, { toValue: s, damping: 22, stiffness: 260, useNativeDriver: true }),
      Animated.spring(animTx, { toValue: bounded.tx, damping: 22, stiffness: 260, useNativeDriver: true }),
      Animated.spring(animTy, { toValue: bounded.ty, damping: 22, stiffness: 260, useNativeDriver: true }),
    ]).start();
  }, [animScale, animTx, animTy, clampTranslation]);

  const resetZoom = useCallback(() => {
    animateToTransform(1, 0, 0);
  }, [animateToTransform]);

  const stepZoom = useCallback((delta) => {
    sfx('tap');
    const cur = tfRef.current;
    const nextScale = clamp(Math.round((cur.scale + delta) * 2) / 2, MIN_SCALE, MAX_SCALE);
    if (nextScale <= 1.01) {
      animateToTransform(1, 0, 0);
      return;
    }
    const ratio = nextScale / cur.scale;
    animateToTransform(nextScale, cur.tx * ratio, cur.ty * ratio);
  }, [animateToTransform]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches || [];
        const g = gestureRef.current;
        const cur = tfRef.current;
        g.grantTime = Date.now();
        g.moved = false;
        g.touchCount = touches.length;
        g.startScale = cur.scale;
        g.startTx = cur.tx;
        g.startTy = cur.ty;

        if (touches.length >= 2) {
          const [t1, t2] = touches;
          g.pinchDist = Math.max(1, Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY));
          g.pinchMidX = (t1.pageX + t2.pageX) / 2;
          g.pinchMidY = (t1.pageY + t2.pageY) / 2;
        } else if (touches.length === 1) {
          g.startX = touches[0].pageX;
          g.startY = touches[0].pageY;
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches || [];
        const g = gestureRef.current;
        const cur = tfRef.current;
        const { stageW, stageH } = fitRef.current;

        // Smoothly re-anchor baseline whenever touch count switches (1 <-> 2 fingers)
        if (touches.length !== g.touchCount) {
          g.touchCount = touches.length;
          g.startScale = cur.scale;
          g.startTx = cur.tx;
          g.startTy = cur.ty;
          if (touches.length >= 2) {
            const [t1, t2] = touches;
            g.pinchDist = Math.max(1, Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY));
            g.pinchMidX = (t1.pageX + t2.pageX) / 2;
            g.pinchMidY = (t1.pageY + t2.pageY) / 2;
          } else if (touches.length === 1) {
            g.startX = touches[0].pageX;
            g.startY = touches[0].pageY;
          }
          return;
        }

        if (touches.length >= 2) {
          g.moved = true;
          const [t1, t2] = touches;
          const dist = Math.max(1, Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY));
          const midX = (t1.pageX + t2.pageX) / 2;
          const midY = (t1.pageY + t2.pageY) / 2;

          const nextScale = clamp(g.startScale * (dist / g.pinchDist), MIN_SCALE, MAX_SCALE);
          const scaleFactor = nextScale / g.startScale;

          // Focal-point coordinates relative to viewport center
          const cx = stageW / 2;
          const cy = stageH / 2;
          const startRelX = g.pinchMidX - cx;
          const startRelY = g.pinchMidY - cy;
          const nowRelX = midX - cx;
          const nowRelY = midY - cy;

          const nextTx = nowRelX - (startRelX - g.startTx) * scaleFactor;
          const nextTy = nowRelY - (startRelY - g.startTy) * scaleFactor;
          applyTransformImmediate(nextScale, nextTx, nextTy);
        } else if (touches.length === 1) {
          const dx = touches[0].pageX - g.startX;
          const dy = touches[0].pageY - g.startY;
          if (Math.hypot(dx, dy) > 8) g.moved = true;

          if (cur.scale > 1.01) {
            applyTransformImmediate(cur.scale, g.startTx + dx, g.startTy + dy);
          }
        }
      },
      onPanResponderRelease: (evt) => {
        const g = gestureRef.current;
        const cur = tfRef.current;
        const now = Date.now();

        // Detect double-tap to zoom in (centered on tap) or reset to 1x
        if (!g.moved && g.touchCount === 1 && (now - g.grantTime) < 260) {
          const pageX = evt.nativeEvent.pageX;
          const pageY = evt.nativeEvent.pageY;
          const dt = now - g.lastTapTime;
          const dist = Math.hypot(pageX - g.lastTapX, pageY - g.lastTapY);

          if (dt < DOUBLE_TAP_DELAY && dist < DOUBLE_TAP_DIST) {
            g.lastTapTime = 0;
            sfx('tap');
            if (cur.scale > 1.08) {
              animateToTransform(1, 0, 0);
            } else {
              const { stageW, stageH } = fitRef.current;
              const relX = pageX - stageW / 2;
              const relY = pageY - stageH / 2;
              const ratio = DOUBLE_TAP_SCALE / cur.scale;
              const nextTx = -relX * (ratio - 1);
              const nextTy = -relY * (ratio - 1);
              animateToTransform(DOUBLE_TAP_SCALE, nextTx, nextTy);
            }
            return;
          }
          g.lastTapTime = now;
          g.lastTapX = pageX;
          g.lastTapY = pageY;
        }

        // Snap cleanly to bounds or 1x on release
        if (cur.scale <= 1.03) {
          animateToTransform(1, 0, 0);
        } else {
          animateToTransform(cur.scale, cur.tx, cur.ty);
        }
      },
      onPanResponderTerminate: () => {
        const cur = tfRef.current;
        if (cur.scale <= 1.03) {
          animateToTransform(1, 0, 0);
        } else {
          animateToTransform(cur.scale, cur.tx, cur.ty);
        }
      },
    })
  ).current;

  if (!payload || !activeUri) return null;

  const closeViewer = () => {
    setZoomImg(null);
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={closeViewer}>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,12,8,0.96)' }}>
        {/* Interactive Zoom & Pan Stage */}
        <View
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) setStage({ width, height });
          }}
          {...panResponder.panHandlers}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        >
          <Animated.View
            style={{
              width: fitW,
              height: fitH,
              transform: [
                { translateX: animTx },
                { translateY: animTy },
                { scale: animScale },
              ],
            }}
          >
            <Image
              source={{ uri: activeUri }}
              onLoad={(e) => {
                const s = e?.nativeEvent?.source;
                if (s?.width > 0 && s?.height > 0) {
                  setNatSize({ width: s.width, height: s.height });
                }
              }}
              style={{ width: fitW, height: fitH }}
              resizeMode="contain"
            />
            {showVectorOverlay && (
              <BoundingBoxOverlay
                kernels={payload.kernels}
                fitW={fitW}
                fitH={fitH}
                natW={natSize.width || payload.imageWidth}
                natH={natSize.height || payload.imageHeight}
              />
            )}
          </Animated.View>
        </View>

        {/* Top Bar: Hint + Annotated/Original Switcher + Close */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 54 : 40,
            left: 16,
            right: 16,
            zIndex: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {canToggleMode ? (
            <View style={{
              flexDirection: 'row',
              backgroundColor: 'rgba(18,32,24,0.88)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.16)',
              borderRadius: 99,
              padding: 3,
              gap: 3,
            }}>
              {[
                ['annotated', 'Annotated'],
                ['original', 'Original'],
              ].map(([modeKey, label]) => {
                const active = viewMode === modeKey;
                return (
                  <Pressable
                    key={modeKey}
                    onPress={() => {
                      if (viewMode === modeKey) return;
                      sfx('tap');
                      setViewMode(modeKey);
                    }}
                    style={{
                      paddingHorizontal: 13,
                      paddingVertical: 7,
                      borderRadius: 99,
                      backgroundColor: active ? GOLD : 'transparent',
                    }}
                  >
                    <Text style={{
                      color: active ? '#1d1403' : '#d5e6dc',
                      fontFamily: 'OpenRunde-Bold',
                      fontSize: 12,
                    }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={{
              backgroundColor: 'rgba(18,32,24,0.82)',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 99,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}>
              <Text style={{ color: '#cfe3d6', fontSize: 12, fontFamily: 'OpenRunde-Bold' }}>
                {displayScale > 1.05 ? 'Drag to pan · Double-tap to reset' : 'Pinch or double-tap to zoom'}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => { sfx('tap'); closeViewer(); }}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={23} color="#fff" />
          </Pressable>
        </View>

        {/* Bottom Zoom Controls Bar (1x - 5x) */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 40 : 28,
            left: 16,
            right: 16,
            zIndex: 20,
            alignItems: 'center',
            gap: 8,
          }}
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(14,26,19,0.9)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.16)',
            borderRadius: 99,
            paddingHorizontal: 8,
            paddingVertical: 6,
            gap: 8,
          }}>
            <Pressable
              onPress={() => stepZoom(-0.5)}
              disabled={displayScale <= MIN_SCALE}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: displayScale <= MIN_SCALE ? 0.35 : 1,
              }}
            >
              <Ionicons name="remove" size={18} color="#fff" />
            </Pressable>

            <Pressable
              onPress={() => { sfx('tap'); resetZoom(); }}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 }}
            >
              <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 13 }}>
                {displayScale.toFixed(1)}x
              </Text>
            </Pressable>

            <Pressable
              onPress={() => stepZoom(0.5)}
              disabled={displayScale >= MAX_SCALE}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: displayScale >= MAX_SCALE ? 0.35 : 1,
              }}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </Pressable>

            {displayScale > 1.05 && (
              <Pressable
                onPress={() => { sfx('tap'); resetZoom(); }}
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderRadius: 99,
                  backgroundColor: GOLD,
                }}
              >
                <Text style={{ color: '#1d1403', fontFamily: 'OpenRunde-Bold', fontSize: 12 }}>Reset</Text>
              </Pressable>
            )}
          </View>

          <Text style={{ color: 'rgba(207,227,214,0.75)', fontSize: 11.5, fontFamily: 'OpenRunde-Medium' }}>
            {displayScale > 1.05
              ? 'Drag in any direction to pan · Double-tap to reset'
              : 'Pinch or double-tap to zoom up to 5x'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
