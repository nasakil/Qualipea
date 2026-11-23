import React,{useState} from 'react';
import {View,Text,Pressable,ActivityIndicator} from 'react-native';
import Svg,{Path,Circle,Defs,RadialGradient,Stop,G} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {COL,GR,GOLD,GC,pc,useT} from '../theme';

export const Brk=({s=26,c=GOLD})=>[[0,0,'Top','Left'],[0,1,'Top','Right'],[1,0,'Bottom','Left'],[1,1,'Bottom','Right']].map(([b,r,v,h],i)=><View key={i} style={{position:'absolute',[v.toLowerCase()]:0,[h.toLowerCase()]:0,width:s,height:s,borderColor:c,['border'+v+'Width']:3,['border'+h+'Width']:3,['border'+v+h+'Radius']:12}}/>);
