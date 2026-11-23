import React,{useState} from 'react';
import {View,Text,Pressable,ActivityIndicator} from 'react-native';
import Svg,{Path,Circle,Defs,RadialGradient,Stop,G} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {COL,GR,GOLD,GC,pc,useT} from '../theme';

export const Ring=({v,c})=>{const T=useT(),r=22,L=2*Math.PI*r;return <View style={{width:54,height:54,alignItems:'center',justifyContent:'center'}}><Svg width={54} height={54} style={{position:'absolute',transform:[{rotate:'-90deg'}]}}><Circle cx={27} cy={27} r={r} stroke={T.line} strokeWidth={5} fill="none"/><Circle cx={27} cy={27} r={r} stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L*(1-v)}/></Svg><Text style={{fontWeight:'800',fontSize:13,color:T.ink}}>{pc(v)}%</Text></View>};
