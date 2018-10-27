'use strict';

var config = require('../config');
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');

var Room = require('../models/room');
var User = require('../models/user');
var roomModel = require('../database').models.room;

/**
 * Encapsulates all code for emitting and listening to socket events
 *
 */
var ioEvents = function (io) {

	// // Rooms namespace
	// io.of('/rooms').on('connection', function(socket) {


	// });

	// Chatroom namespace
	io.of('/chatroom').on('connection', function (socket) {

		// Create a new room
		socket.on('createRoom', function (title) {
			Room.findOne({ 'title': new RegExp('^' + title + '$', 'i') }, function (err, room) {
				if (err) throw err;
				if (room) {
					socket.emit('updateRoomsList', { error: 'Room title already exists.' });
				} else {
					Room.create({
						title: title
					}, function (err, newRoom) {
						if (err) throw err;
						socket.emit('updateRoomsList', newRoom);
						socket.broadcast.emit('updateRoomsList', newRoom);
					});
				}
			});
		});
		// Join a chatroom
		socket.on('join', function (roomObj) {
			Room.findById(roomObj.roomId, function (err, room) {
				if (err) throw err;
				if (!room) {
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				} else {
					// Check if user exists in the session
					// if(socket.request.session.passport == null){
					// 	return;
					// }
					Room.addUser(room, socket, function (err, newRoom) {
						// Join the room channel
						socket.join(newRoom.id);

						Room.getUsers(newRoom, socket, function (err, users, cuntUserInRoom) {
							if (err) throw err;

							// Return list of all user connected to the room to the current user
							//	socket.emit('updateUsersList', users, true);
							io.to(newRoom.id).emit('updateUsersList', users[users.length - 1]);

							// Return the current user to other connecting sockets in the room 
							// ONLY if the user wasn't connected already to the current room
							if (cuntUserInRoom === 1) {
								socket.broadcast.to(newRoom.id).emit('updateUsersList', users[users.length - 1]);
							}
						});
					});
				}
			});
		});

		// When a socket exits
		socket.on('disconnect', function () {

			// Check if user exists in the session
			// if(socket.request.session.passport == null){
			// 	return;
			// }

			// Find the room to which the socket is connected to, 
			// and remove the current user + socket from this room
			Room.removeUser(socket, function (err, room, userId, cuntUserInRoom) {
				if (err) throw err;

				// Leave the room channel
				socket.leave(room.id);

				// Return the user id ONLY if the user was connected to the current room using one socket
				// The user id will be then used to remove the user from users list on chatroom page
				if (cuntUserInRoom === 1) {
					socket.broadcast.to(room.id).emit('removeUser', userId);
				}
			});
		});

		// When a new message arrives
		socket.on('newMessage', function (roomId, message) {
			// No need to emit 'addMessage' to the current socket
			// As the new message will be added manually in 'main.js' file
			console.log(roomId + 'message' + message);
			roomModel.find({
				_id: roomId,
				'connections': { $elemMatch: { 'socketId': socket.id } }
			}, { 'connections.$': 1 }).populate('connections.0.userId','username picture').exec((err, result) => {
				console.log(result[0].connections[0]);
				roomModel.findByIdAndUpdate(roomId, {
					$push: { chatBox: { 'by': result[0].connections[0].userId, comment: message } }
				});
				socket.broadcast.to(roomId).emit('addMessage', { name: result[0].connections[0].userId.username, image:result[0].connections[0].userId.picture, message: message });
			});

		});
	});
}


/**
 * Initialize Socket.io
 * Uses Redis as Adapter for Socket.io
 *
 */
var init = function (server) {
	// var options = {};
	// options.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("Bearer");
	// options.secretOrKey = config.sessionSecret;
	var io = require('socket.io')(server);

	// Force Socket.io to ONLY use "websockets"; No Long Polling.
	// io.set('transports', ['websocket']);

	// Using Redis
	let port = config.redis.port;
	let host = config.redis.host;
	let password = config.redis.password;
	let pubClient = redis(port, host, { auth_pass: password });
	let subClient = redis(port, host, { auth_pass: password, return_buffers: true, });
	io.adapter(adapter({ pubClient, subClient }));

	pubClient.on('ready', function () {
		console.log("pubClient is ready");
	});

	subClient.on('ready', function () {
		console.log("subClient in ready");
	});
	// Allow sockets to access session data
	io.use((socket, next) => {
		require('../session')(socket.request, {}, next);
	});
	io.use((socket, next) => {
		let storeToken = socket.handshake.query['Authorization'].split(' ');
		if (storeToken[0] === 'Bearer' && storeToken[1]) {
			User.findOne({ 'token': storeToken[1] }, function (err, user) {

				if (err) return next(new Error('authentication error'));
				if (user) {
					socket.request['user'] = user;
					return next();
				}
			})

		}
		return next(new Error('authentication error'));
	});
	// Define all Events
	ioEvents(io);

	// The server object will be then used to list to a port number
	return server;
}

// var verify = function (jwtPayload, done) {
// 	// token is valid 
// 	// we still can verify the token

// 	// the user passed is set to socket.request.user
// 	done(null, user)
//   }
module.exports = init;