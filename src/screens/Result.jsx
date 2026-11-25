import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GOLD, GC, GS, GRADES, normGrade, pc } from '../theme';
import { GN, PRICE_CONFIG, defectById } from '../data';
import { Txt, Btn, Kernel, DefectKernel } from '../components';
import { useApp } from '../AppContext';
import { sfx } from '../sound';

const HERO_THEME = {
  'Extra Class': {
    grad: ['#0f3d28', '#175438', '#0c2b1d'],
    glow: 'rgba(52, 211, 153, 0.18)',
    verdict: 'Top-grade whole kernel',
    icon: 'ribbon',
  },
  'Class I': {
    grad: ['#0e3832', '#154f46', '#0b2824'],
    glow: 'rgba(45, 212, 191, 0.18)',
    verdict: 'Good whole kernel',
    icon: 'checkmark-circle',
  },
  'Class II': {
    grad: ['#3a2d0f', '#4f3c13', '#261d0a'],
    glow: 'rgba(245, 158, 11, 0.20)',
    verdict: 'Minor surface flaws',
    icon: 'alert-circle',
  },
  'Defect': {
    grad: ['#3d1616', '#561d1d', '#290f0f'],
    glow: 'rgba(248, 113, 113, 0.20)',
    verdict: 'Sort out / reject',
    icon: 'warning',
  },
};

export default function Result() {
  const { T, dark, cur, saving, openCam, save, askDiscard, openRecommendations, openDefectEditor, setZoomImg, anim } = useApp();
  const heroScale = useRef(new Animated.Value(anim ? 0.94 : 1)).current;
  const heroFade = useRef(new Animated.Value(anim ? 0 : 1)).current;

  useEffect(() => {
    if (!cur) return;
    if (!anim) {
      heroScale.setValue(1);
      heroFade.setValue(1);
      return;
    }
    heroScale.setValue(0.94);
    heroFade.setValue(0);
    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, damping: 15, stiffness: 170, useNativeDriver: true }),
      Animated.timing(heroFade, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [cur, anim, heroScale, heroFade]);

  if (!cur) return null;
  const g = normGrade(cur.g);
  const c = GC[g];
  const ht = HERO_THEME[g] || HERO_THEME['Class I'];
  const detectedDefects = (cur.defects || []).map(defectById).filter(Boolean);
  const confPct = pc(cur.c);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 52, paddingBottom: 124, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Floating Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
          <Pressable
            onPress={() => { sfx('tap'); askDiscard(); }}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.line,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed && anim ? 0.94 : 1 }],
            })}
          >
            <Ionicons name="chevron-back" size={21} color={T.ink} />
          </Pressable>

          <Txt s={16} w="800">Scan Result</Txt>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 99,
            backgroundColor: cur.rv ? GC.B + '22' : c + '1c',
          }}>
            <Ionicons name={cur.rv ? 'flag' : 'sparkles'} size={12} color={cur.rv ? GC.B : c} />
            <Text style={{
              color: cur.rv ? GC.B : c,
              fontFamily: 'OpenRunde-Bold',
              fontSize: 11.5,
            }}>
              {cur.rv ? 'Review' : 'AI Graded'}
            </Text>
          </View>
        </View>

        {/* Grade-Adaptive Editorial Hero Card */}
        <Animated.View style={{ opacity: heroFade, transform: [{ scale: heroScale }] }}>
          <LinearGradient
            colors={ht.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 32,
              padding: 20,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: dark ? 0.35 : 0.16,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 6,
            }}
          >
            {/* Subtle Ambient Top-Right Glow */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -45,
                right: -35,
                width: 170,
                height: 170,
                borderRadius: 85,
                backgroundColor: ht.glow,
              }}
            />

            {/* Visual Stage: Captured Photo OR Spotlight Peanut */}
            {cur.img ? (
              <Pressable
                onPress={() => { sfx('tap'); setZoomImg(cur.img); }}
                style={{
                  width: '100%',
                  height: 178,
                  borderRadius: 22,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  marginBottom: 16,
                }}
              >
                <Image source={{ uri: cur.img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <View style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  backgroundColor: 'rgba(0,0,0,0.62)',
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
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 14 }}>
                <View style={{
                  width: 146,
                  height: 146,
                  borderRadius: 73,
                  backgroundColor: ht.glow,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <View style={{
                    width: 118,
                    height: 118,
                    borderRadius: 59,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.16)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Kernel g={g} size={96} rot={-16} />
                  </View>
                </View>
              </View>
            )}

            {/* Centered Verdict & Grade Pill */}
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 11,
                paddingVertical: 4,
                borderRadius: 99,
                backgroundColor: c,
              }}>
                <Ionicons name={ht.icon} size={13} color="#fff" />
                <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 11.5, letterSpacing: 0.4 }}>
                  {GS[g]} · {ht.verdict.toUpperCase()}
                </Text>
              </View>

              <Text style={{
                color: '#fff',
                fontFamily: 'OpenRunde-Bold',
                fontSize: 34,
                letterSpacing: -0.7,
                marginTop: 4,
              }}>
                {GN[g][0]}
              </Text>
            </View>

            {/* Integrated Sleek Confidence Meter */}
            <View style={{
              marginTop: 16,
              backgroundColor: 'rgba(0,0,0,0.24)',
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 11,
              gap: 8,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontFamily: 'OpenRunde-Semibold', fontSize: 12 }}>
                  {cur.total ? `AI Confidence · ${cur.total} kernels` : 'AI Confidence'}
                </Text>
                <Text style={{ color: '#fff', fontFamily: 'OpenRunde-Bold', fontSize: 15 }}>
                  {confPct}%
                </Text>
              </View>
              <View style={{
                height: 6,
                borderRadius: 99,
                backgroundColor: 'rgba(255,255,255,0.14)',
                overflow: 'hidden',
              }}>
                <View style={{
                  width: `${Math.max(confPct, 4)}%`,
                  height: '100%',
                  borderRadius: 99,
                  backgroundColor: cur.rv ? GOLD : c,
                }} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Low-Confidence Banner (1-liner) */}
        {cur.rv && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: GC.B + '1f',
            borderWidth: 1,
            borderColor: GC.B + '44',
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}>
            <Ionicons name="alert-circle" size={18} color={GC.B} />
            <Txt s={13} w="600" style={{ flex: 1 }}>
              Low confidence — verify kernel manually.
            </Txt>
          </View>
        )}

        {/* Unified AI Insights Card: Detected Anomalies + Segmented Score Distribution */}
        <View style={{
          backgroundColor: T.card,
          borderRadius: 26,
          borderWidth: 1,
          borderColor: T.line,
          padding: 16,
          gap: 16,
        }}>
          {/* Part 1: AI Detected Anomalies (Auto-selected + Editable) */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Ionicons name="scan-circle-outline" size={18} color={detectedDefects.length ? c : GC['Extra Class']} />
                <Txt s={14.5} w="800">AI Anomalies</Txt>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 99,
                  backgroundColor: detectedDefects.length ? c + '1f' : GC['Extra Class'] + '1f',
                }}>
                  <Text style={{
                    color: detectedDefects.length ? c : GC['Extra Class'],
                    fontFamily: 'OpenRunde-Bold',
                    fontSize: 11,
                  }}>
                    {detectedDefects.length ? `${detectedDefects.length} auto` : 'None'}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => { sfx('tap'); openDefectEditor(cur, 'res', null, false); }}
                hitSlop={8}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 99,
                  backgroundColor: dark ? '#1a2820' : T.bg,
                  borderWidth: 1,
                  borderColor: T.line,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="create-outline" size={13} color={T.g2} />
                <Text style={{ color: T.g2, fontFamily: 'OpenRunde-Bold', fontSize: 12 }}>Edit</Text>
              </Pressable>
            </View>

            {detectedDefects.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {detectedDefects.map(d => (
                  <Pressable
                    key={d.id}
                    onPress={() => { sfx('tap'); openDefectEditor(cur, 'res', null, false); }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 7,
                      paddingLeft: 8,
                      paddingRight: 12,
                      borderRadius: 15,
                      backgroundColor: dark ? '#16221c' : T.bg,
                      borderWidth: 1,
                      borderColor: d.color + '48',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <DefectKernel id={d.id} size={26} />
                    <Txt s={13} w="700">{d.name}</Txt>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: GC['Extra Class'] + '12',
              }}>
                <Ionicons name="checkmark-circle" size={17} color={GC['Extra Class']} />
                <Txt s={13.5} w="600">Clean kernel — no anomalies found</Txt>
              </View>
            )}
          </View>

          <View style={{ height: 1, backgroundColor: T.line }} />

          {/* Part 2: Continuous Stacked Class Distribution Bar + Clean 4-Col Legend */}
          <View style={{ gap: 10 }}>
            <View style={{
              flexDirection: 'row',
              height: 10,
              borderRadius: 99,
              overflow: 'hidden',
              backgroundColor: dark ? '#1d2b23' : T.line,
              gap: 2,
            }}>
              {GRADES.map(x => {
                const v = cur.p?.[x] || 0;
                if (v <= 0.005) return null;
                return (
                  <View
                    key={x}
                    style={{
                      flex: v,
                      backgroundColor: GC[x],
                      borderRadius: 99,
                    }}
                  />
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {GRADES.map(x => {
                const active = x === g;
                const col = GC[x];
                return (
                  <View key={x} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: col }} />
                      <Text style={{
                        color: active ? col : T.mute,
                        fontFamily: 'OpenRunde-Bold',
                        fontSize: 11.5,
                      }}>
                        {GS[x]}
                      </Text>
                    </View>
                    <Txt s={14} w={active ? '800' : '600'} c={active ? T.ink : T.mute} style={{ marginTop: 2 }}>
                      {pc(cur.p?.[x] || 0)}%
                    </Txt>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Tinted Interactive CTA: Guide & Batch Value */}
        <Pressable
          onPress={() => { sfx('tap'); openRecommendations(cur, null, false); }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: dark ? '#15291f' : '#e6f3ec',
            borderRadius: 22,
            borderWidth: 1,
            borderColor: T.g2 + '40',
            paddingVertical: 14,
            paddingHorizontal: 16,
            gap: 12,
            transform: [{ scale: pressed && anim ? 0.985 : 1 }],
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: T.g2,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="calculator-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt s={15} w="800">Guide &amp; Batch Value</Txt>
              <Txt s={12.5} c={T.mute}>
                Fixes &amp; PSA ₱{(cur.price ?? PRICE_CONFIG.basePricePerKg).toFixed(0)}/kg
              </Txt>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={T.g2} />
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
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 30,
        flexDirection: 'row',
        gap: 12,
      }}>
        <Btn t="Scan again" kind="sec" onPress={openCam} />
        <Btn t="Save result" onPress={save} busy={saving} />
      </View>
    </View>
  );
}
