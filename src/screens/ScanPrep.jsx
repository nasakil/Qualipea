import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GR, GOLD, GC } from '../theme';
import { Txt, Btn } from '../components';
import { useApp } from '../AppContext';
import { sfx } from '../sound';

const CHAMBER_STEPS = [
  ['cube-outline', 'Spread kernels on tray', 'Place 5+ kernels on the tray, spaced apart so they don’t touch.'],
  ['flash-outline', 'Close the lid', 'The LED ring turns on and shuts out room light.'],
  ['scan-outline', 'Hold still', 'Don’t move the chamber while the RPi camera captures.'],
];

const CAMERA_STEPS = [
  ['cube-outline', 'Spread kernels on tray', 'Place 5+ kernels on a plain tray, spaced apart so they don’t touch.'],
  ['sunny-outline', 'Use even lighting', 'Avoid harsh shadows so every kernel stands out clearly.'],
  ['scan-outline', 'Fit whole tray in frame', 'Keep the entire tray inside the frame with even lighting.'],
];

export default function ScanPrep() {
  const { T, dark, demo, setDemo, dev, setDev, piInfo, piUrl, refreshPiStatus, setScr, openCam, toast, anim, skipPrep, setSkipPrep } = useApp();
  const steps = demo ? CHAMBER_STEPS : CAMERA_STEPS;
  const fade = useRef(new Animated.Value(anim ? 0 : 1)).current;
  const slide = useRef(new Animated.Value(anim ? 14 : 0)).current;
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!demo) {
      setChecking(true);
      refreshPiStatus().finally(() => setChecking(false));
    }
  }, [demo]);

  useEffect(() => {
    if (!anim) {
      fade.setValue(1);
      slide.setValue(0);
      return;
    }
    fade.setValue(0);
    slide.setValue(14);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [anim, fade, slide]);

  const piOnline = !demo && dev === 1;
  const camOk = demo || piInfo?.cameraReady;
  const modelOk = demo || piOnline;

  const checklist = [
    {
      label: 'Raspberry Pi 5 API',
      sub: demo ? 'Simulated (Demo mode)' : (piOnline ? piUrl.replace(/^https?:\/\//, '') : 'Offline — not reachable'),
      ok: demo || piOnline,
      tag: demo ? 'Demo' : (checking ? 'Checking…' : piOnline ? 'Online' : 'Offline'),
    },
    {
      label: 'Camera Feed',
      sub: demo ? 'Demo preview active' : (piOnline ? (piInfo?.cameraReady ? `${piInfo.cameraBackend || 'picamera2'} ready` : 'RPi cam unavailable · Phone ready') : 'Phone preview only'),
      ok: camOk,
      tag: demo ? 'Demo' : (piInfo?.cameraReady ? 'RPi Cam' : 'Phone'),
    },
    {
      label: 'YOLO11n-cls Model',
      sub: demo ? 'Simulated grading' : (piOnline ? `${piInfo?.classesCount || 4} classes loaded` : 'Required for live grading'),
      ok: modelOk,
      tag: demo ? 'Demo' : (modelOk ? 'Ready' : 'Missing'),
    },
  ];

  const handleRecheck = async () => {
    sfx('tap');
    setChecking(true);
    await refreshPiStatus();
    setChecking(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => { sfx('tap'); setScr('home', -1); }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 15,
            backgroundColor: T.card,
            borderWidth: 1,
            borderColor: T.line,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed && anim ? 0.94 : 1 }],
          })}
        >
          <Ionicons name="chevron-back" size={24} color={T.ink} />
        </Pressable>

        <Txt s={28} w="800" style={{ marginTop: 16, letterSpacing: -0.5 }}>
          {demo ? 'Set up the chamber' : 'Prepare your tray'}
        </Txt>
        <Txt s={14.5} c={T.mute} style={{ marginTop: 4, lineHeight: 20 }}>
          {demo
            ? 'Demo mode simulates Pi 5 grading so you can test the flow offline.'
            : 'Check your Pi 5 & model status below before scanning a tray.'}
        </Txt>

        {/* System Readiness Checklist Card */}
        <View style={{
          marginTop: 16,
          backgroundColor: T.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: !demo && !piOnline ? GOLD + '55' : T.line,
          padding: 15,
          gap: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Ionicons name="checkbox-outline" size={17} color={T.g2} />
              <Txt s={14.5} w="800">System checklist</Txt>
            </View>
            {!demo && (
              <Pressable
                onPress={handleRecheck}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 99,
                  backgroundColor: dark ? '#1b2b22' : T.bg,
                  borderWidth: 1,
                  borderColor: T.line,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="refresh-outline" size={13} color={T.g2} />
                <Text style={{ color: T.g2, fontFamily: 'OpenRunde-Bold', fontSize: 11.5 }}>
                  {checking ? 'Checking…' : 'Check'}
                </Text>
              </Pressable>
            )}
          </View>

          {checklist.map(item => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 4,
              }}
            >
              <Ionicons
                name={item.ok ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={demo ? GOLD : (item.ok ? GC.A : GC.C)}
              />
              <View style={{ flex: 1 }}>
                <Txt s={14} w="700">{item.label}</Txt>
                <Txt s={12} c={T.mute}>{item.sub}</Txt>
              </View>
              <View style={{
                paddingHorizontal: 9,
                paddingVertical: 3,
                borderRadius: 99,
                backgroundColor: (demo ? GOLD : item.ok ? GC.A : GC.C) + '20',
              }}>
                <Text style={{
                  color: demo ? GOLD : (item.ok ? GC.A : GC.C),
                  fontFamily: 'OpenRunde-Bold',
                  fontSize: 11,
                }}>
                  {item.tag}
                </Text>
              </View>
            </View>
          ))}

          {!demo && !piOnline && (
            <View style={{
              marginTop: 4,
              padding: 11,
              borderRadius: 15,
              backgroundColor: GOLD + '18',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}>
              <Txt s={12.5} w="600" style={{ flex: 1, lineHeight: 17 }}>
                No Pi 5 / model detected. Test the camera preview or switch to Demo mode.
              </Txt>
              <Pressable
                onPress={() => { sfx('tap'); setDemo(true); setDev(1); toast('Demo mode enabled'); }}
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 7,
                  borderRadius: 11,
                  backgroundColor: GOLD,
                }}
              >
                <Text style={{ color: '#1d1403', fontFamily: 'OpenRunde-Bold', fontSize: 12 }}>Use Demo</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Tray Prep Steps */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {steps.map(([ic, a, b], idx) => (
            <View
              key={a}
              style={{
                flexDirection: 'row',
                gap: 14,
                padding: 15,
                marginTop: 11,
                backgroundColor: T.card,
                borderWidth: 1,
                borderColor: T.line,
                borderRadius: 22,
                alignItems: 'center',
              }}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: GR,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name={ic} size={21} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ color: T.g2, fontFamily: 'OpenRunde-Bold', fontSize: 12 }}>0{idx + 1}</Text>
                  <Txt s={15.5} w="700">{a}</Txt>
                </View>
                <Txt s={13} c={T.mute} style={{ marginTop: 2, lineHeight: 18 }}>{b}</Txt>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Sticky Bottom Controls */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: T.bg,
        borderTopWidth: 1,
        borderTopColor: T.line,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 28,
      }}>
        <Pressable
          onPress={() => { sfx('tap'); setSkipPrep(!skipPrep); }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            alignSelf: 'center',
            paddingHorizontal: 14,
            paddingVertical: 7,
            marginBottom: 8,
            borderRadius: 14,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: skipPrep ? T.g2 : T.mute,
            backgroundColor: skipPrep ? T.g2 : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {skipPrep && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
          <Txt s={13.5} w="600" c={T.mute}>Skip prep next time</Txt>
        </Pressable>
        <View style={{ flexDirection: 'row' }}>
          <Btn
            t={!demo && !piOnline ? 'Test camera preview' : 'Open camera'}
            icon="camera-outline"
            kind={demo ? undefined : 'gold'}
            onPress={openCam}
          />
        </View>
      </View>
    </View>
  );
}
