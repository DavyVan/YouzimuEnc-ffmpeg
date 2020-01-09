'use strict';
const process = require('process');
const child_process = require('child_process');
const {ipcRenderer} = require('electron');

// Check the OS
var os = process.platform;      // darwin or win32
var display_str = '';

if (os === 'darwin') {
    display_str = 'macOS不支持GPU加速，仅使用CPU编码';
} else if (os === 'win32') {   // Only check nvidia gpu on Windows
    let stdout;
    try {
        stdout = child_process.execFileSync('cpputils/gpuquery.exe', { windowsHide: true });
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

if (display_str !== '') {
    ipcRenderer.send('init', display_str);
}
