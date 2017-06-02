'use latest';

const SSH2Client = require('ssh2').Client;
const google = require('googleapis');

module.exports = function(ctx, cb) {
	const OAuth2 = google.auth.OAuth2;

	const oauth2Client = new OAuth2(
		ctx.secrets.GOOGLE_CLIENT_ID,
		ctx.secrets.GOOGLE_CLIENT_SECRET
	);

	oauth2Client.setCredentials({
		//access_token: '',
		refresh_token: ctx.secrets.GOOGLE_REFRESH_TOKEN
	});

	const drive = google.drive('v3');
	listFiles(drive, oauth2Client, ctx.secrets.DRIVE_BACKUP_FOLDER_ID);
	uploadFile(drive, oauth2Client, ctx.secrets.DRIVE_BACKUP_FOLDER_ID);

	const ssh2Conn = new SSH2Client();
	ssh2Conn.on('ready', function() {
		console.log('SSH2Client :: ready');

		ssh2Conn.sftp(function(err, sftp) {
			if (err) throw err;
			sftp.readdir(ctx.secrets.FTP_PATH, function(err, list) {
				if (err) throw err;
				console.dir(list);
				ssh2Conn.end();
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

function listFiles(drive, auth, folderId) {
	drive.files.list({
		auth: auth,
		q: "'" + folderId + "'" + ' in parents',
		pageSize: 10,
		fields: 'nextPageToken, files(id, name)'
	}, function(err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
		const files = response.files;
		if (files.length === 0) {
			console.log('No files found.');
		} else {
			console.log('Files:');
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				console.log('%s (%s)', file.name, file.id);
			}
		}
	});
}

function uploadFile(drive, auth, folderId) {
	var fileMetadata = {
		name: 'test.txt',
		parents: [folderId]
	};
	var media = {
		//mimeType: 'text/plain',
		body: 'hello...'
	};
	drive.files.create({
		auth: auth,
		resource: fileMetadata,
		media: media,
		fields: 'id'
	}, function(err, file) {
		if (err) {
			// Handle error
			console.log(err);
		} else {
			console.log('File Id: ', file.id);
		}
	});

}
