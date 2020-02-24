'use strict';

const process = require('process');
const path = require('path');
const app = require('electron').remote.app;

function getFFMPEG() {
    let os = process.platform;

    if (os == 'darwin') {   // macOS
        return path.resolve(app.getAppPath() + '/bin/ffmpeg');
    } else if (os == 'win32') {
        return path.resolve(app.getAppPath() + '/bin/ffmpeg.exe');
    }
}

function getFFPROBE() {
    let os = process.platform;

    if (os == 'darwin') {   // macOS
        return path.resolve(app.getAppPath() + '/bin/ffprobe');
    } else if (os == 'win32') {
        return path.resolve(app.getAppPath() + '/bin/ffprobe.exe');
    }
}

function escapeAssFilename(filename) {
    // level 1
    let t = filename;
    t = t.replace(/'|\\|:|,/g, '\\$&');
    // level 2
    t = t.replace(/'|\\|:|,/g, '\\$&');
    return t;
}

module.exports = {
    getFFMPEG: getFFMPEG,
    getFFPROBE: getFFPROBE,
    escapeAssFilename: escapeAssFilename
};