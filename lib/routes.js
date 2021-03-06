
'use strict';

var controllers = require('./controllers'),
	helpers = require.main.require('./src/routes/helpers'),
	winston = require.main.require('winston'),
	friends = require('./friends');

(function(routes) {

	routes.init = function(params, callback) {
		var middlewares = [params.middleware.exposeUid, params.middleware.canViewUsers];

		helpers.setupPageRoute(params.router, '/user/:userslug/friends', params.middleware, middlewares, controllers.getFriends);

		callback();
	};

	routes.initV3Routes = async ({ router, middleware, helpers }) => {
		console.log('init v3 routes');
		const db = require.main.require('./src/database');

		router.get('/friends/:uid', middleware.authenticate, middleware.admin.checkPrivileges, middleware.assert.user, (req, res) => {
			const offset = Number(req.query.offset || 0);
			const limit  = Number(req.query.limit  || 50);
			friends.getFriendsPageData(req.params.uid, req.user.uid, offset, offset + limit - 1, function(err, friendsData) {
				helpers.formatApiResponse(200, res, friendsData);
			});
		})

		router.get('/friends/:uid/count', middleware.assert.user, function(req, res) {
			friends.getFriendCount(req.params.uid, function(err, count) {
				helpers.formatApiResponse(200, res, {
					count: count
				});
			});
		});

		router.post('/friends/:uid', middleware.authenticate, middleware.assert.user, function(req, res) {
			const uid = parseInt(req.user.uid, 10);
			const toUid = parseInt(req.params.uid, 10);

			if (uid === toUid) {
				return helpers.formatApiResponse(400, res, new Error('[[error:invalid-user]]'));
			}

			friends.isPending(uid, toUid, function(err, pending) {
				if (!pending) {	// Request
					friends.requestFriendship(uid, toUid, function() {
						helpers.formatApiResponse(200, res);
					});
				} else {  // Accept
					friends.acceptFriendship(uid, toUid, function() {
						helpers.formatApiResponse(200, res);
					});
				}
			});
		});

		router.delete('/friends/:uid', middleware.authenticate, middleware.assert.user, function(req, res) {
			const uid = parseInt(req.user.uid, 10);
			const toUid = parseInt(req.params.uid, 10);

			if (uid === toUid) {
				return helpers.formatApiResponse(400, res, new Error('[[error:invalid-user]]'));
			}

			friends.isFriends(uid, toUid, function(err, isFriends) {
				if (isFriends) {	// Unfriend
					friends.removeFriendship(uid, toUid, function(err) {
						helpers.formatApiResponse(200, res);
					});
				} else {  // Reject
					friends.rejectFriendship(uid, toUid, function(err) {
						helpers.formatApiResponse(200, res);
					});
				}
			});
		});

		winston.info('[plugins/friends] v3 API integration enabled, routes added.');
	}

	routes.initV1V2Routes = function(data, callback) {
		var db = require.main.require('./src/database'),
			middleware = {
				verifyUserExists: function(req, res, next) {
					db.exists('user:' + req.params.uid, function(err, exists) {
						if (err) {
							return data.errorHandler.handle(err, res);
						} else if (!exists) {
							return data.errorHandler.respond(404, res);
						} else {
							return next();
						}
					});
				}
			};

		data.router.get('/friends/:uid', data.apiMiddleware.requireUser, data.apiMiddleware.requireAdmin, middleware.verifyUserExists, function(req, res) {
			var offset = Number(req.query.offset || 0);
			var limit  = Number(req.query.limit  || 50);
			friends.getFriendsPageData(req.params.uid, req.user.uid, offset, offset + limit - 1, function(err, friendsData) {
				return data.errorHandler.handle(err, res, friendsData);
			});
		});

		data.router.get('/friends/:uid/count', middleware.verifyUserExists, function(req, res) {
			friends.getFriendCount(req.params.uid, function(err, count) {
				data.errorHandler.handle(err, res, {
					count: count
				});
			});
		});

		data.router.post('/friends/:uid', data.apiMiddleware.requireUser, middleware.verifyUserExists, function(req, res) {
			var uid = parseInt(req.user.uid, 10),
				toUid = parseInt(req.params.uid, 10);

			if (uid === toUid) {
				return res.status(400).json(data.errorHandler.generate(
					400, 'invalid-user',
					'You cannot friend yourself!'
				));
			}

			friends.isPending(uid, toUid, function(err, pending) {
				if (!pending) {	// Request
					friends.requestFriendship(uid, toUid, function(err) {
						return data.errorHandler.handle(err, res);
					});
				} else {  // Accept
					friends.acceptFriendship(uid, toUid, function(err) {
						return data.errorHandler.handle(err, res);
					});
				}
			});
		});

		data.router.delete('/friends/:uid', data.apiMiddleware.requireUser, middleware.verifyUserExists, function(req, res) {
			var uid = parseInt(req.user.uid, 10),
				toUid = parseInt(req.params.uid, 10);

			if (uid === toUid) {
				return res.status(400).json(data.errorHandler.generate(
					400, 'invalid-user',
					'You cannot unfriend yourself!'
				));
			}

			friends.isFriends(uid, toUid, function(err, isFriends) {
				if (isFriends) {	// Unfriend
					friends.removeFriendship(uid, toUid, function(err) {
						return data.errorHandler.handle(err, res);
					});
				} else {  // Reject
					friends.rejectFriendship(uid, toUid, function(err) {
						return data.errorHandler.handle(err, res);
					});
				}
			});
		});

		winston.info('[plugins/friends] Write API integration enabled, routes added.');
		callback(null, data);
	};

}(module.exports));

