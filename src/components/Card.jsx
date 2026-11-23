import React,{useState} from 'react';
import {View,Text,Pressable,ActivityIndicator} from 'react-native';
import Svg,{Path,Circle,Defs,RadialGradient,Stop,G} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {COL,GR,GOLD,GC,pc,useT} from '../theme';

export const Card=({children,style})=>{const T=useT();return <View style={[{backgroundColor:T.card,borderRadius:24,padding:16,shadowColor:'#0d2a1a',shadowOpacity:.1,shadowRadius:14,shadowOffset:{width:0,height:6},elevation:3},style]}>{children}</View>};
