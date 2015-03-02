'use strict';

var async = require('async'),
	db = require.main.require('./src/database'),

	user = require.main.require('./src/user'),
	notifications = require.main.require('./src/notifications');

var friends = {};

friends.getFriendsPageData = function(uid, start, end, callback) {
	async.parallel({
		friends: function(next) {
			user.getUsersFromSet('uid:' + uid + ':friends', uid, start, end, next);
		},
		pendingFriends: function(next) {
			user.getUsersFromSet('uid:' + uid + ':friends:pending', uid, 0, -1, next);
		}
	}, callback);
};

friends.requestFriendship = function(uid, toUid, callback) {
	async.parallel({
		isFriends: async.apply(isFriends, uid, toUid),
		isFriendRequestSent: async.apply(isFriendRequestSent, uid, toUid)
	}, function(err, results) {
		if (err) {
			return callback(err);
		}

		if (results.isFriends) {
			return callback(new Error('[[error:already-friends]]'));
		} else if (results.isFriendRequestSent) {
			return callback(new Error('[[error:friend-request-already-sent]]'));
		}

		var now = Date.now();
		async.parallel([
			async.apply(db.sortedSetAdd, 'uid:' + uid + ':friends:requests', now, toUid),
			async.apply(db.sortedSetAdd, 'uid:' + toUid + ':friends:pending', now, uid),
		], function(err) {
			if (err) {
				return callback(err);
			}

			sendFriendRequestNotification(uid, toUid, callback);
		});
	});
};

function sendFriendRequestNotification(uid, toUid, callback) {
	user.getMultipleUserFields([uid, toUid], ['username', 'userslug'], function(err, userData) {
		if (err) {
			return callback(err);
		}
		var me = userData[0];
		var to = userData[1];

		notifications.create({
			bodyShort: me.username + ' wants to be friends',
			nid: 'friend:request:' + uid + ':uid:' + toUid,
			from: uid,
			path: '/user/' + to.userslug + '/friends'
		}, function(err, notification) {
			if (err) {
				return callback(err);
			}
			notifications.push(notification, [toUid], callback);
		});
	});
}

friends.acceptFriendship = function(uid, toUid, callback) {
	async.parallel({
		isFriends: async.apply(isFriends, uid, toUid),
		isFriendPending: async.apply(isFriendPending, uid, toUid)
	}, function(err, results) {
		if (err) {
			return callback(err);
		}

		if (results.isFriends) {
			return callback(new Error('[[error:already-friends]]'));
		} else if (!results.isFriendPending) {
			return callback(new Error('[[error:no-friend-request]]'));
		}
		
		var now = Date.now();
		async.parallel([
			async.apply(db.sortedSetAdd, 'uid:' + uid + ':friends', now, toUid),
			async.apply(db.sortedSetRemove, 'uid:' + uid + ':friends:pending', toUid),
			async.apply(db.sortedSetAdd, 'uid:' + toUid + ':friends', now, uid),
			async.apply(db.sortedSetRemove, 'uid:' + toUid + ':friends:requests', uid),
		], callback);
	});
};

friends.rejectFriendship = function(uid, toUid, callback) {
	async.parallel([
		async.apply(db.sortedSetRemove, 'uid:' + uid + ':friends:pending', toUid),
		async.apply(db.sortedSetRemove, 'uid:' + toUid + ':friends:requests', uid)
	], callback);
};

friends.removeFriendship = function(uid, toUid, callback) {
	async.parallel([
		async.apply(db.sortedSetRemove, 'uid:' + uid + ':friends', toUid),
		async.apply(db.sortedSetRemove, 'uid:' + uid + ':friends:requests', toUid),
		async.apply(db.sortedSetRemove, 'uid:' + uid + ':friends:pending', toUid),
		async.apply(db.sortedSetRemove, 'uid:' + toUid + ':friends', uid),
		async.apply(db.sortedSetRemove, 'uid:' + toUid + ':friends:pending', uid),
		async.apply(db.sortedSetRemove, 'uid:' + toUid + ':friends:requests', uid)
	], callback);
};

function isFriends(uid, toUid, callback) {
	db.isSortedSetMember('uid:' + uid + ':friends', toUid, callback);
}

friends.areFriendsOrRequested = function(uid, uids, callback) {
	async.parallel({
		isFriends: async.apply(db.isSortedSetMembers, 'uid:' + uid + ':friends', uids),
		isRequested: async.apply(db.isSortedSetMembers, 'uid:' + uid + ':friends:requests', uids)
	}, function(err, results) {
		if (err) {
			return callback(err);
		}
		var result = [];
		results.isFriends.forEach(function(isFriend, index) {
			result[index] = isFriend || results.isRequested[index];
		});
		callback(null, result);
	});	
};

function isFriendRequestSent(uid, toUid, callback) {
	db.isSortedSetMember('uid:' + uid + ':friends:requests', toUid, callback);
}

function isFriendPending(uid, toUid, callback) {
	db.isSortedSetMember('uid:' + uid + ':friends:pending', toUid, callback);	
}

module.exports = friends;