import React,{useState} from 'react';
import Svg,{Path,Circle,Defs,RadialGradient,Stop,G} from 'react-native-svg';
import {COL,normGrade} from '../theme';

let kid=0;
export const Kernel=({g='Extra Class',size=80,rot=-14})=>{
  const [id]=useState(()=>'k'+(++kid));
  const key=normGrade(g);
  const [a,b]=COL[key]||COL['Extra Class'];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={id} cx=".38" cy=".32" r=".85">
          <Stop offset="0" stopColor={a}/>
          <Stop offset="1" stopColor={b}/>
        </RadialGradient>
      </Defs>
      <G rotation={rot} origin="50,50">
        <Path d="M16 52c0-18 13-28 34-28s34 10 34 28-13 26-34 26S16 70 16 52z" fill={`url(#${id})`}/>
        <Path d="M26 45c9-10 28-13 46-4" stroke="#fff6" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        {key==='Defect'&&<Circle cx="64" cy="58" r="6" fill="#2b180899"/>}
      </G>
    </Svg>
  );
};
