'use latest';

const SSH2Client = require('ssh2').Client;
const google = require('googleapis');
const dateFormat = require('dateformat');

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

	const ssh2Conn = new SSH2Client();
	ssh2Conn.on('ready', function() {
		console.log('SSH2Client :: ready');

		ssh2Conn.sftp(function(err, sftp) {
			if (err) throw err;

			const filePath = ctx.secrets.FTP_PATH;
			uploadFile(drive, oauth2Client, ctx.secrets.DRIVE_BACKUP_FOLDER_ID,
				getFileName(filePath, new Date()),
				sftp.createReadStream(filePath), function() {
					ssh2Conn.end();
				});
		});
	}).connect({
		host: ctx.secrets.FTP_HOST,
		port: ctx.secrets.FTP_PORT,
		username: ctx.secrets.FTP_USER,
		password: ctx.secrets.FTP_PASSWORD,
	});

	cb(null, { result: 'IN_PROCESS' });
};

function getFileName(filePath, date) {
	return (dateFormat(date, 'UTC:yyyymmddHHMMss') + '_' +
		filePath.substring(filePath.lastIndexOf('/') + 1));
}

function uploadFile(drive, auth, folderId, fileName, fileStream, callback) {
	var fileMetadata = {
		name: fileName,
		parents: [folderId]
	};
	var media = {
		//mimeType: 'text/plain',
		body: fileStream//'hello...'
	};
	drive.files.create({
		auth: auth,
		resource: fileMetadata,
		media: media,
		fields: 'id'
	}, function(err, file) {
		if (err) {
			throw err;
		} else {
			console.log('File Id: ', file.id);
			callback();
		}
	});
}
