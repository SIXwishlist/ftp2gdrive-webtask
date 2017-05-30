module.exports = function(ctx, cb) {

  var Client = require('ssh2').Client;

  var conn = new Client();
  conn.on('ready', function() {
    console.log('Client :: ready');
    conn.sftp(function(err, sftp) {
      if (err) throw err;
      sftp.readdir(ctx.secrets.FTP_PATH, function(err, list) {
        if (err) throw err;
        console.dir(list);
        conn.end();
      });
    });
  }).connect({
    host: ctx.secrets.FTP_HOST,
    port: ctx.secrets.FTP_PORT,
    username: ctx.secrets.FTP_USER,
    password: ctx.secrets.FTP_PASSWORD,
  });

  cb(null, { result: 'success' });
};