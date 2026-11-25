import React,{useEffect,useRef} from 'react';
import {View,Text,Pressable,ScrollView,Animated,Image} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Svg,{Circle} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {GOLD,GC,GS,GRADES,normGrade,pc} from '../theme';
import {GN,PRICE_CONFIG,buildWhySummary} from '../data';
import {Card,Txt,Btn,Bar} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

export default function Result(){
  const {T,cur,saving,openCam,save,askDiscard,openRecommendations,setZoomImg,anim}=useApp();
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
  const g=normGrade(cur.g);
  const c=GC[g];
  const why=buildWhySummary(cur);
  const r=30,circ=2*Math.PI*r;

  return (
    <View style={{flex:1,backgroundColor:T.bg}}>
      <ScrollView contentContainerStyle={{paddingBottom:130}} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={T.hero}
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
            <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:17}}>Classification result</Text>
            <View style={{width:40}}/>
          </View>

          <View style={{flexDirection:'row',alignItems:'center',gap:16,marginTop:22}}>
            <Animated.View style={{
              width:88,
              height:88,
              borderRadius:26,
              backgroundColor:c,
              alignItems:'center',
              justifyContent:'center',
              transform:[{scale:badgeScale}],
            }}>
              <Text style={{color:'#fff',fontSize:38,fontFamily:'OpenRunde-Bold'}}>{GS[g]}</Text>
            </Animated.View>
            <View style={{flex:1}}>
              <Text style={{color:'#fff',fontSize:25,fontFamily:'OpenRunde-Bold'}}>{GN[g][0]}</Text>
              <Text style={{color:'#ffffffbb',marginTop:2}}>{GN[g][1]}</Text>
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
              <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:15}}>{pc(cur.c)}%</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{padding:20,gap:14}}>
          {cur.rv&&(
            <View style={{flexDirection:'row',gap:12,backgroundColor:GC.B+'2a',borderRadius:18,padding:14}}>
              <Ionicons name="flag" size={20} color={GC.B}/>
              <Txt style={{flex:1}} s={14}>
                <Text style={{fontFamily:'OpenRunde-Bold'}}>Flagged for expert review. </Text>
                Confidence is low, so this isn’t a verified grade.
              </Txt>
            </View>
          )}

          {cur.img&&(
            <Card style={{borderWidth:1,borderColor:T.line,padding:10}}>
              <Pressable
                onPress={()=>{sfx('tap');setZoomImg(cur.img)}}
                style={{width:'100%',height:184,borderRadius:18,overflow:'hidden',backgroundColor:'#181a17'}}
              >
                <Image source={{uri:cur.img}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
                <View style={{
                  position:'absolute',
                  right:10,
                  bottom:10,
                  backgroundColor:'rgba(0,0,0,0.6)',
                  paddingHorizontal:10,
                  paddingVertical:5,
                  borderRadius:99,
                  flexDirection:'row',
                  alignItems:'center',
                  gap:5,
                }}>
                  <Ionicons name="expand-outline" size={13} color="#fff"/>
                  <Text style={{color:'#fff',fontSize:11.5,fontFamily:'OpenRunde-Bold'}}>Tap to zoom</Text>
                </View>
              </Pressable>
            </Card>
          )}

          {/* Plain-language Why this grade explanation */}
          <Card style={{borderWidth:1,borderColor:T.line}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8}}>
              <Ionicons name="sparkles-outline" size={18} color={GOLD}/>
              <Txt s={16} w="800">Why {GN[g][0]}?</Txt>
            </View>
            <Txt s={14.5} w="700" style={{marginBottom:6}}>{why.headline}</Txt>
            {why.factors.map((f,idx)=>(
              <View key={idx} style={{flexDirection:'row',gap:8,marginTop:5}}>
                <Text style={{color:c,fontFamily:'OpenRunde-Bold'}}>•</Text>
                <Txt s={13.5} c={T.mute} style={{flex:1,lineHeight:19}}>{f}</Txt>
              </View>
            ))}
          </Card>

          <Card style={{borderWidth:1,borderColor:T.line}}>
            <Txt w="700">Class probabilities</Txt>
            {GRADES.map(x=>(
              <View key={x} style={{flexDirection:'row',alignItems:'center',gap:10,marginTop:10}}>
                <Txt s={13} w="700" style={{width:82}}>{x}</Txt>
                <View style={{flex:1}}><Bar v={cur.p?.[x]||0} c={GC[x]} h={8}/></View>
                <Txt s={13} style={{width:36,textAlign:'right'}}>{pc(cur.p?.[x]||0)}%</Txt>
              </View>
            ))}
          </Card>

          {/* Streamlined CTA to Recommendations & Batch Calculator */}
          <Pressable
            onPress={()=>{sfx('tap');openRecommendations(cur,null,false)}}
            style={({pressed})=>({
              backgroundColor:T.card,
              borderRadius:24,
              borderWidth:1.5,
              borderColor:T.g2+'55',
              padding:18,
              gap:12,
              transform:[{scale:pressed&&anim?0.985:1}],
            })}
          >
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:12,flex:1}}>
                <View style={{
                  width:44,
                  height:44,
                  borderRadius:15,
                  backgroundColor:T.g2+'22',
                  alignItems:'center',
                  justifyContent:'center',
                }}>
                  <Ionicons name="medkit-outline" size={22} color={T.g2}/>
                </View>
                <View style={{flex:1}}>
                  <Txt s={16} w="800">Guide, defect fixes &amp; calculator</Txt>
                  <Txt s={13} c={T.mute} style={{marginTop:2}}>
                    Sorting advice, defect breakdown &amp; batch value
                  </Txt>
                </View>
              </View>
              <View style={{
                width:34,
                height:34,
                borderRadius:12,
                backgroundColor:T.g2,
                alignItems:'center',
                justifyContent:'center',
              }}>
                <Ionicons name="arrow-forward" size={18} color="#fff"/>
              </View>
            </View>
            <View style={{
              flexDirection:'row',
              alignItems:'center',
              justifyContent:'space-between',
              paddingTop:10,
              borderTopWidth:1,
              borderTopColor:T.line,
            }}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                <Ionicons name="pricetag-outline" size={14} color={GOLD}/>
                <Txt s={12.5} w="700" c={T.ink}>
                  ₱{(cur.price??PRICE_CONFIG.basePricePerKg).toFixed(2)}/kg
                </Txt>
                <Txt s={12} c={T.mute}>· {PRICE_CONFIG.location}</Txt>
              </View>
              <Txt s={12} c={T.mute}>{cur.model||'yolo11n-cls'}</Txt>
            </View>
          </Pressable>
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
