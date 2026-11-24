import React from 'react';
import {View,Text,Pressable,ScrollView,Share} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {GR,GC,pc} from '../theme';
import {Card,Txt,Btn} from '../components';
import Row from '../components/Row';
import Top from '../components/Top';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

export default function History(){
  const {T,filt,setFilt,hist,startScan,toast,anim}=useApp();
  const baseFiltered=hist.filter(h=>{
    if(filt==='All'||filt==='Oldest')return true;
    if(filt==='Today')return h.d===0;
    if(filt==='Flagged')return Boolean(h.r);
    return h.g===filt;
  });
  const l=filt==='Oldest'?[...baseFiltered].reverse():baseFiltered;
  const n={A:0,B:0,C:0};
  let flagged=0,todayCount=0;
  hist.forEach(h=>{n[h.g]++;if(h.r)flagged++;if(h.d===0)todayCount++});

  const counts={All:hist.length,Today:todayCount,Oldest:hist.length,A:n.A,B:n.B,C:n.C,Flagged:flagged};

  const exportSummary=async()=>{
    if(!hist.length){
      toast('No scans to export');
      return;
    }
    sfx('tap');
    const avgConf=pc(hist.reduce((a,b)=>a+b.c,0)/hist.length);
    const lines=[
      'QualiPea Batch Grading Report',
      `Total scans: ${hist.length}`,
      `Grade A: ${n.A} | Grade B: ${n.B} | Grade C: ${n.C}`,
      `Avg confidence: ${avgConf}% | Flagged for review: ${flagged}`,
      '',
      'Recent scans:',
      ...hist.slice(0,25).map((h,i)=>`${i+1}. Grade ${h.x||h.g}${h.x?` (model: ${h.g})`:''} — ${pc(h.c)}%${h.r?' [Review]':''} (${h.tm})`),
    ];
    try{
      await Share.share({message:lines.join('\n'),title:'QualiPea Batch Report'});
    }catch(_){}
  };

  return (
    <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingBottom:145}} showsVerticalScrollIndicator={false}>
      <Top
        title="History"
        right={
          hist.length?(
            <Pressable
              onPress={exportSummary}
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
              <Ionicons name="share-outline" size={21} color={T.ink}/>
            </Pressable>
          ):null
        }
      />

      <Card style={{flexDirection:'row',alignItems:'center',gap:18,borderWidth:1,borderColor:T.line}}>
        <View>
          <Txt s={36} w="800">{hist.length}</Txt>
          <Txt s={13.5} c={T.mute}>scans</Txt>
        </View>
        <View style={{flex:1,gap:9}}>
          <View style={{flexDirection:'row',gap:4,height:12}}>
            {['A','B','C'].map(x=>(
              <View key={x} style={{flex:n[x]||.001,backgroundColor:GC[x],borderRadius:9}}/>
            ))}
          </View>
          <View style={{flexDirection:'row',gap:16}}>
            {['A','B','C'].map(x=>(
              <Text key={x} style={{color:GC[x],fontWeight:'700',fontSize:13}}>● {n[x]}</Text>
            ))}
          </View>
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:14}}>
        {['All','Today','A','B','C','Flagged','Oldest'].map(f=>{
          const active=filt===f;
          const label=f.length===1?'Grade '+f:(f==='Oldest'?'Oldest first':f);
          return (
            <Pressable
              key={f}
              onPress={()=>{sfx('tap');setFilt(f)}}
              style={({pressed})=>({
                paddingHorizontal:15,
                paddingVertical:9,
                borderRadius:99,
                marginRight:8,
                backgroundColor:active?GR:T.card,
                borderWidth:1,
                borderColor:active?T.g2:T.line,
                flexDirection:'row',
                alignItems:'center',
                gap:6,
                transform:[{scale:pressed&&anim?0.96:1}],
              })}
            >
              <Text style={{fontWeight:'700',fontSize:13.5,color:active?'#fff':T.mute}}>{label}</Text>
              <Text style={{fontWeight:'700',fontSize:12,color:active?'rgba(255,255,255,0.75)':T.mute}}>
                {counts[f]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {[['Today',0],['Yesterday',1],['Earlier',2]].map(([k,d])=>{
        const g=l.filter(h=>h.d===d);
        if(!g.length)return null;
        return (
          <View key={k}>
            <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:10,marginBottom:8}}>
              <Txt w="700" c={T.mute}>{k}</Txt>
              <Txt c={T.mute}>{g.length}</Txt>
            </View>
            {g.map(h=><Row key={hist.indexOf(h)} h={h} i={hist.indexOf(h)}/>)}
          </View>
        );
      })}

      {!l.length&&(
        <Card style={{
          marginTop:12,
          paddingVertical:32,
          paddingHorizontal:22,
          alignItems:'center',
          gap:10,
          borderWidth:1,
          borderColor:T.line,
        }}>
          <View style={{
            width:56,
            height:56,
            borderRadius:20,
            backgroundColor:T.g2+'20',
            alignItems:'center',
            justifyContent:'center',
            marginBottom:4,
          }}>
            <Ionicons name={hist.length?'filter-outline':'camera-outline'} size={26} color={T.g2}/>
          </View>
          <Txt s={18} w="800" style={{textAlign:'center'}}>
            {hist.length?`No ${filt==='Flagged'?'flagged':`Grade ${filt}`} scans`:'No scans saved yet'}
          </Txt>
          <Txt s={14} c={T.mute} style={{textAlign:'center',maxWidth:250,lineHeight:20}}>
            {hist.length
              ?'Try switching filters to view your other saved kernel grades.'
              :'Capture a peanut kernel to see its grade, photo, and confidence score here.'}
          </Txt>
          <View style={{flexDirection:'row',marginTop:10,width:'100%'}}>
            {hist.length?(
              <Btn t="Show all scans" kind="sec" onPress={()=>setFilt('All')}/>
            ):(
              <Btn t="Start a scan" kind="gold" icon="scan-outline" onPress={startScan}/>
            )}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
