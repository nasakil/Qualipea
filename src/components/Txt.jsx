import React,{useState} from 'react';
import {View,Text,Pressable,ActivityIndicator} from 'react-native';
import Svg,{Path,Circle,Defs,RadialGradient,Stop,G} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {COL,GR,GOLD,GC,pc,useT} from '../theme';

export const Txt=({s=15,w='400',c,children,style})=>{const T=useT();return <Text style={[{fontSize:s,fontWeight:w,color:c||T.ink},style]}>{children}</Text>};
