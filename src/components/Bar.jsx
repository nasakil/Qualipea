import React,{useEffect,useRef} from 'react';
import {View,Animated} from 'react-native';
import {useT,useAnim} from '../theme';

export const Bar=({v,c,h=6})=>{
  const T=useT();
  const anim=useAnim();
  const pct=Math.max(0,Math.min(1,v||0));
  const widthAnim=useRef(new Animated.Value(anim?0:pct)).current;

  useEffect(()=>{
    if(!anim){
      widthAnim.setValue(pct);
      return;
    }
    Animated.timing(widthAnim,{
      toValue:pct,
      duration:520,
      useNativeDriver:false,
    }).start();
  },[pct,anim,widthAnim]);

  const width=widthAnim.interpolate({
    inputRange:[0,1],
    outputRange:['0%','100%'],
  });

  return (
    <View style={{height:h,borderRadius:9,backgroundColor:T.line,overflow:'hidden'}}>
      <Animated.View style={{width,height:'100%',backgroundColor:c,borderRadius:9}}/>
    </View>
  );
};
