'use strict';

var async = require('async');
var friends = require('./friends');

var usersController = require.main.require('./src/controllers/accounts/helpers');
var pagination = require.main.require('./src/pagination');

var controllers = {};

controllers.getFriends = function(req, res, next) {
	var uid = req.user ? req.user.uid : 0;
	var userData;

	var friendsPerPage = 5000;
	var page = parseInt(req.query.page, 10) || 1;
	var start = Math.max(0, (page - 1) * friendsPerPage);
	var stop = start + friendsPerPage - 1;

	async.waterfall([
		function(next) {
			usersController.getUserDataByUserSlug(req.params.userslug, uid, next);
		},
		function(_userData, next) {
			userData = _userData;
			async.parallel({
				friendCount: function(next) {
					friends.getFriendCount(userData.uid, next);
				},
				friendsData: function(next) {
					friends.getFriendsPageData(userData.uid, uid, start, stop, next);
				}
			}, next);
		}
	], function(err, results) {
		if (err) {
			return next(err);
		}
		userData.users = results.friendsData.friends;
		if (parseInt(userData.uid, 10) === parseInt(uid, 10)) {
			userData.pendingFriends = results.friendsData.pendingFriends;
		}

		var pageCount = Math.max(1, Math.ceil(parseInt(results.friendCount, 10) / friendsPerPage));

		userData.pagination = pagination.create(page, pageCount, req.query);
		userData.title = 'Friends';
		res.render('friends', userData);
	});
};

module.exports = controllers;