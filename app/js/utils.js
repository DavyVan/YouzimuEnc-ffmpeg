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

function escapeAssFilename(filename) {
    // level 1
    let t = filename;
    t = t.replace(/'|\\|:/g, '\\$&');
    // level 2
    t = t.replace(/'|\\|:/g, '\\$&');
    return t;
}

module.exports = {
    getFFMPEG: getFFMPEG,
    getFFPROBE: getFFPROBE,
    escapeAssFilename: escapeAssFilename
};