'use strict';

const plugins = require.main.require('./src/plugins');
const friends = require('./friends');

const pluginID = 'nodebb-plugin-friends';

plugins.hooks.register(pluginID, { hook: 'filter:userlist.get', method: getUsers });
plugins.hooks.register(pluginID, { hook: 'filter:user.profileMenu', method: addProfileLink });
plugins.hooks.register(pluginID, { hook: 'filter:account/profile.build', method: getUserAccount });

/**
 * Called on `filter:userlist.get`
 */
async function getUsers(data) {
	await getFrienship(data.uid, data.users);
	return data;
}

/**
 * Called on `filter:account/profile.build`
 */
async function getUserAccount(hookData) {
	await getFrienship(hookData.templateData.uid, [hookData.templateData]);
	return hookData;
}

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
async function addProfileLink(data) {
	data.links.push({
		id: 'nodebb-plugin-friends',
		route: 'friends',
		icon: 'fa-users',
		name: 'Friends',
		visibility: {
			other: false,
		},
	});
	return data;
}
