'use strict';

const {ipcRenderer, remote} = require('electron');
const {dialog} = remote;
const path = require('path');

var containerEl = document.querySelector('body');
var chooseVideoInputButtonEl = document.getElementById('choose-video-input');
var videoInputFilenameEl = document.getElementById('video-input-filename');
var progressTextEl = document.getElementById('progress-text');

var videoInputFilename = null;

// Display GPU infomation and ffmpeg/ffprobe version
ipcRenderer.on('gpuinfo', (event, display_str, ffmpeg_version_str, ffprobe_version_str)=>{
    document.getElementById('display-div').innerHTML = `${display_str} | ${ffmpeg_version_str} | ${ffprobe_version_str}`;
});

// Choose video input file button
chooseVideoInputButtonEl.addEventListener('click', ()=>{
    let filename = dialog.showOpenDialogSync(remote.getCurrentWindow(), {
        title: '选择需要压制的视频文件',
        buttonLabel: '选择',
        filters: [{name: '支持的视频格式', extensions: ['mp4']}],
        properties: ['openFile']
    });
    
    if (filename !== undefined) {
        videoInputFilenameEl.setAttribute('value', filename);
        // submitButtonEl.removeAttribute('disabled');
        videoInputFilename = filename;
        console.log(filename);
    } else {
        console.log("User cancelled video input file selection.");
    }
});

function progressTextAlert(msg) {
    progressTextEl.innerHTML = msg;
    progressTextEl.classList.add('animated', 'flash', 'text-danger');
    progressTextEl.addEventListener('animationend', (event)=>{
        progressTextEl.classList.remove('animated', 'flash');
    });
}
function progressTextAlertClear() {
    progressTextEl.innerHTML = '';
    progressTextEl.classList.remove('text-danger');
}

// Choose video input file, dragndrop
containerEl.ondragover = () => {
    return false;
};

containerEl.ondragleave = () => {
    return false;
};

containerEl.ondragend = () => {
    return false;
};
containerEl.ondrop = (event)=>{
    event.preventDefault();

    let filepath = event.dataTransfer.files[0].path;
    let filenum = event.dataTransfer.files.length;

    // if drag multiple files
    if (filenum > 1) {
        progressTextEl.setAttribute('value', '只能拖放一个文件到这里');
        return;
    };

    // if the file format is not supported
    if (path.extname(filepath).toLowerCase().substring(1) != 'mp4') {
        progressTextAlert('格式不支持');
        
        return;
    };
    progressTextAlertClear();
    videoInputFilename = filepath;
    videoInputFilenameEl.setAttribute('value', filepath);
};