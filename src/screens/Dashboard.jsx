import React,{useEffect,useRef} from 'react';
import {View,Text,ScrollView,Animated} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {GC,GS,GRADES,GOLD,normGrade,pc} from '../theme';
import {Card,Txt,Bar} from '../components';
import Row from '../components/Row';
import Top from '../components/Top';
import {useApp} from '../AppContext';
import {getDaysAgo} from '../storage';

const DAY_LABELS=['S','M','T','W','T','F','S'];

export default function Dashboard(){
  const {T,hist,anim}=useApp();
  const now=Date.now();
  const n=hist.length||1;
  const c={'Extra Class':0,'Class I':0,'Class II':0,'Defect':0};
  const cf={'Extra Class':[],'Class I':[],'Class II':[],'Defect':[]};
  const days=[0,0,0,0,0,0,0];
  hist.forEach(h=>{
    const g=normGrade(h.g);
    c[g]++;
    cf[g].push(h.c);
    const daysAgo=getDaysAgo(h,now);
    if(daysAgo>=0&&daysAgo<=6){
      days[6-daysAgo]++;
    }
  });

  const av=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
  const fl=hist.filter(h=>h.r);
  const mx=Math.max(1,...days);
  const weekTotal=days.reduce((a,b)=>a+b,0);

  const todayIdx=new Date(now).getDay();
  const labels=days.map((_,i)=>i===6?'Today':DAY_LABELS[(todayIdx-(6-i)+7)%7]);

  const barGrow=useRef(new Animated.Value(anim?0:1)).current;
  useEffect(()=>{
    if(!anim){
      barGrow.setValue(1);
      return;
    }
    barGrow.setValue(0);
    Animated.timing(barGrow,{
      toValue:1,
      duration:520,
      useNativeDriver:false,
    }).start();
  },[hist.length,weekTotal,anim,barGrow]);

  const topCount=c['Extra Class']+c['Class I'];
  const kpis=[
    [hist.length?pc(av(hist.map(h=>h.c)))+'%':'0%','Avg conf.','checkmark-circle-outline',T.g2],
    [hist.length?pc(topCount/n)+'%':'0%','Extra / I','ribbon-outline',GC['Extra Class']],
    [String(fl.length),'To review','flag-outline',fl.length?GC['Class II']:T.mute],
  ];

  return (
    <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingBottom:145}} showsVerticalScrollIndicator={false}>
      <Top title="Dashboard"/>

      <LinearGradient
        colors={T.hero}
        start={{x:0,y:0}}
        end={{x:1,y:1}}
        style={{borderRadius:30,padding:22}}
      >
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'}}>
          <View>
            <Text style={{color:'#ffffffb8',fontSize:14,fontFamily:'OpenRunde-Semibold'}}>Total scans</Text>
            <Text style={{color:'#fff',fontSize:52,fontFamily:'OpenRunde-Bold',letterSpacing:-1,marginTop:2}}>{hist.length}</Text>
          </View>
          <View style={{
            backgroundColor:'rgba(255,255,255,0.12)',
            borderWidth:1,
            borderColor:'rgba(255,255,255,0.16)',
            borderRadius:18,
            paddingHorizontal:14,
            paddingVertical:10,
            alignItems:'flex-end',
          }}>
            <Text style={{color:'#ffffffb8',fontSize:12,fontFamily:'OpenRunde-Semibold'}}>Avg scans</Text>
            <Text style={{color:'#fff',fontSize:22,fontFamily:'OpenRunde-Bold',marginTop:2}}>
              {(weekTotal/7).toFixed(1)}
              <Text style={{fontSize:12.5,color:'#ffffffb8',fontFamily:'OpenRunde-Medium'}}> / day</Text>
            </Text>
          </View>
        </View>
        <View style={{flexDirection:'row',gap:4,height:12,marginVertical:12}}>
          {GRADES.map(x=>(
            <View key={x} style={{flex:c[x]||.001,backgroundColor:GC[x],borderRadius:9}}/>
          ))}
        </View>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'space-between'}}>
          {GRADES.map(x=>(
            <View key={x} style={{flexDirection:'row',alignItems:'center',gap:5}}>
              <View style={{width:8,height:8,borderRadius:4,backgroundColor:GC[x]}}/>
              <Text style={{color:'#ffffffd8',fontSize:12}}>
                {x} <Text style={{fontFamily:'OpenRunde-Bold',color:'#fff'}}>{c[x]}</Text>
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={{flexDirection:'row',gap:10,marginVertical:14}}>
        {kpis.map(([val,label,ic,col])=>(
          <Card key={label} style={{flex:1,padding:14,borderWidth:1,borderColor:T.line}}>
            <View style={{
              width:32,
              height:32,
              borderRadius:10,
              backgroundColor:col+'22',
              alignItems:'center',
              justifyContent:'center',
              marginBottom:10,
            }}>
              <Ionicons name={ic} size={17} color={col}/>
            </View>
            <Txt s={22} w="800">{val}</Txt>
            <Txt s={12} c={T.mute} style={{marginTop:2}}>{label}</Txt>
          </Card>
        ))}
      </View>

      <Card style={{borderWidth:1,borderColor:T.line}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Txt s={16} w="700">Last 7 days</Txt>
          <Txt s={12.5} c={T.mute}>{weekTotal} scans</Txt>
        </View>
        <View style={{flexDirection:'row',alignItems:'flex-end',height:132,gap:8,marginTop:14}}>
          {days.map((d,i)=>{
            const targetH=d?Math.max(14,(d/mx)*86):6;
            const animatedH=barGrow.interpolate({inputRange:[0,1],outputRange:[4,targetH]});
            const isToday=i===6;
            return (
              <View key={i} style={{flex:1,alignItems:'center',justifyContent:'flex-end',height:'100%'}}>
                <Text style={{
                  fontSize:11,
                  fontFamily:'OpenRunde-Bold',
                  color:d?(isToday?GOLD:T.ink):'transparent',
                  marginBottom:4,
                }}>
                  {d}
                </Text>
                <Animated.View style={{
                  width:'100%',
                  maxWidth:28,
                  height:animatedH,
                  borderRadius:8,
                  backgroundColor:d?(isToday?GOLD:GC['Extra Class']):T.line,
                }}/>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize:10.5,
                    fontWeight:isToday?'700':'500',
                    color:isToday?T.ink:T.mute,
                    marginTop:7,
                  }}
                >
                  {labels[i]}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Txt s={19} w="700" style={{marginTop:22,marginBottom:10}}>Confidence by class</Txt>
      <Card style={{borderWidth:1,borderColor:T.line}}>
        {GRADES.map(x=>(
          <View key={x} style={{flexDirection:'row',alignItems:'center',gap:10,marginVertical:7}}>
            <View style={{
              minWidth:30,
              height:26,
              paddingHorizontal:6,
              borderRadius:8,
              backgroundColor:GC[x]+'22',
              alignItems:'center',
              justifyContent:'center',
            }}>
              <Text style={{color:GC[x],fontFamily:'OpenRunde-Bold',fontSize:11.5}}>{GS[x]}</Text>
            </View>
            <Txt s={13} w="600" style={{width:74}}>{x}</Txt>
            <View style={{flex:1}}><Bar v={av(cf[x])} c={GC[x]} h={8}/></View>
            <Txt s={13} w="700" style={{width:38,textAlign:'right'}}>
              {cf[x].length?pc(av(cf[x]))+'%':'n/a'}
            </Txt>
          </View>
        ))}
      </Card>

      <Txt s={19} w="700" style={{marginTop:22,marginBottom:10}}>Needs expert review</Txt>
      {fl.length?(
        fl.map(h=>{
          const idx=hist.indexOf(h);
          return <Row key={h.id||idx} h={h} i={idx}/>;
        })
      ):(
        <Card style={{borderWidth:1,borderColor:T.line,flexDirection:'row',alignItems:'center',gap:12}}>
          <Ionicons name="checkmark-circle-outline" size={22} color={GC['Extra Class']}/>
          <Txt c={T.mute}>All scans look confident. None flagged.</Txt>
        </Card>
      )}
    </ScrollView>
  );
}
