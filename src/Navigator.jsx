import React,{useEffect,useRef} from 'react';
import {View,Animated,PanResponder,BackHandler} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {useApp} from './AppContext';
import {sfx} from './sound';
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import SavingOverlay from './components/SavingOverlay';
import SheetModal from './components/SheetModal';
import Splash from './screens/Splash';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import ScanPrep from './screens/ScanPrep';
import Scanner from './screens/Scanner';
import Processing from './screens/Processing';
import Result from './screens/Result';
import History from './screens/History';
import Dashboard from './screens/Dashboard';
import Settings from './screens/Settings';

const MAP={
  splash:Splash,
  onb:Onboarding,
  home:Home,
  prep:ScanPrep,
  cam:Scanner,
  proc:Processing,
  res:Result,
  hist:History,
  dash:Dashboard,
  set:Settings,
};

export default function Navigator(){
  const {T,scr,dark,tabs,goTab,setScr,askDiscard,askExit,sheet,close,navDir,anim}=useApp();
  const Screen=MAP[scr];

  const enterX=useRef(new Animated.Value(0)).current;
  const enterOp=useRef(new Animated.Value(1)).current;
  const dragX=useRef(new Animated.Value(0)).current;

  const stateRef=useRef({scr,tabs,anim,goTab,setScr,askDiscard,askExit,sheet,close});
  stateRef.current={scr,tabs,anim,goTab,setScr,askDiscard,askExit,sheet,close};

  useEffect(()=>{
    const sub=BackHandler.addEventListener('hardwareBackPress',()=>{
      const s=stateRef.current;
      if(s.sheet){
        if(!s.sheet.lock)s.close();
        return true;
      }
      if(s.scr==='res'){s.askDiscard();return true}
      if(s.scr==='prep'||s.scr==='cam'){s.setScr('home',-1);return true}
      if(s.scr==='proc')return true;
      if(['hist','dash','set'].includes(s.scr)){s.goTab('home');return true}
      if(s.scr==='home'){s.askExit();return true}
      if(s.scr==='onb'){s.setScr('splash',-1);return true}
      return false;
    });
    return()=>sub.remove();
  },[]);

  useEffect(()=>{
    dragX.setValue(0);
    if(!anim){
      enterX.setValue(0);
      enterOp.setValue(1);
      return;
    }
    const startX=navDir===0?0:navDir*28;
    enterX.setValue(startX);
    enterOp.setValue(0.35);
    Animated.parallel([
      Animated.timing(enterX,{toValue:0,duration:220,useNativeDriver:true}),
      Animated.timing(enterOp,{toValue:1,duration:220,useNativeDriver:true}),
    ]).start();
  },[scr,navDir,anim,enterX,enterOp,dragX]);

  const pan=useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:()=>false,
      onMoveShouldSetPanResponder:(_,g)=>{
        const {scr:curScr,tabs:tList}=stateRef.current;
        const isTab=tList.includes(curScr);
        const isEdgeBack=['prep','cam','res'].includes(curScr)&&g.x0<56&&g.dx>18;
        if(!isTab&&!isEdgeBack)return false;
        return Math.abs(g.dx)>18&&Math.abs(g.dx)>Math.abs(g.dy)*1.6;
      },
      onPanResponderMove:(_,g)=>{
        const {scr:curScr,tabs:tList,anim:isAnim}=stateRef.current;
        if(!isAnim)return;
        const idx=tList.indexOf(curScr);
        if(idx>=0){
          const blocked=(idx===0&&g.dx>0)||(idx===tList.length-1&&g.dx<0);
          dragX.setValue(blocked?g.dx*0.18:g.dx*0.35);
        }else if(g.dx>0){
          dragX.setValue(g.dx*0.35);
        }
      },
      onPanResponderRelease:(_,g)=>{
        const {scr:curScr,tabs:tList,anim:isAnim,goTab:go,setScr:nav,askDiscard:discard}=stateRef.current;
        const idx=tList.indexOf(curScr);

        if(idx>=0){
          if((g.dx<-55||g.vx<-0.55)&&idx<tList.length-1){
            sfx('nav');
            go(tList[idx+1]);
            return;
          }
          if((g.dx>55||g.vx>0.55)&&idx>0){
            sfx('nav');
            go(tList[idx-1]);
            return;
          }
        }else if(['prep','cam','res'].includes(curScr)&&(g.dx>65||g.vx>0.55)){
          sfx('nav');
          if(curScr==='res')discard();
          else nav('home',-1);
          dragX.setValue(0);
          return;
        }

        if(isAnim){
          Animated.spring(dragX,{
            toValue:0,
            damping:20,
            stiffness:260,
            useNativeDriver:true,
          }).start();
        }else{
          dragX.setValue(0);
        }
      },
      onPanResponderTerminate:()=>{
        dragX.setValue(0);
      },
    })
  ).current;

  const translateX=Animated.add(enterX,dragX);

  return (
    <View style={{flex:1,backgroundColor:T.bg}}>
      <StatusBar style={dark||['splash','onb','cam'].includes(scr)?'light':'dark'}/>
      <Animated.View
        {...pan.panHandlers}
        style={{flex:1,opacity:enterOp,transform:[{translateX}]}}
      >
        <Screen/>
      </Animated.View>
      {tabs.includes(scr)&&<TabBar/>}
      <Toast/>
      <SavingOverlay/>
      <SheetModal/>
    </View>
  );
}
