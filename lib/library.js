'use strict';

var routes = require('./routes');

(function(library) {

	library.init = function(params, callback) {
		require('./websockets');
		require('./hooks');
		routes.init(params, callback);
	};

	library.initWriteRoutes = routes.initWriteRoutes;

}(module.exports));

