'use strict';

const Sockets = require.main.require('./src/socket.io/plugins');
const friends = require('./friends');


Sockets.friends = {};

Sockets.friends.friend = async function (socket, data) {
	if (!socket.uid || !data || !data.uid) {
		throw new Error('[[error:invalid-data]]');
	}
	return friends.requestFriendship(socket.uid, data.uid);
};

Sockets.friends.unfriend = async function (socket, data) {
	if (!socket.uid || !data || !data.uid) {
		throw new Error('[[error:invalid-data]]');
	}
	return friends.removeFriendship(socket.uid, data.uid);
};

Sockets.friends.accept = async function (socket, data) {
	if (!socket.uid || !data || !data.uid) {
		throw new Error('[[error:invalid-data]]');
	}
	return friends.acceptFriendship(socket.uid, data.uid);
};

Sockets.friends.reject = async function (socket, data) {
	if (!socket.uid || !data || !data.uid) {
		throw new Error('[[error:invalid-data]]');
	}
	return friends.rejectFriendship(socket.uid, data.uid);
};

Sockets.friends.areFriendsOrRequested = async function (socket, data) {
	if (!socket.uid || !data || !data.uid) {
		throw new Error('[[error:invalid-data]]');
	}
	return friends.areFriendsOrRequested(socket.uid, [parseInt(data.uid, 10)]);
};
