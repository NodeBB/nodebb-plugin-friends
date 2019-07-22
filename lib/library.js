'use strict';

const routes = require('./routes');
const friends = require('./friends');

const library = module.exports;

library.init = function(params, callback) {
	require('./websockets');
	require('./hooks');
	routes.init(params, callback);
};
library.initWriteRoutes = routes.initWriteRoutes;

library.listUids = friends.getFriendsUids;
