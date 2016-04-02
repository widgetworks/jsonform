namespace jsonform.util {
    /**
     * Regular expressions used to extract array indexes in input field names
     */
    export var reArray = /\[([0-9]*)\](?=\[|\.|$)/g;
    
	
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
	
}