# ftp2gdrive-webtask

A webtask that reads a file from FTP and stores it to a folder in Google Drive.

## Install

* `npm install`


## Config

Fill fields in `secrets.txt`.


## Development

* `npm start`


## Deploy to webtask

* `npm run deploy`

You can also cron the webtask:

* `wt cron schedule --name ftp2gdrive-webtask --secrets-file config/secrets.txt "0 1,13 * * *" src/webtask.js`


## License

MIT License
