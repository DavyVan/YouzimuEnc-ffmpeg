'use strict';

const {ipcRenderer, remote} = require('electron');

var cmdTextareaEl = document.getElementById('cmd-textarea');
var saveButtonEl = document.getElementById('save-button');
var cancelButtonEl = document.getElementById('cancel-button');

var old = '';

// set initial value
ipcRenderer.on('cmd', (event, command)=>{
    cmdTextareaEl.innerHTML = command;
    old = command;
});

saveButtonEl.addEventListener('click', ()=>{
    // check if cmd has been modified
    if (old == cmdTextareaEl.value) {
        // if not modified, just close the window
        remote.getCurrentWindow().close();
    } else {
        // if modified
        ipcRenderer.send('cmd-changed', cmdTextareaEl.value);   // main will close the window instead
    }
});

cancelButtonEl.addEventListener('click', ()=>{
    remote.getCurrentWindow().close();
});