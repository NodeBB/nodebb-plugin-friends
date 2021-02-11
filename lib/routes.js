
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

	routes.initWriteRoutes = function(data, callback) {
		console.log('initting routes');
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

		winston.verbose('[plugins/friends] Write API integration enabled, routes added.');
		callback(null, data);
	};

}(module.exports));

