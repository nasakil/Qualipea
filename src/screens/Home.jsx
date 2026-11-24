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
  const {T,dark,demo,dev,hist,connect,startScan,anim}=useApp();
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
  const pillLabel=dev===1?(demo?'Pi 5 · Demo':'Pi 5'):dev===2?'Connecting…':'Connect Pi 5';

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

        <Pressable
          onPress={()=>{sfx('tap');startScan()}}
          style={({pressed})=>({marginBottom:14,transform:[{scale:pressed&&anim?.985:1}]})}
        >
          <LinearGradient
            colors={['#1b6242','#0b2b1e']}
            start={{x:0,y:0}}
            end={{x:1,y:1}}
            style={{borderRadius:30,padding:22,minHeight:184,overflow:'hidden'}}
          >
            <Text style={{color:'#fff',fontSize:26,fontFamily:'OpenRunde-Bold',maxWidth:175}}>Start a new scan</Text>
            <Text style={{color:'#ffffffb8',fontFamily:'OpenRunde-Regular',marginVertical:9,maxWidth:195,lineHeight:20}}>
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
              <Text style={{fontFamily:'OpenRunde-Bold',color:'#2a1d04'}}>Scan kernel</Text>
              <Ionicons name="arrow-forward" size={18} color="#2a1d04"/>
            </View>
            <Animated.View style={{position:'absolute',right:-18,bottom:-12,transform:[{translateY:floatY}]}}>
              <Kernel size={170}/>
            </Animated.View>
          </LinearGradient>
        </Pressable>

        <Card style={{borderWidth:1,borderColor:T.line,marginBottom:14,padding:15}}>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:11}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:9}}>
              <View style={{
                width:32,
                height:32,
                borderRadius:11,
                backgroundColor:T.g2+'22',
                alignItems:'center',
                justifyContent:'center',
              }}>
                <Ionicons name="book-outline" size={17} color={T.g2}/>
              </View>
              <Txt s={15.5} w="800">Peanut quality guide</Txt>
            </View>
            <Txt s={12} c={T.mute}>{openRef?'Tap to close':'Tap a class'}</Txt>
          </View>

          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
            {REF_GUIDE.map(item=>{
              const active=openRef===item.id;
              const col=GC[item.grade];
              return (
                <Pressable
                  key={item.id}
                  onPress={()=>{sfx('tap');setOpenRef(active?null:item.id)}}
                  style={({pressed})=>({
                    flexDirection:'row',
                    alignItems:'center',
                    gap:6,
                    paddingHorizontal:12,
                    paddingVertical:8,
                    borderRadius:14,
                    backgroundColor:active?col:(dark?'#101d15':T.bg),
                    borderWidth:1,
                    borderColor:active?col:T.line,
                    transform:[{scale:pressed&&anim?0.96:1}],
                  })}
                >
                  <View style={{width:7,height:7,borderRadius:4,backgroundColor:active?'#fff':col}}/>
                  <Text style={{
                    fontFamily:'OpenRunde-Bold',
                    fontSize:12.5,
                    color:active?'#fff':T.ink,
                  }}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {openRef&&(()=>{
            const item=REF_GUIDE.find(x=>x.id===openRef);
            if(!item)return null;
            const col=GC[item.grade];
            return (
              <View style={{
                marginTop:12,
                paddingTop:12,
                borderTopWidth:1,
                borderTopColor:T.line,
                gap:8,
              }}>
                <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
                  <View style={{
                    width:44,
                    height:44,
                    borderRadius:14,
                    backgroundColor:'#26261f',
                    alignItems:'center',
                    justifyContent:'center',
                  }}>
                    <Kernel g={item.grade} size={34} rot={-18}/>
                  </View>
                  <View style={{flex:1}}>
                    <Txt s={15} w="800">{item.title}</Txt>
                    <Txt s={12.5} c={T.mute} style={{marginTop:1}}>{item.summary}</Txt>
                  </View>
                </View>
                <View style={{gap:5,marginTop:2}}>
                  {item.cues.map(cue=>(
                    <View key={cue} style={{flexDirection:'row',gap:8}}>
                      <Text style={{color:col,fontFamily:'OpenRunde-Bold'}}>•</Text>
                      <Txt s={13} style={{flex:1,lineHeight:18}}>{cue}</Txt>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}
        </Card>

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
      </ScrollView>
    </View>
  );
}
