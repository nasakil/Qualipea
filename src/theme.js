import {createContext,useContext} from 'react';
import {Dimensions} from 'react-native';

export const W=Dimensions.get('window').width;
export const LT={bg:'#eef3ec',card:'#fff',ink:'#14261c',mute:'#667a6d',line:'#dbe3d6',g2:'#1f6a49'};
export const DK={bg:'#0d1711',card:'#152119',ink:'#eaf2ea',mute:'#8fa597',line:'#24372b',g2:'#2f8a5f'};
export const Th=createContext(LT),useT=()=>useContext(Th);
export const AnimCtx=createContext(true),useAnim=()=>useContext(AnimCtx);

export const GR='#123d2b',GOLD='#e3a63b';

export const GRADES=['Extra Class','Class I','Class II','Defect'];

export const GC={
  'Extra Class':'#1ea866',
  'Class I':'#2a9d8f',
  'Class II':'#d99a1c',
  'Defect':'#c2453d',
  A:'#1ea866',
  B:'#d99a1c',
  C:'#c2453d',
};

export const GS={
  'Extra Class':'EX',
  'Class I':'I',
  'Class II':'II',
  'Defect':'DF',
};

export const COL={
  'Extra Class':['#f4ca82','#be7d2e'],
  'Class I':['#ebc076','#b0712c'],
  'Class II':['#dba35e','#98602a'],
  'Defect':['#a8763f','#573619'],
};

export function normGrade(raw){
  if(GRADES.includes(raw))return raw;
  const s=String(raw||'').toUpperCase().trim();
  if(s==='A'||s.includes('EXTRA'))return 'Extra Class';
  if(s==='C1'||s.includes('CLASS I')&&!s.includes('CLASS II'))return 'Class I';
  if(s==='B'||s==='C2'||s.includes('CLASS II')||s.includes('CLASS 2'))return 'Class II';
  if(s==='C'||s==='DF'||s.includes('DEFECT')||s.includes('REJECT'))return 'Defect';
  return 'Class I';
}

export function fontForWeight(w){
  const s=String(w||'400').toLowerCase();
  if(s==='700'||s==='800'||s==='900'||s==='bold')return 'OpenRunde-Bold';
  if(s==='600')return 'OpenRunde-Semibold';
  if(s==='500')return 'OpenRunde-Medium';
  return 'OpenRunde-Regular';
}

export const pc=c=>Math.round((c||0)*100);
