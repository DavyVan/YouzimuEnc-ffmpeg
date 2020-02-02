'use strict';

const process = require('process');

function getFFMPEG() {
    let os = process.platform;

    if (os == 'darwin') {   // macOS
        return 'bin/ffmpeg';
    } else if (os == 'win32') {
        return 'bin/ffmpeg.exe'
    }
}

function getFFPROBE() {
    let os = process.platform;

    if (os == 'darwin') {   // macOS
        return 'bin/ffprobe';
    } else if (os == 'win32') {
        return 'bin/ffprobe.exe'
    }
}

module.exports = {
    getFFMPEG: getFFMPEG,
    getFFPROBE: getFFPROBE
};