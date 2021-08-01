
'use strict';

const helpers = require.main.require('./src/routes/helpers');
const winston = require.main.require('winston');
const controllers = require('./controllers');
const friends = require('./friends');


const Routes = {};

Routes.init = async function (params) {
	const middlewares = [params.middleware.exposeUid, params.middleware.canViewUsers];
	helpers.setupPageRoute(params.router, '/user/:userslug/friends', params.middleware, middlewares, controllers.getFriends);
};

Routes.initV3Routes = async function ({ router, middleware, helpers }) {
	winston.verbose('[plugins/friends] init v3 routes');

	router.get('/friends/:uid', middleware.authenticate, middleware.admin.checkPrivileges, middleware.assert.user, async (req, res) => {
		const offset = Number(req.query.offset || 0);
		const limit = Number(req.query.limit || 50);
		try {
			const friendsData = await friends.getFriendsPageData(req.params.uid, req.user.uid, offset, offset + limit - 1);
			helpers.formatApiResponse(200, res, friendsData);
		} catch (e) {
			winston.error('[plugins/friends] v3 GET /friends/:uid', e);
			helpers.generateError(500, res, e);
		}
	});

	router.get('/friends/:uid/count', middleware.assert.user, async (req, res) => {
		try {
			const count = await friends.getFriendCount(req.params.uid);
			helpers.formatApiResponse(200, res, { count: count });
		} catch (e) {
			winston.error('[plugins/friends] v3 GET /friends/:uid/count', e);
			helpers.generateError(500, res, e);
		}
	});

	router.post('/friends/:uid', middleware.authenticate, middleware.assert.user, async (req, res) => {
		const uid = parseInt(req.user.uid, 10);
		const toUid = parseInt(req.params.uid, 10);

		if (uid === toUid) {
			helpers.formatApiResponse(400, res, new Error('[[error:invalid-user]]'));
			return;
		}

		try {
			const isPending = await friends.isPending(uid, toUid);
			if (isPending) {
				await friends.acceptFriendship(uid, toUid);
			} else {
				await friends.requestFriendship(uid, toUid);
			}
			helpers.formatApiResponse(200, res);
		} catch (e) {
			winston.error('[plugins/friends] v3 POST /friends/:uid Error', e);
			helpers.generateError(500, res, e);
		}
	});

	router.delete('/friends/:uid', middleware.authenticate, middleware.assert.user, async (req, res) => {
		const uid = parseInt(req.user.uid, 10);
		const toUid = parseInt(req.params.uid, 10);

		if (uid === toUid) {
			helpers.formatApiResponse(400, res, new Error('[[error:invalid-user]]'));
			return;
		}

		try {
			const isFriends = await friends.isFriends(uid, toUid);
			if (isFriends) {
				await friends.removeFriendship(uid, toUid);
			} else {
				await friends.rejectFriendship(uid, toUid);
			}
			helpers.formatApiResponse(200, res);
		} catch (e) {
			winston.error('[plugins/friends] v3 DELETE /friends/:uid Error', e);
			helpers.generateError(500, res, e);
		}
	});

	winston.info('[plugins/friends] v3 API integration enabled, routes added.');
};

Routes.initV1V2Routes = async function (data) {
	const user = require.main.require('./src/user');
	const middleware = {
		verifyUserExists: async function (req, res, next) {
			try {
				const userExists = await user.exists(req.params.uid);
				if (!userExists) {
					data.errorHandler.respond(404, res);
					return;
				}
				next();
			} catch (err) {
				winston.error('[plugins/friends] verifyUserExists middleware Error', err);
				data.errorHandler.handle(err, res);
			}
		},
	};

	data.router.get('/friends/:uid', data.apiMiddleware.requireUser, data.apiMiddleware.requireAdmin, middleware.verifyUserExists, async (req, res) => {
		const offset = Number(req.query.offset || 0);
		const limit = Number(req.query.limit || 50);
		try {
			const friendsData = await friends.getFriendsPageData(req.params.uid, req.user.uid, offset, offset + limit - 1);
			data.errorHandler.handle(null, res, friendsData);
		} catch (err) {
			winston.error('[plugins/friends] v1/v2 GET /friends/:uid Error', err);
			data.errorHandler.handle(err, res);
		}
	});

	data.router.get('/friends/:uid/count', middleware.verifyUserExists, async (req, res) => {
		try {
			const count = await friends.getFriendCount(req.params.uid);
			data.errorHandler.handle(null, res, { count: count });
		} catch (err) {
			winston.error('[plugins/friends] v1/v2 GET /friends/:uid/count Error', err);
			data.errorHandler.handle(err, res);
		}
	});

	data.router.post('/friends/:uid', data.apiMiddleware.requireUser, middleware.verifyUserExists, async (req, res) => {
		const uid = parseInt(req.user.uid, 10);
		const toUid = parseInt(req.params.uid, 10);

		if (uid === toUid) {
			res.status(400).json(data.errorHandler.generate(
				400, 'invalid-user',
				'You cannot friend yourself!'
			));
			return;
		}

		try {
			const isPending = await friends.isPending(uid, toUid);
			if (isPending) {
				await friends.acceptFriendship(uid, toUid);
			} else {
				await friends.requestFriendship(uid, toUid);
			}
			data.errorHandler.handle(null, res);
		} catch (err) {
			winston.error('[plugins/friends] v1/v2 POST /friends/:uid Error', err);
			data.errorHandler.handle(err, res);
		}
	});

	data.router.delete('/friends/:uid', data.apiMiddleware.requireUser, middleware.verifyUserExists, async (req, res) => {
		const uid = parseInt(req.user.uid, 10);
		const toUid = parseInt(req.params.uid, 10);

		if (uid === toUid) {
			res.status(400).json(data.errorHandler.generate(
				400, 'invalid-user',
				'You cannot unfriend yourself!'
			));
			return;
		}

		try {
			const isFriends = await friends.isFriends(uid, toUid);
			if (isFriends) {
				await friends.removeFriendship(uid, toUid);
			} else {
				await friends.rejectFriendship(uid, toUid);
			}
		} catch (err) {
			winston.error('[plugins/friends] v1/v2 DELETE /friends/:uid Error', err);
			data.errorHandler.handle(err, res);
		}
	});

	winston.info('[plugins/friends] Write API integration enabled, routes added.');

	return data;
};

module.exports = Routes;
