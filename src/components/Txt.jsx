import React from 'react';
import {Text,StyleSheet} from 'react-native';
import {useT,fontForWeight} from '../theme';

export const Txt=({s=15,w='400',c,children,style})=>{
  const T=useT();
  const flat=style?StyleSheet.flatten(style):{};
  const {fontWeight,...rest}=flat||{};
  const fam=flat?.fontFamily||fontForWeight(fontWeight||w);
  return (
    <Text style={[{fontSize:s,fontFamily:fam,color:c||T.ink},rest]}>
      {children}
    </Text>
  );
};
