var shared = require('./karma-shared.conf');

module.exports = function (config) {
	shared(config);
	config.set({
		files: [
            // Dependencies
            "deps/jquery.min.js"
            ,"bower_components/lodash/dist/lodash.js"
            ,"deps/opt/ZSchema-browser-min.js"
            
            // Library under test
            ,{
				pattern: "build/jsonform.js",
				nocache: true
			}
            
			// {
			// 	// Serve fixture data.
			// 	pattern: 'test/fixtures/**/*.json',
			// 	served: true,
			// 	watched: true,
			// 	included: false
			// },
            
            ,"build/test/lib/dom-compare.js"
            ,"node_modules/jasmine-jquery/lib/jasmine-jquery.js"
            
			// Add helpers.
			,'build/test/helpers/**/*.js'
            
			,{
				pattern: 'build/test/**/*.spec.js',
				nocache: true
			}
		]
	});
};
