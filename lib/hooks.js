'use strict';

var async = require('async');
var plugins = require.main.require('./src/plugins');
var friends = require('./friends');

var pluginID = 'nodebb-plugin-friends';

plugins.registerHook(pluginID, {hook: 'filter:userlist.get', method: getUsers});
plugins.registerHook(pluginID, {hook: 'filter:user.profileLinks', method: addProfileLink});
plugins.registerHook(pluginID, {hook: 'filter:user.account', method: getUserAccount});

function getUsers(data, callback) {
	getFrienship(data.uid, data.users, function(err, users) {
		callback(err, data);
	});
}

function getUserAccount(data, callback) {
	getFrienship(data.uid, [data.userData], function(err, users) {
		callback(err, data);
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
		}
	}, function(err, results) {
		if (err) {
			return callback(err);
		}

		users.forEach(function(user, index) {
			if (user) {
				user.isFriends = results.isFriends[index];
				user.isFriendPending = results.isFriendPending[index];
			}
		});
		callback(null, users);
	});
}

function addProfileLink(links, callback) {
	if (!Array.isArray(links)) {
		return callback(null, links);
	}

	links.push({
		id: 'nodebb-plugin-friends',
		public: false,
		route: 'friends',
		icon: 'fa-users',
		name: 'Friends'
	});
	
	callback(null, links);
}