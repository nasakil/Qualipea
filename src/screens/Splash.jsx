import React,{useEffect,useRef} from 'react';
import {View,Text,Pressable,Animated,PanResponder,Easing,Dimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {GOLD,GC} from '../theme';
import {Kernel} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

const H=Dimensions.get('window').height;
const TRACK_H=148;
const KNOB_S=60;
const MAX_PULL=TRACK_H-KNOB_S-22;

export default function Splash(){
  const {anim,setScr,seenOnb}=useApp();
  const fade=useRef(new Animated.Value(anim?0:1)).current;
  const heroJump=useRef(new Animated.Value(anim?22:0)).current;
  const arrowBounce=useRef(new Animated.Value(0)).current;
  const arrowScale=useRef(new Animated.Value(1)).current;
  const dragY=useRef(new Animated.Value(0)).current;
  const screenY=useRef(new Animated.Value(0)).current;
  const exiting=useRef(false);
  const animRef=useRef(anim);
  const seenRef=useRef(seenOnb);
  animRef.current=anim;
  seenRef.current=seenOnb;

  const enterApp=()=>{
    if(exiting.current)return;
    exiting.current=true;
    sfx('nav');
    const nextScreen=seenRef.current?'home':'onb';
    if(!animRef.current){
      setScr(nextScreen,1);
      return;
    }
    Animated.parallel([
      Animated.timing(dragY,{
        toValue:-MAX_PULL,
        duration:160,
        easing:Easing.out(Easing.cubic),
        useNativeDriver:true,
      }),
      Animated.timing(screenY,{
        toValue:-H*0.24,
        duration:240,
        easing:Easing.in(Easing.cubic),
        useNativeDriver:true,
      }),
      Animated.timing(fade,{
        toValue:0,
        duration:220,
        useNativeDriver:true,
      }),
    ]).start(()=>setScr(nextScreen,1));
  };

  useEffect(()=>{
    sfx('boot');
    if(!anim){
      fade.setValue(1);
      heroJump.setValue(0);
      arrowBounce.setValue(0);
      arrowScale.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(fade,{
        toValue:1,
        duration:480,
        easing:Easing.out(Easing.cubic),
        useNativeDriver:true,
      }),
      Animated.spring(heroJump,{
        toValue:0,
        damping:14,
        stiffness:135,
        useNativeDriver:true,
      }),
    ]).start();

    const arrowLoop=Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(arrowBounce,{toValue:-22,duration:250,easing:Easing.out(Easing.quad),useNativeDriver:true}),
          Animated.timing(arrowScale,{toValue:1.06,duration:250,useNativeDriver:true}),
        ]),
        Animated.parallel([
          Animated.spring(arrowBounce,{toValue:0,damping:8,stiffness:210,mass:0.7,useNativeDriver:true}),
          Animated.spring(arrowScale,{toValue:1,damping:10,stiffness:220,useNativeDriver:true}),
        ]),
        Animated.delay(160),
        Animated.timing(arrowBounce,{toValue:-11,duration:160,easing:Easing.out(Easing.quad),useNativeDriver:true}),
        Animated.spring(arrowBounce,{toValue:0,damping:9,stiffness:240,mass:0.7,useNativeDriver:true}),
        Animated.delay(950),
      ])
    );

    arrowLoop.start();
    return()=>arrowLoop.stop();
  },[anim,fade,heroJump,arrowBounce,arrowScale]);

  const pan=useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:()=>false,
      onMoveShouldSetPanResponder:(_,g)=>g.dy<-8&&Math.abs(g.dy)>Math.abs(g.dx),
      onPanResponderMove:(_,g)=>{
        if(g.dy<0){
          const clamped=Math.max(-MAX_PULL,g.dy);
          dragY.setValue(clamped);
          screenY.setValue(clamped*0.26);
        }
      },
      onPanResponderRelease:(_,g)=>{
        if(g.dy<-42||g.vy<-0.45){
          enterApp();
        }else if(animRef.current){
          Animated.parallel([
            Animated.spring(dragY,{toValue:0,damping:15,stiffness:220,useNativeDriver:true}),
            Animated.spring(screenY,{toValue:0,damping:15,stiffness:220,useNativeDriver:true}),
          ]).start();
        }else{
          dragY.setValue(0);
          screenY.setValue(0);
        }
      },
      onPanResponderTerminate:()=>{
        dragY.setValue(0);
        screenY.setValue(0);
      },
    })
  ).current;

  const knobTranslate=Animated.add(dragY,arrowBounce);

  return (
    <View style={{flex:1,backgroundColor:'#08130d'}}>
      {/* Subtle deep top-right emerald light wash */}
      <LinearGradient
        colors={['#16472f','#0b2116','#08130d']}
        start={{x:0.9,y:0}}
        end={{x:0.1,y:0.75}}
        style={{position:'absolute',top:0,left:0,right:0,bottom:0}}
      />

      <Animated.View
        {...pan.panHandlers}
        style={{
          flex:1,
          justifyContent:'space-between',
          paddingTop:64,
          opacity:fade,
          transform:[{translateY:screenY}],
        }}
      >
        {/* Top editorial brand bar */}
        <View style={{
          paddingHorizontal:26,
          flexDirection:'row',
          alignItems:'center',
          justifyContent:'space-between',
        }}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
            <View style={{width:8,height:8,borderRadius:4,backgroundColor:GC.A}}/>
            <Text style={{color:'#eaf4ee',fontSize:14,fontFamily:'OpenRunde-Bold',letterSpacing:1.6}}>
              QUALIPEA
            </Text>
          </View>
          <View style={{
            paddingHorizontal:11,
            paddingVertical:5,
            borderRadius:99,
            backgroundColor:'rgba(255,255,255,0.07)',
            borderWidth:1,
            borderColor:'rgba(255,255,255,0.1)',
          }}>
            <Text style={{color:'#9ec0ac',fontSize:11.5,fontFamily:'OpenRunde-Bold'}}>v1.0</Text>
          </View>
        </View>

        {/* Center editorial medallion + bold display typography */}
        <Animated.View style={{paddingHorizontal:26,transform:[{translateY:heroJump}]}}>
          <View style={{
            width:128,
            height:128,
            borderRadius:38,
            backgroundColor:'#f3e7ce',
            alignItems:'center',
            justifyContent:'center',
            marginBottom:28,
            shadowColor:GOLD,
            shadowOpacity:0.22,
            shadowRadius:24,
            shadowOffset:{width:0,height:10},
            elevation:10,
          }}>
            <Kernel size={94} rot={-18}/>
          </View>

          <Text style={{
            color:'#f4faf6',
            fontSize:46,
            fontFamily:'OpenRunde-Bold',
            letterSpacing:-1.4,
            lineHeight:50,
          }}>
            Grade every{'\n'}
            <Text style={{color:GOLD,fontFamily:'OpenRunde-Bold'}}>kernel</Text>{'\n'}
            in seconds.
          </Text>

          <Text style={{
            color:'#93b09f',
            fontSize:16,
            fontFamily:'OpenRunde-Regular',
            lineHeight:23,
            marginTop:14,
            maxWidth:280,
          }}>
            Smart optical sorting and instant reference pricing for Spanish peanuts.
          </Text>
        </Animated.View>

        {/* Bottom-anchored swipe-up arch with bouncing arrow */}
        <View style={{alignItems:'center'}}>
          <View style={{
            width:76,
            height:TRACK_H,
            borderTopLeftRadius:38,
            borderTopRightRadius:38,
            backgroundColor:'#12281c',
            borderWidth:1,
            borderBottomWidth:0,
            borderColor:'rgba(255,255,255,0.12)',
            paddingTop:16,
            paddingBottom:24,
            justifyContent:'space-between',
            alignItems:'center',
          }}>
            <Ionicons name="chevron-up" size={18} color="rgba(255,255,255,0.45)"/>

            <Animated.View style={{transform:[{translateY:knobTranslate},{scale:arrowScale}]}}>
              <Pressable
                onPress={enterApp}
                style={({pressed})=>({
                  width:KNOB_S,
                  height:KNOB_S,
                  borderRadius:KNOB_S/2,
                  backgroundColor:GOLD,
                  alignItems:'center',
                  justifyContent:'center',
                  shadowColor:GOLD,
                  shadowOpacity:0.4,
                  shadowRadius:14,
                  shadowOffset:{width:0,height:4},
                  elevation:8,
                  transform:[{scale:pressed&&anim?0.93:1}],
                })}
              >
                <Ionicons name="arrow-up" size={26} color="#171103"/>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
