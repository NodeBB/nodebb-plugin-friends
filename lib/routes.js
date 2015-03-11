
'use strict';

var controllers = require('./controllers'),
	helpers = require.main.require('./src/routes/helpers'),
	winston = require.main.require('winston'),
	friends = require('./friends');

(function(routes) {

	routes.init = function(params, callback) {
		var middlewares = [params.middleware.checkGlobalPrivacySettings];

		helpers.setupPageRoute(params.router, '/user/:userslug/friends', params.middleware, middlewares, controllers.getFriends);

		callback();
	};

	routes.initWriteRoutes = function(data, callback) {
		data.router.get('/friends/:userslug', data.apiMiddleware.requireUser, data.apiMiddleware.requireAdmin, data.apiMiddleware.exposeUid, function(req, res) {
			friends.getFriendsPageData(res.locals.uid, res.locals.uid, 0, 49, function(err, friendsData) {
				return data.errorHandler.handle(err, res, friendsData);
			});
		});

		data.router.post('/friends/:userslug', data.apiMiddleware.requireUser, data.apiMiddleware.exposeUid, function(req, res) {
			var uid = parseInt(req.user.uid, 10),
				toUid = parseInt(res.locals.uid, 10);

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

		data.router.delete('/friends/:userslug', data.apiMiddleware.requireUser, data.apiMiddleware.exposeUid, function(req, res) {
			var uid = parseInt(req.user.uid, 10),
				toUid = parseInt(res.locals.uid, 10);

			if (uid === toUid) {
				return res.status(400).json(data.errorHandler.generate(
					400, 'invalid-user',
					'You cannot unfriend yourself!'
				));
			}

			friends.isFriends(uid, toUid, function(err, isFriends) {
				if (!isFriends) {	// Unfriend
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

