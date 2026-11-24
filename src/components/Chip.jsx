import React from 'react';
import {View,Text} from 'react-native';

export const Chip=({t,c})=>(
  <View style={{backgroundColor:c+'26',paddingHorizontal:10,paddingVertical:4,borderRadius:99}}>
    <Text style={{color:c,fontFamily:'OpenRunde-Bold',fontSize:12.5}}>{t}</Text>
  </View>
);
