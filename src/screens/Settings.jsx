import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GC } from '../theme';
import { HARDWARE_SPECS, SOFTWARE_SPECS } from '../data';
import { Card, Txt, Btn, Chip } from '../components';
import Top from '../components/Top';
import { useApp } from '../AppContext';
import { sfx } from '../sound';

const TEAM_MEMBERS = [
  ['NA', 'Asakil, Norman B.'],
  ['DG', 'Gonzales, Daniella A.'],
  ['KJ', 'Jimenez, Kiesha Mae C.'],
  ['MS', 'Simo, Melgen II A.'],
];

export default function Settings() {
  const { snd, toggleSnd, anim, toggleAnim, piUrl, setPiUrl, skipPrep, setSkipPrep, dark, setDark, T, demo, dev, dg, connect, toggleDemo, askExit, runDiag, setSheet, close } = useApp();
  const [showSpecs, setShowSpecs] = useState(false);

  const openTeamSheet = () => {
    sfx('tap');
    setSheet({
      node: (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={{
            width: 58,
            height: 58,
            borderRadius: 20,
            backgroundColor: T.g2 + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="people-outline" size={28} color={T.g2} />
          </View>
          <Txt s={23} w="800" style={{ marginTop: 12, textAlign: 'center' }}>Team QualiPea</Txt>
          <Txt s={13.5} c={T.mute} style={{ marginTop: 6, textAlign: 'center', lineHeight: 19, maxWidth: 295 }}>
            QualiPea is a mobile app and imaging chamber that grades Spanish peanut kernels using computer vision.
          </Txt>

          <View style={{
            width: '100%',
            marginTop: 16,
            padding: 12,
            borderRadius: 22,
            backgroundColor: dark ? '#0f1913' : T.bg,
            borderWidth: 1,
            borderColor: T.line,
            gap: 8,
          }}>
            <Txt s={11.5} w="800" c={T.g2} style={{ marginLeft: 4, marginBottom: 2 }}>DEVELOPED BY</Txt>
            {TEAM_MEMBERS.map(([initials, name]) => (
              <View
                key={name}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 11,
                  paddingVertical: 6,
                  paddingHorizontal: 6,
                }}
              >
                <View style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  backgroundColor: T.g2 + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: T.g2, fontFamily: 'OpenRunde-Bold', fontSize: 12 }}>{initials}</Text>
                </View>
                <Txt s={14.5} w="700">{name}</Txt>
              </View>
            ))}
          </View>

          <Txt s={12.5} c={T.mute} style={{ marginTop: 14, textAlign: 'center', lineHeight: 18 }}>
            Holy Cross of Davao College{'\n'}Bachelor of Science in Information Technology · 4th Year
          </Txt>
          <Txt s={11.5} c={T.mute} style={{ marginTop: 6 }}>QualiPea · Version 1.0.0</Txt>
        </View>
      ),
      btns: [['Close', 'sec', close]],
    });
  };
  const on = dev === 1;
  const R = [
    ['hardware-chip-outline', 'Raspberry Pi 5', on, on ? `Connected (${piUrl.replace(/^https?:\/\//, '')})` : dev === 2 ? 'Connecting…' : `Offline · ${piUrl.replace(/^https?:\/\//, '')}`],
    ['camera-outline', 'Camera Module 3', on, on ? 'Ready, 12 MP' : 'Unavailable until the Pi connects'],
    ['sunny-outline', 'LED ring', on, on ? 'On, lighting is even' : 'Off'],
    ['cube-outline', 'Grading model', on, on ? 'yolo11n-cls 1.0.0 · 4 classes' : 'Can’t check until the Pi connects'],
  ];
  const ok = R.filter(r => r[2]).length;

  const prefs = [
    ['Animations', 'Motion, transitions and pulses', anim, toggleAnim],
    ['Sound & haptics', 'Audio and tactile feedback', snd, toggleSnd],
    ['Skip scan prep', 'Go straight to the scanner', skipPrep, setSkipPrep],
    ['Demo mode', 'Simulated chamber and sample data', demo, toggleDemo],
    ['Dark mode', 'Low-glare dark interface', dark, setDark],
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 145 }} showsVerticalScrollIndicator={false}>
      <Top
        title="Settings"
        right={
          <Pressable
            onPress={openTeamSheet}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 13,
              paddingVertical: 9,
              borderRadius: 99,
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.line,
              transform: [{ scale: pressed && anim ? 0.95 : 1 }],
            })}
          >
            <Ionicons name="people-outline" size={16} color={T.g2} />
            <Text style={{ color: T.ink, fontFamily: 'OpenRunde-Bold', fontSize: 12.5 }}>Team</Text>
          </Pressable>
        }
      />
      <Card style={{ borderWidth: 1, borderColor: T.line }}>
        <Txt s={13.5} c={T.mute}>System status</Txt>
        <Txt s={23} w="800" style={{ marginTop: 2 }}>
          {dev === 2 ? 'Connecting…' : ok === R.length ? 'All systems ready' : on ? 'Some checks pending' : 'Chamber offline'}
        </Txt>
        <Txt s={13.5} c={T.mute} style={{ marginBottom: 8 }}>{ok} of {R.length} checks passing</Txt>
        {R.map(([ic, t, o, s], i) => (
          <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10 }}>
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: o ? T.g2 + '24' : T.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name={ic} size={22} color={o ? T.g2 : T.mute} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt w="700">{t}</Txt>
              <Txt s={13} c={T.mute}>{s}</Txt>
            </View>
            {dg >= 0 && i >= dg ? <Chip t={i === dg ? 'Checking' : 'Queued'} c="#667a6d" /> : <Chip t={o ? 'Ready' : 'Offline'} c={o ? GC.A : GC.C} />}
          </View>
        ))}
        <View style={{ gap: 10, marginTop: 12 }}>
          {!on && dev !== 2 && (
            <View style={{ flexDirection: 'row' }}>
              <Btn t="Connect chamber" kind="gold" onPress={() => connect()} />
            </View>
          )}
          <View style={{ flexDirection: 'row' }}>
            <Btn t={dg >= 0 ? 'Running diagnostics…' : 'Run diagnostics'} kind="sec" onPress={runDiag} />
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: 14, borderWidth: 1, borderColor: T.line }}>
        <Txt w="700" s={15.5}>Raspberry Pi 5 server URL</Txt>
        <Txt s={12.5} c={T.mute} style={{ marginTop: 2, marginBottom: 10 }}>
          Used when Demo mode is off to connect and grade kernel photos.
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TextInput
            value={piUrl}
            onChangeText={setPiUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.137.31:8000"
            placeholderTextColor={T.mute}
            style={{
              flex: 1,
              backgroundColor: T.bg,
              color: T.ink,
              borderWidth: 1,
              borderColor: T.line,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14.5,
              fontFamily: 'OpenRunde-Semibold',
            }}
          />
          <Pressable
            onPress={() => { sfx('tap'); connect(); }}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: T.g2,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed && anim ? 0.96 : 1 }],
            })}
          >
            <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 14 }}>
              {dev === 2 ? 'Testing…' : 'Test'}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card style={{ marginTop: 14, borderWidth: 1, borderColor: T.line, paddingVertical: 6 }}>
        {prefs.map(([a, b, v, f], idx) => (
          <View
            key={a}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 11,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: T.line,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Txt w="600" s={15.5}>{a}</Txt>
              {!!b && <Txt s={12.5} c={T.mute} style={{ marginTop: 2 }}>{b}</Txt>}
            </View>
            <Switch value={v} onValueChange={f} trackColor={{ false: T.line, true: T.g2 }} />
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: 14, borderWidth: 1, borderColor: T.line, padding: 0, overflow: 'hidden' }}>
        <Pressable
          onPress={() => { sfx('tap'); setShowSpecs(v => !v) }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: T.g2 + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="hardware-chip-outline" size={20} color={T.g2} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt s={15.5} w="700">Hardware &amp; software specs</Txt>
              <Txt s={12.5} c={T.mute}>Imaging chamber &amp; YOLO11-cls stack</Txt>
            </View>
          </View>
          <Ionicons name={showSpecs ? 'chevron-up' : 'chevron-down'} size={20} color={T.mute} />
        </Pressable>

        {showSpecs && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: T.line, paddingTop: 14, gap: 10 }}>
            <Txt s={12} w="800" c={T.g2}>HARDWARE</Txt>
            {HARDWARE_SPECS.map(([name, detail]) => (
              <View key={name}>
                <Txt s={14} w="700">{name}</Txt>
                <Txt s={12.5} c={T.mute}>{detail}</Txt>
              </View>
            ))}
            <Txt s={12} w="800" c={T.g2} style={{ marginTop: 8 }}>SOFTWARE</Txt>
            {SOFTWARE_SPECS.map(([name, detail]) => (
              <View key={name}>
                <Txt s={14} w="700">{name}</Txt>
                <Txt s={12.5} c={T.mute}>{detail}</Txt>
              </View>
            ))}
          </View>
        )}
      </Card>

      <View style={{ flexDirection: 'row', marginTop: 14 }}>
        <Btn t="Exit app" kind="sec" icon="exit-outline" onPress={askExit} />
      </View>
      <Txt s={12.5} c={T.mute} style={{ marginTop: 12 }}>
        Prototype with sample data. Grades, prices and status values are illustrative.
      </Txt>
    </ScrollView>
  );
}
