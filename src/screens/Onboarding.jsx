import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Pressable,FlatList,Animated,Easing} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Svg,{Path} from 'react-native-svg';
import {W,GC,GS,GRADES,GOLD} from '../theme';
import {Kernel,Card,Txt,Chip,Brk} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

const OB=[
  ['Drop in one kernel.','Place a single peanut kernel on the pad and close the chamber lid.'],
  ['Tap to scan.','The camera captures the kernel and checks lighting in seconds.'],
  ['Get a clear class.','Extra Class, Class I, Class II, or Defect with confidence scores and explanations.'],
  ['Price & next steps.','See PSA reference pricing, defect advice, and save every scan to history.'],
];

function Sparkle({size=28,color='#ffffff'}){
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 1 C12.8 7.5 16.5 11.2 23 12 C16.5 12.8 12.8 16.5 12 23 C11.2 16.5 7.5 12.8 1 12 C7.5 11.2 11.2 7.5 12 1 Z"
        fill={color}
      />
    </Svg>
  );
}

export default function Onboarding(){
  const {dark,T,setScr,oi,setOi,ob,anim}=useApp();
  const [pageW,setPageW]=useState(W);
  const floatY=useRef(new Animated.Value(0)).current;

  useEffect(()=>{sfx('ob'+(oi+1))},[oi]);

  useEffect(()=>{
    if(!anim){
      floatY.setValue(0);
      return;
    }
    const loop=Animated.loop(
      Animated.sequence([
        Animated.timing(floatY,{toValue:-8,duration:1700,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
        Animated.timing(floatY,{toValue:0,duration:1700,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
      ])
    );
    loop.start();
    return()=>loop.stop();
  },[anim,floatY]);

  const surface=dark?T.bg:'#ffffff';
  const gradColors=dark
    ? ['#0b4a2b','#13673f','#0d1711']
    : ['#0a4f2d','#198251','#ffffff'];

  const Scene=(i)=>{
    if(i===0){
      return (
        <View style={{
          width:168,
          height:168,
          borderRadius:46,
          backgroundColor:dark?'#182920':'#f5f7f4',
          alignItems:'center',
          justifyContent:'center',
          shadowColor:'#0a2c1a',
          shadowOpacity:0.18,
          shadowRadius:22,
          shadowOffset:{width:0,height:14},
          elevation:10,
        }}>
          <Kernel size={126} rot={-18}/>
        </View>
      );
    }
    if(i===1){
      return (
        <View style={{
          width:168,
          height:168,
          borderRadius:46,
          backgroundColor:dark?'#182920':'#f5f7f4',
          alignItems:'center',
          justifyContent:'center',
          shadowColor:'#0a2c1a',
          shadowOpacity:0.18,
          shadowRadius:22,
          shadowOffset:{width:0,height:14},
          elevation:10,
        }}>
          <View style={{width:118,height:118,alignItems:'center',justifyContent:'center'}}>
            <Brk s={28} c={T.g2}/>
            <Kernel g="Class II" size={82} rot={-18}/>
          </View>
        </View>
      );
    }
    if(i===2){
      return (
        <View style={{flexDirection:'row',gap:9,alignItems:'center'}}>
          {GRADES.map((x,j)=>(
            <View
              key={x}
              style={{
                width:58,
                height:72,
                borderRadius:20,
                backgroundColor:GC[x],
                alignItems:'center',
                justifyContent:'center',
                marginTop:j%2===1?-16:0,
                shadowColor:'#0a2c1a',
                shadowOpacity:0.2,
                shadowRadius:14,
                shadowOffset:{width:0,height:8},
                elevation:8,
              }}
            >
              <Text style={{color:'#fff',fontWeight:'900',fontSize:22}}>{GS[x]}</Text>
            </View>
          ))}
        </View>
      );
    }
    return (
      <Card style={{
        alignItems:'center',
        gap:6,
        paddingHorizontal:28,
        paddingVertical:22,
        borderRadius:28,
        shadowOpacity:0.18,
        shadowRadius:20,
        elevation:10,
      }}>
        <Chip t="Extra Class" c={GC['Extra Class']}/>
        <Txt s={38} w="800">₱100.00</Txt>
        <Txt s={13} c={T.mute}>per kg · PSA Region XI reference</Txt>
      </Card>
    );
  };

  return (
    <View style={{flex:1,backgroundColor:surface}}>
      {/* Top smooth emerald-to-surface gradient */}
      <LinearGradient
        colors={gradColors}
        locations={[0,0.48,1]}
        style={{position:'absolute',top:0,left:0,right:0,height:'58%'}}
      />

      {/* Top header with centered QualiPea lockup & one-line Skip intro on the top right */}
      <View style={{
        paddingTop:58,
        paddingHorizontal:20,
        alignItems:'center',
        justifyContent:'center',
      }}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <View style={{
            width:28,
            height:28,
            borderRadius:14,
            backgroundColor:'#ffffff',
            alignItems:'center',
            justifyContent:'center',
          }}>
            <Kernel size={20} rot={-18}/>
          </View>
          <Text style={{color:'#ffffff',fontSize:18,fontWeight:'800',letterSpacing:-0.3}}>
            QualiPea
          </Text>
        </View>

        {oi<3&&(
          <Pressable
            onPress={()=>{sfx('tap');setScr('home',1)}}
            style={({pressed})=>({
              position:'absolute',
              right:20,
              top:55,
              paddingHorizontal:12,
              paddingVertical:7,
              borderRadius:99,
              backgroundColor:'rgba(255,255,255,0.16)',
              opacity:pressed?0.75:1,
            })}
          >
            <Text numberOfLines={1} style={{color:'#ffffff',fontSize:13,fontWeight:'700'}}>
              Skip intro
            </Text>
          </Pressable>
        )}
      </View>

      {/* Paged slides */}
      <View style={{flex:1}} onLayout={e=>{const w=e.nativeEvent.layout.width; if(w>0)setPageW(w)}}>
        <FlatList
          ref={ob}
          data={OB}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={x=>x[0]}
          getItemLayout={(_,index)=>({length:pageW,offset:pageW*index,index})}
          onMomentumScrollEnd={e=>{
            const idx=Math.round(e.nativeEvent.contentOffset.x/pageW);
            if(idx>=0&&idx<OB.length)setOi(idx);
          }}
          renderItem={({item,index})=>(
            <View style={{width:pageW,flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:30}}>
              <View style={{height:240,alignItems:'center',justifyContent:'center',marginBottom:24}}>
                <View style={{position:'absolute',top:12,right:-26}}>
                  <Sparkle size={30} color={GOLD}/>
                </View>
                <Animated.View style={{transform:[{translateY:floatY}]}}>
                  {Scene(index)}
                </Animated.View>
                <View style={{
                  width:120,
                  height:14,
                  borderRadius:99,
                  backgroundColor:dark?'rgba(0,0,0,0.35)':'rgba(10,45,25,0.09)',
                  marginTop:18,
                }}/>
              </View>

              <Text style={{
                color:dark?T.ink:'#101813',
                fontSize:30,
                fontWeight:'800',
                textAlign:'center',
                letterSpacing:-0.7,
                lineHeight:36,
              }}>
                {item[0]}
              </Text>
              <Text style={{
                color:dark?T.mute:'#5f6e65',
                fontSize:15.5,
                textAlign:'center',
                marginTop:10,
                lineHeight:22,
                maxWidth:295,
              }}>
                {item[1]}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Bottom CTA */}
      <View style={{paddingHorizontal:24,paddingBottom:40,gap:14,alignItems:'center'}}>
        <View style={{flexDirection:'row',gap:7,marginBottom:4}}>
          {OB.map((_,i)=>(
            <Pressable
              key={i}
              onPress={()=>{
                sfx('tap');
                setOi(i);
                ob.current?.scrollToOffset({offset:i*pageW,animated:anim});
              }}
              style={{
                width:i===oi?24:7,
                height:7,
                borderRadius:99,
                backgroundColor:i===oi?(dark?GOLD:'#101813'):(dark?'#26382d':'#d5ddd8'),
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={()=>{
            sfx('tap');
            if(oi>=OB.length-1){
              setScr('home',1);
            }else{
              const next=oi+1;
              setOi(next);
              ob.current?.scrollToOffset({offset:next*pageW,animated:anim});
            }
          }}
          style={({pressed})=>({
            width:'100%',
            height:56,
            borderRadius:18,
            backgroundColor:dark?GOLD:'#101813',
            alignItems:'center',
            justifyContent:'center',
            transform:[{scale:pressed&&anim?0.98:1}],
          })}
        >
          <Text style={{
            color:dark?'#1a1203':'#ffffff',
            fontSize:16,
            fontWeight:'700',
          }}>
            {oi===3?'Get Started':'Continue'}
          </Text>
        </Pressable>

        <Text style={{
          color:dark?'rgba(143,165,151,0.6)':'#8b9690',
          fontSize:11.5,
          textAlign:'center',
          lineHeight:16,
        }}>
          QualiPea Optical Kernel Grading · Camera & Demo Ready
        </Text>
      </View>
    </View>
  );
}
