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

var KatalogJson = require('.././assets/json/Test.json');

var Quagga = require("quagga");

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
      target: camera    // Or '#yourElement' (optional)
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
  //console.log(last_result);
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
const PdfObject = document.querySelector('.PDF__object--js');
const PdfEmbed = document.querySelector('.PDF__embed--js');
const label = document.querySelector('.image__label--js');
const buttonLoad = document.querySelector('.buttonLoad--js');
var path = "";

function handleClickLoad(){
  if (input.value!=""){
    if (KatalogJson.hasOwnProperty(input.value)){
        path = './assets/img/katalog/' + KatalogJson[input.value];
        //console.log("path: " + path);
        var extension = path.substring(path.length-3).toUpperCase();
        if (extension == "JPG"){
        try{
          PdfObject.style.display='none';
          image.src = path;
          image.style.display='block';
        }
        catch (err){console.log('no file: ' + path);}
        }
        else if (extension == "PDF"){
          image.style.display='none';
          PdfObject.data = path;
          PdfEmbed.src= path;
          PdfObject.style.display='block';
        }
        label.innerHTML = input.value +" (" + KatalogJson[input.value] + ")";
    }
    else {
      image.src = "assets/img/no-pictures.svg"
      label.innerHTML = "nie znaleziono rysunku";
    }
    input.value = "";
  }
}
buttonLoad.addEventListener('click',handleClickLoad);

//console.log(navigator.mediaDevices);
//console.log(navigator.mediaDevices.getUserMedia);

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

const camera = document.querySelector('.camera--js');

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
      camera.srcObject = stream;
      camera.style.display = 'block';
      buttonFlipCamera.style.display = "block";
      buttonStopCamera.style.display = "block";
      buttonStartCamera.style.display = "none";
    }).catch(function (error) {
      alert(error.name + ": " + error.message);
    });
    
}

function stopVideoStream() {
    camera.style.display = 'none';
    buttonFlipCamera.style.display = "none";
    buttonStopCamera.style.display = "none";
    buttonStartCamera.style.display = "block";
    if (camera.srcObject) {
        camera.srcObject.getTracks()[0].stop();
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