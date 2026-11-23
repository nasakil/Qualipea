import React,{useState} from 'react';
import {View,Text,Pressable,ActivityIndicator} from 'react-native';
import Svg,{Path,Circle,Defs,RadialGradient,Stop,G} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {COL,GR,GOLD,GC,pc,useT} from '../theme';

export const Chip=({t,c})=><View style={{backgroundColor:c+'26',paddingHorizontal:10,paddingVertical:4,borderRadius:99}}><Text style={{color:c,fontWeight:'700',fontSize:12.5}}>{t}</Text></View>;
