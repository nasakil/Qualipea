import React,{useState} from 'react';
import {View,Text,Pressable,ScrollView,TextInput,KeyboardAvoidingView,Platform} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {GC,GOLD,pc} from '../theme';
import {GN,ADV,PRICE_CONFIG,defectById,buildWhySummary} from '../data';
import {Card,Txt,Btn} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

export default function Recommendations(){
  const {T,dark,recScan,saveScanKg,setScr,anim}=useApp();
  const [expanded,setExpanded]=useState({});
  const [kgText,setKgText]=useState(recScan?.kg?String(recScan.kg):'');

  if(!recScan)return null;

  const g=recScan.x||recScan.g||'B';
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
          style={{padding:20,paddingTop:56,paddingBottom:26,borderBottomLeftRadius:32,borderBottomRightRadius:32}}
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
            <Text style={{color:'#fff',fontWeight:'800',fontSize:17}}>Recommendations</Text>
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

          <View style={{flexDirection:'row',alignItems:'center',gap:14,marginTop:20}}>
            <View style={{
              width:66,
              height:66,
              borderRadius:22,
              backgroundColor:c,
              alignItems:'center',
              justifyContent:'center',
            }}>
              <Text style={{color:'#fff',fontSize:38,fontWeight:'900'}}>{g}</Text>
            </View>
            <View style={{flex:1}}>
              <Text style={{color:'#fff',fontSize:23,fontWeight:'800'}}>{GN[g][0]}</Text>
              <Text style={{color:'#ffffffb8',fontSize:13.5,marginTop:2}}>
                {pc(recScan.c)}% confidence · {why.headline}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{padding:20,gap:14}}>
          {/* Why this grade card */}
          <Card style={{borderWidth:1,borderColor:T.line}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8}}>
              <Ionicons name="sparkles-outline" size={18} color={GOLD}/>
              <Txt s={16} w="800">Why {GN[g][0]}?</Txt>
            </View>
            {why.factors.map((f,idx)=>(
              <View key={idx} style={{flexDirection:'row',gap:9,marginTop:idx===0?0:7}}>
                <Text style={{color:T.g2,fontWeight:'800'}}>•</Text>
                <Txt s={14} c={idx===0?T.ink:T.mute} style={{flex:1,lineHeight:20}}>{f}</Txt>
              </View>
            ))}
          </Card>

          {/* Good kernel handling advice */}
          <Card style={{borderWidth:1,borderColor:T.line}}>
            <Txt s={16} w="800" style={{marginBottom:6}}>Batch handling advice</Txt>
            {ADV[g].map(a=>(
              <View key={a} style={{flexDirection:'row',gap:10,paddingVertical:6}}>
                <Ionicons name="checkmark-circle" size={19} color={GC.A}/>
                <Txt s={14} style={{flex:1,lineHeight:20}}>{a}</Txt>
              </View>
            ))}
          </Card>

          {/* Defect-specific expandable remediation cards */}
          <View>
            <Txt s={18} w="800" style={{marginBottom:10}}>Defect action steps</Txt>
            {selectedDefects.length?(
              <View style={{gap:10}}>
                {selectedDefects.map(d=>{
                  const open=expanded[d.id]!==false; // open by default
                  return (
                    <Card key={d.id} style={{borderWidth:1,borderColor:T.line,padding:0,overflow:'hidden'}}>
                      <Pressable
                        onPress={()=>toggleCard(d.id)}
                        style={{flexDirection:'row',alignItems:'center',gap:12,padding:15}}
                      >
                        <View style={{
                          width:42,
                          height:42,
                          borderRadius:14,
                          backgroundColor:d.color+'22',
                          alignItems:'center',
                          justifyContent:'center',
                        }}>
                          <Ionicons name={d.icon} size={20} color={d.color}/>
                        </View>
                        <View style={{flex:1}}>
                          <Txt s={15.5} w="800">{d.name}</Txt>
                          <Txt s={12.5} c={T.mute}>{d.summary}</Txt>
                        </View>
                        <Ionicons name={open?'chevron-up':'chevron-down'} size={20} color={T.mute}/>
                      </Pressable>

                      {open&&(
                        <View style={{
                          paddingHorizontal:16,
                          paddingBottom:16,
                          paddingTop:8,
                          borderTopWidth:1,
                          borderTopColor:T.line,
                          gap:8,
                        }}>
                          {d.steps.map((step,i)=>(
                            <View key={i} style={{flexDirection:'row',gap:10}}>
                              <Text style={{color:T.g2,fontWeight:'800',fontSize:13.5}}>{i+1}.</Text>
                              <Txt s={13.5} style={{flex:1,lineHeight:20}}>{step}</Txt>
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
                <Ionicons name="shield-checkmark-outline" size={24} color={GC.A}/>
                <View style={{flex:1}}>
                  <Txt w="700">No tray defects selected</Txt>
                  <Txt s={13} c={T.mute} style={{marginTop:2}}>
                    Store kernels in a clean, sealed container in a cool, dry place.
                  </Txt>
                </View>
              </Card>
            )}
          </View>

          {/* PSA Davao Region Batch Value Calculator */}
          <Card style={{borderWidth:1,borderColor:T.line}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
              <Txt s={16.5} w="800">Batch value calculator</Txt>
              <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:99,backgroundColor:T.g2+'22'}}>
                <Text style={{color:T.g2,fontWeight:'800',fontSize:11.5}}>₱{basePrice.toFixed(2)}/kg</Text>
              </View>
            </View>
            <Txt s={12.5} c={T.mute} style={{marginTop:4,lineHeight:18}}>
              {PRICE_CONFIG.sourceName} · {PRICE_CONFIG.location}{'\n'}
              {PRICE_CONFIG.commodity} · {PRICE_CONFIG.referencePeriod}
            </Txt>

            <View style={{flexDirection:'row',alignItems:'center',gap:12,marginTop:14}}>
              <View style={{flex:1}}>
                <Txt s={12.5} w="700" c={T.mute} style={{marginBottom:6}}>Batch weight (kg)</Txt>
                <TextInput
                  value={kgText}
                  onChangeText={handleKgChange}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 25"
                  placeholderTextColor={T.mute}
                  style={{
                    backgroundColor:dark?'#0f1913':T.bg,
                    color:T.ink,
                    borderWidth:1,
                    borderColor:T.line,
                    borderRadius:14,
                    paddingHorizontal:14,
                    paddingVertical:12,
                    fontSize:16,
                    fontWeight:'700',
                  }}
                />
              </View>

              <View style={{flex:1,alignItems:'flex-end',paddingTop:18}}>
                <Txt s={12} c={T.mute}>Estimated reference</Txt>
                <Txt s={26} w="800" c={validKg>0?T.g2:T.mute}>
                  {validKg>0?`₱${estTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`:'—'}
                </Txt>
              </View>
            </View>

            <Txt s={12} c={T.mute} style={{marginTop:12,lineHeight:17}}>
              Reference estimate only (PSA farmgate rate × weight), not a guaranteed buyer offer. No unvalidated quality premium or deduction is applied.
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
