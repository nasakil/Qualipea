import React,{useEffect,useRef} from 'react';
import {View,Text,Pressable,Animated} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {GOLD} from '../theme';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

const ITEMS=[
  ['home','home-outline','Home',1],
  ['hist','time-outline','History',1],
  null,
  ['dash','bar-chart-outline','Dashboard',1.2],
  ['set','settings-outline','Settings',1.05],
];

export default function TabBar(){
  const {T,dark,scr,goTab,startScan,anim}=useApp();
  const fabPulse=useRef(new Animated.Value(1)).current;

  useEffect(()=>{
    if(!anim){
      fabPulse.stopAnimation();
      fabPulse.setValue(1);
      return;
    }
    const loop=Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse,{toValue:1.05,duration:1500,useNativeDriver:true}),
        Animated.timing(fabPulse,{toValue:1,duration:1500,useNativeDriver:true}),
      ])
    );
    loop.start();
    return()=>loop.stop();
  },[anim,fabPulse]);

  return (
    <View style={{
      position:'absolute',
      left:10,
      right:10,
      bottom:20,
      minHeight:82,
      paddingHorizontal:8,
      paddingVertical:12,
      borderRadius:36,
      backgroundColor:T.card,
      borderWidth:1,
      borderColor:T.line,
      flexDirection:'row',
      alignItems:'center',
      shadowColor:'#06140c',
      shadowOpacity:dark?.42:.16,
      shadowRadius:22,
      shadowOffset:{width:0,height:8},
      elevation:12,
    }}>
      {ITEMS.map((x)=>{
        if(!x){
          return (
            <Pressable
              key="fab"
              onPress={()=>{sfx('tap');startScan()}}
              style={({pressed})=>({
                width:68,
                alignItems:'center',
                justifyContent:'center',
                transform:[{scale:pressed&&anim?.93:1}],
              })}
            >
              <Animated.View style={{
                width:62,
                height:62,
                borderRadius:31,
                marginTop:-36,
                backgroundColor:GOLD,
                alignItems:'center',
                justifyContent:'center',
                borderWidth:5,
                borderColor:T.bg,
                shadowColor:GOLD,
                shadowOpacity:dark?.5:.35,
                shadowRadius:14,
                shadowOffset:{width:0,height:4},
                elevation:10,
                transform:[{scale:fabPulse}],
              }}>
                <Ionicons name="scan-outline" size={26} color="#241803"/>
              </Animated.View>
            </Pressable>
          );
        }

        const [key,icon,label,weight]=x;
        const active=scr===key;
        return (
          <Pressable
            key={key}
            onPress={()=>{sfx('nav');goTab(key)}}
            style={({pressed})=>({
              flex:weight,
              alignItems:'center',
              justifyContent:'center',
              paddingVertical:3,
              gap:5,
              transform:[{scale:pressed&&anim?.94:1}],
            })}
          >
            <View style={{
              width:52,
              height:34,
              borderRadius:17,
              alignItems:'center',
              justifyContent:'center',
              backgroundColor:active?(dark?'#1c3828':T.g2+'26'):'transparent',
            }}>
              <Ionicons name={icon} size={22} color={active?T.g2:T.mute}/>
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={{
                fontSize:11,
                fontFamily:active?'OpenRunde-Bold':'OpenRunde-Medium',
                color:active?T.g2:T.mute,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
