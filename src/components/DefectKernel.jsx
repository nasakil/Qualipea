import React,{useState} from 'react';
import {View} from 'react-native';
import Svg,{Path,Circle,Ellipse,Defs,RadialGradient,Stop} from 'react-native-svg';

let dfid=0;

export const DefectKernel=({id='moldy',size=48,rot=-16})=>{
  const [uid]=useState(()=>'dfk'+(++dfid));
  const body='M9 35 C9 21, 19 14, 34 15 C45 16, 54 22, 57 30 C59 34, 57 39, 52 42 C44 48, 30 50, 19 47 C12 45, 9 41, 9 35 Z';
  const shriveledBody='M11 36 C12 24, 21 20, 33 22 C43 23, 52 24, 55 31 C57 36, 51 41, 42 42 C31 44, 19 44, 13 40 Z';
  const isDark=id==='moldy'||id==='insect';

  return (
    <View style={{width:size,height:size,transform:[{rotate:`${rot}deg`}]}}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <RadialGradient id={uid} cx="36%" cy="32%" r="76%">
            <Stop offset="0%" stopColor={isDark?'#b38358':'#e2aa76'}/>
            <Stop offset="62%" stopColor={isDark?'#7d532f':'#b97340'}/>
            <Stop offset="100%" stopColor={isDark?'#472b15':'#793f1c'}/>
          </RadialGradient>
        </Defs>

        <Ellipse cx={33} cy={51} rx={18} ry={3.2} fill="#000000" fillOpacity={0.18}/>

        {id==='shriveled'?(
          <>
            <Path d={shriveledBody} fill={`url(#${uid})`} stroke="#633516" strokeWidth={1.1}/>
            <Path
              d="M20 24 C23 29, 23 36, 20 41 M30 23 C33 29, 33 36, 30 42 M40 24 C43 29, 43 35, 40 40"
              stroke="#5b3012"
              strokeWidth={1.6}
              strokeOpacity={0.72}
              fill="none"
              strokeLinecap="round"
            />
          </>
        ):(
          <>
            <Path d={body} fill={`url(#${uid})`} stroke="#5a3014" strokeWidth={1.1} strokeOpacity={0.7}/>
            <Path d="M16 32 C26 26, 39 25, 50 31" stroke="#683516" strokeWidth={1} strokeOpacity={0.3} fill="none" strokeLinecap="round"/>
            <Path d="M16 26 C23 20, 35 19, 45 23" stroke="#fff3e0" strokeWidth={2} strokeOpacity={0.38} fill="none" strokeLinecap="round"/>
          </>
        )}

        {id==='moldy'&&(
          <>
            <Circle cx={25} cy={31} r={5.5} fill="#4b8555" fillOpacity={0.92}/>
            <Circle cx={35} cy={36} r={6.5} fill="#34633d" fillOpacity={0.92}/>
            <Circle cx={31} cy={27} r={3.6} fill="#7dc288" fillOpacity={0.86}/>
            <Circle cx={40} cy={31} r={2.4} fill="#9cd6a5" fillOpacity={0.78}/>
          </>
        )}

        {id==='damaged'&&(
          <>
            <Path d="M31 15 L28 28 L35 33 L31 48 L39 46 L42 32 L36 27 L38 16 Z" fill="#f3dfc0" fillOpacity={0.92}/>
            <Path d="M31 15 L28 28 L35 33 L31 48" stroke="#3a1e0b" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </>
        )}

        {id==='discolored'&&(
          <>
            <Ellipse cx={38} cy={35} rx={10} ry={6.5} fill="#3e200c" fillOpacity={0.84}/>
            <Circle cx={23} cy={29} r={4.5} fill="#542c11" fillOpacity={0.74}/>
          </>
        )}

        {id==='insect'&&(
          <>
            <Circle cx={24} cy={32} r={2.8} fill="#1b0f06"/>
            <Circle cx={36} cy={29} r={2.5} fill="#1b0f06"/>
            <Circle cx={33} cy={39} r={2.3} fill="#1b0f06"/>
            <Circle cx={41} cy={35} r={1.3} fill="#ebd6b0"/>
            <Circle cx={28} cy={39} r={1.2} fill="#ebd6b0"/>
          </>
        )}
      </Svg>
    </View>
  );
};
