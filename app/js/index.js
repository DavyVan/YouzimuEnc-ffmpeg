'use strict';

const {ipcRenderer} = require('electron');

ipcRenderer.on('gpuinfo', (event, str)=>{
    document.getElementById('gpuinfo').innerHTML = str;
});