var Client = require('ssh2').Client;
var defaultConfig = require('./config/default.config.json')


var conn = new Client();
conn.on('ready', function() {
  console.log('Client :: ready');
  conn.sftp(function(err, sftp) {
    if (err) throw err;
    sftp.readdir(defaultConfig.secret.path, function(err, list) {
      if (err) throw err;
      console.dir(list);
      conn.end();
    });
  });
}).connect({
  host: defaultConfig.secret.host,
  port: defaultConfig.secret.port,
  username: defaultConfig.secret.username,
  password: defaultConfig.secret.password,
});
