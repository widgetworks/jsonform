var shared = require('./karma-shared.conf');

module.exports = function (config) {
	shared(config);
	config.set({
		files: [
            // Dependencies
            "deps/jquery.min.js"
            ,"deps/underscore-min.js"
            ,"deps/opt/ZSchema-browser-min.js"
            
            // Library under test
            ,"build/jsonform.js"
            
			// {
			// 	// Serve fixture data.
			// 	pattern: 'test/fixtures/**/*.json',
			// 	served: true,
			// 	watched: true,
			// 	included: false
			// },
            
            ,"node_modules/jasmine-jquery/lib/jasmine-jquery.js"
            
			// Add helpers.
			,'build/test/helpers/**/*.js'
            
			,'build/test/**/*.spec.js'
		]
	});
};
