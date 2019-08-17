"use strict";

// service worker registration - remove if you're not going to use it

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('serviceworker.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// place your code below

import Quagga from './quagga';

var last_result = [];
var counts = {};

function order_by_occurrence(arr) {
  counts = {};
  arr.forEach(function(value){
    if(!counts[value]) {
      counts[value]=0;
    }
    counts[value]++;
  });

  return Object.keys(counts).sort(function(curKey,nextKey) {
    return counts[curKey] < counts[nextKey];
  });
}

function loadQuagga() {
  Quagga.init({
    inputStream : {
      name : "Live",
      type : "LiveStream",
      target: document.querySelector('video')    // Or '#yourElement' (optional)
    },
    decoder : {
      readers : ["code_128_reader","ean_reader"]
    }
  }, function(err) {
      if (err) {
          console.log(err);
          return
      }
      console.log("Initialization finished. Ready to start");
      //Quagga.initialized = true;
      Quagga.start();
      input.value = "";
  });
  
  
  last_result = [];
  console.log(last_result);
  //if (Quagga.initialized == undefined) {
    Quagga.onDetected(function(result) {
      var last_code = result.codeResult.code;
      console.log("last_code: " + last_code);
      last_result.push(last_code);
      input.value = input.value +1;
      if (last_result.length>20){
        var code = order_by_occurrence(last_result)[0];
        Quagga.stop();
        stopVideoStream();
        console.log("final code: " + code);
        input.value = code;
      }
    });
  //}
}


const input = document.querySelector('.input--js');
const image = document.querySelector('.image--js');
const label = document.querySelector('.image__label--js');
const buttonLoad = document.querySelector('.buttonLoad--js');

function handleClickLoad(){
  if (input.value!=""){
    if (input.value == "lm") {
      image.src = "assets/img/logoLM.jpg"
      label.innerHTML = input.value;
    }
    else if (input.value == "piws") {
      image.src = "assets/img/logoPiws.jpg"
      label.innerHTML = input.value;
    }
    else {
      image.src = "assets/img/no-pictures.svg"
      label.innerHTML = "nie znaleziono rysunku";
    }
    input.value = "";
  }
}
buttonLoad.addEventListener('click',handleClickLoad);

console.log(navigator.mediaDevices);
console.log(navigator.mediaDevices.getUserMedia);
const constraints = {
  audio: false,
  video: true
};

//const video = document.querySelector('video');
//navigator.mediaDevices.getUserMedia(constraints).
//then((stream) => {video.srcObject = stream});
const buttonStartCamera = document.querySelector('.buttonStartCamera--js');
const buttonStopCamera = document.querySelector('.buttonStopCamera--js');
const buttonFlipCamera = document.querySelector('.buttonFlipCamera--js');

buttonStartCamera.addEventListener('click', function() {
  startVideoStream();
  loadQuagga();
  }
);

buttonStopCamera.addEventListener('click', function() {
  Quagga.stop();
  stopVideoStream();
  }
);

const video = document.querySelector('video');

// init video stream
let currentDeviceId;
function startVideoStream () {
    let config = {
        audio: false,
        video: {}
    };
    config.video = currentDeviceId ? {deviceId: currentDeviceId} : {facingMode: "environment"};
    stopVideoStream();
    navigator.mediaDevices.getUserMedia(config).then(function (stream) {
       video.srcObject = stream;
    }).catch(function (error) {
      alert(error.name + ": " + error.message);
    });
}

function stopVideoStream() {
    if (video.srcObject) {
        video.srcObject.getTracks()[0].stop();
    }
}

buttonFlipCamera.disabled = true;
//console.log("buttonFlipCamera " + navigator.mediaDevices.enumerateDevices());
navigator.mediaDevices.enumerateDevices()
.then(function(devices) {
  devices = devices.filter(function (device) {
      return device.kind === 'videoinput';
  });
  
  if (devices.length > 1) {
    buttonFlipCamera.disabled = false;
    currentDeviceId = devices[0].deviceId;
    buttonFlipCamera.addEventListener('click', function() {
      let targetDevice;
      for (let i = 0; i < devices.length; i++) {
        if (devices[i].deviceId === currentDeviceId) {
          targetDevice = (i + 1 < devices.length) ? devices[i+1] : devices[0];
          break;
        }
      }
      currentDeviceId = targetDevice.deviceId;
      startVideoStream();
    });
  }
});