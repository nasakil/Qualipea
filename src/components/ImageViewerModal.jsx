import React,{useState} from 'react';
import {View,Text,Pressable,Modal,Image,ScrollView,Dimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useApp} from '../AppContext';
import {sfx} from '../sound';

const {width:W,height:H}=Dimensions.get('window');

export default function ImageViewerModal(){
  const {zoomImg,setZoomImg}=useApp();
  const [zoomed,setZoomed]=useState(false);

  if(!zoomImg)return null;

  const closeViewer=()=>{
    setZoomed(false);
    setZoomImg(null);
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={closeViewer}>
      <View style={{flex:1,backgroundColor:'rgba(5,12,8,0.94)',justifyContent:'center',alignItems:'center'}}>
        <View style={{
          position:'absolute',
          top:54,
          left:20,
          right:20,
          zIndex:10,
          flexDirection:'row',
          justifyContent:'space-between',
          alignItems:'center',
        }}>
          <Text style={{color:'#cfe3d6',fontSize:13,fontFamily:'OpenRunde-Bold'}}>
            {zoomed?'Tap photo to reset zoom':'Tap photo to zoom in'}
          </Text>
          <Pressable
            onPress={()=>{sfx('tap');closeViewer()}}
            style={{
              width:42,
              height:42,
              borderRadius:21,
              backgroundColor:'rgba(255,255,255,0.14)',
              alignItems:'center',
              justifyContent:'center',
            }}
          >
            <Ionicons name="close" size={24} color="#fff"/>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={{alignItems:'center',justifyContent:'center',minWidth:W,minHeight:H*0.72}}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            onPress={()=>{sfx('tap');setZoomed(z=>!z)}}
            style={{alignItems:'center',justifyContent:'center'}}
          >
            <Image
              source={{uri:zoomImg}}
              style={{
                width:zoomed?W*1.85:W*0.92,
                height:zoomed?H*0.82:W*0.92,
                borderRadius:zoomed?12:24,
              }}
              resizeMode="contain"
            />
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
