import React,{useState} from 'react';
import {View,Text,Pressable,ScrollView} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {GR,GC,normGrade} from '../theme';
import {DEFECT_CATALOG,GN} from '../data';
import {Txt,Btn,Kernel} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

export default function DefectSelection(){
  const {T,dark,recScan,saveScanDefects,setScr,setSheet,close,anim}=useApp();
  const initial=recScan?.defects||[];
  const [selected,setSelected]=useState(initial);

  const toggle=(id)=>{
    sfx('tap');
    setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  };

  const showExample=(defect)=>{
    sfx('tap');
    setSheet({
      node:(
        <View style={{width:'100%',alignItems:'center'}}>
          <View style={{
            width:96,
            height:96,
            borderRadius:26,
            backgroundColor:defect.color+'22',
            borderWidth:1,
            borderColor:defect.color+'55',
            alignItems:'center',
            justifyContent:'center',
          }}>
            <Kernel g={defect.gradeHint} size={68} rot={-18}/>
          </View>
          <Txt s={22} w="800" style={{marginTop:14,textAlign:'center'}}>{defect.name}</Txt>
          <Txt s={13.5} c={defect.color} w="700" style={{marginTop:4,textAlign:'center'}}>{defect.summary}</Txt>
          <View style={{
            width:'100%',
            marginTop:16,
            padding:16,
            borderRadius:20,
            backgroundColor:dark?'#0f1913':T.bg,
            borderWidth:1,
            borderColor:T.line,
          }}>
            <Txt s={12.5} w="700" c={T.mute} style={{marginBottom:6}}>WHAT TO LOOK FOR</Txt>
            <Txt s={14.5} style={{lineHeight:21}}>{defect.lookFor}</Txt>
          </View>
        </View>
      ),
      btns:[['Got it','sec',close]],
    });
  };

  const handleConfirm=()=>{
    if(!selected.length&&normGrade(recScan?.x||recScan?.g)!=='Extra Class'){
      setSheet({
        ic:'alert-circle-outline',
        title:'Select a defect',
        body:'Please select at least one defect you see on the tray, or tap "No defects" if the batch looks clean.',
        btns:[
          ['No defects','sec',()=>{close();saveScanDefects([]);setScr('recs',1)}],
          ['Pick defects','',close],
        ],
      });
      return;
    }
    saveScanDefects(selected);
    setScr('recs',1);
  };

  const g=normGrade(recScan?.x||recScan?.g);

  return (
    <View style={{flex:1,backgroundColor:T.bg}}>
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:56,paddingBottom:130}} showsVerticalScrollIndicator={false}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Pressable
            onPress={()=>{sfx('tap');setScr(recScan?.fromHistory?'hist':'res',-1)}}
            style={({pressed})=>({
              width:44,
              height:44,
              borderRadius:15,
              backgroundColor:T.card,
              borderWidth:1,
              borderColor:T.line,
              alignItems:'center',
              justifyContent:'center',
              transform:[{scale:pressed&&anim?0.94:1}],
            })}
          >
            <Ionicons name="chevron-back" size={24} color={T.ink}/>
          </Pressable>

          {selected.length>0&&(
            <Pressable onPress={()=>{sfx('tap');setSelected([])}}>
              <Txt s={14} w="700" c={T.g2}>Clear all</Txt>
            </Pressable>
          )}
        </View>

        <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:18}}>
          <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:99,backgroundColor:GC[g]+'24'}}>
            <Text style={{color:GC[g],fontWeight:'800',fontSize:12}}>{GN[g][0]}</Text>
          </View>
          <Txt s={13} c={T.mute}>{selected.length} selected</Txt>
        </View>

        <Txt s={28} w="800" style={{marginTop:8,letterSpacing:-0.5}}>
          Check defects seen on tray
        </Txt>
        <Txt s={14.5} c={T.mute} style={{marginTop:6,marginBottom:16,lineHeight:21}}>
          Tick any visual defects you spot so QualiPea can explain the grade and give step-by-step handling advice. Tap the info icon for examples.
        </Txt>

        <View style={{gap:11}}>
          {DEFECT_CATALOG.map(d=>{
            const checked=selected.includes(d.id);
            return (
              <Pressable
                key={d.id}
                onPress={()=>toggle(d.id)}
                style={({pressed})=>({
                  flexDirection:'row',
                  alignItems:'center',
                  gap:13,
                  backgroundColor:T.card,
                  borderRadius:24,
                  padding:14,
                  borderWidth:1.5,
                  borderColor:checked?T.g2:T.line,
                  transform:[{scale:pressed&&anim?0.985:1}],
                })}
              >
                <View style={{
                  width:26,
                  height:26,
                  borderRadius:9,
                  backgroundColor:checked?GR:'transparent',
                  borderWidth:2,
                  borderColor:checked?GR:T.mute,
                  alignItems:'center',
                  justifyContent:'center',
                }}>
                  {checked&&<Ionicons name="checkmark" size={16} color="#fff"/>}
                </View>

                <View style={{
                  width:46,
                  height:46,
                  borderRadius:15,
                  backgroundColor:d.color+'20',
                  alignItems:'center',
                  justifyContent:'center',
                }}>
                  <Ionicons name={d.icon} size={22} color={d.color}/>
                </View>

                <View style={{flex:1}}>
                  <Txt s={15.5} w="700">{d.name}</Txt>
                  <Txt s={13} c={T.mute} style={{marginTop:2}}>{d.summary}</Txt>
                </View>

                <Pressable
                  onPress={()=>showExample(d)}
                  hitSlop={10}
                  style={{
                    width:36,
                    height:36,
                    borderRadius:12,
                    backgroundColor:dark?'#1c2c22':T.bg,
                    borderWidth:1,
                    borderColor:T.line,
                    alignItems:'center',
                    justifyContent:'center',
                  }}
                >
                  <Ionicons name="information-circle-outline" size={20} color={T.g2}/>
                </Pressable>
              </Pressable>
            );
          })}
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
        <Btn
          t={selected.length>0?`Continue (${selected.length})`:'Continue'}
          kind="gold"
          icon="arrow-forward"
          onPress={handleConfirm}
        />
      </View>
    </View>
  );
}
