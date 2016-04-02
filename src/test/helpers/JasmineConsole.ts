/**
 * Add test utility function that strips out Jasmine functions
 * from the call-stack.
 * 
 * Replace the default `console.error` function
 * with a version that will strip out Jasmine functions
 * from the call-stack.
 * 
 * Adapted from Karma `adapter.js`.
 * 
 * @type {error}
 * @private
 */
var __console_error = window.console.error;
window.console.error = function(message){
	if (arguments.length == 1 && typeof message == 'string'){
		// remove jasmine stack entries
		// Only if there is exactly one argument and it is a string.
		__console_error.call(window.console, message.replace(/\n.+jasmine\.js?\w*\:.+(?=(\n|$))/g, ''));
		
		// window.console.groupCollapsed('callstack');
		// __console_error.call(window.console, message);
		// window.console.groupEnd();
	} else {
		__console_error.apply(window.console, arguments);
	}
};
