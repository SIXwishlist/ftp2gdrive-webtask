const fs = require('fs');
const ini = require('ini');
const ftp2gdrive = require('./src/webtask');

const secrets = ini.parse(fs.readFileSync('./config/secrets.txt', 'utf-8'));

ftp2gdrive({secrets: secrets}, function() {});
