'use strict';

const utils = require('./utils');
const process = require('process');

function bitrateCmdGen(mode, targetRate, maxRate, crf) {
    if (mode == 0 || mode == 1) {
        // bitrate
        return `-b:v ${targetRate}M -maxrate ${maxRate}M`;
    } else if (mode == 2 || mode ==3) {
        // crf
        return `-crf ${crf}`;
    }
}

function cmdGen(videoIn, assIn, videoOut, mode, targetRate, maxRate, crf, preset) {
    let bitrateCmd = bitrateCmdGen(mode, targetRate, maxRate, crf);
    if (mode == 0 || mode == 2) {
        // 1 pass, bitrate or crf
        return `${utils.getFFMPEG()} -c:v h264_cuvid -i "${videoIn}" -c:v h264_nvenc -c:a copy -tune film -preset ${preset} ${bitrateCmd} -vf "subtitles=${utils.escapeAssFilename(assIn)}" "${videoOut}" -y -v quiet -stats`;
    } else if (mode == 1 || mode == 3) {
        // 2 pass, bitrate or crf
        // 1st pass
        let os = process.platform;
        let sink = '';
        if (os == 'darwin') {
            sink = '/dev/null';
        } else if (os == 'win32') {
            sink = 'NUL';
        }

        let pass1 = `${utils.getFFMPEG()} -c:v h264_cuvid -i "${videoIn}" -c:v h264_nvenc -an -tune film -preset ${preset} ${bitrateCmd} -vf "subtitles=${utils.escapeAssFilename(assIn)}" -f mp4 -y -v quiet -stats -pass 1 ${sink}`;
        let pass2 = `${utils.getFFMPEG()} -c:v h264_cuvid -i "${videoIn}" -c:v h264_nvenc -c:a copy -tune film -preset ${preset} ${bitrateCmd} -vf "subtitles=${utils.escapeAssFilename(assIn)}" "${videoOut}" -y -v quiet -stats -pass 2`;
        return pass1 + ' && ' + pass2;
    }
}

module.exports = {
    cmdGen: cmdGen
};