'use strict';

var async = require('async');
var plugins = require.main.require('./src/plugins');
var friends = require('./friends');

var pluginID = 'nodebb-plugin-friends';

plugins.registerHook(pluginID, {hook: 'filter:userlist.get', method: getUsers});
plugins.registerHook(pluginID, {hook: 'filter:user.profileMenu', method: addProfileLink});
plugins.registerHook(pluginID, {hook: 'filter:account/profile.build', method: getUserAccount});

function getUsers(data, callback) {
	getFrienship(data.uid, data.users, function(err, users) {
		callback(err, data);
	});
}

function getUserAccount(hookData, callback) {
	getFrienship(hookData.templateData.uid, [hookData.templateData], function(err) {
		callback(err, hookData);
	});
}

function getFrienship(uid, users, callback) {
	var uids = users.map(function(user) {
		return user && user.uid;
	});
	async.parallel({
		isFriends: function(next) {
			friends.isFriends(uid, uids, next);
		},
		isFriendPending: function(next) {
			friends.isPending(uid, uids, next);
		},
		isFriendRequested: function(next) {
			friends.isRequestSent(uid, uids, next);
		}
	}, function(err, results) {
		if (err) {
			return callback(err);
		}

		users.forEach(function(user, index) {
			if (user) {
				user.isFriends = results.isFriends[index];
				user.isFriendPending = results.isFriendPending[index];
				user.isFriendRequested = results.isFriendRequested[index];
				if (user.isFriends) {
					user.isFriendPending = user.isFriendRequested = false;
				}
			}
		});
		callback(null, users);
	});
}

function addProfileLink(data, next) {
	data.links.push({
		id: 'nodebb-plugin-friends',
		route: 'friends',
		icon: 'fa-users',
		name: 'Friends',
		visibility: {
			other: false
		}
	});

	return next(null, data);
};