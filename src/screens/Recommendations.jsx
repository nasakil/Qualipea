import React,{useState} from 'react';
import {View,Text,Pressable,ScrollView,TextInput,KeyboardAvoidingView,Platform} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Svg,{Path,Circle,Line,Ellipse} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {GC,GS,GOLD,normGrade,pc} from '../theme';
import {GN,ADV,PRICE_CONFIG,defectById,buildWhySummary} from '../data';
import {Card,Txt,Btn,Kernel} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

function DefectArt({id,size=48}){
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {id==='shriveled'?(
        <>
          <Path d="M14 34c2-11 10-15 18-13s16 3 18 12c2 9-7 14-18 12S12 43 14 34z" fill="#b77e39"/>
          <Path d="M22 27c4 4 4 10 0 14M32 25c4 5 4 11 0 16M42 27c3 4 3 9 0 13" stroke="#6b4418" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </>
      ):(
        <>
          <Ellipse cx="32" cy="34" rx="22" ry="15" transform="rotate(-14 32 34)" fill={id==='moldy'||id==='insect'?'#8f6331':'#c98e46'}/>
          <Path d="M18 29c6-6 17-8 27-2" stroke="#fff5" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </>
      )}

      {id==='moldy'&&(
        <>
          <Circle cx="26" cy="32" r="6" fill="#4f8f5b" opacity="0.9"/>
          <Circle cx="36" cy="37" r="7" fill="#3a6e44" opacity="0.9"/>
          <Circle cx="32" cy="28" r="4" fill="#7ec489" opacity="0.85"/>
        </>
      )}

      {id==='damaged'&&(
        <Path d="M31 18 L27 31 L35 35 L30 49" stroke="#241608" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      )}

      {id==='discolored'&&(
        <>
          <Ellipse cx="38" cy="36" rx="10" ry="7" fill="#4b2912" opacity="0.82"/>
          <Circle cx="24" cy="30" r="4.5" fill="#5e3416" opacity="0.72"/>
        </>
      )}

      {id==='insect'&&(
        <>
          <Circle cx="25" cy="33" r="3.2" fill="#1e1207"/>
          <Circle cx="37" cy="30" r="2.8" fill="#1e1207"/>
          <Circle cx="34" cy="40" r="2.5" fill="#1e1207"/>
          <Circle cx="42" cy="37" r="1.4" fill="#e6cfa3"/>
          <Circle cx="29" cy="41" r="1.4" fill="#e6cfa3"/>
        </>
      )}
    </Svg>
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
          colors={['#17573b','#0b2b1e']}
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
