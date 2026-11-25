import React,{useState} from 'react';
import {View,Text,Pressable,ScrollView,TextInput,KeyboardAvoidingView,Platform} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {GC,GS,GOLD,normGrade,pc} from '../theme';
import {GN,ADV,PRICE_CONFIG,defectById,buildWhySummary} from '../data';
import {Card,Txt,Btn,Kernel,DefectKernel} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

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
        <Text style={{color:'#fff',fontSize:11,fontFamily:'OpenRunde-Bold'}}>{GS[grade]}</Text>
      </View>
    </View>
  );
}

const STEP_ICONS=['funnel-outline','shield-checkmark-outline','archive-outline'];

export default function Recommendations(){
  const {T,dark,recScan,saveScanKg,openDefectEditor,setScr,anim}=useApp();
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
            <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:17}}>Guide &amp; Value</Text>
            <Pressable
              onPress={()=>{sfx('tap');openDefectEditor(recScan,'recs',recScan.histIdx,recScan.fromHistory)}}
              style={({pressed})=>({
                paddingHorizontal:12,
                paddingVertical:8,
                borderRadius:12,
                backgroundColor:'rgba(255,255,255,0.14)',
                flexDirection:'row',
                alignItems:'center',
                gap:5,
                opacity:pressed?0.75:1,
              })}
            >
              <Ionicons name="create-outline" size={13} color="#fff"/>
              <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:12.5}}>Edit</Text>
            </Pressable>
          </View>

          <View style={{flexDirection:'row',alignItems:'center',gap:16,marginTop:20}}>
            <ClassIllustration grade={g}/>
            <View style={{flex:1}}>
              <Text style={{color:'#fff',fontSize:24,fontFamily:'OpenRunde-Bold'}}>{GN[g][0]}</Text>
              <Text style={{color:'#ffffffc4',fontSize:13.5,marginTop:3}}>{why.headline}</Text>
              <View style={{flexDirection:'row',gap:8,marginTop:8}}>
                <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:99,backgroundColor:'rgba(255,255,255,0.14)'}}>
                  <Text style={{color:'#fff',fontSize:11.5,fontFamily:'OpenRunde-Bold'}}>{pc(recScan.c)}% match</Text>
                </View>
                {selectedDefects.length>0&&(
                  <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:99,backgroundColor:GOLD+'33'}}>
                    <Text style={{color:'#f7d688',fontSize:11.5,fontFamily:'OpenRunde-Bold'}}>
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
                  <Text style={{color:c,fontFamily:'OpenRunde-Bold'}}>•</Text>
                  <Txt s={13.5} c={idx===0?T.ink:T.mute} style={{flex:1,lineHeight:19}}>{f}</Txt>
                </View>
              ))}
            </View>
          </Card>

          {/* Illustrated Defect Cards */}
          <View>
            <Txt s={17.5} w="800" style={{marginBottom:10}}>AI-detected defects</Txt>
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
                          <DefectKernel id={d.id} size={46}/>
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
                                <Text style={{color:d.color,fontFamily:'OpenRunde-Bold',fontSize:11.5}}>{i+1}</Text>
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
                  <Txt w="700">No defects detected by AI</Txt>
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
                <Text style={{color:T.g2,fontFamily:'OpenRunde-Bold',fontSize:11.5}}>₱{basePrice.toFixed(0)}/kg · PSA</Text>
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
                    fontFamily:'OpenRunde-Bold',
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
                    fontFamily:'OpenRunde-Bold',
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
