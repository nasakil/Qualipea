import React,{useEffect,useRef} from 'react';
import {View,Text,Pressable,ScrollView,Animated,Image,ActivityIndicator} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Svg,{Circle} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {GOLD,GC,pc} from '../theme';
import {GN,ADV} from '../data';
import {Card,Txt,Btn,Bar} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

export default function Result(){
  const {T,cur,tab,setTab,pd,saving,openCam,save,askDiscard,anim}=useApp();
  const badgeScale=useRef(new Animated.Value(anim?0.72:1)).current;

  useEffect(()=>{
    if(!cur)return;
    if(!anim){
      badgeScale.setValue(1);
      return;
    }
    badgeScale.setValue(0.72);
    Animated.spring(badgeScale,{
      toValue:1,
      damping:13,
      stiffness:180,
      useNativeDriver:true,
    }).start();
  },[cur,anim,badgeScale]);

  if(!cur)return null;
  const c=GC[cur.g];
  const r=30,circ=2*Math.PI*r;

  return (
    <View style={{flex:1,backgroundColor:T.bg}}>
      <ScrollView contentContainerStyle={{paddingBottom:130}} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#17573b','#0b2b1e']}
          style={{padding:20,paddingTop:56,paddingBottom:28,borderBottomLeftRadius:34,borderBottomRightRadius:34}}
        >
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <Pressable
              onPress={()=>{sfx('tap');askDiscard()}}
              style={({pressed})=>({
                width:40,
                height:40,
                borderRadius:14,
                backgroundColor:'rgba(255,255,255,0.12)',
                alignItems:'center',
                justifyContent:'center',
                transform:[{scale:pressed&&anim?0.94:1}],
              })}
            >
              <Ionicons name="chevron-back" size={24} color="#fff"/>
            </Pressable>
            <Text style={{color:'#fff',fontWeight:'800',fontSize:17}}>Classification result</Text>
            <View style={{width:40}}/>
          </View>

          <View style={{flexDirection:'row',alignItems:'center',gap:16,marginTop:22}}>
            <Animated.View style={{
              width:94,
              height:94,
              borderRadius:28,
              backgroundColor:c,
              alignItems:'center',
              justifyContent:'center',
              transform:[{scale:badgeScale}],
            }}>
              <Text style={{color:'#fff',fontSize:56,fontWeight:'800'}}>{cur.g}</Text>
            </Animated.View>
            <View style={{flex:1}}>
              <Text style={{color:'#fff',fontSize:26,fontWeight:'800'}}>{GN[cur.g][0]}</Text>
              <Text style={{color:'#ffffffbb',marginTop:2}}>{GN[cur.g][1]}</Text>
            </View>
            <View style={{width:72,height:72,alignItems:'center',justifyContent:'center'}}>
              <Svg width={72} height={72} style={{position:'absolute',transform:[{rotate:'-90deg'}]}}>
                <Circle cx={36} cy={36} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={6} fill="none"/>
                <Circle
                  cx={36}
                  cy={36}
                  r={r}
                  stroke={GOLD}
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ*(1-cur.c)}
                />
              </Svg>
              <Text style={{color:'#fff',fontWeight:'800',fontSize:15}}>{pc(cur.c)}%</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{padding:20,gap:14}}>
          {cur.rv&&(
            <View style={{flexDirection:'row',gap:12,backgroundColor:GC.B+'2a',borderRadius:18,padding:14}}>
              <Ionicons name="flag" size={20} color={GC.B}/>
              <Txt style={{flex:1}} s={14}>
                <Text style={{fontWeight:'700'}}>Flagged for expert review. </Text>
                Confidence is low, so this isn’t a verified grade.
              </Txt>
            </View>
          )}

          {cur.img&&(
            <Card style={{borderWidth:1,borderColor:T.line,padding:10}}>
              <View style={{width:'100%',height:184,borderRadius:18,overflow:'hidden',backgroundColor:'#181a17'}}>
                <Image source={{uri:cur.img}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
              </View>
            </Card>
          )}

          <Card style={{borderWidth:1,borderColor:T.line}}>
            <Txt w="700">Class probabilities</Txt>
            {['A','B','C'].map(x=>(
              <View key={x} style={{flexDirection:'row',alignItems:'center',gap:10,marginTop:10}}>
                <Txt w="700">{x}</Txt>
                <View style={{flex:1}}><Bar v={cur.p[x]} c={GC[x]} h={8}/></View>
                <Txt s={13}>{pc(cur.p[x])}%</Txt>
              </View>
            ))}
          </Card>

          <View style={{flexDirection:'row',backgroundColor:T.line,borderRadius:16,padding:4}}>
            {[['p','Price'],['a','Advice']].map(([k,l])=>(
              <Pressable
                key={k}
                onPress={()=>{sfx('tap');setTab(k)}}
                style={{
                  flex:1,
                  height:40,
                  borderRadius:12,
                  alignItems:'center',
                  justifyContent:'center',
                  backgroundColor:tab===k?T.card:'transparent',
                }}
              >
                <Txt w="700" c={tab===k?T.ink:T.mute}>{l}</Txt>
              </Pressable>
            ))}
          </View>

          {tab==='p'?(
            !pd?(
              <Card style={{alignItems:'center',gap:10,padding:30,borderWidth:1,borderColor:T.line}}>
                <ActivityIndicator color={T.g2}/>
                <Txt c={T.mute}>Fetching reference price…</Txt>
              </Card>
            ):(
              <Card style={{borderWidth:1,borderColor:T.line}}>
                <Txt s={13.5} c={T.mute}>
                  {cur.price?'Live reference price from Pi 5':'Reference price, not grade-adjusted'}
                </Txt>
                <Txt s={38} w="800">
                  ₱{(cur.price??92).toFixed(2)} <Txt s={16} c={T.mute}>per kg</Txt>
                </Txt>
                {[
                  ['Commodity','Spanish peanut kernel'],
                  ['Source',cur.priceSource||(cur.fromPi?'Raspberry Pi 5 API':'Demo provider, sample data')],
                  ['Model',cur.model||'yolo11n-cls 1.0.0'],
                  ['Grade adjustment',cur.price?'Applied by server':'Not approved yet'],
                ].map(([a,b])=>(
                  <View key={a} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:10}}>
                    <Txt c={T.mute} s={14}>{a}</Txt>
                    <Txt s={14}>{b}</Txt>
                  </View>
                ))}
                <Txt s={12.5} c={T.mute}>A peanut price isn’t a Grade {cur.g} price until experts approve adjustments.</Txt>
              </Card>
            )
          ):(
            <Card style={{borderWidth:1,borderColor:T.line}}>
              <Txt w="700">{cur.rv?'Verify with an expert first':GN[cur.g][1]}</Txt>
              {ADV[cur.g].map(a=>(
                <View key={a} style={{flexDirection:'row',gap:10,paddingVertical:9}}>
                  <Ionicons name="checkmark" size={20} color={GC.A}/>
                  <Txt style={{flex:1}}>{a}</Txt>
                </View>
              ))}
              <Txt s={12.5} c={T.mute}>Proposed advice, pending expert validation.</Txt>
            </Card>
          )}
        </View>
      </ScrollView>

      <View style={{
        position:'absolute',
        bottom:0,
        left:0,
        right:0,
        backgroundColor:T.bg,
        borderTopWidth:1,
        borderTopColor:T.line,
        paddingHorizontal:20,
        paddingTop:14,
        paddingBottom:32,
        flexDirection:'row',
        gap:12,
      }}>
        <Btn t="Scan again" kind="sec" onPress={openCam}/>
        <Btn t="Save result" onPress={save} busy={saving}/>
      </View>
    </View>
  );
}
