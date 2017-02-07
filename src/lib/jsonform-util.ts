namespace jsonform.util {
    
    // Globals that are required for jsonform to run
    var serverside = (typeof exports !== 'undefined');
    // export var global = (typeof exports !== 'undefined') ? exports : window;
    export var global = (typeof global !== 'undefined') ? global : window;
    export var $ = (typeof global.jQuery !== 'undefined') ? global.jQuery : <any>{ fn: {} };
    export var _ = (typeof global._ !== 'undefined') ? global._ : null;
    
    // Don't try to load underscore.js if is already loaded
    if (!_) {
        if (serverside){
            _ = require('underscore');
        } else {
            throw new Error('Missing required underscore/lodash dependency');
        }
    }
    
    
    /**
     * Regular expressions used to extract array indexes in input field names
     */
    export var reArray = /\[([0-9]*)\](?=\[|\.|$)/g;
    
    
    /**
     * Escapes selector name for use with jQuery
     *
     * All meta-characters listed in jQuery doc are escaped:
     * http://api.jquery.com/category/selectors/
     *
     * @function
     * @param {String} selector The jQuery selector to escape
     * @return {String} The escaped selector.
     */
    export var escapeSelector = function(selector) {
        return selector.replace(/([ \!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;<\=\>\?\@\[\\\]\^\`\{\|\}\~])/g, '\\$1');
    };
    
    
    // From backbonejs
    export var escapeHTML = function(string) {
        if (!isSet(string)) {
            return '';
        }
        string = '' + string;
        if (!string) {
            return '';
        }
        return string
            .replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    };
    
    
    /**
     * Returns true if given value is neither "undefined" nor null
     */
    export var isSet = function(value) {
        return !(_.isUndefined(value) || _.isNull(value));
    };
    
    
    /**
     * Template settings for form views
     */
    export var fieldTemplateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g
    };

    /**
     * Template settings for value replacement
     */
    export var valueTemplateSettings = {
        evaluate: /\{\[([\s\S]+?)\]\}/g,
        interpolate: /\{\{([\s\S]+?)\}\}/g
    };

    export var _template = typeof _.template('', {}) === 'string' ? _.template : function(tmpl, data, opts) {
        return _.template(tmpl, opts)(data);
    }

    /**
     * Returns true if given property is directly property of an object
     */
    export var hasOwnProperty = function(obj, prop) {
        return typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, prop);
    }
    
	
	//Allow to access subproperties by splitting "."
    /**
     * Retrieves the key identified by a path selector in the structured object.
     *
     * Levels in the path are separated by a dot. Array items are marked
     * with [x]. For instance:
     *  foo.bar[3].baz
     *
     * @function
     * @param {Object} obj Structured object to parse
     * @param {String} key Path to the key to retrieve
     * @param {boolean} ignoreArrays True to use first element in an array when
     *   stucked on a property. This parameter is basically only useful when
     *   parsing a JSON schema for which the "items" property may either be an
     *   object or an array with one object (only one because JSON form does not
     *   support mix of items for arrays).
     * @return {Object} The key's value.
     */
    export function getObjKey(obj, key: string, ignoreArrays = false) {
        var innerobj = obj;
        var keyparts = key.split(".");
        var subkey = null;
        var arrayMatch = null;
        var prop = null;

        for (var i = 0; i < keyparts.length; i++) {
            if ((innerobj === null) || (typeof innerobj !== "object")) return null;
            subkey = keyparts[i];
            prop = subkey.replace(reArray, '');
            reArray.lastIndex = 0;
            arrayMatch = reArray.exec(subkey);
            if (arrayMatch) {
                innerobj = innerobj[prop];
                while (true) {
                    if (!_.isArray(innerobj)) return null;
                    innerobj = innerobj[parseInt(arrayMatch[1], 10)];
                    arrayMatch = reArray.exec(subkey);
                    if (!arrayMatch) break;
                }
            }
            else if (ignoreArrays &&
                !innerobj[prop] &&
                _.isArray(innerobj) &&
                innerobj[0]) {
                innerobj = innerobj[0][prop];
            }
            else {
                innerobj = innerobj[prop];
            }
        }

        if (ignoreArrays && _.isArray(innerobj) && innerobj[0]) {
            return innerobj[0];
        }
        else {
            return innerobj;
        }
    };

    //Allow to access subproperties by splitting "."
    /**
     * Retrieves the key identified by a path selector in the structured object.
     *
     * Levels in the path are separated by a dot. Array items are marked
     * with [x]. For instance:
     *  foo.bar[3].baz
     *
     * @function
     * @param {Object} obj Structured object to parse, can be array too
     * @param {String} key Path to the key to retrieve
     * @return {Object} The key's value.
     */
    export function getObjKeyEx(obj, key: string, objKey?: string) {
        var innerobj = obj;

        if (key === null || key === undefined || key === '')
            return obj;

        if (typeof objKey === 'string' && objKey.length > 0) {
            if (key.slice(0, objKey.length) !== objKey) {
                console.log([objKey, obj, key]);
                throw new Error('key [' + key + '] does not match the objKey [' + objKey + ']');
            }
            key = key.slice(objKey.length);
            if (key[0] === '.')
                key = key.slice(1);
        }

        var m = key.match(/^((([^\\\[.]|\\.)+)|\[(\d+)\])\.?(.*)$/);
        if (!m)
            throw new Error('bad format key: ' + key);

        if (typeof m[2] === 'string' && m[2].length > 0) {
            innerobj = innerobj[m[2]];
        }
        else if (typeof m[4] === 'string' && m[4].length > 0) {
            innerobj = innerobj[Number(m[4])];
        }
        else
            throw new Error('impossible reach here');
        if (innerobj && m[5].length > 0)
            innerobj = this.getObjKeyEx(innerobj, m[5]);

        return innerobj;
    };


    /**
     * Sets the key identified by a path selector to the given value.
     *
     * Levels in the path are separated by a dot. Array items are marked
     * with [x]. For instance:
     *  foo.bar[3].baz
     *
     * The hierarchy is automatically created if it does not exist yet.
     *
     * @function
     * @param {Object} obj The object to build
     * @param {String} key The path to the key to set where each level
     *  is separated by a dot, and array items are flagged with [x].
     * @param {Object} value The value to set, may be of any type.
     */
    export function setObjKey(obj, key, value) {
        var innerobj = obj;
        var keyparts = key.split(".");
        var subkey = null;
        var arrayMatch = null;
        var prop = null;

        for (var i = 0; i < keyparts.length - 1; i++) {
            subkey = keyparts[i];
            prop = subkey.replace(reArray, '');
            reArray.lastIndex = 0;
            arrayMatch = reArray.exec(subkey);
            if (arrayMatch) {
                // Subkey is part of an array
                while (true) {
                    if (!_.isArray(innerobj[prop])) {
                        innerobj[prop] = [];
                    }
                    innerobj = innerobj[prop];
                    prop = parseInt(arrayMatch[1], 10);
                    arrayMatch = reArray.exec(subkey);
                    if (!arrayMatch) break;
                }
                if ((typeof innerobj[prop] !== 'object') ||
                    (innerobj[prop] === null)) {
                    innerobj[prop] = {};
                }
                innerobj = innerobj[prop];
            }
            else {
                // "Normal" subkey
                if ((typeof innerobj[prop] !== 'object') ||
                    (innerobj[prop] === null)) {
                    innerobj[prop] = {};
                }
                innerobj = innerobj[prop];
            }
        }

        // Set the final value
        subkey = keyparts[keyparts.length - 1];
        prop = subkey.replace(reArray, '');
        reArray.lastIndex = 0;
        arrayMatch = reArray.exec(subkey);
        if (arrayMatch) {
            while (true) {
                if (!_.isArray(innerobj[prop])) {
                    innerobj[prop] = [];
                }
                innerobj = innerobj[prop];
                prop = parseInt(arrayMatch[1], 10);
                arrayMatch = reArray.exec(subkey);
                if (!arrayMatch) break;
            }
            innerobj[prop] = value;
        }
        else {
            innerobj[prop] = value;
        }
    };
    
    
    /**
     * Retrieves the key definition from the given schema.
     *
     * The key is identified by the path that leads to the key in the
     * structured object that the schema would generate. Each level is
     * separated by a '.'. Array levels are marked with []. For instance:
     *  foo.bar[].baz
     * ... to retrieve the definition of the key at the following location
     * in the JSON schema (using a dotted path notation):
     *  foo.properties.bar.items.properties.baz
     *
     * @function
     * @param {Object} schema The JSON schema to retrieve the key from
     * @param {String} key The path to the key, each level being separated
     *  by a dot and array items being flagged with [].
     * @return {Object} The key definition in the schema, null if not found.
     */
    export var getSchemaKey = function(schema, key) {
        var schemaKey = key
            .replace(/\./g, '.properties.')
            .replace(/\[[0-9]*\]/g, '.items');
        var schemaDef = jsonform.util.getObjKey(schema, schemaKey, true);
        if (schemaDef && schemaDef.$ref) {
            throw new Error('JSONForm does not yet support schemas that use the ' +
                '$ref keyword. See: https://github.com/joshfire/jsonform/issues/54');
        }
        return schemaDef;
    };
    
    
    /**
     * TypeScript type guards
     */
    // export function isSchemaElement(schema: ISchemaElementAny): schema is ISchemaElement{
    //     return schema.type === jsonform.schema.Type.object;
    // }
    // export function isSchemaElementV3(schema: ISchemaElementAny): schema is ISchemaElement{
    //     return schema.type === jsonform.schema.Type.object;
    // }
    
    export function isObject(schema: ISchemaElement): schema is ISchemaObject{
        return schema.type === jsonform.schema.Type.object;
    }
	
}