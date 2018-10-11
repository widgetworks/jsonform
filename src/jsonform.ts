/// <reference path="./references.d.ts" />

import * as util from "./lib/jsonform-util";

import elementTypes from './templates/templates';
import fieldTemplate from './templates/_fieldTemplate';
import {getInitialValue} from './lib/FormNode';

import {getFormValue} from './lib/jsonform-jquery';


// Expose the getFormValue method to the global object
// (other methods exposed as jQuery functions)
var JsonForm = {
    isBootstrap2: true,
    
    getFormValue: getFormValue,
    fieldTemplate: fieldTemplate,
    fieldTypes:   elementTypes,         // alias of `elementTypes`
    elementTypes: elementTypes,
    getInitialValue: getInitialValue,
    util: util,
};
export {
    JsonForm,
    JsonForm as JSONForm,
    JsonForm as default,
};

var global = (typeof global !== 'undefined') ? global : window;
if (!global.JSONForm) {
    global.JSONForm = JsonForm;
    global.JsonForm = JsonForm;
}
