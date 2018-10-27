'use strict';

var config = require('../config');
var Mongoose = require('mongoose');
var logger = require('../logger');
const GridFsStorage = require('multer-gridfs-storage');
var multer = require('multer');
var gridfs = require('gridfs-stream');
// Connect to the database
// construct the database URI and encode username and password.
var dbURI = "mongodb://" +
	//encodeURIComponent(config.db.username) + ":" + 
	//encodeURIComponent(config.db.password) + "@" + 
	config.db.host + ":" +
	config.db.port + "/" +
	config.db.name;
Mongoose.connect(dbURI, { useNewUrlParser: true }, function (err, database) {
	console.log("mongo connected")

});

var gridFsStream = gridfs(dbURI, Mongoose.mongo);
var storage = new GridFsStorage({
	url: dbURI,
	file: (req, file) => {
		console.log('file store requested');
		if (file.mimetype === 'image/jpeg') {
			console.log(file);
			return {
				filename: file.originalname,
				bucketName: 'photos'
			};
		} else {
			return null;
		}
	}
});

var multerSingleUpload = multer({ //multer settings
	storage: storage
}).single('ionicfile');

// Throw an error if the connection fails
Mongoose.connection.on('error', function (err) {
	if (err) throw err;
});

// mpromise (mongoose's default promise library) is deprecated, 
// Plug-in your own promise library instead.
// Use native promises
Mongoose.Promise = global.Promise;

module.exports = {
	Mongoose, multerSingleUpload,gridFsStream,
	models: {
		user: require('./schemas/user.js'),
		room: require('./schemas/room.js')
	}
};