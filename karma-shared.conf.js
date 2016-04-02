var _path = require('path');

module.exports = function (config) {
	config.set({
		autoWatch: true,
		// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
		logLevel: config.LOG_INFO,
//		logLevel: config.LOG_DEBUG,
//		basePath: '.',
        basePath:  __dirname,
		autoWatchBatchDelay: 1000,
		frameworks: [
			'jasmine'
			// ,'sprockets'
		],
		plugins: [
			'karma-*',
			'karma-growl-reporter'
		],
		exclude: ['**/*.js___jb_bak___', '**/*.d.ts'],
		reporters: [
			'dots',
			'growl'
		],
		browsers: ['Chrome_persistent_user'],
        customLaunchers: {
			Chrome_persistent_user: {
				/**
				 * Don't fill up the hard-drive with lots of temporary
				 * chrome data directories.
                 * 
                 * NOTE: Only available in karma-chrome-launcher@0.2.3+
				 */
				base: 'Chrome',
				chromeDataDir: _path.resolve(__dirname, '.chrome')
			}
		}
	});
};
