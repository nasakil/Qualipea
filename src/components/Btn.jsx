import React from 'react';
import {Text,Pressable,ActivityIndicator} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {GR,GOLD,GC,useT,useAnim} from '../theme';
import {sfx} from '../sound';

export const Btn=({t,onPress,kind,icon,busy})=>{
  const T=useT();
  const anim=useAnim();
  const bg=kind==='gold'?GOLD:kind==='red'?GC.C:kind==='sec'?T.card:GR;
  const fg=kind==='gold'?'#2a1d04':kind==='sec'?T.ink:'#fff';
  return (
    <Pressable
      onPress={(e)=>{sfx('tap');onPress&&onPress(e)}}
      disabled={busy}
      style={({pressed})=>({
        flex:1,
        height:56,
        borderRadius:20,
        backgroundColor:bg,
        alignItems:'center',
        justifyContent:'center',
        flexDirection:'row',
        gap:8,
        opacity:busy?.7:1,
        transform:[{scale:pressed&&anim?.97:1}],
        borderWidth:kind==='sec'?1.5:0,
        borderColor:T.line,
      })}
    >
      {busy?<ActivityIndicator color={fg}/>:icon&&<Ionicons name={icon} size={20} color={fg}/>}
      <Text style={{color:fg,fontFamily:'OpenRunde-Bold',fontSize:16}}>{t}</Text>
    </Pressable>
  );
};
