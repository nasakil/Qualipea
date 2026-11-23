import React,{createContext,useContext,useState,useEffect,useRef} from 'react';
import {View,Text,Pressable,Animated,Image,useColorScheme} from 'react-native';
import {GR,GC,pc,LT,DK,Th,AnimCtx} from './theme';
import {GN,SEED} from './data';
import {Kernel,Card,Txt} from './components';
import {sfx,setSfx,initAudio} from './sound';

const Ctx=createContext(null);
export const useApp=()=>useContext(Ctx);

const CONNECT_STEPS=[
  'Finding your chamber',
  'Opening a secure link',
  'Checking camera and LED',
];

export function AppProvider({children}){
  const sys=useColorScheme();
  const [dark,setDark]=useState(sys==='dark');
  const T=dark?DK:LT;

  const [scr,setScrState]=useState('splash');
  const [navDir,setNavDir]=useState(0);
  const [oi,setOi]=useState(0);
  const [demo,setDemo]=useState(true);
  const [dev,setDev]=useState(0);
  const [hd,setHd]=useState(SEED);
  const [hr,setHr]=useState([]);
  const [cur,setCur]=useState(null);
  const [cap,setCap]=useState(false);
  const [photo,setPhoto]=useState(null);
  const [tab,setTab]=useState('p');
  const [pd,setPd]=useState(false);
  const [ps,setPs]=useState(0);
  const [filt,setFilt]=useState('All');
  const [sheet,setSheet]=useState(null);
  const [msg,setMsg]=useState(null);
  const [dg,setDg]=useState(-1);
  const [saving,setSaving]=useState(false);
  const [snd,setSnd]=useState(true);
  const [anim,setAnim]=useState(true);

  const hist=demo?hd:hr;
  const setHist=demo?setHd:setHr;
  const tabs=['home','hist','dash','set'];
  const ob=useRef(null);
  const scan=useRef(new Animated.Value(0)).current;
  const toastTimer=useRef(null);

  const setScr=(next,dir=0)=>{
    setNavDir(dir);
    setScrState(next);
  };

  const goTab=(next)=>{
    const curIdx=tabs.indexOf(scr);
    const nextIdx=tabs.indexOf(next);
    const dir=curIdx>=0&&nextIdx>=0?(nextIdx>curIdx?1:nextIdx<curIdx?-1:0):0;
    setScr(next,dir);
  };

  useEffect(()=>{initAudio()},[]);

  useEffect(()=>{
    if(!anim){
      scan.stopAnimation();
      scan.setValue(0.5);
      return;
    }
    const loop=Animated.loop(
      Animated.sequence([
        Animated.timing(scan,{toValue:1,duration:1300,useNativeDriver:true}),
        Animated.timing(scan,{toValue:0,duration:1300,useNativeDriver:true}),
      ])
    );
    loop.start();
    return()=>loop.stop();
  },[anim,scan]);

  const toast=(t,keep)=>{
    if(toastTimer.current)clearTimeout(toastTimer.current);
    setMsg(t);
    if(!keep){
      toastTimer.current=setTimeout(()=>setMsg(null),1900);
    }
  };

  const close=()=>setSheet(null);
  const toggleDemo=()=>{setDemo(d=>!d);setDev(0)};
  const toggleSnd=()=>setSnd(v=>{setSfx(!v);return !v});
  const toggleAnim=()=>setAnim(v=>!v);

  const connect=cb=>{
    if(dev===2)return;
    setDev(2);
    setSheet({
      load:1,
      lock:1,
      title:'Connecting to Pi 5',
      body:'Keep the chamber powered and on the same Wi-Fi.',
      steps:CONNECT_STEPS,
      stepIdx:0,
    });

    const t1=setTimeout(()=>{
      setSheet(prev=>prev&&prev.load?{...prev,stepIdx:1}:prev);
      sfx('step',0);
    },550);

    const t2=setTimeout(()=>{
      setSheet(prev=>prev&&prev.load?{...prev,stepIdx:2}:prev);
      sfx('step',1);
    },1300);

    const t3=setTimeout(()=>{
      if(!demo){
        setDev(0);
        sfx('err');
        setSheet({
          ic:'alert-circle-outline',
          bad:1,
          title:'Can’t reach the Pi',
          body:'Make sure the chamber is powered and on the same Wi-Fi, or scan directly with your phone camera.',
          btns:[
            ['Phone camera','gold',()=>{close();setScr('prep',1)}],
            ['Retry','sec',()=>{close();connect(cb)}],
          ],
        });
        return;
      }
      setSheet(prev=>prev&&prev.load?{...prev,stepIdx:3}:prev);
      sfx('step',2);
      setTimeout(()=>{
        setDev(1);
        close();
        toast('Pi 5 connected');
        sfx('connect');
        cb&&cb();
      },420);
    },2050);

    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)};
  };

  const startScan=()=>!demo?setScr('prep',1):(dev===1?setScr('prep',1):connect(()=>setScr('prep',1)));
  const openCam=()=>{setCap(false);setPhoto(null);setScr('cam',1)};

  const analyze=()=>{
    const r=Math.random();
    const g=r<.45?'A':r<.8?'B':'C';
    const c=.6+Math.random()*.38;
    const o=['A','B','C'].filter(x=>x!==g);
    const sp=Math.random()*.6+.2;
    setCur({g,c,rv:c<.75,img:!demo?photo:null,p:{[g]:c,[o[0]]:(1-c)*sp,[o[1]]:(1-c)*(1-sp)}});
    setPs(0);
    setScr('proc',1);
    [1,2,3,4].forEach(i=>setTimeout(()=>{setPs(i);sfx('step',i-1)},i*650));
    setTimeout(()=>{
      setTab('p');
      setPd(false);
      setScr('res',1);
      sfx(g,c);
      if(c<.75)setTimeout(()=>sfx('flag'),750);
      setTimeout(()=>setPd(true),1300);
    },3100);
  };

  const save=()=>{
    setSaving(true);
    setTimeout(()=>{
      setSaving(false);
      setHist([{g:cur.g,c:cur.c,d:0,tm:'Just now',r:cur.rv,img:cur.img||null},...hist]);
      sfx('save');
      setSheet({
        ok:1,
        title:'Result saved',
        body:`Grade ${cur.g} was added to your history${cur.rv?', flagged for expert review':''}.`,
        btns:[
          ['Scan another','sec',()=>{close();startScan()}],
          ['View history','',()=>{close();goTab('hist')}],
        ],
      });
    },1100);
  };

  const askExit=()=>setSheet({
    ic:'exit-outline',
    bad:1,
    title:'Exit QualiPea?',
    body:'You’ll return to the splash screen and the Pi will disconnect.',
    btns:[
      ['Stay','sec',close],
      ['Exit','red',()=>{close();setDev(0);setOi(0);setScr('splash',-1)}],
    ],
  });

  const askDiscard=()=>setSheet({
    ic:'flag-outline',
    title:'Discard this result?',
    body:'This scan hasn’t been saved yet.',
    btns:[
      ['Keep it','sec',close],
      ['Discard','red',()=>{close();setScr('home',-1)}],
    ],
  });

  const fix=(i,x)=>{
    const h=[...hist];
    h[i]={...h[i],x:x===h[i].g?undefined:x};
    setHist(h);
    detail(i,h);
  };

  const detail=(i,list=hist)=>{
    const h=list[i];
    if(!h)return;
    const scannedLabel=h.d?['','Yesterday','Earlier'][h.d]:(h.tm==='Just now'||h.tm==='Now'?'Just now':'Today '+h.tm);
    const rows=[
      ['Confidence',pc(h.c)+'%'],
      ['Scanned',scannedLabel],
      ['Model','yolo11n-cls 1.0.0'],
      ['Status',h.r?'Flagged for review':'Confident'],
      ...(h.x?[['Expert grade','Grade '+h.x]]:[]),
    ];
    setSheet({
      node:(
        <View style={{width:'100%',alignItems:'center'}}>
          <View style={{
            width:104,
            height:104,
            borderRadius:26,
            backgroundColor:dark?'#26231d':'#f1ece2',
            borderWidth:1,
            borderColor:T.line,
            alignItems:'center',
            justifyContent:'center',
            alignSelf:'center',
            marginTop:4,
            overflow:'hidden',
            shadowColor:'#000',
            shadowOpacity:dark?.35:.08,
            shadowRadius:12,
            shadowOffset:{width:0,height:4},
          }}>
            {h.img?(
              <Image source={{uri:h.img}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
            ):(
              <Kernel g={h.g} size={76} rot={-18}/>
            )}
          </View>
          <Txt s={26} w="800" style={{textAlign:'center',marginTop:14}}>{GN[h.g][0]}</Txt>
          <Txt s={14.5} c={T.mute} style={{textAlign:'center',marginTop:4}}>{GN[h.g][1]}</Txt>

          <Card style={{
            width:'100%',
            marginTop:18,
            backgroundColor:dark?'#0f1913':T.bg,
            borderWidth:1,
            borderColor:T.line,
            borderRadius:22,
            paddingVertical:4,
            paddingHorizontal:16,
            shadowOpacity:0,
            elevation:0,
          }}>
            {rows.map(([a,b],idx)=>(
              <View
                key={a}
                style={{
                  flexDirection:'row',
                  justifyContent:'space-between',
                  alignItems:'center',
                  paddingVertical:13,
                  borderTopWidth:idx===0?0:1,
                  borderTopColor:T.line,
                }}
              >
                <Txt s={14.5} c={T.mute}>{a}</Txt>
                <Txt s={14.5} w="700">{b}</Txt>
              </View>
            ))}
          </Card>

          <View style={{width:'100%',marginTop:18}}>
            <Txt s={15.5} w="700">Expert correction</Txt>
            <View style={{flexDirection:'row',gap:10,marginTop:12,marginBottom:10}}>
              {['A','B','C'].map(x=>{
                const active=h.x===x;
                return (
                  <Pressable
                    key={x}
                    onPress={()=>{sfx('tap');fix(i,x)}}
                    style={({pressed})=>({
                      paddingHorizontal:18,
                      paddingVertical:10,
                      borderRadius:99,
                      backgroundColor:active?GR:(dark?'#142119':T.bg),
                      borderWidth:1,
                      borderColor:active?T.g2:T.line,
                      transform:[{scale:pressed&&anim?.96:1}],
                    })}
                  >
                    <Text style={{fontWeight:'700',fontSize:14,color:active?'#fff':T.mute}}>Grade {x}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Txt s={12.5} c={T.mute}>The model’s original prediction is always kept.</Txt>
          </View>
        </View>
      ),
      btns:[['Close','sec',close]],
    });
  };

  const runDiag=()=>{
    if(dg>=0||dev===2)return;
    let i=0;
    setDg(0);
    const iv=setInterval(()=>{
      i++;
      if(i>=6){
        clearInterval(iv);
        setDg(-1);
        toast(dev===1?'Diagnostics passed':'Chamber is offline');
      }else{
        setDg(i);
      }
    },650);
  };

  const value={
    snd,toggleSnd,anim,toggleAnim,
    sys,dark,setDark,T,
    scr,setScr,goTab,navDir,
    oi,setOi,demo,setDemo,dev,setDev,
    hd,setHd,hr,setHr,cur,setCur,cap,setCap,photo,setPhoto,
    tab,setTab,pd,setPd,ps,setPs,filt,setFilt,
    sheet,setSheet,msg,setMsg,dg,setDg,saving,setSaving,
    hist,setHist,tabs,ob,scan,
    toast,close,connect,toggleDemo,startScan,openCam,analyze,save,
    askExit,askDiscard,fix,detail,runDiag,
  };

  return (
    <Th.Provider value={T}>
      <AnimCtx.Provider value={anim}>
        <Ctx.Provider value={value}>{children}</Ctx.Provider>
      </AnimCtx.Provider>
    </Th.Provider>
  );
}
