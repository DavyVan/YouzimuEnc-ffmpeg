'use strict';

const {app, BrowserWindow, ipcMain, webContents} = require('electron');
const child_process = require('child_process');

var mainWin = null;
var cmdModWin = null;

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

    ipcMain.on('init', (event, display_str, ffmpeg_version_str, ffprobe_version_str)=>{
        mainWin.webContents.loadURL('file://' + __dirname + '/app/index.html');
        mainWin.webContents.on('did-finish-load', ()=>{
            mainWin.webContents.send('gpuinfo', display_str, ffmpeg_version_str, ffprobe_version_str);
        });
    });

    ipcMain.on('open-cmd-mod', (event, command)=>{
        cmdModWin = new BrowserWindow({
            width: 780,
            height: 460,
            resizable: false,
            parent: mainWin,
            modal: true,
            webPreferences: {
                nodeIntegration: true
            },
            title: '命令行编辑'
        });
        cmdModWin.setMenu(null);
        cmdModWin.loadURL('file://' + __dirname + '/app/cmd_mod.html');
        cmdModWin.webContents.openDevTools({mode: 'detach'});

        cmdModWin.webContents.on('did-finish-load', ()=>{
            cmdModWin.webContents.send('cmd', command);
        });
    });

    ipcMain.on('cmd-changed', (event, newCommand)=>{
        // close window
        cmdModWin.close();
        cmdModWin = null;

        // forward new command to mainWin
        mainWin.webContents.send('cmd-changed', newCommand);
    });
});