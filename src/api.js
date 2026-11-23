export const DEFAULT_PI_URL='http://192.168.137.31:5000';

export function normalizeUrl(raw){
  const trimmed=(raw||'').trim().replace(/\/+$/,'');
  if(!trimmed)return DEFAULT_PI_URL;
  return /^https?:\/\//i.test(trimmed)?trimmed:`http://${trimmed}`;
}

async function fetchWithTimeout(url,options={},timeoutMs=4500){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const res=await fetch(url,{...options,signal:controller.signal});
    return res;
  }finally{
    clearTimeout(timer);
  }
}

export async function checkPiHealth(baseUrl){
  const base=normalizeUrl(baseUrl);
  const paths=['/health','/status','/'];
  let lastError=null;

  for(const p of paths){
    try{
      const res=await fetchWithTimeout(`${base}${p}`,{method:'GET'},4000);
      if(res.ok){
        let data=null;
        try{data=await res.json()}catch(_){}
        return {ok:true,url:base,endpoint:p,data};
      }
      if(res.status!==404){
        lastError=`HTTP ${res.status}`;
      }
    }catch(err){
      lastError=err?.name==='AbortError'?'Connection timed out':(err?.message||'Network error');
    }
  }
  return {ok:false,url:base,error:lastError||'Unable to reach Raspberry Pi 5'};
}

function parseGrade(raw){
  const s=String(raw||'').toUpperCase();
  if(s.includes('A'))return 'A';
  if(s.includes('B'))return 'B';
  if(s.includes('C'))return 'C';
  return 'B';
}

function normalizeProbabilities(data,g,c){
  const src=data?.probabilities||data?.probs||data?.scores||null;
  if(src&&typeof src==='object'){
    const getVal=(k)=>{
      const v=src[k]??src[`Grade ${k}`]??src[`grade_${k.toLowerCase()}`]??src[k.toLowerCase()];
      if(typeof v!=='number'||Number.isNaN(v))return null;
      return v>1?v/100:v;
    };
    const a=getVal('A'),b=getVal('B'),cc=getVal('C');
    if(a!==null&&b!==null&&cc!==null){
      return {A:a,B:b,C:cc};
    }
  }
  const rem=Math.max(0,1-c);
  const others=['A','B','C'].filter(x=>x!==g);
  return {[g]:c,[others[0]]:rem*0.6,[others[1]]:rem*0.4};
}

export async function classifyKernel(baseUrl,imageUri){
  const base=normalizeUrl(baseUrl);
  const endpoints=['/predict','/classify','/grade'];
  let lastError=null;

  for(const ep of endpoints){
    try{
      const form=new FormData();
      form.append('file',{
        uri:imageUri,
        name:'kernel.jpg',
        type:'image/jpeg',
      });
      form.append('image',{
        uri:imageUri,
        name:'kernel.jpg',
        type:'image/jpeg',
      });

      const res=await fetchWithTimeout(
        `${base}${ep}`,
        {
          method:'POST',
          body:form,
          headers:{Accept:'application/json'},
        },
        12000
      );

      if(res.status===404)continue;
      if(!res.ok){
        lastError=`HTTP ${res.status}`;
        continue;
      }

      const data=await res.json();
      const rawGrade=data.grade??data.class??data.label??data.prediction;
      const g=parseGrade(rawGrade);
      let c=Number(data.confidence??data.score??data.probability??0.85);
      if(Number.isNaN(c))c=0.85;
      if(c>1)c=c/100;
      c=Math.max(0,Math.min(1,c));

      return {
        ok:true,
        result:{
          g,
          c,
          rv:c<0.75,
          p:normalizeProbabilities(data,g,c),
          model:data.model||'yolo11n-cls 1.0.0',
          fromPi:true,
        },
      };
    }catch(err){
      lastError=err?.name==='AbortError'?'Inference timed out':(err?.message||'Upload failed');
    }
  }

  return {ok:false,error:lastError||'Could not classify on Pi 5'};
}
