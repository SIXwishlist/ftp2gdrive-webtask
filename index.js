var fs = require('fs');
var ini = require('ini');
var ftp2gdrive = require('./src/webtask');

var secrets = ini.parse(fs.readFileSync('./config/secrets.txt', 'utf-8'));

ftp2gdrive({secrets: secrets}, function(){});
