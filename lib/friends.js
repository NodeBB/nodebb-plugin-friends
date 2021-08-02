'use strict';

const winston = require.main.require('winston');
const db = require.main.require('./src/database');
const notifications = require.main.require('./src/notifications');
const plugins = require.main.require('./src/plugins');
const user = require.main.require('./src/user');


const Friends = {};

Friends.getFriendCount = async function (uid) {
	return db.sortedSetCard(`uid:${uid}:friends`);
};

Friends.getFriendsPageData = async function (uid, callerUid, start, end) {
	const [friends, pendingFriends] = await Promise.all([
		user.getUsersFromSet(`uid:${uid}:friends`, callerUid, start, end),
		user.getUsersFromSet(`uid:${uid}:friends:pending`, callerUid, 0, -1),
	]);
	return { friends, pendingFriends };
};

Friends.getFriendsUids = async function (data) {
	try {
		const uids = await user.getUidsFromSet(`uid:${data.uid}:friends`, data.start, data.stop);
		data.uids = uids;
	} catch (err) {
		winston.error('[plugins/friends] Friends.getFriendsUids failed', err);
	}
	return data;
};

Friends.requestFriendship = async function (uid, toUid) {
	if (!parseInt(uid, 10) || !parseInt(toUid, 10)) {
		throw new Error('[[error:invalid-uid]]');
	}

	if (parseInt(uid, 10) === parseInt(toUid, 10)) {
		throw new Error('[[plugin-friends:error.self-request]]');
	}

	const [isFriends, isFriendRequestSent] = await Promise.all([
		Friends.isFriends(uid, toUid),
		Friends.isRequestSent(uid, toUid),
	]);

	if (isFriends) {
		throw new Error('[[plugin-friends:error.already-friends]]');
	}
	if (isFriendRequestSent) {
		throw new Error('[[plugin-friends:error.friend-request-already-sent]]');
	}

	const now = Date.now();
	await Promise.all([
		db.sortedSetAdd(`uid:${uid}:friends:requests`, now, toUid),
		db.sortedSetAdd(`uid:${toUid}:friends:pending`, now, uid),
	]);

	plugins.hooks.fire('action:friend.requested', { uid: uid, toUid: toUid });

	await sendFriendRequestNotification(uid, toUid);
};

async function sendFriendRequestNotification(uid, toUid) {
	const [me, to] = await user.getUsersFields([uid, toUid], ['username', 'userslug']);

	const notification = await notifications.create({
		bodyShort: `[[plugin-friends:notification, ${me.username}]]`,
		nid: `friend:request:${uid}:uid:${toUid}`,
		from: uid,
		path: `/user/${to.userslug}/friends`,
	});
	if (notification) {
		notifications.push(notification, [toUid]);
	}
}

Friends.acceptFriendship = async function (uid, toUid) {
	const [isFriends, isFriendPending] = await Promise.all([
		Friends.isFriends(uid, toUid),
		Friends.isPending(uid, toUid),
	]);

	if (isFriends) {
		throw new Error('[[plugin-friends:error.already-friends]]');
	} else if (!isFriendPending) {
		throw new Error('[[plugin-friends:error.no-friend-request]]');
	}

	const now = Date.now();
	await Promise.all([
		db.sortedSetAdd(`uid:${uid}:friends`, now, toUid),
		db.sortedSetsRemove([`uid:${uid}:friends:pending`, `uid:${uid}:friends:requests`], toUid),
		db.sortedSetAdd(`uid:${toUid}:friends`, now, uid),
		db.sortedSetsRemove([`uid:${toUid}:friends:pending`, `uid:${toUid}:friends:requests`], uid),
	]);

	plugins.hooks.fire('action:friend.accepted', { uid: uid, toUid: toUid });
};

Friends.rejectFriendship = async function (uid, toUid) {
	await Promise.all([
		db.sortedSetRemove(`uid:${uid}:friends:pending`, toUid),
		db.sortedSetRemove(`uid:${toUid}:friends:requests`, uid),
	]);

	plugins.hooks.fire('action:friend.rejected', { uid: uid, toUid: toUid });
};

Friends.removeFriendship = async function (uid, toUid) {
	await Promise.all([
		db.sortedSetsRemove([`uid:${uid}:friends`, `uid:${uid}:friends:requests`, `uid:${uid}:friends:requests`], toUid),
		db.sortedSetsRemove([`uid:${toUid}:friends`, `uid:${toUid}:friends:pending`, `uid:${toUid}:friends:requests`], uid),
	]);

	plugins.hooks.fire('action:friend.removed', { uid: uid, toUid: toUid });
};

Friends.isFriends = async function (uid, toUid) {
	return Array.isArray(toUid) ?
		db.isSortedSetMembers(`uid:${uid}:friends`, toUid) :
		db.isSortedSetMember(`uid:${uid}:friends`, toUid);
};

Friends.isPending = async function (uid, toUid) {
	return Array.isArray(toUid) ?
		db.isSortedSetMembers(`uid:${uid}:friends:pending`, toUid) :
		db.isSortedSetMember(`uid:${uid}:friends:pending`, toUid);
};

Friends.isRequestSent = async function (uid, toUid) {
	return Array.isArray(toUid) ?
		db.isSortedSetMembers(`uid:${uid}:friends:requests`, toUid) :
		db.isSortedSetMember(`uid:${uid}:friends:requests`, toUid);
};

Friends.areFriendsOrRequested = async function (uid, uids) {
	const [isFriends, isRequested] = await Promise.all([
		db.isSortedSetMembers(`uid:${uid}:friends`, uids),
		db.isSortedSetMembers(`uid:${uid}:friends:requests`, uids),
	]);

	const result = [];
	isFriends.forEach((isFriend, index) => {
		result[index] = isFriend || isRequested[index];
	});

	return result;
};

module.exports = Friends;
