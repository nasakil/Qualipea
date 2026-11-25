import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { GOLD, GC, GS, GRADES, normGrade, pc } from '../theme';
import { GN, PRICE_CONFIG, defectById } from '../data';
import { Txt, Btn, Kernel, DefectKernel } from '../components';
import { useApp } from '../AppContext';
import { sfx } from '../sound';

const SHORT_VERDICT = {
  'Extra Class': 'Premium whole kernel',
  'Class I': 'Good whole kernel',
  'Class II': 'Minor surface flaws',
  'Defect': 'Sort out / reject',
};

export default function Result() {
  const { T, dark, cur, saving, openCam, save, askDiscard, openRecommendations, setZoomImg, anim } = useApp();
  const heroScale = useRef(new Animated.Value(anim ? 0.92 : 1)).current;
  const heroFade = useRef(new Animated.Value(anim ? 0 : 1)).current;

  useEffect(() => {
    if (!cur) return;
    if (!anim) {
      heroScale.setValue(1);
      heroFade.setValue(1);
      return;
    }
    heroScale.setValue(0.92);
    heroFade.setValue(0);
    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, damping: 14, stiffness: 170, useNativeDriver: true }),
      Animated.timing(heroFade, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [cur, anim, heroScale, heroFade]);

  if (!cur) return null;
  const g = normGrade(cur.g);
  const c = GC[g];
  const detectedDefects = (cur.defects || []).map(defectById).filter(Boolean);
  const r = 24;
  const circ = 2 * Math.PI * r;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 54, paddingBottom: 126, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Top Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => { sfx('tap'); askDiscard(); }}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 15,
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.line,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed && anim ? 0.94 : 1 }],
            })}
          >
            <Ionicons name="chevron-back" size={22} color={T.ink} />
          </Pressable>

          <Txt s={16.5} w="800">Result</Txt>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 11,
            paddingVertical: 6,
            borderRadius: 99,
            backgroundColor: cur.rv ? GC.B + '22' : T.g2 + '1e',
          }}>
            <Ionicons name={cur.rv ? 'flag' : 'sparkles'} size={12} color={cur.rv ? GC.B : T.g2} />
            <Text style={{
              color: cur.rv ? GC.B : T.g2,
              fontFamily: 'OpenRunde-Bold',
              fontSize: 11.5,
            }}>
              {cur.rv ? 'Review' : 'AI Graded'}
            </Text>
          </View>
        </View>

        {/* Visual Hero Card */}
        <Animated.View style={{ opacity: heroFade, transform: [{ scale: heroScale }] }}>
          <LinearGradient
            colors={T.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 30,
              padding: 18,
              overflow: 'hidden',
              gap: 16,
            }}
          >
            {/* Visual Frame (Captured Photo or Peanut SVG) + Floating Confidence Ring */}
            <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 164 }}>
              {cur.img ? (
                <Pressable
                  onPress={() => { sfx('tap'); setZoomImg(cur.img); }}
                  style={{
                    width: '100%',
                    height: 176,
                    borderRadius: 22,
                    overflow: 'hidden',
                    backgroundColor: '#121a15',
                  }}
                >
                  <Image source={{ uri: cur.img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <View style={{
                    position: 'absolute',
                    left: 10,
                    bottom: 10,
                    backgroundColor: 'rgba(0,0,0,0.58)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 99,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                    <Ionicons name="expand-outline" size={13} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'OpenRunde-Bold' }}>Zoom</Text>
                  </View>
                </Pressable>
              ) : (
                <View style={{
                  width: 138,
                  height: 138,
                  borderRadius: 42,
                  backgroundColor: 'rgba(255,255,255,0.09)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Kernel g={g} size={102} rot={-18} />
                </View>
              )}

              {/* Floating Confidence Ring */}
              <View style={{
                position: 'absolute',
                top: cur.img ? 10 : 2,
                right: cur.img ? 10 : 2,
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: 'rgba(10,24,16,0.72)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Svg width={58} height={58} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx={29} cy={29} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={4.5} fill="none" />
                  <Circle
                    cx={29}
                    cy={29}
                    r={r}
                    stroke={GOLD}
                    strokeWidth={4.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - cur.c)}
                  />
                </Svg>
                <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 13.5 }}>{pc(cur.c)}%</Text>
              </View>
            </View>

            {/* Clean Class Identity Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                backgroundColor: c,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 22 }}>{GS[g]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 27, letterSpacing: -0.4 }}>
                  {GN[g][0]}
                </Text>
                <Text style={{ color: '#ffffffbd', fontFamily: 'OpenRunde-Medium', fontSize: 13.5, marginTop: 1 }}>
                  {SHORT_VERDICT[g]}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Low-Confidence Alert (Compact 1-liner) */}
        {cur.rv && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: GC.B + '22',
            borderWidth: 1,
            borderColor: GC.B + '44',
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 11,
          }}>
            <Ionicons name="alert-circle" size={19} color={GC.B} />
            <Txt s={13} w="600" style={{ flex: 1 }}>
              Low AI confidence — double-check kernel manually.
            </Txt>
          </View>
        )}

        {/* AI-Detected Defects Visual Strip (100% AI, Zero Manual Checkboxes) */}
        <View style={{
          backgroundColor: T.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: T.line,
          padding: 15,
          gap: 11,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="eye-outline" size={16} color={T.g2} />
              <Txt s={14} w="800">AI detected</Txt>
            </View>
            <View style={{
              paddingHorizontal: 9,
              paddingVertical: 3,
              borderRadius: 99,
              backgroundColor: detectedDefects.length ? GC.C + '20' : GC['Extra Class'] + '20',
            }}>
              <Text style={{
                color: detectedDefects.length ? GC.C : GC['Extra Class'],
                fontFamily: 'OpenRunde-Bold',
                fontSize: 11.5,
              }}>
                {detectedDefects.length ? `${detectedDefects.length} found` : 'Clean'}
              </Text>
            </View>
          </View>

          {detectedDefects.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {detectedDefects.map(d => (
                <View
                  key={d.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 7,
                    paddingLeft: 8,
                    paddingRight: 12,
                    borderRadius: 15,
                    backgroundColor: dark ? '#16221c' : T.bg,
                    borderWidth: 1,
                    borderColor: d.color + '44',
                  }}
                >
                  <DefectKernel id={d.id} size={28} />
                  <Txt s={13} w="700">{d.name}</Txt>
                </View>
              ))}
            </View>
          ) : (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: GC['Extra Class'] + '14',
            }}>
              <Ionicons name="checkmark-circle" size={18} color={GC['Extra Class']} />
              <Txt s={13.5} w="600" c={T.ink}>No surface defects detected</Txt>
            </View>
          )}
        </View>

        {/* Compact 4-Column Bento Score Strip */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {GRADES.map(x => {
            const val = cur.p?.[x] || 0;
            const active = x === g;
            const col = GC[x];
            return (
              <View
                key={x}
                style={{
                  flex: 1,
                  backgroundColor: active ? col + '18' : T.card,
                  borderRadius: 20,
                  borderWidth: active ? 1.5 : 1,
                  borderColor: active ? col : T.line,
                  paddingVertical: 11,
                  paddingHorizontal: 8,
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{
                  color: active ? col : T.mute,
                  fontFamily: 'OpenRunde-Bold',
                  fontSize: 11.5,
                }}>
                  {GS[x]}
                </Text>
                <Txt s={15.5} w="800" c={active ? T.ink : T.mute}>{pc(val)}%</Txt>
                <View style={{
                  width: '100%',
                  height: 5,
                  borderRadius: 99,
                  backgroundColor: dark ? '#203028' : T.line,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    width: `${Math.max(val * 100, val > 0 ? 10 : 0)}%`,
                    height: '100%',
                    borderRadius: 99,
                    backgroundColor: col,
                  }} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Sleek One-Line Guide & Batch Value Tile */}
        <Pressable
          onPress={() => { sfx('tap'); openRecommendations(cur, null, false); }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: T.card,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: T.g2 + '55',
            padding: 15,
            gap: 12,
            transform: [{ scale: pressed && anim ? 0.985 : 1 }],
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: T.g2 + '1e',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="calculator-outline" size={20} color={T.g2} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt s={15} w="800">Guide &amp; Batch Value</Txt>
              <Txt s={12.5} c={T.mute}>
                ₱{(cur.price ?? PRICE_CONFIG.basePricePerKg).toFixed(0)}/kg · Region XI
              </Txt>
            </View>
          </View>
          <View style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: T.g2,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="arrow-forward" size={17} color="#fff" />
          </View>
        </Pressable>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: T.bg,
        borderTopWidth: 1,
        borderTopColor: T.line,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 32,
        flexDirection: 'row',
        gap: 12,
      }}>
        <Btn t="Scan again" kind="sec" onPress={openCam} />
        <Btn t="Save result" onPress={save} busy={saving} />
      </View>
    </View>
  );
}
