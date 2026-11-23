import React,{useEffect,useRef} from 'react';
import {Text,Animated} from 'react-native';
import {useApp} from '../AppContext';

export default function Toast(){
  const {msg,anim}=useApp();
  const op=useRef(new Animated.Value(0)).current;
  const sc=useRef(new Animated.Value(0.92)).current;

  useEffect(()=>{
    if(!msg)return;
    if(!anim){
      op.setValue(1);
      sc.setValue(1);
      return;
    }
    op.setValue(0);
    sc.setValue(0.92);
    Animated.parallel([
      Animated.timing(op,{toValue:1,duration:180,useNativeDriver:true}),
      Animated.spring(sc,{toValue:1,damping:18,stiffness:240,useNativeDriver:true}),
    ]).start();
  },[msg,anim,op,sc]);

  if(!msg)return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position:'absolute',
        top:'45%',
        alignSelf:'center',
        backgroundColor:'#0d1711ee',
        paddingHorizontal:24,
        paddingVertical:16,
        borderRadius:18,
        flexDirection:'row',
        gap:10,
        opacity:op,
        transform:[{scale:sc}],
      }}
    >
      <Text style={{color:'#fff',fontWeight:'700'}}>{msg}</Text>
    </Animated.View>
  );
}
