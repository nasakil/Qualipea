import React,{useEffect,useRef} from 'react';
import {View,Text,Animated,ActivityIndicator} from 'react-native';
import {useApp} from '../AppContext';

export default function SavingOverlay(){
  const {saving,anim}=useApp();
  const fade=useRef(new Animated.Value(0)).current;
  const scale=useRef(new Animated.Value(0.92)).current;

  useEffect(()=>{
    if(!saving)return;
    if(!anim){
      fade.setValue(1);
      scale.setValue(1);
      return;
    }
    fade.setValue(0);
    scale.setValue(0.92);
    Animated.parallel([
      Animated.timing(fade,{toValue:1,duration:180,useNativeDriver:true}),
      Animated.spring(scale,{toValue:1,damping:18,stiffness:240,useNativeDriver:true}),
    ]).start();
  },[saving,anim,fade,scale]);

  if(!saving)return null;
  return (
    <Animated.View style={{
      position:'absolute',
      top:0,
      left:0,
      right:0,
      bottom:0,
      backgroundColor:'rgba(6,16,10,0.58)',
      alignItems:'center',
      justifyContent:'center',
      opacity:fade,
    }}>
      <Animated.View style={{
        backgroundColor:'#0f1e15',
        borderWidth:1,
        borderColor:'rgba(255,255,255,0.12)',
        paddingHorizontal:28,
        paddingVertical:22,
        borderRadius:24,
        alignItems:'center',
        gap:12,
        transform:[{scale}],
      }}>
        <ActivityIndicator color="#fff" size="large"/>
        <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:15}}>Saving scan…</Text>
      </Animated.View>
    </Animated.View>
  );
}
