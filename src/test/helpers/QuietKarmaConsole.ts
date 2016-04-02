/**
 * Dodgy override of `window.__karma__.result` method
 * that will suppress output of "success" results
 * to make it easier to focus on debugging failing tests.
 * 
 * @type {error}
 * @private
 */
(function(){
    var __karma__ = (<any>window).__karma__;
    
    var __result_original = __karma__.result;
    var __complete_original = __karma__.complete;

    __karma__.__result_success_count = 0;
    __karma__.__result_failed_count = 0;

    __karma__.result = function(result){
        if (result.success){
            // Increment count of successful tests.
            this.__result_success_count++;
        } else {
            // Forward to default.
            this.__result_failed_count++;
            __result_original.call(this, result);
        }
    };

    __karma__.complete = function(){
        window.console.log(
            [
                'Passed: ', this.__result_success_count, ' tests\n',
                'Failed: ', this.__result_failed_count, '\n',
                'Skipped: ', this.skipped, ' tests'
            ].join('')
        );
        window.console.log('(Succesful messages have been suppressed. To enable/disable, edit `test/helpers/QuietKarmaConsole.js`)');
    };

}());
