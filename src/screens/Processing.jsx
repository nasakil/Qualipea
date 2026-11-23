import React,{useEffect,useRef} from 'react';
import {View,Animated,Easing} from 'react-native';
import Svg,{Circle} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {GC} from '../theme';
import {Txt} from '../components';
import {useApp} from '../AppContext';

const STEPS=[
  'Validating image',
  'Applying training preprocessing',
  'Running YOLO11-cls',
  'Fetching reference price',
];

export default function Processing(){
  const {T,dark,ps,anim}=useApp();
  const spin=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    if(!anim){
      spin.stopAnimation();
      spin.setValue(0.3);
      return;
    }
    spin.setValue(0);
    const loop=Animated.loop(
      Animated.timing(spin,{
        toValue:1,
        duration:1100,
        easing:Easing.linear,
        useNativeDriver:true,
      })
    );
    loop.start();
    return()=>loop.stop();
  },[anim,spin]);

  const rotate=spin.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
  const size=68,sw=5,r=(size-sw)/2,c=2*Math.PI*r;

  return (
    <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:30}}>
      <Animated.View style={{width:size,height:size,transform:[{rotate}]}}>
        <Svg width={size} height={size}>
          <Circle cx={size/2} cy={size/2} r={r} stroke={dark?'#24372b':T.line} strokeWidth={sw} fill="none"/>
          <Circle
            cx={size/2}
            cy={size/2}
            r={r}
            stroke={GC.A}
            strokeWidth={sw}
            fill="none"
            strokeDasharray={`${c*0.28} ${c}`}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Txt s={26} w="800" style={{marginTop:24}}>Grading your kernel</Txt>
      <Txt c={T.mute} style={{marginTop:4}}>YOLO11-cls is reading the image</Txt>
      <View style={{
        marginTop:26,
        gap:14,
        backgroundColor:T.card,
        borderWidth:1,
        borderColor:T.line,
        borderRadius:24,
        padding:20,
        width:'100%',
      }}>
        {STEPS.map((s,i)=>{
          const done=ps>i;
          return (
            <View key={s} style={{flexDirection:'row',gap:12,alignItems:'center',opacity:done?1:.4}}>
              <View style={{
                width:24,
                height:24,
                borderRadius:12,
                backgroundColor:done?GC.A:(dark?'#223128':T.line),
                alignItems:'center',
                justifyContent:'center',
              }}>
                <Ionicons name="checkmark" size={14} color={done?'#fff':T.mute}/>
              </View>
              <Txt w={done?'600':'400'}>{s}</Txt>
            </View>
          );
        })}
      </View>
    </View>
  );
}
