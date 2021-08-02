'use strict';

const controllerHelpers = require.main.require('./src/controllers/helpers');
const usersController = require.main.require('./src/controllers/accounts/helpers');
const pagination = require.main.require('./src/pagination');
const friends = require('./friends');


const Controllers = {};

Controllers.getFriends = async function (req, res) {
	const uid = req.user ? req.user.uid : 0;
	const page = parseInt(req.query.page, 10) || 1;

	const FRIENDS_PER_PAGE = 5000;

	const start = Math.max(0, (page - 1) * FRIENDS_PER_PAGE);
	const stop = start + FRIENDS_PER_PAGE - 1;

	const userData = await usersController.getUserDataByUserSlug(req.params.userslug, uid);
	const [friendCount, friendsData] = await Promise.all([
		friends.getFriendCount(userData.uid),
		friends.getFriendsPageData(userData.uid, uid, start, stop),
	]);

	userData.users = friendsData.friends;
	if (parseInt(userData.uid, 10) === parseInt(uid, 10)) {
		userData.pendingFriends = friendsData.pendingFriends;
	}

	const pageCount = Math.max(1, Math.ceil(parseInt(friendCount, 10) / FRIENDS_PER_PAGE));

	userData.pagination = pagination.create(page, pageCount, req.query);
	userData.title = '[[plugin-friends:friends]]';

	userData.breadcrumbs = controllerHelpers.buildBreadcrumbs([{ text: userData.username, url: `/user/${userData.userslug}` }, { text: '[[plugin-friends:friends]]' }]);

	res.render('friends', userData);
};

module.exports = Controllers;
