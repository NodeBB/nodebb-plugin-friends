'use strict';

var plugins = require.main.require('./src/plugins');
var friends = require('./friends');

var pluginID = 'nodebb-plugin-friends';

plugins.registerHook(pluginID, {hook: 'filter:userlist.get', method: getUsers});
plugins.registerHook(pluginID, {hook: 'filter:user.profileLinks', method: addProfileLink});

function getUsers(userData, callback) {
	var users = userData.users;

	var uids = users.map(function(user) {
		return user && user.uid;
	});

	friends.areFriendsOrRequested(userData.uid, uids, function(err, areFriends) {
		if (err) {
			return callback(err);
		}

		users.forEach(function(user, index) {
			if (user) {
				user.isFriends = areFriends[index];
			}
		});
		callback(null, userData);
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