'use strict';

const {ipcRenderer, remote} = require('electron');
const {dialog} = remote;
const path = require('path');
const child_process = require('child_process');
const utils = require('./js/utils.js');

var containerEl = document.querySelector('body');
var chooseVideoInputButtonEl = document.getElementById('choose-video-input');
var videoInputFilenameEl = document.getElementById('video-input-filename');
var chooseAssInputButtonEl = document.getElementById('choose-ass-input');
var assInputFilenameEl = document.getElementById('ass-input-filename');
var progressTextEl = document.getElementById('progress-text');
var videoOutputFilenameEl = document.getElementById('output-filename');

var inputVideoFPSEl = document.getElementById('input-video-fps');
var inputVideoResEl = document.getElementById('input-video-res');
var inputVideoDurationEl = document.getElementById('input-video-duration');
var outputVideoFPSEl = document.getElementById('output-video-fps');
var outputVideoResEl = document.getElementById('output-video-res');
var outputVideoDurationEl = document.getElementById('output-video-duration');

var videoInputFilename = null;
var videoOutputFilename = null;
var assInputFilename = null;

// media info
var width = 0;
var height = 0;
var fps = 0.0;
var duration = {m: 0, s: 0};

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
    })[0];
    
    if (filename !== undefined) {
        videoInputSelected(filename);
        // console.log(filename);
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

function videoInputSelected(filepath) {
    progressTextAlertClear();
    videoInputFilename = filepath;
    videoInputFilenameEl.setAttribute('value', filepath);
    console.log(filepath);

    // Detect media info using ffprobe
    child_process.execFile(utils.getFFPROBE(), ['-print_format', 'json', '-v', 'quiet', '-show_streams', '-i', videoInputFilename], {windowsHide: true}, (error, stdout, stderr)=>{
        let resultJSON = JSON.parse(stdout);
        let vStream = resultJSON.streams[0];
        width = vStream.width;
        height = vStream.height;
        fps = eval(vStream.avg_frame_rate).toFixed(3);
        duration.m = Math.floor(parseFloat(vStream.duration) / 60);
        duration.s = Math.round(parseFloat(vStream.duration) - duration.m * 60);

        // display
        inputVideoFPSEl.innerHTML = fps;
        inputVideoResEl.innerHTML = `${width}x${height}`;
        inputVideoDurationEl.innerHTML = `${duration.m}m${duration.s}s`;
        outputVideoFPSEl.innerHTML = fps;
        outputVideoResEl.innerHTML = `${width}x${height}`;
        outputVideoDurationEl.innerHTML = `${duration.m}m${duration.s}s`;
    });

    // Set output path
    let pathObj = path.parse(videoInputFilename);
    pathObj.name = `${pathObj.name}_output`;
    delete pathObj.base;    // path.format() will ignore name and ext if base exists.
    videoOutputFilename = path.format(pathObj);
    videoOutputFilenameEl.setAttribute('value', videoOutputFilename);
}

function assInputSelected(filepath) {
    progressTextAlertClear();
    assInputFilename = filepath;
    assInputFilenameEl.setAttribute('value', filepath);
    // TODO: detect ass info; display, compare (consider the selection order)
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

    // let filepath = event.dataTransfer.files[0].path;
    let filenum = event.dataTransfer.files.length;

    // if drag multiple files
    if (filenum > 2) {
        progressTextAlert('最多拖放两个文件，一个MP4视频文件，一个ASS字幕文件');
        return;
    };

    // if only one file:
    // ASS or MP4 only
    if (filenum == 1) {
        let filepath = event.dataTransfer.files[0].path;
        let fileext = path.extname(filepath).toLowerCase().substring(1);    // substring() to skip the leading dot in (e.g.)".mp4"

        if (fileext == 'mp4') {
            videoInputSelected(filepath);
            return;
        } else if (fileext == 'ass') {
            assInputSelected(filepath);
            return;
        } else {    // unsupported file format
            progressTextAlert('格式不支持，只接受MP4或者ASS文件');
            return;
        }
    }

    /**
     * If drag two files:
     * Only accept 1 mp4 + 1 ass
     */
    if (filenum == 2) {
        let filepath1 = event.dataTransfer.files[0].path;
        let filepath2 = event.dataTransfer.files[1].path;
        let fileext1 = path.extname(filepath1).toLowerCase().substring(1);
        let fileext2 = path.extname(filepath2).toLowerCase().substring(1);

        // check format
        if ((fileext1 == 'mp4' && fileext2 == 'ass') || (fileext1 == 'ass' && fileext2 == 'mp4')) {
            if (fileext1 == 'mp4') {
                videoInputSelected(filepath1);
                assInputSelected(filepath2);
            } else {
                videoInputSelected(filepath2);
                assInputSelected(filepath1);
            }
        } else {    // all other cases are error
            progressTextAlert('只可以是一个MP4视频文件，一个ASS字幕文件');
            return;
        }
    }
    
};