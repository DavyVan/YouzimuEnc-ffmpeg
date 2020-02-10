'use strict';

const process = require('process');
const path = require('path');

function getFFMPEG() {
    let os = process.platform;

    if (os == 'darwin') {   // macOS
        return path.resolve('bin/ffmpeg');
    } else if (os == 'win32') {
        return path.resolve('bin/ffmpeg.exe');
    }
}

function getFFPROBE() {
    let os = process.platform;

    if (os == 'darwin') {   // macOS
        return path.resolve('bin/ffprobe');
    } else if (os == 'win32') {
        return path.resolve('bin/ffprobe.exe');
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