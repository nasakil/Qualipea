import React from 'react';
import {View} from 'react-native';
import {Txt} from '../components';
import {useApp} from '../AppContext';

export default function Top({title,sub,right}){
  const {T}=useApp();
  return (
    <View style={{
      paddingTop:58,
      paddingBottom:18,
      flexDirection:'row',
      justifyContent:'space-between',
      alignItems:'center',
      gap:12,
    }}>
      <View style={{flex:1}}>
        {!!sub&&<Txt s={14.5} w="500" c={T.mute} style={{marginBottom:3}}>{sub}</Txt>}
        <Txt s={32} w="800" style={{letterSpacing:-0.5}}>{title}</Txt>
      </View>
      {right}
    </View>
  );
}
