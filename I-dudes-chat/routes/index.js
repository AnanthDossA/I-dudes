'use strict';

var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');
var User = require('../models/user');
var Room = require('../models/room');
var config = require('../config');
var swaggerJSDoc = require('swagger-jsdoc');
var roomModel = require('../database').models.room;
var multerSingleUpload =  require('../database').multerSingleUpload;
var gridFsStream = require('../database').gridFsStream;

router.get('/', function (req, res, next) {
	console.log('entered route');
	// If user is already logged in, then redirect to rooms page
	res.json({ success: true });
});


// swagger definition
var swaggerDefinition = {
	info: {
		title: 'Node Swagger API',
		version: '1.0.0',
		description: 'Demonstrating how to describe a RESTful API with Swagger',
	},
	host: 'localhost:3000',
	basePath: '/',
};
// options for the swagger docs
var options = {
	// import swaggerDefinitions
	swaggerDefinition: swaggerDefinition,
	// path to the API docs
	apis: ['./**/routes/*.js', 'routes.js'],// pass all in array 
};
// initialize swagger-jsdoc
var swaggerSpec = swaggerJSDoc(options);
// serve swagger 
router.get('/swagger.json', function (req, res) { res.setHeader('Content-Type', 'application/json'); res.send(swaggerSpec); });

/**
 * @swagger
 * definition:
 *   login:
 *     properties:
 *       success:
 *         type: boolean
 *       token:
 *         type: string
 *       age:
 *         type: integer
 *       sex:
 *         type: string
 */

/**
* @swagger
* /login:
*   post:
*     tags:
*       - login
*     description: Return Login status
*     produces:
*       - application/json
*     responses:
*       200:
*         description: Return Login response
*         schema:
*           $ref: '#/definitions/login'
*/

router.post('/login', function (req, res) {
	console.log('entered login');
	User.findOne({
		username: req.body.username
	}, function (err, user) {
		if (err) throw err;
		if (!user) {
			res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
		} else {
			// check if password matches
			user.validatePassword(req.body.password, function (err, isMatch) {
				if (isMatch && !err) {
					// if user is found and password is right create a token
					var token = jwt.sign({ 'username': user.username, '_id': user._id }, config.sessionSecret);
					// return the information including token as JSON
					User.findByIdAndUpdate(user._id, { 'token': token }, function (err, updatedUser) {
						if (updatedUser)
							res.json({ success: true, token: token });
					});
				} else {
					res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
				}
			});
		}
	});
});

// Register via username and password
router.post('/signup', function (req, res, next) {
	var credentials = { 'username': req.body.name, 'password': req.body.password };
	if (credentials.name === '' || credentials.password === '') {
		res.send({ 'message': 'Missing Credentials', 'success': false });
		// req.flash('error', 'Missing credentials');
		// req.flash('showRegisterForm', true);
		// res.redirect('/');
	} else {

		// Check if the username already exists for non-social account
		User.findOne({ 'username': new RegExp('^' + req.body.name + '$', 'i'), 'socialId': null }, function (err, user) {
			if (err) throw err;
			if (user) {
				res.send({ 'message': 'Username already exists', 'success': false });
				// req.flash('error', 'Username already exists.');
				// req.flash('showRegisterForm', true);
				// res.redirect('/');
			} else {
				User.create(credentials, function (err, newUser) {
					if (err) throw err;
					res.send({ 'message': 'Your account has been created', 'success': true })
					// req.flash('success', 'Your account has been created. Please log in.');
					// res.redirect('/');
				});
			}
		});
	}
});

// Social Authentication routes
// 1. Login via Facebook
router.get('/auth/facebook', passport.authenticate('facebook'));
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
	successRedirect: '/rooms',
	failureRedirect: '/',
	failureFlash: true
}));

// 2. Login via Twitter
router.get('/auth/twitter', passport.authenticate('twitter'));
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
	successRedirect: '/rooms',
	failureRedirect: '/',
	failureFlash: true
}));

// Rooms
router.get('/rooms', passport.authenticate('jwt', { session: false }), [function (req, res, next) {
	console.log('entered  rooms api');
	Room.find({}, function (err, rooms) {
		console.log(rooms);
		if (err) throw err;
		res.send(rooms);
	});
}]);
router.post('/room-detail', passport.authenticate('jwt', { session: false }), [function (req, res, next) {
	Room.findById(req.body.roomId, function (err, roomDetail) {
		if (err) throw err;
		if (roomDetail) {
			res.send({
				'data': {
					'name': roomDetail.title,
					'users': roomDetail.connections,
					'planItems': roomDetail.itemsList,
					'chatHistory': roomDetail.chatBox
				}, 'success': true
			});
		}
		else {
			res.send(null);
		}

	});
}]);

// Create Room
router.post('/create-room', passport.authenticate('jwt', { session: false }), [function (req, res, next) {
	console.log('Create room api');
	Room.findOne({ 'title': new RegExp('^' + req.body.name + '$', 'i') }, function (err, room) {
		if (err) throw err;
		if (room) {
			res.json({ success: false, message: 'Room Already Exists' });
		} else {
			console.log('Room create');
			Room.create({
				title: req.body.name,
				about: req.body.about
			}, function (err, newRoom) {
				if (err) throw err;
				res.json({ success: true, message: 'Room Created Successfully' });
			});
		}
	});
}]);

// Create Room
router.post('/create-new-item', passport.authenticate('jwt', { session: false }), [function (req, res, next) {
	console.log('Create sub-room api');
	Room.findByIdAndUpdate(
		req.body.roomId,
		{
			$push: { itemsList: { 'name': req.body.name } }
		}, function (err, newRoom) {
			console.log(err);
			if (err) throw err;
			res.json({ success: true, message: 'New Item Created Successfully' });
		});
}]);


// Create Room
router.post('/create-attachment', passport.authenticate('jwt', { session: false }), [function (req, res, next) {
	console.log('Create attachment');
	console.log(req.body.roomId + "   " + req.body.name + "   " + req.body.attachment);
	roomModel.update({
		_id: req.body.roomId,
		'itemsList.name': req.body.name
	}, { $push: { 'itemsList.$.attachmentsList': { attachmentType: 'string', attachment: req.body.attachment, vote: 0, by: '5b592e8efbd13b1004857f16' } } }, (err, result) => {
		console.log(err);
		if (err) throw err;
		console.log(result);
		res.json({ success: true, message: 'New Attachment Created Successfully' });
	});
}]);


// Chat Room 
router.get('/chat/:id', passport.authenticate('jwt', { session: false }), [function (req, res, next) {
	var roomId = req.params.id;
	Room.findById(roomId, function (err, room) {
		if (err) throw err;
		if (!room) {
			return next();
		}
		res.render('chatroom', { user: req.user, room: room });
	});
}]);

// Logout
router.get('/logout', passport.authenticate('jwt', { session: false }), function (req, res, next) {
	// remove the req.user property and clear the login session
	req.logout();
});

var getToken = function (headers) {
	if (headers && headers.authorization) {
		var parted = headers.authorization.split(' ');
		if (parted.length === 2) {
			return parted[1];
		} else {
			return null;
		}
	} else {
		return null;
	}
};

router.post('/upload', passport.authenticate('jwt', { session: false }), function (req, res, next) {
	console.log('Create attachment');
	multerSingleUpload(req, res, function (err) {
		if (err) {
			console.log('err');
			throw err;
		}
		roomModel.update({
			_id: req.headers.roomid,
			'itemsList.name': req.headers.name
		}, { $push: { 'itemsList.$.attachmentsList': { attachmentType: req.file.mimetype, attachment: req.file.buffer, attachmentUrl: req.file.destination, vote: 0, by: '5b592e8efbd13b1004857f16' } } }, (err, result) => {
			console.log(err);
			if (err) throw err;
			console.log(result);
			res.json({ success: true, message: 'New Attachment Created Successfully' });
		});
	});
});

router.get('/download', (req, res) => {
	// Check file exist on MongoDB
	
	var filename = 'retrieve';
	
	gridFsStream.collection('photos').exist({ filename: filename }, (err, file) => {
		if (err || !file) {
			res.status(404).send('File Not Found');
			return
		} 
		
		var readstream = gridFsStream.collection('photos').createReadStream({ filename: filename });
		readstream.pipe(res);            
	});
});	

module.exports = router;
