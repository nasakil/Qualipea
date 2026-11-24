import React from 'react';
import {View,Text,Pressable,Image} from 'react-native';
import {GC,GS,normGrade} from '../theme';
import {GN} from '../data';
import {Kernel,Txt,Chip,Ring} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

export default function Row({h,i}){
  const {T,detail,anim}=useApp();
  const g=normGrade(h.g);
  const badgeKey=h.x?normGrade(h.x):g;
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
          <Text style={{color:'#fff',fontWeight:'800',fontSize:10.5}}>{GS[badgeKey]}</Text>
        </View>
      </View>
      <View style={{flex:1}}>
        <Txt s={16} w="700">{GN[g][0]}{h.x?' → '+h.x:''}</Txt>
        <Txt s={12.5} c={T.mute}>{GN[g][1]}</Txt>
        <View style={{flexDirection:'row',gap:8,marginTop:6,alignItems:'center'}}>
          <Txt s={12} c={T.mute}>{h.tm}</Txt>
          {h.r?<Chip t="Review" c={GC.B}/>:<Chip t="Confident" c={GC.A}/>}
        </View>
      </View>
      <Ring v={h.c} c={GC[g]}/>
    </Pressable>
  );
}
