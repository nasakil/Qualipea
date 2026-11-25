import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Ellipse, Defs, RadialGradient, LinearGradient, Stop } from 'react-native-svg';
import { normGrade } from '../theme';

const PALETTES = {
  'Extra Class': { hi: '#f0bd8c', mid: '#cf834c', lo: '#8f4a24', vein: '#7a3a18', rim: '#fff1de' },
  'Class I': { hi: '#e8b380', mid: '#c47843', lo: '#844320', vein: '#703516', rim: '#fae8d2' },
  'Class II': { hi: '#d9a26e', mid: '#ab6b3b', lo: '#6f3c1b', vein: '#592d12', rim: '#eed8be' },
  'Defect': { hi: '#9e714a', mid: '#6d4728', lo: '#3a2210', vein: '#291608', rim: '#b89674' },
};

let kid = 0;

export const Kernel = ({ g = 'Extra Class', size = 80, rot = -18 }) => {
  const [id] = useState(() => 'pk' + (++kid));
  const key = normGrade(g);
  const p = PALETTES[key] || PALETTES['Extra Class'];

  // Organic shelled Spanish peanut silhouette: plump rounded tail (left) tapering to a subtle germ beak (right)
  const bodyPath = 'M14 54 C14 33, 30 22, 52 24 C70 25, 84 35, 89 47 C92 53, 89 60, 81 65 C68 74, 46 77, 29 73 C18 70, 14 63, 14 54 Z';

  return (
    <View style={{ width: size, height: size, transform: [{ rotate: `${rot}deg` }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={`${id}_body`} cx="36%" cy="32%" r="76%">
            <Stop offset="0%" stopColor={p.hi} />
            <Stop offset="58%" stopColor={p.mid} />
            <Stop offset="100%" stopColor={p.lo} />
          </RadialGradient>
          <LinearGradient id={`${id}_shine`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={p.rim} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={p.rim} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Soft drop shadow underneath kernel */}
        <Ellipse cx={51} cy={78} rx={30} ry={5} fill="#000000" fillOpacity={0.18} />

        {/* Main organic Spanish peanut kernel body */}
        <Path d={bodyPath} fill={`url(#${id}_body)`} stroke={p.lo} strokeWidth={1.2} strokeOpacity={0.65} />

        {/* Subtle hilum / germ tip accent at the tapered right end */}
        <Path
          d="M84 44 C88 47, 89 52, 85 57"
          stroke={p.lo}
          strokeWidth={1.6}
          strokeOpacity={0.55}
          fill="none"
          strokeLinecap="round"
        />

        {/* Delicate longitudinal testa (skin) veins */}
        <Path
          d="M23 48 C38 38, 60 36, 80 46"
          stroke={p.vein}
          strokeWidth={1.15}
          strokeOpacity={0.28}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M22 57 C40 53, 62 52, 81 55"
          stroke={p.vein}
          strokeWidth={1.2}
          strokeOpacity={0.32}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M29 66 C46 66, 63 64, 77 60"
          stroke={p.vein}
          strokeWidth={1.1}
          strokeOpacity={0.24}
          fill="none"
          strokeLinecap="round"
        />

        {/* Natural glossy top-left highlight */}
        <Path
          d="M25 40 C35 30, 54 28, 70 34 C56 32, 39 34, 28 43 Z"
          fill={`url(#${id}_shine)`}
        />

        {/* Class II: subtle exposed cream cotyledon scuff / minor skin peel */}
        {key === 'Class II' && (
          <>
            <Path
              d="M54 56 C60 53, 67 55, 68 61 C65 65, 57 65, 53 61 Z"
              fill="#f0d9b5"
              fillOpacity={0.82}
              stroke="#9a6434"
              strokeWidth={0.9}
              strokeOpacity={0.55}
            />
            <Path
              d="M42 42 C46 44, 48 48, 46 52"
              stroke="#5c3214"
              strokeWidth={1.3}
              strokeOpacity={0.45}
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Defect: realistic dark blemish, moldy spot & tiny bore mark */}
        {key === 'Defect' && (
          <>
            <Ellipse cx={57} cy={55} rx={11} ry={7.5} fill="#2b1708" fillOpacity={0.68} />
            <Circle cx={45} cy={46} r={5.5} fill="#4c7a52" fillOpacity={0.72} />
            <Circle cx={63} cy={57} r={2.3} fill="#180d04" fillOpacity={0.9} />
            <Path
              d="M32 45 C36 52, 34 60, 30 66"
              stroke="#241307"
              strokeWidth={1.5}
              strokeOpacity={0.55}
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
      </Svg>
    </View>
  );
};
