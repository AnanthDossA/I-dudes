'use strict';

var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
var RoomSchema = new Mongoose.Schema({
    title: { type: String, required: true },
    about: String,
    itemsList: { type: [{ name: String, attachmentsList: [{ attachmentType: String, attachment: Buffer, attachmentUrl: String, vote: Number, by: { type: Schema.Types.ObjectId, ref: 'user' }, createdDateTime: { type: Date, default: Date.now }, }] }] },
    connections: { type: [{ userId: { type: Schema.Types.ObjectId, ref: 'user' }, socketId: String }] },
    chatBox: { type: [{ by: { type: Schema.Types.ObjectId, ref: 'user' }, createdDateTime: { type: Date, default: Date.now }, comment: String }] }
});

var roomModel = Mongoose.model('room', RoomSchema);
module.exports = roomModel;