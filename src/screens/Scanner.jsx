import React,{useRef,useState} from 'react';
import {View,Text,Pressable,Animated,Image,ActivityIndicator,Platform} from 'react-native';
import {CameraView,useCameraPermissions} from 'expo-camera';
import {WebView} from 'react-native-webview';
import {Ionicons} from '@expo/vector-icons';
import {GOLD,GC} from '../theme';
import {piVideoUrl} from '../api';
import {Kernel,Btn,Brk} from '../components';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

const SIM_PRESETS=[
  ['auto','Auto','#9db5a7'],
  ['Extra Class','EX',GC['Extra Class']],
  ['Class I','I',GC['Class I']],
  ['Class II','II',GC['Class II']],
  ['Defect','DF',GC['Defect']],
  ['low','Low?',GOLD],
];

function mjpegHtml(src){
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#111613;display:flex;align-items:center;justify-content:center}img{width:100%;height:100%;object-fit:cover;display:block}</style></head><body><img src="${src}" onerror="window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('err')" onload="window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('ok')"/></body></html>`;
}

export default function Scanner(){
  const {demo,piUrl,setScr,goTab,cap,setCap,photo,setPhoto,scan,analyze,toast,anim,demoSim,setDemoSim}=useApp();
  const [permission,requestPermission]=useCameraPermissions();
  const [taking,setTaking]=useState(false);
  const [torch,setTorch]=useState(false);
  const [camSource,setCamSource]=useState('pi'); // 'pi' (RPi Cam default) or 'phone'
  const [streamKey,setStreamKey]=useState(()=>Date.now());
  const [streamErr,setStreamErr]=useState(false);
  const camRef=useRef(null);
  const flash=useRef(new Animated.Value(0)).current;

  const isRpi=!demo&&camSource==='pi';
  const isPhone=!demo&&camSource==='phone';
  const videoSrc=piVideoUrl(piUrl,streamKey);

  const triggerFlash=()=>{
    if(!anim)return;
    flash.setValue(0.85);
    Animated.timing(flash,{toValue:0,duration:220,useNativeDriver:true}).start();
  };

  const refreshStream=()=>{
    sfx('tap');
    setStreamErr(false);
    setStreamKey(Date.now());
  };

  const handleCapture=async()=>{
    if(taking)return;
    sfx('shutter');
    triggerFlash();
    if(demo){
      setCap(true);
      return;
    }
    if(isRpi){
      // RPi Cam triggers GET /scan directly on the Raspberry Pi 5 server
      analyze('pi');
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

  const needsPermission=isPhone&&(!permission||!permission.granted);

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

        {!demo?(
          <View style={{
            flexDirection:'row',
            backgroundColor:'rgba(255,255,255,0.1)',
            borderRadius:99,
            padding:3,
            gap:3,
          }}>
            {[['pi','RPi Cam'],['phone','Phone']].map(([k,lbl])=>{
              const active=camSource===k;
              return (
                <Pressable
                  key={k}
                  onPress={()=>{sfx('tap');setCap(false);setPhoto(null);setStreamErr(false);setCamSource(k)}}
                  style={{
                    paddingHorizontal:12,
                    paddingVertical:6,
                    borderRadius:99,
                    backgroundColor:active?GOLD:'transparent',
                  }}
                >
                  <Text style={{
                    color:active?'#1d1403':'#d5e6dc',
                    fontFamily:'OpenRunde-Bold',
                    fontSize:12,
                  }}>
                    {lbl}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ):(
          <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:18}}>
            Scanner (Demo)
          </Text>
        )}

        {isRpi?(
          <Pressable
            onPress={refreshStream}
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
            <Ionicons name="refresh-outline" size={20} color="#fff"/>
          </Pressable>
        ):isPhone&&!needsPermission&&!cap?(
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
        backgroundColor:'#181d1a',
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
            <Text style={{color:'#fff',fontSize:19,fontFamily:'OpenRunde-Bold',textAlign:'center'}}>
              Camera access needed
            </Text>
            <Text style={{color:'#a9beb2',fontSize:14,fontFamily:'OpenRunde-Regular',textAlign:'center',lineHeight:20}}>
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
              <Text style={{color:'#241803',fontFamily:'OpenRunde-Bold',fontSize:15}}>Allow camera</Text>
            </Pressable>
          </View>
        ):(
          <>
            {isRpi&&(
              Platform.OS==='web'?(
                <Image
                  key={streamKey}
                  source={{uri:videoSrc}}
                  onError={()=>setStreamErr(true)}
                  onLoad={()=>setStreamErr(false)}
                  style={{position:'absolute',top:0,left:0,right:0,bottom:0,width:'100%',height:'100%'}}
                  resizeMode="cover"
                />
              ):(
                <WebView
                  key={streamKey}
                  originWhitelist={['*']}
                  source={{html:mjpegHtml(videoSrc)}}
                  scrollEnabled={false}
                  bounces={false}
                  onMessage={e=>{
                    if(e.nativeEvent.data==='err')setStreamErr(true);
                    if(e.nativeEvent.data==='ok')setStreamErr(false);
                  }}
                  onError={()=>setStreamErr(true)}
                  style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#111613'}}
                />
              )
            )}

            {isPhone&&(
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

            {isRpi&&streamErr&&(
              <View style={{
                position:'absolute',
                top:0,left:0,right:0,bottom:0,
                backgroundColor:'rgba(10,16,12,0.88)',
                alignItems:'center',
                justifyContent:'center',
                paddingHorizontal:28,
                gap:10,
              }}>
                <Ionicons name="videocam-off-outline" size={38} color={GOLD}/>
                <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:17,textAlign:'center'}}>
                  Waiting for RPi Camera stream
                </Text>
                <Text style={{color:'#9fb5a8',fontFamily:'OpenRunde-Regular',fontSize:13,textAlign:'center',lineHeight:19}}>
                  Make sure api_server.py is running at {piUrl.replace(/^https?:\/\//,'')}/video on the same Wi-Fi.
                </Text>
                <View style={{flexDirection:'row',gap:10,marginTop:6}}>
                  <Pressable
                    onPress={refreshStream}
                    style={{
                      paddingHorizontal:18,
                      paddingVertical:10,
                      borderRadius:14,
                      backgroundColor:'rgba(255,255,255,0.12)',
                    }}
                  >
                    <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:13.5}}>Retry stream</Text>
                  </Pressable>
                  <Pressable
                    onPress={()=>{sfx('tap');goTab('set')}}
                    style={{
                      paddingHorizontal:16,
                      paddingVertical:10,
                      borderRadius:14,
                      backgroundColor:GOLD,
                    }}
                  >
                    <Text style={{color:'#1d1403',fontFamily:'OpenRunde-Bold',fontSize:13.5}}>Edit Pi IP</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Animated.View
              pointerEvents="none"
              style={{
                position:'absolute',
                top:0,left:0,right:0,bottom:0,
                backgroundColor:'#fff',
                opacity:flash,
                zIndex:10,
              }}
            />

            <View pointerEvents="none" style={{width:220,height:220,alignItems:'center',justifyContent:'center'}}>
              <Brk s={38} c={cap?GC.A:GOLD}/>
              {demo&&<Kernel g={demoSim==='auto'||demoSim==='low'?'Class II':demoSim} size={136}/>}
              {!cap&&anim&&!(isRpi&&streamErr)&&(
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
              <Text style={{color:'#fff',fontFamily:'OpenRunde-Bold',fontSize:12.5}}>
                {cap
                  ?'✓ Image captured'
                  :demo
                    ?(demoSim==='auto'?'Live preview (Demo)':`Simulate: ${demoSim==='low'?'Low confidence':demoSim}`)
                    :isRpi
                      ?`RPi Cam · ${piUrl.replace(/^https?:\/\//,'')}`
                      :(torch?'Phone camera · Torch on':'Phone camera')}
              </Text>
            </View>

            {demo&&!cap&&(
              <View style={{
                position:'absolute',
                bottom:14,
                left:12,
                right:12,
                flexDirection:'row',
                justifyContent:'center',
                flexWrap:'wrap',
                gap:6,
              }}>
                {SIM_PRESETS.map(([key,label,col])=>{
                  const active=demoSim===key;
                  return (
                    <Pressable
                      key={key}
                      onPress={()=>{sfx('tap');setDemoSim(key)}}
                      style={{
                        paddingHorizontal:11,
                        paddingVertical:6,
                        borderRadius:99,
                        backgroundColor:active?col:'rgba(8,18,12,0.78)',
                        borderWidth:1,
                        borderColor:active?col:'rgba(255,255,255,0.16)',
                      }}
                    >
                      <Text style={{
                        color:active?(key==='low'?'#1b1303':'#fff'):'#d6e6dc',
                        fontFamily:'OpenRunde-Bold',
                        fontSize:11.5,
                      }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>

      <View style={{padding:24,paddingBottom:44,gap:14,alignItems:'center'}}>
        <Text style={{
          color:'#cfe8d8',
          fontSize:13,
          fontFamily:'OpenRunde-Medium',
          backgroundColor:'#ffffff14',
          paddingHorizontal:14,
          paddingVertical:8,
          borderRadius:99,
          overflow:'hidden',
        }}>
          {cap
            ?'✓ Sharp   ✓ Kernel centered   ✓ Ready to grade'
            :demo
              ?'LED 100%   ·   Focus locked   ·   Lid closed'
              :isRpi
                ?'Tap shutter to trigger GET /scan on Raspberry Pi 5'
                :'Center one kernel inside the frame'}
        </Text>

        {cap?(
          <View style={{flexDirection:'row',gap:12,width:'100%'}}>
            <Btn t="Retake" kind="sec" onPress={handleRetake}/>
            <Btn t="Analyze" kind="gold" onPress={()=>analyze(camSource)}/>
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
