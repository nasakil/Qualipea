import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Pressable,ScrollView,Animated} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {GOLD,GC,pc} from '../theme';
import {REF_GUIDE} from '../data';
import {Kernel,Card,Txt,Chip} from '../components';
import Row from '../components/Row';
import Top from '../components/Top';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

function getGreeting(){
  const h=new Date().getHours();
  if(h<12)return 'Good morning';
  if(h<18)return 'Good afternoon';
  return 'Good evening';
}

export default function Home(){
  const {T,dark,demo,dev,piUrl,hist,connect,startScan,askExit,anim}=useApp();
  const [openRef,setOpenRef]=useState(null);
  const pulse=useRef(new Animated.Value(1)).current;
  const floatY=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    if(!anim){
      pulse.stopAnimation();
      pulse.setValue(1);
      floatY.stopAnimation();
      floatY.setValue(0);
      return;
    }
    const pLoop=Animated.loop(
      Animated.sequence([
        Animated.timing(pulse,{toValue:0.4,duration:1000,useNativeDriver:true}),
        Animated.timing(pulse,{toValue:1,duration:1000,useNativeDriver:true}),
      ])
    );
    const fLoop=Animated.loop(
      Animated.sequence([
        Animated.timing(floatY,{toValue:-6,duration:1900,useNativeDriver:true}),
        Animated.timing(floatY,{toValue:0,duration:1900,useNativeDriver:true}),
      ])
    );
    pLoop.start();
    fLoop.start();
    return()=>{pLoop.stop();fLoop.stop()};
  },[anim,pulse,floatY]);

  const dotColor=dev===1?GC.A:dev===2?GOLD:T.mute;
  const host=piUrl.replace(/^https?:\/\//,'');
  const statusText=[`Tap to connect · ${host}`,demo?'Connected · camera ready':`Connected · ${host}`,'Connecting…'][dev];

  return (
    <View style={{flex:1}}>
      {dark&&(
        <LinearGradient
          colors={['#173123','transparent']}
          start={{x:0.1,y:0}}
          end={{x:0.85,y:1}}
          pointerEvents="none"
          style={{position:'absolute',top:0,left:0,right:0,height:240}}
        />
      )}
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingBottom:145}} showsVerticalScrollIndicator={false}>
        <Top
          sub={getGreeting()}
          title="Ready to grade?"
          right={
            <Pressable
              onPress={()=>{sfx('tap');askExit()}}
              style={({pressed})=>({
                width:44,
                height:44,
                borderRadius:15,
                backgroundColor:T.card,
                borderWidth:1,
                borderColor:T.line,
                alignItems:'center',
                justifyContent:'center',
                transform:[{scale:pressed&&anim?.94:1}],
              })}
            >
              <Ionicons name="exit-outline" size={22} color={T.ink}/>
            </Pressable>
          }
        />

        <Pressable
          onPress={()=>{sfx('tap');startScan()}}
          style={({pressed})=>({marginBottom:12,transform:[{scale:pressed&&anim?.985:1}]})}
        >
          <LinearGradient
            colors={['#1b6242','#0b2b1e']}
            start={{x:0,y:0}}
            end={{x:1,y:1}}
            style={{borderRadius:30,padding:22,minHeight:184,overflow:'hidden'}}
          >
            <Text style={{color:'#fff',fontSize:26,fontWeight:'800',maxWidth:175}}>Start a new scan</Text>
            <Text style={{color:'#ffffffb8',marginVertical:9,maxWidth:195,lineHeight:20}}>
              One kernel per scan, lid closed, LED on.
            </Text>
            <View style={{
              flexDirection:'row',
              alignItems:'center',
              alignSelf:'flex-start',
              backgroundColor:GOLD,
              paddingHorizontal:18,
              paddingVertical:11,
              borderRadius:14,
              gap:8,
              marginTop:4,
            }}>
              <Text style={{fontWeight:'700',color:'#2a1d04'}}>Scan kernel</Text>
              <Ionicons name="arrow-forward" size={18} color="#2a1d04"/>
            </View>
            <Animated.View style={{position:'absolute',right:-18,bottom:-12,transform:[{translateY:floatY}]}}>
              <Kernel size={170}/>
            </Animated.View>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={()=>{sfx('tap');connect()}}
          style={({pressed})=>({marginBottom:14,transform:[{scale:pressed&&anim?.985:1}]})}
        >
          <View style={{
            flexDirection:'row',
            alignItems:'center',
            gap:11,
            backgroundColor:T.card,
            borderWidth:1,
            borderColor:T.line,
            borderRadius:20,
            paddingVertical:11,
            paddingHorizontal:13,
          }}>
            <View style={{
              width:34,
              height:34,
              borderRadius:11,
              backgroundColor:T.g2+'20',
              alignItems:'center',
              justifyContent:'center',
            }}>
              <Ionicons name="hardware-chip-outline" size={18} color={T.g2}/>
            </View>

            <View style={{flex:1,gap:2}}>
              <Txt s={14} w="700">Raspberry Pi 5 chamber</Txt>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                <View style={{
                  width:13,
                  height:13,
                  borderRadius:7,
                  backgroundColor:dotColor+'2e',
                  alignItems:'center',
                  justifyContent:'center',
                }}>
                  <Animated.View style={{
                    width:7,
                    height:7,
                    borderRadius:4,
                    backgroundColor:dotColor,
                    opacity:dev===0?0.7:pulse,
                  }}/>
                </View>
                <Txt s={12.5} c={T.mute}>{statusText}</Txt>
              </View>
            </View>

            {demo?(
              <View style={{
                backgroundColor:dark?'#223228':T.line,
                paddingHorizontal:10,
                paddingVertical:4,
                borderRadius:99,
              }}>
                <Text style={{color:dark?'#b8cabf':T.mute,fontWeight:'700',fontSize:11.5}}>Demo</Text>
              </View>
            ):dev===1?(
              <Chip t="LED on" c={GC.A}/>
            ):null}
            <Ionicons name="chevron-forward" size={15} color={T.mute}/>
          </View>
        </Pressable>

        <View style={{flexDirection:'row',gap:12}}>
          {[
            [hist.length,'scans saved'],
            [hist.length?pc(hist.reduce((a,b)=>a+b.c,0)/hist.length)+'%':'0%','avg confidence'],
          ].map(([a,b])=>(
            <Card key={b} style={{flex:1,borderWidth:1,borderColor:T.line}}>
              <View style={{
                width:36,
                height:36,
                borderRadius:12,
                backgroundColor:T.g2+'26',
                alignItems:'center',
                justifyContent:'center',
                marginBottom:10,
              }}>
                <Ionicons name={b==='scans saved'?'time-outline':'checkmark-circle-outline'} size={18} color={T.g2}/>
              </View>
              <Txt s={26} w="800">{a}</Txt>
              <Txt s={13.5} c={T.mute}>{b}</Txt>
            </Card>
          ))}
        </View>

        <Txt s={19} w="700" style={{marginTop:24,marginBottom:12}}>Recent scans</Txt>
        {hist.slice(0,3).map((h,i)=><Row key={i} h={h} i={i}/>)}
        {!hist.length&&<Txt c={T.mute}>No scans yet.</Txt>}

        <Txt s={19} w="700" style={{marginTop:22,marginBottom:10}}>Peanut quality reference guide</Txt>
        <Card style={{borderWidth:1,borderColor:T.line,padding:0,overflow:'hidden'}}>
          {REF_GUIDE.map((item,idx)=>{
            const isOpen=openRef===item.id;
            const col=GC[item.grade];
            return (
              <View key={item.id} style={{borderTopWidth:idx===0?0:1,borderTopColor:T.line}}>
                <Pressable
                  onPress={()=>{sfx('tap');setOpenRef(isOpen?null:item.id)}}
                  style={{flexDirection:'row',alignItems:'center',gap:12,padding:15}}
                >
                  <View style={{
                    width:40,
                    height:40,
                    borderRadius:13,
                    backgroundColor:'#26261f',
                    alignItems:'center',
                    justifyContent:'center',
                  }}>
                    <Kernel g={item.grade} size={30} rot={-18}/>
                  </View>
                  <View style={{flex:1}}>
                    <Txt s={14.5} w="700">{item.title}</Txt>
                    <Txt s={12} c={col} w="700" style={{marginTop:1}}>{item.badge}</Txt>
                  </View>
                  <Ionicons name={isOpen?'chevron-up':'chevron-down'} size={19} color={T.mute}/>
                </Pressable>
                {isOpen&&(
                  <View style={{paddingHorizontal:16,paddingBottom:16,gap:6}}>
                    <Txt s={13.5} c={T.mute} style={{lineHeight:19,marginBottom:4}}>{item.summary}</Txt>
                    {item.cues.map(cue=>(
                      <View key={cue} style={{flexDirection:'row',gap:8}}>
                        <Text style={{color:col,fontWeight:'800'}}>•</Text>
                        <Txt s={13} style={{flex:1,lineHeight:19}}>{cue}</Txt>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </View>
  );
}
