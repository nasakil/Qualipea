import React,{useState} from 'react';
import {View,Text,Pressable,ScrollView,TextInput,KeyboardAvoidingView,Platform} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Svg,{Path,Circle,Ellipse,Defs,RadialGradient,Stop} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {GC,GS,GOLD,normGrade,pc} from '../theme';
import {GN,ADV,PRICE_CONFIG,defectById,buildWhySummary} from '../data';
import {Card,Txt,Btn,Kernel} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

function DefectArt({id,size=48}){
  const body='M9 35 C9 21, 19 14, 34 15 C45 16, 54 22, 57 30 C59 34, 57 39, 52 42 C44 48, 30 50, 19 47 C12 45, 9 41, 9 35 Z';
  const shriveledBody='M11 36 C12 24, 21 20, 33 22 C43 23, 52 24, 55 31 C57 36, 51 41, 42 42 C31 44, 19 44, 13 40 Z';
  const isDark=id==='moldy'||id==='insect';

  return (
    <View style={{width:size,height:size,transform:[{rotate:'-16deg'}]}}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <RadialGradient id={`df_${id}`} cx="36%" cy="32%" r="76%">
            <Stop offset="0%" stopColor={isDark?'#b38358':'#e2aa76'}/>
            <Stop offset="62%" stopColor={isDark?'#7d532f':'#b97340'}/>
            <Stop offset="100%" stopColor={isDark?'#472b15':'#793f1c'}/>
          </RadialGradient>
        </Defs>

        {id==='shriveled'?(
          <>
            <Path d={shriveledBody} fill={`url(#df_${id})`} stroke="#633516" strokeWidth={1.1}/>
            <Path d="M20 24 C23 29, 23 36, 20 41 M30 23 C33 29, 33 36, 30 42 M40 24 C43 29, 43 35, 40 40" stroke="#5b3012" strokeWidth={1.6} strokeOpacity={0.7} fill="none" strokeLinecap="round"/>
          </>
        ):(
          <>
            <Path d={body} fill={`url(#df_${id})`} stroke="#5a3014" strokeWidth={1.1} strokeOpacity={0.7}/>
            <Path d="M16 32 C26 26, 39 25, 50 31" stroke="#683516" strokeWidth={1} strokeOpacity={0.3} fill="none" strokeLinecap="round"/>
            <Path d="M16 26 C23 20, 35 19, 45 23" stroke="#fff3e0" strokeWidth={2} strokeOpacity={0.38} fill="none" strokeLinecap="round"/>
          </>
        )}

        {id==='moldy'&&(
          <>
            <Circle cx={25} cy={31} r={5.5} fill="#4b8555" fillOpacity={0.9}/>
            <Circle cx={35} cy={36} r={6.5} fill="#34633d" fillOpacity={0.9}/>
            <Circle cx={31} cy={27} r={3.6} fill="#7dc288" fillOpacity={0.85}/>
            <Circle cx={40} cy={31} r={2.4} fill="#9cd6a5" fillOpacity={0.75}/>
          </>
        )}

        {id==='damaged'&&(
          <>
            <Path d="M31 15 L28 28 L35 33 L31 48 L39 46 L42 32 L36 27 L38 16 Z" fill="#f3dfc0" fillOpacity={0.9}/>
            <Path d="M31 15 L28 28 L35 33 L31 48" stroke="#3a1e0b" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </>
        )}

        {id==='discolored'&&(
          <>
            <Ellipse cx={38} cy={35} rx={10} ry={6.5} fill="#3e200c" fillOpacity={0.82}/>
            <Circle cx={23} cy={29} r={4.5} fill="#542c11" fillOpacity={0.72}/>
          </>
        )}

        {id==='insect'&&(
          <>
            <Circle cx={24} cy={32} r={2.8} fill="#1b0f06"/>
            <Circle cx={36} cy={29} r={2.5} fill="#1b0f06"/>
            <Circle cx={33} cy={39} r={2.3} fill="#1b0f06"/>
            <Circle cx={41} cy={35} r={1.3} fill="#ebd6b0"/>
            <Circle cx={28} cy={39} r={1.2} fill="#ebd6b0"/>
          </>
        )}
      </Svg>
    </View>
  );
}

function ClassIllustration({grade}){
  const c=GC[grade];
  return (
    <View style={{
      width:74,
      height:74,
      borderRadius:24,
      backgroundColor:'rgba(255,255,255,0.12)',
      borderWidth:1,
      borderColor:'rgba(255,255,255,0.2)',
      alignItems:'center',
      justifyContent:'center',
    }}>
      <Kernel g={grade} size={52} rot={-18}/>
      <View style={{
        position:'absolute',
        right:-6,
        bottom:-6,
        minWidth:28,
        height:24,
        paddingHorizontal:6,
        borderRadius:10,
        backgroundColor:c,
        alignItems:'center',
        justifyContent:'center',
        borderWidth:2,
        borderColor:'#0f3423',
      }}>
        <Text style={{color:'#fff',fontSize:11,fontWeight:'900'}}>{GS[grade]}</Text>
      </View>
    </View>
  );
}

const STEP_ICONS=['funnel-outline','shield-checkmark-outline','archive-outline'];

export default function Recommendations(){
  const {T,dark,recScan,saveScanKg,setScr,anim}=useApp();
  const [expanded,setExpanded]=useState({});
  const [kgText,setKgText]=useState(recScan?.kg?String(recScan.kg):'');

  if(!recScan)return null;

  const g=normGrade(recScan.x||recScan.g);
  const c=GC[g];
  const why=buildWhySummary(recScan);
  const selectedDefects=(recScan.defects||[]).map(defectById).filter(Boolean);

  const basePrice=typeof recScan.price==='number'?recScan.price:PRICE_CONFIG.basePricePerKg;
  const parsedKg=parseFloat(kgText.trim());
  const validKg=!Number.isNaN(parsedKg)&&parsedKg>0?parsedKg:0;
  const estTotal=validKg*basePrice;

  const handleKgChange=(val)=>{
    setKgText(val);
    const num=parseFloat(val.trim());
    saveScanKg(!Number.isNaN(num)&&num>0?num:null);
  };

  const toggleCard=(id)=>{
    sfx('tap');
    setExpanded(prev=>({...prev,[id]:!prev[id]}));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS==='ios'?'padding':undefined}
      style={{flex:1,backgroundColor:T.bg}}
    >
      <ScrollView contentContainerStyle={{paddingBottom:125}} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={T.hero}
          style={{padding:20,paddingTop:56,paddingBottom:24,borderBottomLeftRadius:32,borderBottomRightRadius:32}}
        >
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <Pressable
              onPress={()=>{sfx('tap');setScr(recScan.fromHistory?'hist':'res',-1)}}
              style={({pressed})=>({
                width:42,
                height:42,
                borderRadius:14,
                backgroundColor:'rgba(255,255,255,0.12)',
                alignItems:'center',
                justifyContent:'center',
                transform:[{scale:pressed&&anim?0.94:1}],
              })}
            >
              <Ionicons name="chevron-back" size={24} color="#fff"/>
            </Pressable>
            <Text style={{color:'#fff',fontWeight:'800',fontSize:17}}>Guide &amp; Value</Text>
            <Pressable
              onPress={()=>{sfx('tap');setScr('defects',-1)}}
              style={({pressed})=>({
                paddingHorizontal:12,
                paddingVertical:8,
                borderRadius:12,
                backgroundColor:'rgba(255,255,255,0.14)',
                opacity:pressed?0.75:1,
              })}
            >
              <Text style={{color:'#fff',fontWeight:'700',fontSize:12.5}}>Edit defects</Text>
            </Pressable>
          </View>

          <View style={{flexDirection:'row',alignItems:'center',gap:16,marginTop:20}}>
            <ClassIllustration grade={g}/>
            <View style={{flex:1}}>
              <Text style={{color:'#fff',fontSize:24,fontWeight:'800'}}>{GN[g][0]}</Text>
              <Text style={{color:'#ffffffc4',fontSize:13.5,marginTop:3}}>{why.headline}</Text>
              <View style={{flexDirection:'row',gap:8,marginTop:8}}>
                <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:99,backgroundColor:'rgba(255,255,255,0.14)'}}>
                  <Text style={{color:'#fff',fontSize:11.5,fontWeight:'700'}}>{pc(recScan.c)}% match</Text>
                </View>
                {selectedDefects.length>0&&(
                  <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:99,backgroundColor:GOLD+'33'}}>
                    <Text style={{color:'#f7d688',fontSize:11.5,fontWeight:'700'}}>
                      {selectedDefects.length} defect{selectedDefects.length>1?'s':''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={{padding:20,gap:14}}>
          {/* Quick visual checklist: Do this next */}
          <Card style={{borderWidth:1,borderColor:T.line}}>
            <Txt s={16} w="800" style={{marginBottom:10}}>Do this next</Txt>
            <View style={{gap:10}}>
              {ADV[g].map((step,i)=>(
                <View key={step} style={{flexDirection:'row',alignItems:'center',gap:12}}>
                  <View style={{
                    width:34,
                    height:34,
                    borderRadius:12,
                    backgroundColor:c+'20',
                    alignItems:'center',
                    justifyContent:'center',
                  }}>
                    <Ionicons name={STEP_ICONS[i]||'checkmark-outline'} size={17} color={c}/>
                  </View>
                  <Txt s={14.5} w="600" style={{flex:1}}>{step}</Txt>
                </View>
              ))}
            </View>
          </Card>

          {/* Compact Why bullets */}
          <Card style={{borderWidth:1,borderColor:T.line}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8}}>
              <Ionicons name="sparkles-outline" size={17} color={GOLD}/>
              <Txt s={15.5} w="800">Why {GN[g][0]}?</Txt>
            </View>
            <View style={{gap:7}}>
              {why.factors.slice(0,3).map((f,idx)=>(
                <View key={idx} style={{flexDirection:'row',gap:8}}>
                  <Text style={{color:c,fontWeight:'900'}}>•</Text>
                  <Txt s={13.5} c={idx===0?T.ink:T.mute} style={{flex:1,lineHeight:19}}>{f}</Txt>
                </View>
              ))}
            </View>
          </Card>

          {/* Illustrated Defect Cards */}
          <View>
            <Txt s={17.5} w="800" style={{marginBottom:10}}>Defect fixes</Txt>
            {selectedDefects.length?(
              <View style={{gap:10}}>
                {selectedDefects.map(d=>{
                  const open=expanded[d.id]!==false;
                  return (
                    <Card key={d.id} style={{borderWidth:1,borderColor:T.line,padding:0,overflow:'hidden'}}>
                      <Pressable
                        onPress={()=>toggleCard(d.id)}
                        style={{flexDirection:'row',alignItems:'center',gap:12,padding:13}}
                      >
                        <View style={{
                          width:54,
                          height:54,
                          borderRadius:16,
                          backgroundColor:dark?'#1d2922':'#f4f1ea',
                          borderWidth:1,
                          borderColor:T.line,
                          alignItems:'center',
                          justifyContent:'center',
                        }}>
                          <DefectArt id={d.id} size={46}/>
                        </View>
                        <View style={{flex:1}}>
                          <Txt s={15.5} w="800">{d.name}</Txt>
                          <Txt s={12.5} c={T.mute}>{d.summary}</Txt>
                        </View>
                        <Ionicons name={open?'chevron-up':'chevron-down'} size={20} color={T.mute}/>
                      </Pressable>

                      {open&&(
                        <View style={{
                          paddingHorizontal:15,
                          paddingBottom:14,
                          paddingTop:10,
                          borderTopWidth:1,
                          borderTopColor:T.line,
                          gap:8,
                        }}>
                          {d.steps.map((step,i)=>(
                            <View key={i} style={{flexDirection:'row',alignItems:'center',gap:10}}>
                              <View style={{
                                width:22,
                                height:22,
                                borderRadius:11,
                                backgroundColor:d.color+'24',
                                alignItems:'center',
                                justifyContent:'center',
                              }}>
                                <Text style={{color:d.color,fontWeight:'800',fontSize:11.5}}>{i+1}</Text>
                              </View>
                              <Txt s={13.5} w="500" style={{flex:1}}>{step}</Txt>
                            </View>
                          ))}
                        </View>
                      )}
                    </Card>
                  );
                })}
              </View>
            ):(
              <Card style={{borderWidth:1,borderColor:T.line,flexDirection:'row',alignItems:'center',gap:12}}>
                <View style={{
                  width:44,
                  height:44,
                  borderRadius:14,
                  backgroundColor:GC['Extra Class']+'20',
                  alignItems:'center',
                  justifyContent:'center',
                }}>
                  <Ionicons name="shield-checkmark-outline" size={22} color={GC['Extra Class']}/>
                </View>
                <View style={{flex:1}}>
                  <Txt w="700">Clean batch — no defects ticked</Txt>
                  <Txt s={13} c={T.mute}>Store sealed in a cool, dry place.</Txt>
                </View>
              </Card>
            )}
          </View>

          {/* Compact PSA Batch Value Calculator */}
          <Card style={{borderWidth:1,borderColor:T.line}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <Ionicons name="calculator-outline" size={18} color={T.g2}/>
                <Txt s={16} w="800">Batch value</Txt>
              </View>
              <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:99,backgroundColor:T.g2+'22'}}>
                <Text style={{color:T.g2,fontWeight:'800',fontSize:11.5}}>₱{basePrice.toFixed(0)}/kg · PSA</Text>
              </View>
            </View>

            <View style={{gap:10,marginTop:12}}>
              <View style={{
                flexDirection:'row',
                alignItems:'center',
                backgroundColor:dark?'#0f1913':T.bg,
                borderWidth:1,
                borderColor:T.line,
                borderRadius:14,
                paddingHorizontal:14,
              }}>
                <TextInput
                  value={kgText}
                  onChangeText={handleKgChange}
                  keyboardType="decimal-pad"
                  placeholder="Enter batch weight"
                  placeholderTextColor={T.mute}
                  style={{
                    flex:1,
                    color:T.ink,
                    paddingVertical:12,
                    fontSize:16,
                    fontWeight:'700',
                  }}
                />
                <Txt s={14} w="700" c={T.mute}>kg</Txt>
              </View>

              <View style={{
                flexDirection:'row',
                alignItems:'center',
                justifyContent:'space-between',
                gap:12,
                backgroundColor:dark?'#102118':T.g2+'14',
                borderRadius:14,
                paddingHorizontal:14,
                paddingVertical:12,
              }}>
                <Txt s={12.5} w="600" c={T.mute}>Est. reference</Txt>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                  style={{
                    flex:1,
                    textAlign:'right',
                    fontSize:22,
                    fontWeight:'800',
                    color:validKg>0?T.g2:T.mute,
                  }}
                >
                  {validKg>0?`₱${estTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`:'—'}
                </Text>
              </View>
            </View>

            <Txt s={11.5} c={T.mute} style={{marginTop:10}}>
              {PRICE_CONFIG.location} · {PRICE_CONFIG.referencePeriod} (reference only)
            </Txt>
          </Card>
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
      }}>
        <Btn t="Done" onPress={()=>setScr(recScan.fromHistory?'hist':'home',-1)}/>
      </View>
    </KeyboardAvoidingView>
  );
}
