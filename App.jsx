import React from 'react';
import {AppProvider} from './src/AppContext';
import Navigator from './src/Navigator';

export default function App(){
  return <AppProvider><Navigator/></AppProvider>;
}
