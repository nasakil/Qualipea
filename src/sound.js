import {createAudioPlayer,setAudioModeAsync} from 'expo-audio';
import {F} from './soundMap';
let on=true;const cache=new Map();
export const setSfx=v=>{on=v};
export async function initAudio(){try{await setAudioModeAsync({playsInSilentMode:true,interruptionMode:'mixWithOthers'})}catch(e){}}
// sfx(name,arg): 'step' uses arg as the step index, 'A' uses arg as confidence (>0.9 plays the bright variant)
export async function sfx(n,a){
  if(n==='A'&&a>.9)n='Ahi';
  const l=F[n];if(!on||!l)return;
  try{
    const src=n==='step'?l[Math.min(a|0,l.length-1)]:l[Math.floor(Math.random()*l.length)];
    let p=cache.get(src);if(!p){p=createAudioPlayer(src);cache.set(src,p)}
    try{p.shouldCorrectPitch=false;p.playbackRate=.94+Math.random()*.12}catch(e){}
    try{await p.seekTo(0)}catch(e){}
    p.play();
  }catch(e){}
}
