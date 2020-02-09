'use strict';

const {ipcRenderer, remote} = require('electron');
const {dialog} = remote;
const path = require('path');
const child_process = require('child_process');
const ass_compiler = require('ass-compiler');
const fs = require('fs');

const utils = require('./js/utils.js');
const cmd = require('./js/cmd.js');

var containerEl = document.querySelector('body');

var chooseVideoInputButtonEl = document.getElementById('choose-video-input');
var videoInputFilenameEl = document.getElementById('video-input-filename');
var chooseAssInputButtonEl = document.getElementById('choose-ass-input');
var assInputFilenameEl = document.getElementById('ass-input-filename');
var videoOutputFilenameEl = document.getElementById('output-filename');
var chooseOutputButtonEl = document.getElementById('choose-output');

var inputVideoFPSEl = document.getElementById('input-video-fps');
var inputVideoResEl = document.getElementById('input-video-res');
var inputVideoDurationEl = document.getElementById('input-video-duration');
var outputVideoFPSEl = document.getElementById('output-video-fps');
var outputVideoResEl = document.getElementById('output-video-res');
var outputVideoDurationEl = document.getElementById('output-video-duration');

var inputAssInfoEl = document.getElementById('input-ass-info');
var inputAssResEl = document.getElementById('input-ass-res');

var bitrateModeSelectEl = document.getElementById('bitrate-mode-select');
var targetBitrateGroupEl = document.getElementById('target-bitrate-group');
var maxBitrateGroupEl = document.getElementById('max-bitrate-group');
var CRFGroupEl = document.getElementById('crf-group');
var targetBitrateInputEl = document.getElementById('target-bitrate-input');
var maxBitrateInputEl = document.getElementById('max-bitrate-input');
var CRFInputEl = document.getElementById('crf-input');
var presetSelectEl = document.getElementById('preset-select');

var progressTextEl = document.getElementById('progress-text');
var startButtonEl = document.getElementById('start-button');
var cmdModButtonEl = document.getElementById('cmd-mod-button');

var videoInputFilename = null;
var videoOutputFilename = null;
var assInputFilename = null;

// media info
var width = 0;
var height = 0;
var fps = 0.0;
var duration = {m: 0, s: 0};
// ass info
var assWidth = 0;
var assHeight = 0;

// flags
var userChosenOutputPath = false;

// cmd
var command = '';

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
        videoInputSelected(filename[0]);
        // console.log(filename);
    } else {
        console.log("User cancelled video input file selection.");
    }
});

chooseAssInputButtonEl.addEventListener('click', ()=>{
    let filename = dialog.showOpenDialogSync(remote.getCurrentWindow(), {
        title: '选择字幕文件',
        buttonLabel: '选择',
        filters: [{name: 'ASS字幕文件', extensions: ['ass']}],
        properties: ['openFile']
    });

    if (filename !== undefined) {
        assInputSelected(filename[0]);
    } else {
        console.log("User cancelled ass input file selection.");
    }
});

chooseOutputButtonEl.addEventListener('click', ()=>{
    let _default = undefined;
    if (videoInputFilename != null) {
        let pathObj = path.parse(videoInputFilename);
        pathObj.name = `${pathObj.name}_output`;
        delete pathObj.base;    // path.format() will ignore name and ext if base exists.
        _default = path.format(pathObj);
    }

    let filename = dialog.showSaveDialogSync(remote.getCurrentWindow(), {
        title: '选择输出位置',
        defaultPath: _default,
        filters: [{name: '输出格式', extensions: ['mp4']}],
        properties: ['createDirectory', 'showOverwriteConfirmation']
    });
    
    if (filename != undefined) {
        videoOutputFilename = filename;
        videoOutputFilenameEl.setAttribute('value', videoOutputFilename);
        userChosenOutputPath = true;

        // update cmd
        command = updateCmd();
    } else {
        console.log("User cancelled onput file selection.");
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

        // check resolution against subtitle
        checkRes();
    });

    // Set output path
    if (!userChosenOutputPath) {
        let pathObj = path.parse(videoInputFilename);
        pathObj.name = `${pathObj.name}_output`;
        delete pathObj.base;    // path.format() will ignore name and ext if base exists.
        videoOutputFilename = path.format(pathObj);
        videoOutputFilenameEl.setAttribute('value', videoOutputFilename);
    }

    // update cmd
    command = updateCmd();
}

function checkRes() {
    if (videoInputFilename != null && assInputFilename != null && 
        assWidth != 0 && width != 0 && assHeight != 0 && height != 0) {
        if ((assWidth != width) || (assHeight != height)) {
            console.log(assWidth, width, assHeight, height);
            inputAssResEl.innerHTML += '  字幕分辨率和视频不一致！';
            inputAssInfoEl.classList.add('text-danger');
        } else {
            inputAssResEl.innerHTML = `${assWidth}x${assHeight}`;
            inputAssInfoEl.classList.remove('text-danger');
            console.log('res checked');
        }
    }
}

function assInputSelected(filepath) {
    progressTextAlertClear();
    assInputFilename = filepath;
    assInputFilenameEl.setAttribute('value', filepath);
    console.log(filepath);

    // read video info from subtitle
    fs.readFile(assInputFilename, (error, data)=>{
        if (error) {
            console.log(error);
            return;
        }

        let parsedASS = ass_compiler.parse(data.toString());
        assWidth = parsedASS.info.PlayResX;
        assHeight = parsedASS.info.PlayResY;
        inputAssResEl.innerHTML = `${assWidth}x${assHeight}`;

        // check
        checkRes();
    });

    // update cmd
    command = updateCmd();
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

bitrateModeSelectEl.addEventListener('change', (event)=>{
    let v = event.target.value;
    if (v == 0 || v == 1) {
        // target bitrate mode
        targetBitrateGroupEl.removeAttribute('hidden');
        maxBitrateGroupEl.removeAttribute('hidden');
        CRFGroupEl.setAttribute('hidden', true);
    } else if (v == 2 || v == 3) {
        // CRF mode
        targetBitrateGroupEl.setAttribute('hidden', true);
        maxBitrateGroupEl.setAttribute('hidden', true);
        CRFGroupEl.removeAttribute('hidden');
    }

    // update cmd
    command = updateCmd();
});

targetBitrateInputEl.addEventListener('change', ()=>{
    // update cmd
    command = updateCmd();
});

maxBitrateInputEl.addEventListener('change', ()=>{
    // update cmd
    command = updateCmd();
});

CRFInputEl.addEventListener('change', ()=>{
    // update cmd
    command = updateCmd();
});

presetSelectEl.addEventListener('change', ()=>{
    // update cmd
    command = updateCmd();
});

cmdModButtonEl.addEventListener('click', ()=>{
    ipcRenderer.send('open-cmd-mod', command);
});

function updateCmd() {
    // verify parameters
    if (videoInputFilename == null || assInputFilename == null || videoOutputFilename == null) {
        startButtonEl.setAttribute('disabled', true);
        return '';
    }
    
    startButtonEl.removeAttribute('disabled');
    let ret = cmd.cmdGen(videoInputFilename, assInputFilename, videoOutputFilename, bitrateModeSelectEl.value,
        targetBitrateInputEl.value, maxBitrateInputEl.value, CRFInputEl.value, presetSelectEl.value);
    console.log(ret);
    return ret;
}

ipcRenderer.on('cmd-changed', (event, newCommand)=>{
    command = newCommand;
    console.log('modified cmd: ' + command);
    
    // disable all interactive elements
    chooseVideoInputButtonEl.setAttribute('disabled', true);
    chooseAssInputButtonEl.setAttribute('disabled', true);
    chooseOutputButtonEl.setAttribute('disabled', true);
    bitrateModeSelectEl.setAttribute('disabled', true);
    targetBitrateInputEl.setAttribute('disabled', true);
    maxBitrateInputEl.setAttribute('disabled', true);
    CRFInputEl.setAttribute('disabled', true);
    presetSelectEl.setAttribute('disabled', true);

    // change the cmd-mod-button
    cmdModButtonEl.innerHTML = '命令行已修改，无视所有设置'
    cmdModButtonEl.classList.remove('btn-outline-info');
    cmdModButtonEl.classList.add('btn-warning');

    // enable the start button
    startButtonEl.removeAttribute('disabled');
});