'use strict';
const process = require('process');
const child_process = require('child_process');
const {ipcRenderer, remote} = require('electron');
const utils = require('./js/utils.js');

// Check the OS
var os = process.platform;      // darwin or win32
var display_str = '';
var ffmpeg_version_str = '';
var ffprobe_version_str = '';
var stdout;

if (os === 'darwin') {
    display_str = 'macOS不支持GPU加速，仅使用CPU编码';
} else if (os === 'win32') {   // Only check nvidia gpu on Windows
    
    try {
        stdout = child_process.execFileSync(remote.app.getAppPath() + '/cpputils/gpuquery.exe', { windowsHide: true });
    } catch (error) {
        document.getElementById('text').innerHTML = `检测硬件时错误<br>错误代码：${error.code}<br>错误信息：${error.message}`;
        throw error;    // To terminate the script execution
    }
    let result = JSON.parse(stdout);    // {"devCount":int, "devices":[{"name":string}]}
    let devCount = result.devCount;

    if (devCount === 0) {
        display_str = '未检测到NVIDIA显卡，GPU加速不可用，仅使用CPU编码';
    } else {
        let devName = result.devices[0].name;
        display_str = `GPU加速已启用 | ${devCount} GPU(s) | 编码GPU：#0 ${devName}`;
    }
}

try {
    stdout = child_process.execFileSync(utils.getFFMPEG(), ['-version'], {windowsHide: true});
} catch (error) {
    document.getElementById('text').innerHTML = `检测 ffmpeg 时错误<br>错误代码：${error.code}<br>错误信息：${error.message}`;
    throw error;    // To terminate the script execution
}
let _t = stdout.toString().split(' ');
ffmpeg_version_str = `${_t[0]} ${_t[1]} ${_t[2]}`;

try {
    stdout = child_process.execFileSync(utils.getFFPROBE(), ['-version'], {windowsHide: true});
} catch (error) {
    document.getElementById('text').innerHTML = `检测 ffprobe 时错误<br>错误代码：${error.code}<br>错误信息：${error.message}`;
    throw error;    // To terminate the script execution
}
_t = stdout.toString().split(' ');
ffprobe_version_str = `${_t[0]} ${_t[1]} ${_t[2]}`;

console.log(display_str, ffmpeg_version_str, ffprobe_version_str);


ipcRenderer.send('init', display_str, ffmpeg_version_str, ffprobe_version_str);