import React from 'react';
import {Text} from 'react-native';
import {useT,fontForWeight} from '../theme';

export const Txt=({s=15,w='400',c,children,style})=>{
  const T=useT();
  return (
    <Text style={[{fontSize:s,fontFamily:fontForWeight(w),color:c||T.ink},style]}>
      {children}
    </Text>
  );
};
