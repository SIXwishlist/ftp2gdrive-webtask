var Client = require('ssh2').Client;
var google = require('googleapis');

module.exports = function(ctx, cb) {
	var OAuth2 = google.auth.OAuth2;

	var oauth2Client = new OAuth2(
		ctx.secrets.GOOGLE_CLIENT_ID,
		ctx.secrets.GOOGLE_CLIENT_SECRET
	);

	oauth2Client.setCredentials({
		//access_token: '',
		refresh_token: ctx.secrets.GOOGLE_REFRESH_TOKEN
	});

	listFiles(oauth2Client);

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

function listFiles(auth) {
	var service = google.drive('v3');
	service.files.list({
		auth: auth,
		pageSize: 10,
		fields: 'nextPageToken, files(id, name)'
	}, function(err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
		var files = response.files;
		if (files.length === 0) {
			console.log('No files found.');
		} else {
			console.log('Files:');
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				console.log('%s (%s)', file.name, file.id);
			}
		}
	});
}
