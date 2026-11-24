import {GRADES,normGrade} from './theme';

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

function normalizeProbabilities(data,g,c){
  const src=data?.probabilities||data?.probs||data?.scores||null;
  if(src&&typeof src==='object'){
    const out={};
    let found=0;
    const aliases={
      'Extra Class':['Extra Class','extra_class','extra','EX','A'],
      'Class I':['Class I','class_1','class1','Class 1','I'],
      'Class II':['Class II','class_2','class2','Class 2','II','B'],
      'Defect':['Defect','defect','Defected','defected','Reject','reject','DF','C'],
    };
    for(const k of GRADES){
      for(const a of aliases[k]){
        const v=src[a];
        if(typeof v==='number'&&!Number.isNaN(v)){
          out[k]=v>1?v/100:v;
          found++;
          break;
        }
      }
    }
    if(found>=2){
      GRADES.forEach(k=>{if(typeof out[k]!=='number')out[k]=0});
      return out;
    }
  }
  const rem=Math.max(0,1-c);
  const others=GRADES.filter(x=>x!==g);
  return {
    [g]:c,
    [others[0]]:rem*0.55,
    [others[1]]:rem*0.30,
    [others[2]]:rem*0.15,
  };
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
      const g=normGrade(rawGrade);
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
          price:typeof (data.price??data.reference_price)==='number'?(data.price??data.reference_price):null,
          priceSource:data.price_source||data.source||null,
          reason:data.reason||data.explanation||null,
          defectRate:typeof data.defect_rate==='number'?data.defect_rate:null,
          total:typeof data.total==='number'?data.total:null,
          normal:typeof data.normal==='number'?data.normal:null,
          defect:typeof data.defect==='number'?data.defect:null,
          inferenceTime:typeof data.inference_time==='number'?data.inference_time:null,
          fromPi:true,
        },
      };
    }catch(err){
      lastError=err?.name==='AbortError'?'Inference timed out':(err?.message||'Upload failed');
    }
  }

  return {ok:false,error:lastError||'Could not classify on Pi 5'};
}
