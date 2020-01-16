'use strict';

const {ipcRenderer, remote} = require('electron');
const {dialog} = remote;

var chooseVideoInputButtonEl = document.getElementById('choose-video-input');

// Display GPU infomation and ffmpeg/ffprobe version
ipcRenderer.on('gpuinfo', (event, display_str, ffmpeg_version_str, ffprobe_version_str)=>{
    document.getElementById('display-div').innerHTML = `${display_str} | ${ffmpeg_version_str} | ${ffprobe_version_str}`;
});

// // Choose file button
// chooseVideoInputButtonEl.addEventListener('click', ()=>{
//     filename = dialog.showOpenDialogSync(remote.getCurrentWindow(), {
//         title: '选择需要压制的视频文件',
//         buttonLabel: '选择',
//         filters: [{name: '支持的视频格式', extensions: ['mp4']}],
//         properties: ['openFile']
//     })[0];
//     console.log(filename);
//     if (filename !== undefined) {
//         filenameTextEl.setAttribute('placeholder', filename);
//         submitButtonEl.removeAttribute('disabled');
//     }
// });