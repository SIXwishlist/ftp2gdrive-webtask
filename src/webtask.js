'use latest';

const SSH2Client = require('ssh2').Client;
const google = require('googleapis');
const dateFormat = require('dateformat');

module.exports = function (ctx, cb) {
	const OAuth2 = google.auth.OAuth2;

	const oauth2Client = new OAuth2(
		ctx.secrets.GOOGLE_CLIENT_ID,
		ctx.secrets.GOOGLE_CLIENT_SECRET
	);

	oauth2Client.setCredentials({
		//access_token: '',
		refresh_token: ctx.secrets.GOOGLE_REFRESH_TOKEN
	});

	const drive = google.drive({ version: 'v3', auth: oauth2Client });

	const ssh2Conn = new SSH2Client();
	ssh2Conn.on('ready', function () {
		console.log('SSH2Client :: ready');

		ssh2Conn.sftp(function (err, sftp) {
			if (err) throw err;

			const filePath = ctx.secrets.FTP_PATH;
			uploadFile(drive, ctx.secrets.DRIVE_BACKUP_FOLDER_ID,
				getFileName(filePath, new Date()),
				sftp.createReadStream(filePath),
				function () {
					ssh2Conn.end();
					listLastFiles(drive, ctx.secrets.DRIVE_BACKUP_FOLDER_ID,
						function (files) {
							// files.forEach(function (file) {
							// 	console.log('Found file: ', file.id, file.name, file.md5Checksum);
							// });

							if ((files.length >= 2) && (files[0].md5Checksum === files[1].md5Checksum)) {
								deleteFile(drive, files[1].id);
							}
						});
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

function uploadFile(drive, folderId, fileName, fileStream, callback) {
	var fileMetadata = {
		name: fileName,
		parents: [folderId]
	};
	var media = {
		//mimeType: 'text/plain',
		body: fileStream//'hello...'
	};
	drive.files.create({
		resource: fileMetadata,
		media: media,
		fields: 'id'
	}, function (err, file) {
		if (err) {
			throw err;
		} else {
			console.log('New file Id: ', file.id);
			callback();
		}
	});
}

function listLastFiles(drive, folderId, callback) {
	drive.files.list({
		q: "'" + folderId + "' in parents and not trashed",
		fields: 'files(id, name, md5Checksum)',
		spaces: 'drive',
		orderBy: 'name desc',
		pageSize: 2
	}, function (err, res) {
		if (err) {
			throw err;
		} else {
			callback(res.files);
		}
	});
}

function deleteFile(drive, fileId) {
	drive.files.update({
		fileId: fileId,
		resource: { 'trashed': true }
	}, function (err, res) {
		if (err) {
			throw err;
		} else {
			console.log('Deleted file with id ' + res.id);
		}
	});
}
