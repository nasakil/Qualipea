import {Platform} from 'react-native';
import {createAudioPlayer,setAudioModeAsync} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import {F} from './soundMap';

let on=true;
const cache=new Map();

export const setSfx=v=>{on=v};

export async function initAudio(){
  try{
    await setAudioModeAsync({playsInSilentMode:true,interruptionMode:'mixWithOthers'});
  }catch(e){}
}

export function haptic(kind='light'){
  if(Platform.OS==='web')return;
  try{
    if(kind==='success')Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if(kind==='warn')Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else if(kind==='err')Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if(kind==='medium')Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }catch(e){}
}

export async function sfx(n,a){
  if(n==='shutter')haptic('medium');
  else if(n==='save'||n==='connect'||n==='Extra Class'||n==='Class I')haptic('success');
  else if(n==='flag'||n==='Class II')haptic('warn');
  else if(n==='err'||n==='Defect')haptic('err');
  else if(n==='tap'||n==='nav')haptic('light');

  let key=n;
  if(key==='Extra Class'||key==='Class I')key=a>.9&&key==='Extra Class'?'Ahi':'A';
  else if(key==='Class II')key='B';
  else if(key==='Defect')key='C';
  else if(key==='A'&&a>.9)key='Ahi';

  const l=F[key];
  if(!on||!l)return;
  try{
    const src=key==='step'?l[Math.min(a|0,l.length-1)]:l[Math.floor(Math.random()*l.length)];
    let p=cache.get(src);
    if(!p){p=createAudioPlayer(src);cache.set(src,p)}
    try{p.shouldCorrectPitch=false;p.playbackRate=.94+Math.random()*.12}catch(e){}
    try{await p.seekTo(0)}catch(e){}
    p.play();
  }catch(e){}
}
