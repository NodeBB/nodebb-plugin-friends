'use strict';

var routes = require('./routes'),
	friends = require('./friends');

(function(library) {

	library.init = function(params, callback) {
		require('./websockets');
		require('./hooks');
		routes.init(params, callback);
	};

	library.initWriteRoutes = routes.initWriteRoutes;

	library.listUids = friends.getFriendsUids;

}(module.exports));

