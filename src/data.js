export const GN={
  A:['Grade A','Premium quality (Extra Class / Class I)'],
  B:['Grade B','Intermediate quality (Class II)'],
  C:['Grade C','Quality concern (Reject)'],
};

export const ADV={
  A:[
    'Sort apart from lower grades to preserve premium value',
    'Store cool and dry in a clean, sealed container',
    'Keep the scan record for batch and buyer notes',
  ],
  B:[
    'Inspect kernels that look split, uneven, or slightly stained',
    'Remove visible defects first to protect your selling price',
    'Decide with your buyer if the lot suits processing (peanut butter or oil)',
  ],
  C:[
    'Set these kernels aside immediately and keep away from good batches',
    'Ask a qualified assessor before use or sale — never sell or feed moldy kernels',
    'Re-sort the batch, remove defective kernels, and scan again',
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
    gradeHint:'C',
    icon:'warning-outline',
    color:'#c2453d',
    steps:[
      'Remove moldy kernels right away and keep them away from the good batch.',
      'Do not eat, sell or feed them to animals. Mold can produce aflatoxin, which cooking does not remove.',
      'Clean and dry the sorting area and containers, then re-dry the remaining batch before storing.',
    ],
  },
  {
    id:'damaged',
    name:'Broken / Damaged',
    summary:'Split, cracked or crushed kernel',
    lookFor:'Kernels that are split in half, cracked, chipped or crushed.',
    gradeHint:'B',
    icon:'cut-outline',
    color:'#d99a1c',
    steps:[
      'Separate broken and split kernels from the whole ones.',
      'Sell or use them separately (for example for peanut butter or oil) instead of mixing them into whole-kernel grades.',
      'Use them sooner. Broken kernels spoil faster in storage.',
    ],
  },
  {
    id:'discolored',
    name:'Discolored',
    summary:'Dark, brown or stained kernel',
    lookFor:'Dark brown or stained patches on the skin or kernel that are not part of the normal color.',
    gradeHint:'B',
    icon:'color-fill-outline',
    color:'#b8732a',
    steps:[
      'Set discolored kernels aside and check a few for a musty or rancid smell.',
      'If they smell musty or rancid, discard them.',
      'If they look and smell normal, sell them as a lower grade.',
    ],
  },
  {
    id:'shriveled',
    name:'Shriveled',
    summary:'Thin, wrinkled, undersized kernel',
    lookFor:'Kernels that are noticeably thin, wrinkled or smaller than the rest of the batch.',
    gradeHint:'B',
    icon:'contract-outline',
    color:'#c78a22',
    steps:[
      'Sieve or hand-sort to remove shriveled kernels.',
      'Sell them separately as a lower grade or use them for processing.',
      'Shriveling is often linked to early harvest or poor growing conditions, so note which field the batch came from.',
    ],
  },
  {
    id:'insect',
    name:'Insect-damaged',
    summary:'Small holes, tunnels or powdery dust',
    lookFor:'Tiny holes or tunnels in the kernel, sometimes with fine powdery dust (frass) around them.',
    gradeHint:'C',
    icon:'bug-outline',
    color:'#c2453d',
    steps:[
      'Isolate damaged kernels and check the rest of the batch for live insects.',
      'Clean the storage area and keep kernels in clean, sealed containers.',
      'Store in a cool, dry place and inspect the batch regularly.',
    ],
  },
];

export const defectById=id=>DEFECT_CATALOG.find(d=>d.id===id)||null;

export const REF_GUIDE=[
  {
    id:'A',
    title:'Grade A — Extra Class / Class I',
    badge:'Premium',
    grade:'A',
    summary:'Whole, uniform, clean kernels with natural tan skin and no visible mold or insect holes.',
    cues:[
      'Plump, intact shape with consistent size',
      'Even light-golden to tan seed coat',
      'Free from dark spots, cracks, or musty odor',
    ],
  },
  {
    id:'B',
    title:'Grade B — Class II (Intermediate)',
    badge:'Intermediate',
    grade:'B',
    summary:'Acceptable kernels showing mild surface blemishes, split halves, or uneven sizing.',
    cues:[
      'Minor skin discoloration or light staining',
      'Some split, chipped, or slightly shriveled kernels',
      'Suitable for processing or lower-tier lots after sorting',
    ],
  },
  {
    id:'C',
    title:'Grade C — Reject / Quality Concern',
    badge:'Reject',
    grade:'C',
    summary:'Kernels with severe defects such as mold growth, heavy darkening, or insect tunneling.',
    cues:[
      'Fuzzy green, gray, or black mold patches (aflatoxin risk)',
      'Deep insect holes, tunnels, or powdery frass',
      'Severely dark, rancid, or decayed kernels — set aside immediately',
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
  ['Ultralytics YOLO11-cls','3-class Spanish peanut kernel classification model'],
  ['OpenCV','Image preprocessing and frame capture'],
  ['Expo + React Native','Cross-platform mobile app with offline AsyncStorage persistence'],
];

/**
 * Generates a clear, human-readable explanation of WHY the classifier
 * assigned a given grade based on class probabilities, confidence margin,
 * optional Pi defect-rate metadata, and any user-confirmed defects.
 */
export function buildWhySummary(scan){
  if(!scan)return {headline:'',detail:'',factors:[]};
  const g=scan.x||scan.g||'B';
  const c=typeof scan.c==='number'?scan.c:0.85;
  const pct=Math.round(c*100);
  const probs=scan.p||{A:g==='A'?c:(1-c)*0.5,B:g==='B'?c:(1-c)*0.5,C:g==='C'?c:(1-c)*0.5};
  const sorted=['A','B','C']
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

  if(g==='A'){
    factors.push(`Model matched Grade A (Extra Class) at ${pct}% confidence with clean, uniform visual features.`);
    if(runner.v>=0.15){
      factors.push(`A small ${Math.round(runner.v*100)}% overlap with Grade ${runner.k} suggests slight size or tone variation.`);
    }
  }else if(g==='B'){
    factors.push(`Classified as Grade B (Class II) at ${pct}% confidence — showing intermediate visual traits rather than spotless Grade A.`);
    if(runner.k==='C'&&runner.v>=0.15){
      factors.push(`${Math.round(runner.v*100)}% of the signal leaned toward Grade C, indicating possible staining, splits, or shriveling.`);
    }else if(runner.k==='A'&&runner.v>=0.15){
      factors.push(`${Math.round(runner.v*100)}% of the signal leaned toward Grade A — light sorting may upgrade much of this lot.`);
    }
  }else{
    factors.push(`Classified as Grade C (Reject) at ${pct}% confidence due to strong defect signatures (darkening, mold-like texture, or structural damage).`);
    if(runner.v>=0.15){
      factors.push(`Secondary signal (${Math.round(runner.v*100)}%) overlapped with Grade ${runner.k}, so manual verification is advised.`);
    }
  }

  if(margin<25||c<0.75){
    factors.push(`Tight ${margin}% margin between Grade ${top.k} and Grade ${runner.k} — flagged for human review.`);
  }

  if(defects.length){
    const names=defects.map(d=>d.name).join(', ');
    factors.push(`Confirmed tray defects: ${names}. Follow the defect remediation steps before packing or selling.`);
  }

  const headline=
    g==='A'
      ? 'Clean, uniform kernel profile'
      : g==='B'
        ? (defects.length
            ? `Intermediate lot with ${defects.map(d=>d.name.toLowerCase()).join(' & ')} traits`
            : 'Moderate surface or shape variation detected')
        : (defects.length
            ? `Quality concern due to ${defects.map(d=>d.name.toLowerCase()).join(' & ')}`
            : 'Strong defect indicators detected');

  return {
    headline,
    detail:factors[0]||'',
    factors,
  };
}

export const SEED=[
  {id:'seed-1',g:'A',c:.93,d:0,tm:'9:42',p:{A:.93,B:.05,C:.02}},
  {id:'seed-2',g:'B',c:.87,d:0,tm:'9:40',p:{A:.08,B:.87,C:.05},defects:['damaged']},
  {id:'seed-3',g:'A',c:.91,d:0,tm:'9:37',p:{A:.91,B:.07,C:.02}},
  {id:'seed-4',g:'C',c:.71,d:1,tm:'4:10',r:1,p:{A:.06,B:.23,C:.71},defects:['moldy','discolored']},
  {id:'seed-5',g:'B',c:.82,d:1,tm:'2:25',p:{A:.12,B:.82,C:.06},defects:['shriveled']},
  {id:'seed-6',g:'A',c:.95,d:1,tm:'11:02',p:{A:.95,B:.04,C:.01}},
  {id:'seed-7',g:'C',c:.88,d:2,tm:'Mon',p:{A:.03,B:.09,C:.88},defects:['insect']},
];
