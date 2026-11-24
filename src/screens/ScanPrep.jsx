import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GR, GOLD } from '../theme';
import { Txt, Btn } from '../components';
import { useApp } from '../AppContext';
import { sfx } from '../sound';

const CHAMBER_STEPS = [
  ['cube-outline', 'Place one kernel', 'Center it on the matte pad. Keep it apart from others.'],
  ['flash-outline', 'Close the lid', 'The LED ring turns on and shuts out room light.'],
  ['scan-outline', 'Hold still', 'Don’t move the chamber while the camera captures.'],
];

const CAMERA_STEPS = [
  ['cube-outline', 'Isolate one kernel', 'Place a single kernel on a plain, dark or matte surface.'],
  ['sunny-outline', 'Use even lighting', 'Avoid harsh shadows or turn on the camera torch inside the scanner.'],
  ['scan-outline', 'Center in the frame', 'Hold your phone steady about 12–15 cm above the kernel.'],
];

export default function ScanPrep() {
  const { T, demo, setScr, openCam, anim } = useApp();
  const steps = demo ? CHAMBER_STEPS : CAMERA_STEPS;
  const fade = useRef(new Animated.Value(anim ? 0 : 1)).current;
  const slide = useRef(new Animated.Value(anim ? 14 : 0)).current;

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

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28 }}>
      <Pressable
        onPress={() => { sfx('tap'); setScr('home', -1) }}
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

      <Txt s={30} w="800" style={{ marginTop: 18, letterSpacing: -0.5 }}>
        {demo ? 'Set up the chamber' : 'Prepare your kernel'}
      </Txt>
      <Txt s={15} c={T.mute} style={{ marginTop: 6, marginBottom: 10, lineHeight: 21 }}>
        {demo
          ? 'Consistent light and background keep grades comparable between scans.'
          : 'Good lighting and a clean background help the camera capture sharp kernel details.'}
      </Txt>

      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        {steps.map(([ic, a, b], idx) => (
          <View
            key={a}
            style={{
              flexDirection: 'row',
              gap: 14,
              padding: 16,
              marginTop: 12,
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.line,
              borderRadius: 24,
              alignItems: 'center',
            }}
          >
            <View style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              backgroundColor: GR,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name={ic} size={22} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Text style={{ color: T.g2, fontFamily:'OpenRunde-Bold', fontSize: 12 }}>0{idx + 1}</Text>
                <Txt s={16} w="700">{a}</Txt>
              </View>
              <Txt s={13.5} c={T.mute} style={{ marginTop: 3, lineHeight: 19 }}>{b}</Txt>
            </View>
          </View>
        ))}
      </Animated.View>

      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row' }}>
        <Btn t="Open camera" icon="camera-outline" kind={demo ? undefined : 'gold'} onPress={openCam} />
      </View>
    </View>
  );
}
