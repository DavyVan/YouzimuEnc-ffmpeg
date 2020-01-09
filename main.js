'use strict';

const {app, BrowserWindow, ipcMain, webContents} = require('electron');
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
    mainWin.loadURL('file://' + __dirname + '/app/init.html');
    mainWin.webContents.openDevTools({mode: 'detach'});

    ipcMain.on('init', (event, str)=>{
        mainWin.webContents.loadURL('file://' + __dirname + '/app/index.html');
        mainWin.webContents.on('did-finish-load', ()=>{
            mainWin.webContents.send('gpuinfo', str);
        });
    });
});