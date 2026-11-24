import React,{useRef,useState} from 'react';
import {View,Text,Pressable,Animated,Image,ActivityIndicator} from 'react-native';
import {CameraView,useCameraPermissions} from 'expo-camera';
import {Ionicons} from '@expo/vector-icons';
import {GOLD,GC} from '../theme';
import {Kernel,Btn,Brk} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

export default function Scanner(){
  const {demo,setScr,cap,setCap,photo,setPhoto,scan,analyze,toast,anim}=useApp();
  const [permission,requestPermission]=useCameraPermissions();
  const [taking,setTaking]=useState(false);
  const [torch,setTorch]=useState(false);
  const camRef=useRef(null);

  const handleCapture=async()=>{
    if(taking)return;
    sfx('shutter');
    if(demo){
      setCap(true);
      return;
    }
    if(!camRef.current){
      toast('Camera not ready yet');
      return;
    }
    try{
      setTaking(true);
      const pic=await camRef.current.takePictureAsync({quality:0.8});
      if(pic&&pic.uri){
        setPhoto(pic.uri);
        setCap(true);
      }else{
        toast('Could not capture photo');
      }
    }catch(e){
      toast('Camera capture failed');
    }finally{
      setTaking(false);
    }
  };

  const handleRetake=()=>{
    setPhoto(null);
    setCap(false);
  };

  const needsPermission=!demo&&(!permission||!permission.granted);

  return (
    <View style={{flex:1,backgroundColor:'#0a0f0c',paddingTop:56}}>
      <View style={{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:18,alignItems:'center'}}>
        <Pressable
          onPress={()=>{sfx('tap');setScr('home',-1)}}
          style={({pressed})=>({
            width:42,
            height:42,
            borderRadius:14,
            backgroundColor:'rgba(255,255,255,0.1)',
            alignItems:'center',
            justifyContent:'center',
            transform:[{scale:pressed&&anim?0.94:1}],
          })}
        >
          <Ionicons name="chevron-back" size={24} color="#fff"/>
        </Pressable>

        <Text style={{color:'#fff',fontWeight:'800',fontSize:18}}>
          {demo?'Scanner (Demo)':'Scanner'}
        </Text>

        {!demo&&!needsPermission&&!cap?(
          <Pressable
            onPress={()=>{sfx('tap');setTorch(t=>!t)}}
            style={({pressed})=>({
              width:42,
              height:42,
              borderRadius:14,
              backgroundColor:torch?GOLD:'rgba(255,255,255,0.1)',
              alignItems:'center',
              justifyContent:'center',
              transform:[{scale:pressed&&anim?0.94:1}],
            })}
          >
            <Ionicons name={torch?'flash':'flash-outline'} size={20} color={torch?'#1d1403':'#fff'}/>
          </Pressable>
        ):(
          <View style={{width:42}}/>
        )}
      </View>

      <View style={{
        flex:1,
        margin:18,
        borderRadius:30,
        backgroundColor:'#1c1f1a',
        alignItems:'center',
        justifyContent:'center',
        overflow:'hidden',
      }}>
        {needsPermission?(
          <View style={{alignItems:'center',paddingHorizontal:28,gap:14}}>
            <View style={{
              width:64,
              height:64,
              borderRadius:22,
              backgroundColor:'rgba(227,166,59,0.16)',
              alignItems:'center',
              justifyContent:'center',
            }}>
              <Ionicons name="camera-outline" size={32} color={GOLD}/>
            </View>
            <Text style={{color:'#fff',fontSize:19,fontWeight:'800',textAlign:'center'}}>
              Camera access needed
            </Text>
            <Text style={{color:'#a9beb2',fontSize:14,textAlign:'center',lineHeight:20}}>
              Allow camera access to photograph peanut kernels and save them to your grading history.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={{
                marginTop:4,
                backgroundColor:GOLD,
                paddingHorizontal:22,
                paddingVertical:12,
                borderRadius:16,
              }}
            >
              <Text style={{color:'#241803',fontWeight:'800',fontSize:15}}>Allow camera</Text>
            </Pressable>
          </View>
        ):(
          <>
            {!demo&&(
              cap&&photo?(
                <Image
                  source={{uri:photo}}
                  style={{position:'absolute',top:0,left:0,right:0,bottom:0,width:'100%',height:'100%'}}
                  resizeMode="cover"
                />
              ):(
                <CameraView
                  ref={camRef}
                  facing="back"
                  enableTorch={torch}
                  style={{position:'absolute',top:0,left:0,right:0,bottom:0}}
                />
              )
            )}

            <View style={{width:220,height:220,alignItems:'center',justifyContent:'center'}}>
              <Brk s={38} c={cap?GC.A:GOLD}/>
              {demo&&<Kernel g="Class II" size={130}/>}
              {!cap&&anim&&(
                <Animated.View style={{
                  position:'absolute',
                  left:6,
                  right:6,
                  height:3,
                  backgroundColor:GOLD,
                  transform:[{translateY:scan.interpolate({inputRange:[0,1],outputRange:[-100,100]})}],
                }}/>
              )}
            </View>

            <View style={{position:'absolute',top:16,backgroundColor:'#000a',paddingHorizontal:13,paddingVertical:6,borderRadius:99}}>
              <Text style={{color:'#fff',fontWeight:'700',fontSize:12.5}}>
                {cap?'✓ Image captured':(demo?'Live preview (Demo)':(torch?'Live camera · Torch on':'Live camera'))}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={{padding:24,paddingBottom:44,gap:14,alignItems:'center'}}>
        <Text style={{
          color:'#cfe8d8',
          fontSize:13,
          backgroundColor:'#ffffff14',
          paddingHorizontal:14,
          paddingVertical:8,
          borderRadius:99,
          overflow:'hidden',
        }}>
          {cap?'✓ Sharp   ✓ Kernel centered   ✓ Ready to grade':(demo?'LED 100%   ·   Focus locked   ·   Lid closed':'Center one kernel inside the frame')}
        </Text>

        {cap?(
          <View style={{flexDirection:'row',gap:12,width:'100%'}}>
            <Btn t="Retake" kind="sec" onPress={handleRetake}/>
            <Btn t="Analyze" kind="gold" onPress={analyze}/>
          </View>
        ):(
          <Pressable
            disabled={needsPermission||taking}
            onPress={handleCapture}
            style={({pressed})=>({
              width:80,
              height:80,
              borderRadius:40,
              borderWidth:4,
              borderColor:'#fff',
              alignItems:'center',
              justifyContent:'center',
              opacity:needsPermission?0.35:1,
              transform:[{scale:pressed&&anim?0.93:1}],
            })}
          >
            <View style={{
              width:60,
              height:60,
              borderRadius:30,
              backgroundColor:'#fff',
              alignItems:'center',
              justifyContent:'center',
            }}>
              {taking&&<ActivityIndicator color="#0a0f0c"/>}
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}
