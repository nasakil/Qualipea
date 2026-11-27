import React,{useEffect,useRef} from 'react';
import {View,Text,Pressable,ScrollView,Animated} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {GOLD,GC,GS} from '../theme';
import {REF_GUIDE} from '../data';
import {Kernel,Card,Txt} from '../components';
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
  const {T,dark,demo,dev,hist,connect,startScan,goTab,setSheet,close,anim}=useApp();
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
  const pillLabel=dev===1?(demo?'Pi 5 · Demo':'Pi 5'):dev===2?'Connecting…':'Connect Pi 5';

  const openGuideItem=(item)=>{
    sfx('tap');
    const col=GC[item.grade];
    setSheet({
      node:(
        <View style={{width:'100%',alignItems:'center'}}>
          <View style={{
            width:98,
            height:98,
            borderRadius:28,
            backgroundColor:dark?'#26231d':'#f1ece2',
            borderWidth:1,
            borderColor:col+'55',
            alignItems:'center',
            justifyContent:'center',
          }}>
            <Kernel g={item.grade} size={72} rot={-18}/>
          </View>

          <View style={{
            marginTop:14,
            paddingHorizontal:12,
            paddingVertical:4,
            borderRadius:99,
            backgroundColor:col+'22',
          }}>
            <Text style={{color:col,fontFamily:'OpenRunde-Bold',fontSize:12}}>{item.badge}</Text>
          </View>

          <Txt s={25} w="800" style={{marginTop:8,textAlign:'center'}}>{item.title}</Txt>
          <Txt s={14} c={T.mute} style={{marginTop:6,textAlign:'center',lineHeight:20,maxWidth:290}}>
            {item.summary}
          </Txt>

          <View style={{
            width:'100%',
            marginTop:18,
            padding:16,
            borderRadius:22,
            backgroundColor:dark?'#0f1913':T.bg,
            borderWidth:1,
            borderColor:T.line,
            gap:10,
          }}>
            <Txt s={12} w="800" c={T.mute}>WHAT TO LOOK FOR</Txt>
            {item.cues.map(cue=>(
              <View key={cue} style={{flexDirection:'row',alignItems:'flex-start',gap:10}}>
                <Ionicons name="checkmark-circle" size={18} color={col} style={{marginTop:1}}/>
                <Txt s={14} style={{flex:1,lineHeight:20}}>{cue}</Txt>
              </View>
            ))}
          </View>
        </View>
      ),
      btns:[['Got it','sec',close]],
    });
  };

  return (
    <View style={{flex:1}}>
      {dark&&(
        <LinearGradient
          colors={['#1b2e25','transparent']}
          start={{x:0.1,y:0}}
          end={{x:0.85,y:1}}
          pointerEvents="none"
          style={{position:'absolute',top:0,left:0,right:0,height:210}}
        />
      )}
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingBottom:145}} showsVerticalScrollIndicator={false}>
        <Top
          sub={getGreeting()}
          title="Ready to grade?"
          right={
            <Pressable
              onPress={()=>{sfx('tap');connect()}}
              style={({pressed})=>({
                flexDirection:'row',
                alignItems:'center',
                gap:7,
                paddingHorizontal:12,
                paddingVertical:9,
                borderRadius:99,
                backgroundColor:T.card,
                borderWidth:1,
                borderColor:dev===1?GC.A+'55':T.line,
                transform:[{scale:pressed&&anim?.95:1}],
              })}
            >
              <View style={{
                width:12,
                height:12,
                borderRadius:6,
                backgroundColor:dotColor+'2e',
                alignItems:'center',
                justifyContent:'center',
              }}>
                <Animated.View style={{
                  width:7,
                  height:7,
                  borderRadius:4,
                  backgroundColor:dotColor,
                  opacity:dev===0?0.75:pulse,
                }}/>
              </View>
              <Ionicons name="hardware-chip-outline" size={16} color={dev===1?T.g2:T.ink}/>
              <Text style={{color:T.ink,fontFamily:'OpenRunde-Bold',fontSize:12.5}}>{pillLabel}</Text>
            </Pressable>
          }
        />

        {/* Hero Scan CTA */}
        <Pressable
          onPress={()=>{sfx('tap');startScan()}}
          style={({pressed})=>({marginBottom:18,transform:[{scale:pressed&&anim?.985:1}]})}
        >
          <LinearGradient
            colors={T.hero}
            start={{x:0,y:0}}
            end={{x:1,y:1}}
            style={{borderRadius:30,padding:22,minHeight:184,overflow:'hidden'}}
          >
            <Text style={{color:'#fff',fontSize:26,fontFamily:'OpenRunde-Bold',maxWidth:175}}>Start a new scan</Text>
            <Text style={{color:'#ffffffb8',fontFamily:'OpenRunde-Regular',marginVertical:9,maxWidth:195,lineHeight:20}}>
              {demo?'Spread 5+ kernels on the tray, lid closed, LED on.':'Spread 5+ kernels on the tray for RPi Cam group grading.'}
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
              <Text style={{fontFamily:'OpenRunde-Bold',color:'#2a1d04'}}>Scan tray</Text>
              <Ionicons name="arrow-forward" size={18} color="#2a1d04"/>
            </View>
            <Animated.View style={{position:'absolute',right:-18,bottom:-12,transform:[{translateY:floatY}]}}>
              <Kernel size={170}/>
            </Animated.View>
          </LinearGradient>
        </Pressable>

        {/* Upgraded 2x2 Bento Peanut Quality Guide */}
        <Card style={{borderWidth:1,borderColor:T.line,padding:16,borderRadius:28}}>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:9}}>
              <View style={{
                width:32,
                height:32,
                borderRadius:11,
                backgroundColor:T.g2+'22',
                alignItems:'center',
                justifyContent:'center',
              }}>
                <Ionicons name="sparkles-outline" size={17} color={T.g2}/>
              </View>
              <View>
                <Txt s={16} w="800">Peanut quality guide</Txt>
                <Txt s={12} c={T.mute}>Tap any class to see what to look for</Txt>
              </View>
            </View>
          </View>

          <View style={{gap:10}}>
            {[[0,1],[2,3]].map((pair,rowIdx)=>(
              <View key={rowIdx} style={{flexDirection:'row',gap:10}}>
                {pair.map(idx=>{
                  const item=REF_GUIDE[idx];
                  const col=GC[item.grade];
                  return (
                    <Pressable
                      key={item.id}
                      onPress={()=>openGuideItem(item)}
                      style={({pressed})=>({
                        flex:1,
                        backgroundColor:dark?'#151e1a':T.bg,
                        borderRadius:20,
                        borderWidth:1,
                        borderColor:T.line,
                        padding:13,
                        gap:10,
                        transform:[{scale:pressed&&anim?0.97:1}],
                      })}
                    >
                      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
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
                        <View style={{
                          paddingHorizontal:8,
                          paddingVertical:4,
                          borderRadius:9,
                          backgroundColor:col+'22',
                        }}>
                          <Text style={{color:col,fontFamily:'OpenRunde-Bold',fontSize:11.5}}>{GS[item.grade]}</Text>
                        </View>
                      </View>

                      <View>
                        <Txt s={14.5} w="800">{item.title}</Txt>
                        <Txt s={12} c={T.mute} style={{marginTop:2}}>{item.badge}</Txt>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </Card>

        {/* Recent Scans */}
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:24,marginBottom:12}}>
          <Txt s={19} w="800">Recent scans</Txt>
          {hist.length>0&&(
            <Pressable onPress={()=>{sfx('nav');goTab('hist')}} style={{flexDirection:'row',alignItems:'center',gap:3}}>
              <Txt s={13.5} w="700" c={T.g2}>See all</Txt>
              <Ionicons name="chevron-forward" size={15} color={T.g2}/>
            </Pressable>
          )}
        </View>
        {hist.slice(0,3).map((h,i)=><Row key={h.id||i} h={h} i={i}/>)}
        {!hist.length&&(
          <Pressable
            onPress={()=>{sfx('tap');startScan()}}
            style={({pressed})=>({
              backgroundColor:T.card,
              borderRadius:24,
              borderWidth:1,
              borderColor:T.line,
              padding:22,
              alignItems:'center',
              gap:8,
              transform:[{scale:pressed&&anim?0.985:1}],
            })}
          >
            <View style={{
              width:48,
              height:48,
              borderRadius:16,
              backgroundColor:T.g2+'1e',
              alignItems:'center',
              justifyContent:'center',
            }}>
              <Ionicons name="scan-outline" size={24} color={T.g2}/>
            </View>
            <Txt s={16} w="800">No scans yet</Txt>
            <Txt s={13} c={T.mute} style={{textAlign:'center',lineHeight:19}}>
              Tap here to grade your first Spanish peanut tray.
            </Txt>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
