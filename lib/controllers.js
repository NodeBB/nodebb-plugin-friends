'use strict';

var async = require('async');
var friends = require('./friends');

var usersController = require.main.require('./src/controllers/accounts');

var controllers = {};

controllers.getFriends = function(req, res, next) {
	var uid = req.user ? req.user.uid : 0;

	async.parallel({
		user: function(next) {
			usersController.getBaseUser(req.params.userslug, uid, next);
		},
		friendsData: function(next) {
			friends.getFriendsPageData(uid, 0, 49, next);	
		}
	}, function(err, results) {
		if (err) {
			return next(err);
		}
		results.user.users = results.friendsData.friends;
		results.user.pendingFriends = results.friendsData.pendingFriends;
		res.render('friends', results.user);
	});			
};

module.exports = controllers;