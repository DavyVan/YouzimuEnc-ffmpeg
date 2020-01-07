'use strict';

const {app, BrowserWindow} = require('electron');
const child_process = require('child_process');

var mainWin = null;

app.on('ready', function () {
    mainWin = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        },
        title: '柚子木编码工具'
    });
    mainWin.setMenu(null);
    mainWin.loadURL('file://' + __dirname + '/app/main.html');
    mainWin.webContents.openDevTools({mode: 'detach'});

    // will move to init.html
    let child = child_process.execFile('cpputils/gpuquery.exe', {windowsHide: true});
    child.stdout.on('data', (chunk)=>{
        console.log('Hey!' + chunk);
    });
});