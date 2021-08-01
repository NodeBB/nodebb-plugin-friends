'use strict';

const routes = require('./routes');
const friends = require('./friends');

const library = module.exports;

library.init = async function (params) {
	require('./websockets');
	require('./hooks');
	await routes.init(params);
};
library.initV1V2Routes = routes.initV1V2Routes;
library.initV3Routes = routes.initV3Routes;

library.listUids = friends.getFriendsUids;
