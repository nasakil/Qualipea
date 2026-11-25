import {GRADES,normGrade} from './theme';

export const GN={
  'Extra Class':['Extra Class','Superior whole-kernel quality'],
  'Class I':['Class I','Good quality with minimal blemishes'],
  'Class II':['Class II','Acceptable quality with visible variation'],
  'Defect':['Defect','Quality concern — separate from good batch'],
};

export const ADV={
  'Extra Class':[
    'Keep separate from lower classes',
    'Store cool & dry in sealed containers',
    'Log scan for premium buyer pricing',
  ],
  'Class I':[
    'Ready to sell as whole kernels',
    'Pick out any stray damaged pieces',
    'Store sealed in a cool, dry place',
  ],
  'Class II':[
    'Remove split or stained kernels first',
    'Sell as Class II or for peanut butter / oil',
    'Use sooner — broken kernels spoil faster',
  ],
  'Defect':[
    'Isolate away from good batches right away',
    'Never sell or feed moldy kernels',
    'Re-sort the batch and scan again',
  ],
};

export const PRICE_CONFIG={
  basePricePerKg:100.00,
  sourceName:'PSA OpenSTAT',
  location:'Region XI (Davao Region)',
  commodity:'Peanut, without shell, dry',
  referencePeriod:'June 2026 farmgate price reference',
  unit:'PHP/kg',
};

export const DEFECT_CATALOG=[
  {
    id:'moldy',
    name:'Moldy',
    summary:'Fuzzy green, gray or black growth',
    lookFor:'Powdery or fuzzy patches, often green, gray or black, sometimes with a musty smell.',
    gradeHint:'Defect',
    icon:'warning-outline',
    color:'#c2453d',
    steps:[
      'Remove moldy kernels immediately',
      'Do not eat, sell, or feed (aflatoxin risk)',
      'Clean containers & re-dry the rest',
    ],
  },
  {
    id:'damaged',
    name:'Broken / Damaged',
    summary:'Split, cracked or crushed kernel',
    lookFor:'Kernels that are split in half, cracked, chipped or crushed.',
    gradeHint:'Class II',
    icon:'cut-outline',
    color:'#d99a1c',
    steps:[
      'Separate split kernels from whole ones',
      'Use for peanut butter or oil processing',
      'Sell or use sooner to prevent spoilage',
    ],
  },
  {
    id:'discolored',
    name:'Discolored',
    summary:'Dark, brown or stained kernel',
    lookFor:'Dark brown or stained patches on the skin or kernel that are not part of the normal color.',
    gradeHint:'Class II',
    icon:'color-fill-outline',
    color:'#b8732a',
    steps:[
      'Set stained kernels aside & check odor',
      'Discard if musty or rancid',
      'Sell as lower grade if smell is normal',
    ],
  },
  {
    id:'shriveled',
    name:'Shriveled',
    summary:'Thin, wrinkled, undersized kernel',
    lookFor:'Kernels that are noticeably thin, wrinkled or smaller than the rest of the batch.',
    gradeHint:'Class II',
    icon:'contract-outline',
    color:'#c78a22',
    steps:[
      'Sieve or hand-sort out thin kernels',
      'Sell separately or send for processing',
      'Note field source for harvest tracking',
    ],
  },
  {
    id:'insect',
    name:'Insect-damaged',
    summary:'Small holes, tunnels or powdery dust',
    lookFor:'Tiny holes or tunnels in the kernel, sometimes with fine powdery dust (frass) around them.',
    gradeHint:'Defect',
    icon:'bug-outline',
    color:'#c2453d',
    steps:[
      'Isolate & inspect batch for live pests',
      'Clean storage & seal tightly',
      'Keep cool, dry, and check regularly',
    ],
  },
];

export const defectById=id=>DEFECT_CATALOG.find(d=>d.id===id)||null;

/**
 * Automatically infers likely defects from a scan's predicted class
 * and probability distribution so DefectSelection starts pre-checked.
 */
export function suggestDefects(scan){
  if(!scan)return [];
  if(Array.isArray(scan.defects)&&scan.defects.length)return scan.defects;
  const g=normGrade(scan.x||scan.g);
  const probs=scan.p||{};
  if(g==='Extra Class')return [];
  if(g==='Class I'){
    return ((probs['Class II']||0)+(probs['Defect']||0))>=0.14?['discolored']:[];
  }
  if(g==='Class II'){
    return (probs['Defect']||0)>=0.15?['damaged','discolored']:['damaged','shriveled'];
  }
  // Defect class
  return (probs['Class II']||0)>=0.15?['moldy','discolored']:['moldy','insect'];
}

export const REF_GUIDE=[
  {
    id:'Extra Class',
    title:'Extra Class',
    badge:'Superior',
    grade:'Extra Class',
    summary:'Top-tier whole, uniform, clean kernels with natural tan skin and virtually zero defects.',
    cues:[
      'Plump, intact shape with very consistent size',
      'Even light-golden to tan seed coat',
      'Free from dark spots, splits, cracks, or musty odor',
    ],
  },
  {
    id:'Class I',
    title:'Class I',
    badge:'Good Quality',
    grade:'Class I',
    summary:'Good commercial whole kernels with only very minor skin scuffs or slight size variation.',
    cues:[
      'Mostly uniform whole kernels suitable for retail packing',
      'Very slight skin blemishes that do not affect kernel integrity',
      'No mold, insect holes, or rancid discoloration',
    ],
  },
  {
    id:'Class II',
    title:'Class II',
    badge:'Intermediate',
    grade:'Class II',
    summary:'Acceptable kernels showing noticeable surface blemishes, split halves, or shriveling.',
    cues:[
      'Moderate skin discoloration, staining, or uneven sizing',
      'Contains broken, split, chipped, or shriveled kernels',
      'Best sorted or sold for processing (peanut butter or oil)',
    ],
  },
  {
    id:'Defect',
    title:'Defect',
    badge:'Quality Concern',
    grade:'Defect',
    summary:'Kernels with severe defects such as mold growth, heavy darkening, or insect tunneling.',
    cues:[
      'Fuzzy green, gray, or black mold patches (aflatoxin risk)',
      'Deep insect holes, tunnels, or powdery dust (frass)',
      'Severely dark, decayed, or damaged kernels — set aside immediately',
    ],
  },
];

export const TROUBLESHOOT_STEPS=[
  ['Plug the ethernet cable of the imaging chamber into your laptop.',null],
  ['Switch on the power of the Raspberry Pi and wait about a minute for it to boot.',null],
  ['On your laptop, open Windows PowerShell.',null],
  ['Connect to the Pi with this command, then enter the device password:','ssh qualipearpi@192.168.137.31'],
  ['Start the Raspberry Pi server and keep the terminal window open:','python3 camera_stream.py'],
  ['On your phone, connect to the Wi-Fi network "qualipea" (password: peanut123) or your shared hotspot.',null],
  ['Return to Settings or Home and tap Connect chamber. You can now grade freely!',null],
];

export const HARDWARE_SPECS=[
  ['Raspberry Pi 5','Quad-core ARM processor · runs local YOLO11-cls & Flask API'],
  ['Raspberry Pi Camera Module 3','12 MP · captures peanut kernel images inside the chamber'],
  ['LED Strip / Ring Light','Uniform white illumination inside the imaging chamber'],
  ['Imaging Chamber','Custom enclosure with matte background to shut out room glare'],
  ['microSD Card','32 GB · stores Raspberry Pi OS and model weights'],
  ['Power Supply','Official Raspberry Pi power adapter'],
  ['Android / iOS Smartphone','Runs the QualiPea companion app (camera fallback ready)'],
];

export const SOFTWARE_SPECS=[
  ['Raspberry Pi OS','Operating system of the imaging device'],
  ['Python 3 + Flask','Local HTTP API (port 5000) serving classification & health checks'],
  ['Ultralytics YOLO11-cls','4-class Spanish peanut classifier (Extra Class, Class I, Class II, Defect)'],
  ['OpenCV','Image preprocessing and frame capture'],
  ['Expo + React Native','Cross-platform mobile app with offline AsyncStorage persistence'],
];

/**
 * Generates a clear, human-readable explanation of WHY the classifier
 * assigned Extra Class, Class I, Class II, or Defect based on class
 * probabilities, confidence margin, optional Pi metadata, and confirmed defects.
 */
export function buildWhySummary(scan){
  if(!scan)return {headline:'',detail:'',factors:[]};
  const g=normGrade(scan.x||scan.g);
  const c=typeof scan.c==='number'?scan.c:0.85;
  const pct=Math.round(c*100);
  const rem=Math.max(0,1-c);
  const probs=scan.p||{
    'Extra Class':g==='Extra Class'?c:rem/3,
    'Class I':g==='Class I'?c:rem/3,
    'Class II':g==='Class II'?c:rem/3,
    'Defect':g==='Defect'?c:rem/3,
  };
  const sorted=GRADES
    .map(k=>({k,v:probs[k]||0}))
    .sort((a,b)=>b.v-a.v);
  const top=sorted[0];
  const runner=sorted[1];
  const margin=Math.round((top.v-runner.v)*100);
  const defects=(scan.defects||[]).map(defectById).filter(Boolean);

  const factors=[];

  if(scan.reason){
    factors.push(scan.reason);
  }

  if(typeof scan.defectRate==='number'&&scan.total){
    factors.push(
      `Batch inspection counted ${scan.normal??0} good and ${scan.defect??0} defective kernels out of ${scan.total} (${scan.defectRate.toFixed(1)}% defect rate).`
    );
  }

  if(g==='Extra Class'){
    factors.push(`Matched Extra Class at ${pct}% confidence with clean, plump, uniform kernel features.`);
    if(runner.v>=0.12){
      factors.push(`A small ${Math.round(runner.v*100)}% overlap with ${runner.k} suggests very slight size or tone variation.`);
    }
  }else if(g==='Class I'){
    factors.push(`Classified as Class I at ${pct}% confidence — strong whole-kernel quality with minor surface variation.`);
    if(runner.k==='Extra Class'&&runner.v>=0.12){
      factors.push(`${Math.round(runner.v*100)}% of the visual score leaned toward Extra Class — very close to top-tier quality.`);
    }else if(runner.v>=0.12){
      factors.push(`${Math.round(runner.v*100)}% of the signal overlapped with ${runner.k}, pointing to light scuffs or uneven shape.`);
    }
  }else if(g==='Class II'){
    factors.push(`Classified as Class II at ${pct}% confidence — moderate visual imperfections (such as splits, shriveling, or light staining) kept it below Class I.`);
    if(runner.k==='Defect'&&runner.v>=0.12){
      factors.push(`${Math.round(runner.v*100)}% of the signal leaned toward Defect — inspect closely and remove visibly damaged kernels.`);
    }else if(runner.v>=0.12){
      factors.push(`${Math.round(runner.v*100)}% of the signal leaned toward ${runner.k} — light hand-sorting can improve this lot.`);
    }
  }else{
    factors.push(`Classified as Defect at ${pct}% confidence due to strong defect signatures (darkening, mold-like patches, insect holes, or heavy damage).`);
    if(runner.v>=0.12){
      factors.push(`Secondary signal (${Math.round(runner.v*100)}%) overlapped with ${runner.k}, so manual verification is advised.`);
    }
  }

  if(margin<22||c<0.75){
    factors.push(`Tight ${margin}% margin between ${top.k} and ${runner.k} — flagged for human review.`);
  }

  if(defects.length){
    const names=defects.map(d=>d.name).join(', ');
    factors.push(`Confirmed tray defects: ${names}. Follow the defect remediation steps before packing or selling.`);
  }

  const headline=
    g==='Extra Class'
      ? 'Clean, uniform premium kernel profile'
      : g==='Class I'
        ? 'Good whole-kernel profile with minor blemishes'
        : g==='Class II'
          ? (defects.length
              ? `Class II traits with ${defects.map(d=>d.name.toLowerCase()).join(' & ')}`
              : 'Moderate surface, split, or size variation detected')
          : (defects.length
              ? `Defect flagged due to ${defects.map(d=>d.name.toLowerCase()).join(' & ')}`
              : 'Strong defect indicators detected');

  return {
    headline,
    detail:factors[0]||'',
    factors,
  };
}

export const SEED=[
  {id:'seed-1',g:'Extra Class',c:.93,d:0,tm:'9:42',p:{'Extra Class':.93,'Class I':.05,'Class II':.01,'Defect':.01}},
  {id:'seed-2',g:'Class I',c:.88,d:0,tm:'9:40',p:{'Extra Class':.08,'Class I':.88,'Class II':.03,'Defect':.01}},
  {id:'seed-3',g:'Class II',c:.84,d:0,tm:'9:37',p:{'Extra Class':.02,'Class I':.10,'Class II':.84,'Defect':.04},defects:['damaged']},
  {id:'seed-4',g:'Defect',c:.71,d:1,tm:'4:10',r:1,p:{'Extra Class':.02,'Class I':.05,'Class II':.22,'Defect':.71},defects:['moldy','discolored']},
  {id:'seed-5',g:'Class II',c:.82,d:1,tm:'2:25',p:{'Extra Class':.03,'Class I':.11,'Class II':.82,'Defect':.04},defects:['shriveled']},
  {id:'seed-6',g:'Extra Class',c:.95,d:1,tm:'11:02',p:{'Extra Class':.95,'Class I':.04,'Class II':.01,'Defect':.00}},
  {id:'seed-7',g:'Defect',c:.88,d:2,tm:'Mon',p:{'Extra Class':.01,'Class I':.03,'Class II':.08,'Defect':.88},defects:['insect']},
];
