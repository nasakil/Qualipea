import React from 'react';
import {View,Text,Pressable,Image} from 'react-native';
import {GC,GS,normGrade} from '../theme';
import {GN} from '../data';
import {Kernel,Txt,Chip,Ring} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

export default function Row({h,i}){
  const {T,hist,detail,anim}=useApp();
  const g=normGrade(h.g);
  const badgeKey=h.x?normGrade(h.x):g;
  const scanNum=String(Math.max(1,(hist?.length||1)-i)).padStart(2,'0');
  const defectCount=Array.isArray(h.defects)?h.defects.length:0;
  return (
    <Pressable
      onPress={()=>{sfx('tap');detail(i)}}
      style={({pressed})=>({
        flexDirection:'row',
        alignItems:'center',
        gap:14,
        backgroundColor:T.card,
        borderRadius:26,
        borderWidth:1,
        borderColor:T.line,
        padding:14,
        marginBottom:12,
        borderLeftWidth:h.r?4:1,
        borderLeftColor:h.r?GC.B:T.line,
        transform:[{scale:pressed&&anim?.98:1}],
        shadowColor:'#0d2a1a',
        shadowOpacity:.1,
        shadowRadius:12,
        shadowOffset:{width:0,height:5},
        elevation:3,
      })}
    >
      <View style={{width:58,height:58}}>
        <View style={{
          width:58,
          height:58,
          borderRadius:18,
          backgroundColor:'#26261f',
          alignItems:'center',
          justifyContent:'center',
          overflow:'hidden',
        }}>
          {h.img?(
            <Image source={{uri:h.img}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
          ):(
            <Kernel g={g} size={46} rot={-20}/>
          )}
        </View>
        <View style={{
          position:'absolute',
          right:-6,
          bottom:-6,
          minWidth:26,
          height:24,
          paddingHorizontal:4,
          borderRadius:9,
          backgroundColor:GC[badgeKey],
          alignItems:'center',
          justifyContent:'center',
          borderWidth:2,
          borderColor:T.card,
        }}>
          <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:10.5}}>{GS[badgeKey]}</Text>
        </View>
      </View>
      <View style={{flex:1}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
          <Txt s={16} w="700">{GN[g][0]}{h.x?' → '+h.x:''}</Txt>
          <Txt s={11.5} w="700" c={T.mute}>#{scanNum}</Txt>
        </View>
        <Txt s={12.5} c={T.mute}>{GN[g][1]}</Txt>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:6,alignItems:'center'}}>
          <Txt s={12} c={T.mute}>{h.tm}</Txt>
          {h.r?<Chip t="Review" c={GC.B}/>:<Chip t="Confident" c={GC.A}/>}
          {defectCount>0&&<Chip t={`${defectCount} ${defectCount===1?'defect':'defects'}`} c={GC.C}/>}
          {!!h.kg&&<Chip t={`${h.kg} kg`} c={T.g2}/>}
        </View>
      </View>
      <Ring v={h.c} c={GC[g]}/>
    </Pressable>
  );
}
