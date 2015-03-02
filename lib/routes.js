
'use strict';

var controllers = require('./controllers'),
	helpers = require.main.require('./src/routes/helpers');

(function(routes) {

	
	routes.init = function(params, callback) {
		var middlewares = [params.middleware.checkGlobalPrivacySettings];

		helpers.setupPageRoute(params.router, '/user/:userslug/friends', params.middleware, middlewares, controllers.getFriends);

		require('./websockets');
		require('./hooks');

		callback();
	};

	routes.modifyTemplateConfig = function(config, callback) {
		if (!config || !config.custom_mapping) {
			return callback(null, config);
		}
		
		config.custom_mapping['^user/.*/friends'] = 'friends';
		
		callback(null, config);
	};

}(module.exports));

