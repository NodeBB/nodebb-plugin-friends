'use strict';

const friends = require('./friends');


const Hooks = {};

/**
 * Called on `filter:user.following`
 */
Hooks.listUids = friends.getFriendsUids;

/**
 * Called on `filter:userlist.get`
 */
Hooks.getUsers = async function (data) {
	await getFrienship(data.uid, data.users);
	return data;
};

/**
 * Called on `filter:account/profile.build`
 */
Hooks.getUserAccount = async function (hookData) {
	await getFrienship(hookData.templateData.uid, [hookData.templateData]);
	return hookData;
};

async function getFrienship(uid, users) {
	const uids = users.map(user => user && user.uid);
	const [isFriends, isFriendPending, isFriendRequested] = await Promise.all([
		friends.isFriends(uid, uids),
		friends.isPending(uid, uids),
		friends.isRequestSent(uid, uids),
	]);

	users.forEach((user, index) => {
		if (user) {
			user.isFriends = isFriends[index];
			user.isFriendPending = isFriendPending[index];
			user.isFriendRequested = isFriendRequested[index];
			if (user.isFriends) {
				user.isFriendPending = false;
				user.isFriendRequested = false;
			}
		}
	});

	return users;
}

/**
 * Called on `filter:user.profileMenu`
 */
Hooks.addProfileLink = async function addProfileLink(data) {
	data.links.push({
		id: 'nodebb-plugin-friends',
		route: 'friends',
		icon: 'fa-users',
		name: '[[plugin-friends:friends]]',
		visibility: {
			other: false,
		},
	});
	return data;
};

module.exports = Hooks;
