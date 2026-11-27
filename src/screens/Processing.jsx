import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { GC, GOLD } from '../theme';
import { Txt, Kernel } from '../components';
import { useApp } from '../AppContext';

const STEPS = [
  { label: 'Fetching tray image', activeText: 'Fetching…' },
  { label: 'Segmenting & preprocessing kernels', activeText: 'Processing…' },
  { label: 'Running YOLO11n-cls on Pi 5', activeText: 'Fetching AI…' },
  { label: 'Building grade & kernel count', activeText: 'Finalizing…' },
];

const STATUS_SUB = [
  'Fetching image from camera…',
  'Preprocessing tray & isolating kernels…',
  'Fetching YOLO11n-cls classification…',
  'Tallying kernel counts & majority class…',
  'Done! Preparing your result…',
];

const STAGE_TARGET = [14, 34, 62, 90, 100];
const STAGE_CEIL = [24, 50, 84, 96, 100];

export default function Processing() {
  const { T, dark, ps, anim, photo, demoSim } = useApp();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [pct, setPct] = useState(8);

  useEffect(() => {
    if (!anim) {
      spin.stopAnimation();
      spin.setValue(0.3);
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }
    spin.setValue(0);
    const sLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    );
    sLoop.start();
    pLoop.start();
    return () => {
      sLoop.stop();
      pLoop.stop();
    };
  }, [anim, spin, pulse]);

  // Smoothly advance percentage as `ps` progresses, gently creeping during Pi inference so it never feels stuck
  useEffect(() => {
    const idx = Math.max(0, Math.min(4, ps));
    const target = STAGE_TARGET[idx];
    const ceil = STAGE_CEIL[idx];

    setPct(prev => (idx === 0 ? 8 : Math.max(prev, target)));

    if (idx >= 4) {
      setPct(100);
      return;
    }

    const iv = setInterval(() => {
      setPct(prev => {
        if (prev < target) return Math.min(target, prev + 3);
        if (prev < ceil) return prev + 1;
        return prev;
      });
    }, 180);

    return () => clearInterval(iv);
  }, [ps]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const size = 104, sw = 5.5, r = (size - sw) / 2, c = 2 * Math.PI * r;
  const stageIdx = Math.max(0, Math.min(4, ps));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26, backgroundColor: T.bg }}>
      {/* Animated Spinner Ring + Photo/Kernel Preview */}
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: size, height: size, transform: [{ rotate }] }}>
          <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={dark ? '#24372b' : T.line} strokeWidth={sw} fill="none" />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={GC.A}
              strokeWidth={sw}
              fill="none"
              strokeDasharray={`${c * 0.30} ${c}`}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
        <View style={{
          width: 78,
          height: 78,
          borderRadius: 39,
          backgroundColor: '#26261f',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {photo ? (
            <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Kernel g={demoSim === 'auto' || demoSim === 'low' ? 'Class II' : demoSim} size={56} rot={-16} />
          )}
        </View>
      </View>

      {/* Live Percentage Pill */}
      <View style={{
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 99,
        backgroundColor: T.g2 + '1c',
        borderWidth: 1,
        borderColor: T.g2 + '38',
      }}>
        <Animated.View style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: GC.A,
          opacity: stageIdx >= 4 ? 1 : pulse,
        }} />
        <Text style={{ color: T.g2, fontFamily: 'OpenRunde-Bold', fontSize: 13 }}>
          {stageIdx >= 4 ? 'Complete' : 'Fetching…'} · {pct}%
        </Text>
      </View>

      <Txt s={26} w="800" style={{ marginTop: 14, textAlign: 'center' }}>Grading your tray</Txt>
      <Txt s={14} c={T.mute} style={{ marginTop: 4, textAlign: 'center' }}>
        {STATUS_SUB[stageIdx]}
      </Txt>

      {/* Smooth Progress Bar */}
      <View style={{
        width: '100%',
        marginTop: 20,
        height: 8,
        borderRadius: 99,
        backgroundColor: dark ? '#203028' : T.line,
        overflow: 'hidden',
      }}>
        <View style={{
          width: `${Math.max(pct, 4)}%`,
          height: '100%',
          borderRadius: 99,
          backgroundColor: GC.A,
        }} />
      </View>

      {/* Step Checklist Card */}
      <View style={{
        marginTop: 18,
        gap: 10,
        backgroundColor: T.card,
        borderWidth: 1,
        borderColor: T.line,
        borderRadius: 24,
        padding: 16,
        width: '100%',
      }}>
        {STEPS.map((st, i) => {
          const done = ps > i;
          const active = ps === i;
          return (
            <View
              key={st.label}
              style={{
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                paddingVertical: 6,
                paddingHorizontal: 8,
                borderRadius: 14,
                backgroundColor: active ? (dark ? '#17261e' : '#edf6f0') : 'transparent',
                opacity: done || active ? 1 : 0.42,
              }}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: done ? GC.A : active ? GOLD + '28' : (dark ? '#223128' : T.line),
                borderWidth: active ? 1.5 : 0,
                borderColor: active ? GOLD : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : active ? (
                  <Animated.View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: GOLD,
                    opacity: pulse,
                  }} />
                ) : (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.mute }} />
                )}
              </View>

              <Txt s={14} w={done || active ? '700' : '400'} style={{ flex: 1 }}>
                {st.label}
              </Txt>

              {active && (
                <Text style={{ color: T.g2, fontFamily: 'OpenRunde-Bold', fontSize: 11.5 }}>
                  {st.activeText}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
