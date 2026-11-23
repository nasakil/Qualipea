import React,{useEffect,useRef} from 'react';
import {View,Pressable,Animated,Modal,PanResponder,Easing} from 'react-native';
import Svg,{Circle} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {GC} from '../theme';
import {Txt,Btn} from '../components';
import {useApp} from '../AppContext';

function SpinRing({color,track,anim}){
  const spin=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    if(!anim){
      spin.stopAnimation();
      spin.setValue(0.35);
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
  const size=64,sw=4.5,r=(size-sw)/2,c=2*Math.PI*r;

  return (
    <Animated.View style={{width:size,height:size,transform:[{rotate}]}}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={sw} fill="none"/>
        <Circle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke={color}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={`${c*0.28} ${c}`}
          strokeLinecap="round"
          rotation={120}
          origin={`${size/2},${size/2}`}
        />
      </Svg>
    </Animated.View>
  );
}

export default function SheetModal(){
  const {T,dark,sheet,close,anim}=useApp();
  const slideY=useRef(new Animated.Value(320)).current;
  const fade=useRef(new Animated.Value(0)).current;
  const dragY=useRef(new Animated.Value(0)).current;
  const lockRef=useRef(false);
  const animRef=useRef(anim);
  const closeRef=useRef(close);

  lockRef.current=Boolean(sheet&&sheet.lock);
  animRef.current=anim;
  closeRef.current=close;

  const dismiss=()=>{
    if(lockRef.current)return;
    if(!animRef.current){
      dragY.setValue(0);
      closeRef.current();
      return;
    }
    Animated.parallel([
      Animated.timing(slideY,{toValue:420,duration:180,useNativeDriver:true}),
      Animated.timing(fade,{toValue:0,duration:160,useNativeDriver:true}),
    ]).start(()=>{
      dragY.setValue(0);
      closeRef.current();
    });
  };

  useEffect(()=>{
    if(!sheet)return;
    dragY.setValue(0);
    if(!anim){
      slideY.setValue(0);
      fade.setValue(1);
      return;
    }
    slideY.setValue(260);
    fade.setValue(0);
    Animated.parallel([
      Animated.spring(slideY,{
        toValue:0,
        damping:22,
        stiffness:220,
        mass:0.85,
        useNativeDriver:true,
      }),
      Animated.timing(fade,{
        toValue:1,
        duration:190,
        useNativeDriver:true,
      }),
    ]).start();
  },[Boolean(sheet),anim]);

  const pan=useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:()=>false,
      onMoveShouldSetPanResponder:(_,g)=>!lockRef.current&&g.dy>8&&Math.abs(g.dy)>Math.abs(g.dx)*1.2,
      onPanResponderMove:(_,g)=>{
        if(g.dy>0)dragY.setValue(g.dy);
      },
      onPanResponderRelease:(_,g)=>{
        if(g.dy>85||g.vy>0.65){
          dismiss();
        }else if(animRef.current){
          Animated.spring(dragY,{
            toValue:0,
            damping:20,
            stiffness:260,
            useNativeDriver:true,
          }).start();
        }else{
          dragY.setValue(0);
        }
      },
      onPanResponderTerminate:()=>{
        dragY.setValue(0);
      },
    })
  ).current;

  if(!sheet)return null;

  const translateY=Animated.add(slideY,dragY);

  return (
    <Modal transparent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={{flex:1,backgroundColor:'#06100acc',justifyContent:'flex-end',opacity:fade}}>
        <Pressable style={{flex:1}} onPress={dismiss}/>
        <Animated.View
          {...pan.panHandlers}
          style={{
            backgroundColor:T.card,
            borderTopLeftRadius:34,
            borderTopRightRadius:34,
            borderWidth:1,
            borderBottomWidth:0,
            borderColor:T.line,
            paddingHorizontal:24,
            paddingTop:14,
            paddingBottom:38,
            alignItems:'center',
            transform:[{translateY}],
          }}
        >
          <View style={{
            width:42,
            height:4.5,
            borderRadius:99,
            backgroundColor:dark?'#2e4135':T.line,
            marginBottom:20,
          }}/>

          {sheet.ok?(
            <Ionicons name="checkmark-circle" size={74} color={GC.A}/>
          ):sheet.load?(
            <SpinRing color={GC.A} track={dark?'#24372b':T.line} anim={anim}/>
          ):sheet.ic?(
            <View style={{
              width:64,
              height:64,
              borderRadius:22,
              backgroundColor:(sheet.bad?GC.C:T.g2)+'22',
              alignItems:'center',
              justifyContent:'center',
            }}>
              <Ionicons name={sheet.ic} size={30} color={sheet.bad?GC.C:T.g2}/>
            </View>
          ):null}

          {sheet.title&&<Txt s={24} w="800" style={{marginTop:16,textAlign:'center'}}>{sheet.title}</Txt>}
          {sheet.body&&<Txt s={14.5} c={T.mute} style={{textAlign:'center',marginTop:8,lineHeight:21,maxWidth:290}}>{sheet.body}</Txt>}

          {sheet.steps&&(
            <View style={{marginTop:22,gap:14,alignSelf:'center',minWidth:230}}>
              {sheet.steps.map((label,idx)=>{
                const done=(sheet.stepIdx||0)>idx;
                return (
                  <View key={label} style={{flexDirection:'row',alignItems:'center',gap:12}}>
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
                    <Txt s={15} w={done?'600':'500'} c={done?T.ink:T.mute}>{label}</Txt>
                  </View>
                );
              })}
            </View>
          )}

          {sheet.node}

          {sheet.btns&&(
            <View style={{flexDirection:'row',gap:10,marginTop:22,width:'100%'}}>
              {sheet.btns.map(([t,k,f])=><Btn key={t} t={t} kind={k} onPress={f}/>)}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
