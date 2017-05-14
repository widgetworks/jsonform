/*! Copyright (c) 2012 Joshfire - MIT license */
/**
 * @fileoverview Core of the JSON Form client-side library.
 *
 * Generates an HTML form from a structured data model and a layout description.
 *
 * The library may also validate inputs entered by the user against the data model
 * upon form submission and create the structured data object initialized with the
 * values that were submitted.
 *
 * The library depends on:
 *  - jQuery
 *  - the underscore library
 *  - a JSON parser/serializer. Nothing to worry about in modern browsers.
 *  - the JSONFormValidation library (in jsv.js) for validation purpose
 *
 * See documentation at:
 * http://developer.joshfire.com/doc/dev/ref/jsonform
 *
 * The library creates and maintains an internal data tree along with the DOM.
 * That structure is necessary to handle arrays (and nested arrays!) that are
 * dynamic by essence.
 */
var jsonform;
(function (jsonform) {
    var util;
    (function (util) {
        // Globals that are required for jsonform to run
        var serverside = (typeof exports !== 'undefined');
        // export var global = (typeof exports !== 'undefined') ? exports : window;
        util.global = (typeof util.global !== 'undefined') ? util.global : window;
        util.$ = (typeof util.global.jQuery !== 'undefined') ? util.global.jQuery : { fn: {} };
        util._ = (typeof util.global._ !== 'undefined') ? util.global._ : null;
        // Don't try to load underscore.js if is already loaded
        if (!util._) {
            if (serverside) {
                util._ = require('underscore');
            }
            else {
                throw new Error('Missing required underscore/lodash dependency');
            }
        }
        /**
         * Regular expressions used to extract array indexes in input field names
         */
        util.reArray = /\[([0-9]*)\](?=\[|\.|$)/g;
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
        util.escapeSelector = function (selector) {
            return selector.replace(/([ \!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;<\=\>\?\@\[\\\]\^\`\{\|\}\~])/g, '\\$1');
        };
        // From backbonejs
        util.escapeHTML = function (string) {
            if (!util.isSet(string)) {
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
        util.isSet = function (value) {
            return !(util._.isUndefined(value) || util._.isNull(value));
        };
        /**
         * Template settings for form views
         */
        util.fieldTemplateSettings = {
            evaluate: /<%([\s\S]+?)%>/g,
            interpolate: /<%=([\s\S]+?)%>/g
        };
        /**
         * Template settings for value replacement
         */
        util.valueTemplateSettings = {
            evaluate: /\{\[([\s\S]+?)\]\}/g,
            interpolate: /\{\{([\s\S]+?)\}\}/g
        };
        util._template = typeof util._.template('', {}) === 'string' ? util._.template : function (tmpl, data, opts) {
            return util._.template(tmpl, opts)(data);
        };
        /**
         * Returns true if given property is directly property of an object
         */
        util.hasOwnProperty = function (obj, prop) {
            return typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, prop);
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
         * @param {Object} obj Structured object to parse
         * @param {String} key Path to the key to retrieve
         * @param {boolean} ignoreArrays True to use first element in an array when
         *   stucked on a property. This parameter is basically only useful when
         *   parsing a JSON schema for which the "items" property may either be an
         *   object or an array with one object (only one because JSON form does not
         *   support mix of items for arrays).
         * @return {Object} The key's value.
         */
        function getObjKey(obj, key, ignoreArrays) {
            if (ignoreArrays === void 0) { ignoreArrays = false; }
            var innerobj = obj;
            var keyparts = key.split(".");
            var subkey = null;
            var arrayMatch = null;
            var prop = null;
            for (var i = 0; i < keyparts.length; i++) {
                if ((innerobj === null) || (typeof innerobj !== "object"))
                    return null;
                subkey = keyparts[i];
                prop = subkey.replace(util.reArray, '');
                util.reArray.lastIndex = 0;
                arrayMatch = util.reArray.exec(subkey);
                if (arrayMatch) {
                    innerobj = innerobj[prop];
                    while (true) {
                        if (!util._.isArray(innerobj))
                            return null;
                        innerobj = innerobj[parseInt(arrayMatch[1], 10)];
                        arrayMatch = util.reArray.exec(subkey);
                        if (!arrayMatch)
                            break;
                    }
                }
                else if (ignoreArrays &&
                    !innerobj[prop] &&
                    util._.isArray(innerobj) &&
                    innerobj[0]) {
                    innerobj = innerobj[0][prop];
                }
                else {
                    innerobj = innerobj[prop];
                }
            }
            if (ignoreArrays && util._.isArray(innerobj) && innerobj[0]) {
                return innerobj[0];
            }
            else {
                return innerobj;
            }
        }
        util.getObjKey = getObjKey;
        ;
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
        function getObjKeyEx(obj, key, objKey) {
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
        }
        util.getObjKeyEx = getObjKeyEx;
        ;
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
        function setObjKey(obj, key, value) {
            var innerobj = obj;
            var keyparts = key.split(".");
            var subkey = null;
            var arrayMatch = null;
            var prop = null;
            for (var i = 0; i < keyparts.length - 1; i++) {
                subkey = keyparts[i];
                prop = subkey.replace(util.reArray, '');
                util.reArray.lastIndex = 0;
                arrayMatch = util.reArray.exec(subkey);
                if (arrayMatch) {
                    // Subkey is part of an array
                    while (true) {
                        if (!util._.isArray(innerobj[prop])) {
                            innerobj[prop] = [];
                        }
                        innerobj = innerobj[prop];
                        prop = parseInt(arrayMatch[1], 10);
                        arrayMatch = util.reArray.exec(subkey);
                        if (!arrayMatch)
                            break;
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
            prop = subkey.replace(util.reArray, '');
            util.reArray.lastIndex = 0;
            arrayMatch = util.reArray.exec(subkey);
            if (arrayMatch) {
                while (true) {
                    if (!util._.isArray(innerobj[prop])) {
                        innerobj[prop] = [];
                    }
                    innerobj = innerobj[prop];
                    prop = parseInt(arrayMatch[1], 10);
                    arrayMatch = util.reArray.exec(subkey);
                    if (!arrayMatch)
                        break;
                }
                innerobj[prop] = value;
            }
            else {
                innerobj[prop] = value;
            }
        }
        util.setObjKey = setObjKey;
        ;
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
        util.getSchemaKey = function (schema, key) {
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
        function isObject(schema) {
            return schema.type === jsonform.schema.Type.object;
        }
        util.isObject = isObject;
    })(util = jsonform.util || (jsonform.util = {}));
})(jsonform || (jsonform = {}));
var jsonform;
(function (jsonform) {
    var $ = jsonform.util.$;
    var _ = jsonform.util._;
    /**
     * Represents a node in the form.
     *
     * Nodes that have an ID are linked to the corresponding DOM element
     * when rendered
     *
     * Note the form element and the schema elements that gave birth to the
     * node may be shared among multiple nodes (in the case of arrays).
     *
     * @class
     */
    var FormNode = (function () {
        function FormNode() {
            /**
             * The node's ID (may not be set)
             */
            this.id = null;
            /**
             * The node's key path (may not be set)
             */
            this.key = null;
            /**
             * Unwrapped DOM element associated witht the form element.
             *
             * The DOM element is set when the form element is rendered.
             */
            this.el = null;
            /**
             * Link to the form element that describes the node's layout
             * (note the form element is shared among nodes in arrays)
             */
            this.formElement = null;
            /**
             * Link to the schema element that describes the node's value constraints
             * (note the schema element is shared among nodes in arrays)
             */
            this.schemaElement = null;
            /**
             * Pointer to the "view" associated with the node, typically the right
             * object in jsonform.elementTypes
             */
            this.view = null;
            /**
             * Node's subtree (if one is defined)
             */
            this.children = [];
            /**
             * A pointer to the form tree the node is attached to
             */
            this.ownerTree = null;
            /**
             * A pointer to the parent node of the node in the tree
             */
            this.parentNode = null;
            /**
             * Child template for array-like nodes.
             *
             * The child template gets cloned to create new array items.
             *
             * A pristine FormNode instance that will be cloned once
             * for each item of an array-like schema element.
             *
             * NOTE: The `view.childTemplate` property is a *function*
             * not a FormNode.
             */
            this.childTemplate = null;
            /**
             * Direct children of array-like containers may use the value of a
             * specific input field in their subtree as legend. The link to the
             * legend child is kept here and initialized in computeInitialValues
             * when a child sets "valueInLegend"
             */
            this.legendChild = null;
            /**
             * The path of indexes that lead to the current node when the
             * form element is not at the root array level.
             *
             * Note a form element may well be nested element and still be
             * at the root array level. That's typically the case for "fieldset"
             * elements. An array level only gets created when a form element
             * is of type "array" (or a derivated type such as "tabarray").
             *
             * The array path of a form element linked to the foo[2].bar.baz[3].toto
             * element in the submitted values is [2, 3] for instance.
             *
             * The array path is typically used to compute the right ID for input
             * fields. It is also used to update positions when an array item is
             * created, moved around or suppressed.
             *
             * @type {Array(Number)}
             */
            this.arrayPath = [];
            /**
             * Position of the node in the list of children of its parents
             */
            this.childPos = 0;
            /**
             * Hyphenated version of the property's key path with
             * dots replaced with triple dashes so it can be used
             * as an HTML class
             */
            this.keydash = null;
        }
        // End of additional properties
        //---------------------------------------------------------------------
        /**
         * Clones a node
         *
         * If no `parentNode` is given then the current instance
         * will be set as the parentNode.
         *
         * @function
         * @param {FormNode} parentNode New parent node to attach the node to
         * @return {FormNode} Cloned node
         */
        FormNode.prototype.clone = function (parentNode) {
            if (parentNode === void 0) { parentNode = this.parentNode; }
            var node = new FormNode();
            node.childPos = this.childPos;
            node.arrayPath = _.clone(this.arrayPath);
            node.ownerTree = this.ownerTree;
            node.parentNode = parentNode;
            node.formElement = this.formElement;
            node.schemaElement = this.schemaElement;
            node.view = this.view;
            node.children = _.map(this.children, function (child) {
                return child.clone(node);
            });
            /*  if (this.childTemplate) {
                node.childTemplate = this.childTemplate.clone(node);
            }*/
            /**
             * Additional properties to copy across.
             *
             * 2016-04-30
             * TODO: Do we need to copy across the callbacks and other properties?
             */
            node.required = this.required;
            return node;
        };
        /**
         * Returns true if the subtree that starts at the current node
         * has some non empty value attached to it
         */
        FormNode.prototype.hasNonDefaultValue = function () {
            // hidden elements don't count because they could make the wrong selectfieldset element active
            if (this.formElement && this.formElement.type == "hidden") {
                return false;
            }
            if (this.value && !this.defaultValue) {
                return true;
            }
            var child = _.find(this.children, function (child) {
                return child.hasNonDefaultValue();
            });
            return !!child;
        };
        /**
         * Returns a property value of node, optional look for in parents chain
         *
         * @function
         * @param {String} prop Property name for looking
         * @param {Boolean} searchInParents Search the property in parents chain if not found in current node
         * @return {Any} The property value
         */
        FormNode.prototype.getProperty = function (prop, searchInParents) {
            var value = this[prop];
            if (value !== undefined || !searchInParents || !this.parentNode)
                return value;
            return this.parentNode.getProperty(prop, true);
        };
        /**
         * The `readOnly` property is propagated
         * to all children as well.
         *
         * Setting `readOnly: true` on this element will
         * make all children readOnly as well.
         *
         * Returns a truthy/falsy value.
         */
        FormNode.prototype.isReadOnly = function () {
            return this.getProperty('readOnly', true);
        };
        /**
         * Attaches a child node to the current node.
         *
         * The child node is appended to the end of the list.
         *
         * @function
         * @param {FormNode} node The child node to append
         * @return {FormNode} The inserted node (same as the one given as parameter)
         */
        FormNode.prototype.appendChild = function (node) {
            node.parentNode = this;
            node.childPos = this.children.length;
            this.children.push(node);
            this._updateChildOnAppend(node);
            return node;
        };
        /**
         * Removes the last child of the node.
         *
         * @function
         */
        FormNode.prototype.removeChild = function () {
            var child = this.children[this.children.length - 1];
            if (!child)
                return;
            // Remove the child from the DOM
            $(child.el).remove();
            // Remove the child from the array
            return this.children.pop();
        };
        /**
         * Update any parent-dependant properties on this child node.
         *
         * e.g. in V4 schema the state of the  `required` property is determined by the parent node.
         *
         * @param node
         * @private
         */
        FormNode.prototype._updateChildOnAppend = function (node) {
            /**
             * 2016-04-10
             * TODO: Update the `required` property of the new child node.
             * JsonSchemaV4 moves the definition of required properties up
             * to the parent object - `required` has become a list of children
             * which are required.
             *
             * TODO: Need to check how jsonform handles array elements and their children
             * and if we have access to the parent schemaElement.
             * Or does it clone the schemaElement and give an instance to each child element???
             */
            node.required = this._isChildRequired(node);
        };
        /**
         * Return true if the child is considered
         * to be required when appended to this
         * FormNode.
         *
         * @param childNode
         * @private
         */
        FormNode.prototype._isChildRequired = function (childNode) {
            var isRequired = childNode.formElement.required;
            // Only check schemaElement if the formElement doesn't already have a value.
            if (!_.isBoolean(isRequired) && this.schemaElement) {
                var requiredList = this.schemaElement.required;
                if (this.schemaElement.type == 'array') {
                    requiredList = this.schemaElement.items.required;
                }
                requiredList = requiredList || [];
                // If we are the root element then we don't have a `schemaElement`.
                var childKey = childNode.formElement.keyOnParent;
                isRequired = requiredList.indexOf(childKey) >= 0;
            }
            return isRequired;
        };
        /**
         * Moves the user entered values set in the current node's subtree to the
         * given node's subtree.
         *
         * The target node must follow the same structure as the current node
         * (typically, they should have been generated from the same node template)
         *
         * The current node MUST be rendered in the DOM.
         *
         * TODO: when current node is not in the DOM, extract values from formNode.value
         * properties, so that the function be available even when current node is not
         * in the DOM.
         *
         * Moving values around allows to insert/remove array items at arbitrary
         * positions.
         *
         * @function
         * @param {FormNode} node Target node.
         */
        FormNode.prototype.moveValuesTo = function (node) {
            var values = this.getFormValues(node.arrayPath);
            node.resetValues();
            node.computeInitialValues(values, true);
        };
        /**
         * Switches nodes user entered values.
         *
         * The target node must follow the same structure as the current node
         * (typically, they should have been generated from the same node template)
         *
         * Both nodes MUST be rendered in the DOM.
         *
         * TODO: update getFormValues to work even if node is not rendered, using
         * formNode's "value" property.
         *
         * @function
         * @param {FormNode} node Target node
         */
        FormNode.prototype.switchValuesWith = function (node) {
            var values = this.getFormValues(node.arrayPath);
            var nodeValues = node.getFormValues(this.arrayPath);
            node.resetValues();
            node.computeInitialValues(values, true);
            this.resetValues();
            this.computeInitialValues(nodeValues, true);
        };
        /**
         * Resets all DOM values in the node's subtree.
         *
         * This operation also drops all array item nodes.
         * Note values are not reset to their default values, they are rather removed!
         *
         * @function
         */
        FormNode.prototype.resetValues = function () {
            var params = null;
            var idx = 0;
            // Reset value
            this.value = null;
            // Propagate the array path from the parent node
            // (adding the position of the child for nodes that are direct
            // children of array-like nodes)
            if (this.parentNode) {
                this.arrayPath = _.clone(this.parentNode.arrayPath);
                if (this.parentNode.view && this.parentNode.view.array) {
                    this.arrayPath.push(this.childPos);
                }
            }
            else {
                this.arrayPath = [];
            }
            if (this.view && this.view.inputfield) {
                // Simple input field, extract the value from the origin,
                // set the target value and reset the origin value
                params = $(':input', this.el).serializeArray();
                _.each(params, function (param) {
                    // TODO: check this, there may exist corner cases with this approach
                    // (with multiple checkboxes for instance)
                    $('[name="' + jsonform.util.escapeSelector(param.name) + '"]', $(this.el)).val('');
                }, this);
            }
            else if (this.view && this.view.array) {
                // The current node is an array, drop all children
                while (this.children.length > 0) {
                    this.removeChild();
                }
            }
            // Recurse down the tree
            _.each(this.children, function (child) {
                child.resetValues();
            });
        };
        /**
         * Sets the child template node for the current node.
         *
         * The child template node is used to create additional children
         * in an array-like form element. The template is never rendered.
         *
         * @function
         * @param {FormNode} node The child template node to set
         */
        FormNode.prototype.setChildTemplate = function (node) {
            this.childTemplate = node;
            node.parentNode = this;
        };
        /**
         * Gets the child template node for the current node.
         *
         * The child template node is used to create additional children
         * in an array-like form element. We delay create it when first use.
         */
        FormNode.prototype.getChildTemplate = function () {
            if (!this.childTemplate) {
                if (this.view.array) {
                    // The form element is an array. The number of items in an array
                    // is by definition dynamic, up to the form user (through "Add more",
                    // "Delete" commands). The positions of the items in the array may
                    // also change over time (through "Move up", "Move down" commands).
                    //
                    // The form node stores a "template" node that serves as basis for
                    // the creation of an item in the array.
                    //
                    // Array items may be complex forms themselves, allowing for nesting.
                    //
                    // The initial values set the initial number of items in the array.
                    // Note a form element contains at least one item when it is rendered.
                    var key /*: IFormElement*/;
                    if (this.formElement.items) {
                        key = this.formElement.items[0] || this.formElement.items;
                    }
                    else {
                        key = this.formElement.key + '[]';
                    }
                    if (_.isString(key)) {
                        key = { key: key };
                    }
                    this.setChildTemplate(this.ownerTree.buildFromLayout(key));
                }
            }
            return this.childTemplate;
        };
        /**
         * Recursively sets values to all nodes of the current subtree
         * based on previously submitted values, or based on default
         * values when the submitted values are not enough
         *
         * The function should be called once in the lifetime of a node
         * in the tree. It expects its parent's arrayPath to be up to date.
         *
         * Three cases may arise:
         * 1. if the form element is a simple input field, the value is
         * extracted from previously submitted values of from default values
         * defined in the schema.
         * 2. if the form element is an array-like node, the child template
         * is used to create as many children as possible (and at least one).
         * 3. the function simply recurses down the node's subtree otherwise
         * (this happens when the form element is a fieldset-like element).
         *
         * @function
         * @param {Object} values Previously submitted values for the form
         * @param {Boolean} ignoreDefaultValues Ignore default values defined in the
         *  schema when set.
         * @param {number} topDefaultArrayLevel the top array level of the default value scope, used when
         *  add new item into array, at that time won't consider all default values
         *  above the array schema level.
         *
         * 2016-04-09
         * Coridyn: candidate for refactoring
         */
        FormNode.prototype.computeInitialValues = function (values, ignoreDefaultValues, topDefaultArrayLevel) {
            var _this = this;
            if (ignoreDefaultValues === void 0) { ignoreDefaultValues = false; }
            if (topDefaultArrayLevel === void 0) { topDefaultArrayLevel = 0; }
            var self = this;
            var node = null;
            var nbChildren = 1;
            var i = 0;
            var formData = this.ownerTree.formDesc.tpldata || {};
            // Propagate the array path from the parent node
            // (adding the position of the child for nodes that are direct
            // children of array-like nodes)
            if (this.parentNode) {
                this.arrayPath = _.clone(this.parentNode.arrayPath);
                if (this.parentNode.view && this.parentNode.view.array) {
                    this.arrayPath.push(this.childPos);
                }
            }
            else {
                this.arrayPath = [];
            }
            // Prepare special data param "idx" for templated values
            // (is is the index of the child in its wrapping array, starting
            // at 1 since that's more human-friendly than a zero-based index)
            formData.idx = (this.arrayPath.length > 0) ?
                this.arrayPath[this.arrayPath.length - 1] + 1 :
                this.childPos + 1;
            // Prepare special data param "value" for templated values
            formData.value = '';
            // Prepare special function to compute the value of another field
            formData.getValue = function (key) {
                return getInitialValue(self.ownerTree.formDesc, key, self.arrayPath, formData, !!values);
            };
            if (this.formElement) {
                // Compute the ID of the field (if needed)
                if (this.formElement.id) {
                    this.id = applyArrayPath(this.formElement.id, this.arrayPath);
                }
                else if (this.view && this.view.array) {
                    this.id = jsonform.util.escapeSelector(this.ownerTree.formDesc.prefix) +
                        '-elt-counter-' + _.uniqueId();
                }
                else if (this.parentNode && this.parentNode.view &&
                    this.parentNode.view.array) {
                    // Array items need an array to associate the right DOM element
                    // to the form node when the parent is rendered.
                    this.id = jsonform.util.escapeSelector(this.ownerTree.formDesc.prefix) +
                        '-elt-counter-' + _.uniqueId();
                }
                else if ((this.formElement.type === 'button') ||
                    (this.formElement.type === 'selectfieldset') ||
                    (this.formElement.type === 'question') ||
                    (this.formElement.type === 'buttonquestion')) {
                    // Buttons do need an id for "onClick" purpose
                    this.id = jsonform.util.escapeSelector(this.ownerTree.formDesc.prefix) +
                        '-elt-counter-' + _.uniqueId();
                }
                // Compute the actual key (the form element's key is index-free,
                // i.e. it looks like foo[].bar.baz[].truc, so we need to apply
                // the array path of the node to get foo[4].bar.baz[2].truc)
                if (this.formElement.key) {
                    this.key = applyArrayPath(this.formElement.key, this.arrayPath);
                    this.keydash = this.key.replace(/\./g, '---');
                }
                // Same idea for the field's name
                this.name = applyArrayPath(this.formElement.name, this.arrayPath);
                // Consider that label values are template values and apply the
                // form's data appropriately (note we also apply the array path
                // although that probably doesn't make much sense for labels...)
                _.each([
                    'title',
                    'legend',
                    'description',
                    'append',
                    'prepend',
                    'inlinetitle',
                    'helpvalue',
                    'value',
                    'disabled',
                    // 'required',
                    'placeholder',
                    'readOnly'
                ], function (prop) {
                    if (_.isString(_this.formElement[prop])) {
                        if (_this.formElement[prop].indexOf('{{values.') !== -1) {
                            // This label wants to use the value of another input field.
                            // Convert that construct into {{jsonform.getValue(key)}} for
                            // Underscore to call the appropriate function of formData
                            // when template gets called (note calling a function is not
                            // exactly Mustache-friendly but is supported by Underscore).
                            _this[prop] = _this.formElement[prop].replace(/\{\{values\.([^\}]+)\}\}/g, '{{getValue("$1")}}');
                        }
                        else {
                            // Note applying the array path probably doesn't make any sense,
                            // but some geek might want to have a label "foo[].bar[].baz",
                            // with the [] replaced by the appropriate array path.
                            _this[prop] = applyArrayPath(_this.formElement[prop], _this.arrayPath);
                        }
                        if (_this[prop]) {
                            _this[prop] = jsonform.util._template(_this[prop], formData, jsonform.util.valueTemplateSettings);
                        }
                    }
                    else {
                        _this[prop] = _this.formElement[prop];
                    }
                });
                // Apply templating to options created with "titleMap" as well
                if (this.formElement.options) {
                    this.options = _.map(this.formElement.options, function (option) {
                        var title = null;
                        if (_.isObject(option) && option.title) {
                            // See a few lines above for more details about templating
                            // preparation here.
                            if (option.title.indexOf('{{values.') !== -1) {
                                title = option.title.replace(/\{\{values\.([^\}]+)\}\}/g, '{{getValue("$1")}}');
                            }
                            else {
                                title = applyArrayPath(option.title, self.arrayPath);
                            }
                            return _.extend({}, option, {
                                value: (jsonform.util.isSet(option.value) ? option.value : ''),
                                title: jsonform.util._template(title, formData, jsonform.util.valueTemplateSettings)
                            });
                        }
                        else {
                            return option;
                        }
                    });
                }
            }
            if (this.view && this.view.inputfield && this.schemaElement) {
                // Case 1: simple input field
                if (values) {
                    // Form has already been submitted, use former value if defined.
                    // Note we won't set the field to its default value otherwise
                    // (since the user has already rejected it)
                    if (jsonform.util.isSet(jsonform.util.getObjKey(values, this.key))) {
                        this.value = jsonform.util.getObjKey(values, this.key);
                    }
                }
                else if (!ignoreDefaultValues) {
                    // No previously submitted form result, use default value
                    // defined in the schema if it's available and not already
                    // defined in the form element
                    if (!jsonform.util.isSet(this.value)) {
                        // XXX: the default value could comes from the top upper level default
                        //      value in the schema parent chain, maybe under a certain parent
                        //      level(e.g. when handle new itemn for array)
                        var schemaDefault = getSchemaDefaultByKeyWithArrayIdx(self.ownerTree.formDesc.schema, this.key, topDefaultArrayLevel);
                        if (jsonform.util.isSet(schemaDefault)) {
                            this.value = schemaDefault;
                            if (_.isString(this.value)) {
                                if (this.value.indexOf('{{values.') !== -1) {
                                    // This label wants to use the value of another input field.
                                    // Convert that construct into {{jsonform.getValue(key)}} for
                                    // Underscore to call the appropriate function of formData
                                    // when template gets called (note calling a function is not
                                    // exactly Mustache-friendly but is supported by Underscore).
                                    this.value = this.value.replace(/\{\{values\.([^\}]+)\}\}/g, '{{getValue("$1")}}');
                                }
                                else {
                                    // Note applying the array path probably doesn't make any sense,
                                    // but some geek might want to have a label "foo[].bar[].baz",
                                    // with the [] replaced by the appropriate array path.
                                    this.value = applyArrayPath(this.value, this.arrayPath);
                                }
                                if (this.value) {
                                    this.value = jsonform.util._template(this.value, formData, jsonform.util.valueTemplateSettings);
                                }
                            }
                            this.defaultValue = true;
                        }
                    }
                }
            }
            else if (this.view && this.view.array) {
                // Case 2: array-like node
                nbChildren = 1;
                var minItems = this.getArrayBoundaries().minItems;
                if (values) {
                    var previousArrayValue = jsonform.util.getObjKeyEx(values, this.key);
                    if (previousArrayValue && Array.isArray(previousArrayValue)) {
                        nbChildren = previousArrayValue.length;
                    }
                }
                else if (!ignoreDefaultValues) {
                    var schemaDefault = getSchemaDefaultByKeyWithArrayIdx(self.ownerTree.formDesc.schema, this.key, topDefaultArrayLevel);
                    if (schemaDefault && Array.isArray(schemaDefault)) {
                        nbChildren = schemaDefault.length;
                    }
                }
                else {
                    // If form has already been submitted with no children, the array
                    // needs to be rendered without children. If there are no previously
                    // submitted values, the array gets rendered with one empty item as
                    // it's more natural from a user experience perspective. That item can
                    // be removed with a click on the "-" button.
                    if (minItems >= 0) {
                        nbChildren = 0;
                    }
                }
                for (i = 0; i < nbChildren; i++) {
                    this.appendChild(this.getChildTemplate().clone());
                }
            }
            // Case 3 and in any case: recurse through the list of children
            _.each(this.children, function (child) {
                child.computeInitialValues(values, ignoreDefaultValues, topDefaultArrayLevel);
            });
            // If the node's value is to be used as legend for its "container"
            // (typically the array the node belongs to), ensure that the container
            // has a direct link to the node for the corresponding tab.
            if (this.formElement && this.formElement.valueInLegend) {
                node = this;
                while (node) {
                    if (node.parentNode &&
                        node.parentNode.view &&
                        node.parentNode.view.array) {
                        node.legendChild = this;
                        if (node.formElement && node.formElement.legend) {
                            node.legend = applyArrayPath(node.formElement.legend, node.arrayPath);
                            formData.idx = (node.arrayPath.length > 0) ?
                                node.arrayPath[node.arrayPath.length - 1] + 1 :
                                node.childPos + 1;
                            formData.value = jsonform.util.isSet(this.value) ? this.value : '';
                            node.legend = jsonform.util._template(node.legend, formData, jsonform.util.valueTemplateSettings);
                            break;
                        }
                    }
                    node = node.parentNode;
                }
            }
        };
        /**
         * Returns the structured object that corresponds to the form values entered
         * by the user for the node's subtree.
         *
         * The returned object follows the structure of the JSON schema that gave
         * birth to the form.
         *
         * Obviously, the node must have been rendered before that function may
         * be called.
         *
         * @function
         * @param {Array(Number)} updateArrayPath Array path to use to pretend that
         *  the entered values were actually entered for another item in an array
         *  (this is used to move values around when an item is inserted/removed/moved
         *  in an array)
         * @return {Object} The object that follows the data schema and matches the
         *  values entered by the user.
         *
         * 2016-04-09
         * Coridyn: candidate for refactoring
         */
        FormNode.prototype.getFormValues = function (updateArrayPath) {
            // The values object that will be returned
            var values = {};
            if (!this.el) {
                throw new Error('formNode.getFormValues can only be called on nodes that are associated with a DOM element in the tree');
            }
            // Form fields values
            var formArray = $(':input', this.el).serializeArray();
            // Set values to false for unset checkboxes and radio buttons
            // because serializeArray() ignores them
            formArray = formArray.concat($(':input[type=checkbox]:not(:disabled):not(:checked)[name]', this.el).map(function () {
                return { "name": this.name, "value": this.checked };
            }).get());
            if (updateArrayPath) {
                _.each(formArray, function (param) {
                    param.name = applyArrayPath(param.name, updateArrayPath);
                });
            }
            // The underlying data schema
            var formSchema = this.ownerTree.formDesc.schema;
            for (var i = 0; i < formArray.length; i++) {
                // Retrieve the key definition from the data schema
                var name = formArray[i].name;
                var eltSchema = jsonform.util.getSchemaKey(formSchema.properties, name);
                var arrayMatch = null;
                var cval = null;
                // Skip the input field if it's not part of the schema
                if (!eltSchema)
                    continue;
                // Handle multiple checkboxes separately as the idea is to generate
                // an array that contains the list of enumeration items that the user
                // selected.
                if (eltSchema._jsonform_checkboxes_as_array) {
                    arrayMatch = name.match(/\[([0-9]*)\]$/);
                    if (arrayMatch) {
                        name = name.replace(/\[([0-9]*)\]$/, '');
                        cval = jsonform.util.getObjKey(values, name) || [];
                        if (eltSchema._jsonform_checkboxes_as_array === 'value' && formArray[i].value !== false && formArray[i].value !== '') {
                            // Value selected, push the corresponding enumeration item
                            // to the data result
                            cval.push(formArray[i].value);
                        }
                        else if (eltSchema._jsonform_checkboxes_as_array === true && formArray[i].value === '1') {
                            // Value selected, push the corresponding enumeration item
                            // to the data result
                            cval.push(eltSchema['enum'][parseInt(arrayMatch[1], 10)]);
                        }
                        jsonform.util.setObjKey(values, name, cval);
                        continue;
                    }
                }
                if (eltSchema._jsonform_get_value_by_tagsinput === 'tagsinput') {
                    var vals;
                    if (updateArrayPath) {
                        var oriName = applyArrayPath(name, this.arrayPath);
                        vals = $(':input[name="' + oriName + '"]', this.el).tagsinput('items');
                    }
                    else
                        vals = $(':input[name="' + name + '"]', this.el).tagsinput('items');
                    // this may be called multiple times, but it's ok.
                    jsonform.util.setObjKey(values, name, vals);
                    continue;
                }
                if (name.slice(-2) === '[]') {
                    name = name.slice(0, -2);
                    eltSchema = jsonform.util.getSchemaKey(formSchema.properties, name);
                    if (eltSchema.type === 'array') {
                        cval = jsonform.util.getObjKey(values, name) || [];
                        if (cval.indexOf(formArray[i].value) < 0) {
                            cval.push(formArray[i].value);
                            jsonform.util.setObjKey(values, name, cval);
                        }
                        continue;
                    }
                }
                // Type casting
                if (eltSchema.type === 'boolean') {
                    if (formArray[i].value === '0' || formArray[i].value === 'false') {
                        formArray[i].value = false;
                    }
                    else if (formArray[i].value === '') {
                        formArray[i].value = null;
                    }
                    else {
                        formArray[i].value = !!formArray[i].value;
                    }
                }
                if ((eltSchema.type === 'number') ||
                    (eltSchema.type === 'integer')) {
                    if (_.isString(formArray[i].value)) {
                        if (!formArray[i].value.length) {
                            formArray[i].value = null;
                        }
                        else if (!isNaN(Number(formArray[i].value))) {
                            formArray[i].value = Number(formArray[i].value);
                        }
                    }
                }
                if ((eltSchema.type === 'string') &&
                    (formArray[i].value === '') &&
                    !eltSchema._jsonform_allowEmpty) {
                    formArray[i].value = null;
                }
                if ((eltSchema.type === 'object') &&
                    _.isString(formArray[i].value) &&
                    (formArray[i].value.substring(0, 1) === '{')) {
                    try {
                        formArray[i].value = JSON.parse(formArray[i].value);
                    }
                    catch (e) {
                        formArray[i].value = {};
                    }
                }
                if ((eltSchema.type === 'array') && _.isString(formArray[i].value)) {
                    if (formArray[i].value.substring(0, 1) === '[') {
                        try {
                            formArray[i].value = JSON.parse(formArray[i].value);
                        }
                        catch (e) {
                            formArray[i].value = []; // or null?
                        }
                    }
                    else
                        formArray[i].value = null;
                }
                //TODO is this due to a serialization bug?
                if ((eltSchema.type === 'object') &&
                    (formArray[i].value === 'null' || formArray[i].value === '')) {
                    formArray[i].value = null;
                }
                if (formArray[i].name && (formArray[i].value !== null)) {
                    jsonform.util.setObjKey(values, formArray[i].name, formArray[i].value);
                }
            }
            // console.log("Form value",values);
            return values;
        };
        /**
         * Renders the node.
         *
         * Rendering is done in three steps: HTML generation, DOM element creation
         * and insertion, and an enhance step to bind event handlers.
         *
         * @function
         * @param {Node} el The DOM element where the node is to be rendered. The
         *  node is inserted at the right position based on its "childPos" property.
         */
        FormNode.prototype.render = function (el /*: HTMLElement*/) {
            console.log("(FormNode) render: " + this.key);
            var html = this.generate();
            this.setContent(html, el);
            this.enhance();
        };
        /**
         * Inserts/Updates the HTML content of the node in the DOM.
         *
         * If the HTML is an update, the new HTML content replaces the old one.
         * The new HTML content is not moved around in the DOM in particular.
         *
         * The HTML is inserted at the right position in its parent's DOM subtree
         * otherwise (well, provided there are enough children, but that should always
         * be the case).
         *
         * @function
         * @param {string} html The HTML content to render
         * @param {Node} parentEl The DOM element that is to contain the DOM node.
         *  This parameter is optional (the node's parent is used otherwise) and
         *  is ignored if the node to render is already in the DOM tree.
         */
        FormNode.prototype.setContent = function (html, parentEl /*: HTMLElement*/) {
            var node = $(html);
            var parentNode = parentEl ||
                (this.parentNode ? this.parentNode.el : this.ownerTree.domRoot);
            var nextSibling = null;
            if (this.el) {
                // Replace the contents of the DOM element if the node is already in the tree
                $(this.el).replaceWith(node);
            }
            else {
                /**
                 * Coridyn:
                 * Allow views to expose `view.childSelector` to specify a
                 * custom selector for finding child elements under `parentNode`.
                 *
                 * e.g.
                 * Tables always have 1 element, the header row, so specify a
                 * `childSelector` that will choose child elements after that header row.
                 */
                var childSelector = (this.view && this.view.childSelector) ? this.view.childSelector : '';
                // Insert the node in the DOM if it's not already there
                nextSibling = $(parentNode).children(childSelector).get(this.childPos);
                /* END */
                if (nextSibling) {
                    $(nextSibling).before(node);
                }
                else {
                    $(parentNode).append(node);
                }
            }
            // Save the link between the form node and the generated HTML
            this.el = node;
            // Update the node's subtree, extracting DOM elements that match the nodes
            // from the generated HTML
            this.updateElement(this.el);
        };
        /**
         * Updates the DOM element associated with the node.
         *
         * Only nodes that have ID are directly associated with a DOM element.
         *
         * @function
         */
        FormNode.prototype.updateElement = function (domNode) {
            var _this = this;
            if (this.id) {
                /**
                 * 2013-10-16 - Coridyn:
                 *
                 * Allow the id to be on the current node element.
                 *
                 * Check if the current element is the correct one.
                 * The previous code assumes that the element is a child of `this.el`,
                 * which isn't necessarily the case any more.
                 *
                 * NOTE: The id in the `if` statement should NOT be escaped.
                 */
                if (this.el == null || $(this.el).attr('id') != this.id) {
                    this.el = $('#' + jsonform.util.escapeSelector(this.id), domNode).get(0);
                }
                /* END */
                if (this.view && this.view.getElement) {
                    this.el = this.view.getElement(this.el);
                }
                if ((this.fieldtemplate !== false) &&
                    this.view && this.view.fieldtemplate) {
                    // The field template wraps the element two or three level deep
                    // in the DOM tree, depending on whether there is anything prepended
                    // or appended to the input field
                    this.el = $(this.el).parent().parent();
                    if (this.prepend || this.append) {
                        this.el = this.el.parent();
                    }
                    this.el = this.el.get(0);
                }
                if (this.parentNode && this.parentNode.view &&
                    this.parentNode.view.childTemplate) {
                    // TODO: the child template may introduce more than one level,
                    // so the number of levels introduced should rather be exposed
                    // somehow in jsonform.fieldtemplate.
                    this.el = $(this.el).parent().get(0);
                }
            }
            /**
             * 2016-04-09
             *
             * NOTE: The original `_.each()` invocation here was missing
             * the correct lexical scope!
             *
             * This meant the `this.el` was often undefined and `domNode`
             * was being passed through instead.
             *
             * This means the `ITemplate#getElement()` method probably
             * has the wrong lookup now this is fixed (the jquery
             * lookup path will have changed).
             *
             * Need to review and test to make sure all elements are
             * doing the lookup on the correct element.
             */
            _.each(this.children, function (child) {
                child.updateElement(_this.el || domNode);
            });
        };
        /**
         * Generates the view's HTML content for the underlying model.
         *
         * @function
         */
        FormNode.prototype.generate = function (parentData) {
            var data = {
                id: this.id,
                keydash: this.keydash,
                elt: this.formElement,
                schema: this.schemaElement,
                node: this,
                value: jsonform.util.isSet(this.value) ? this.value : '',
                cls: this.ownerTree.defaultClasses,
                escape: jsonform.util.escapeHTML,
                children: '',
                fieldHtmlClass: ''
            };
            var template = null;
            var html = '';
            var keyOnParent = this.formElement ? this.formElement.keyOnParent : null;
            console.log("(FormNode) generate: keyOnParent=" + keyOnParent + ", required?=" + this.required);
            // Complete the data context if needed
            if (this.ownerTree.formDesc.onBeforeRender) {
                this.ownerTree.formDesc.onBeforeRender(data, this);
            }
            if (this.view.onBeforeRender) {
                this.view.onBeforeRender(data, this);
            }
            // Use the template that 'onBeforeRender' may have set,
            // falling back to that of the form element otherwise
            if (this.template) {
                template = this.template;
            }
            else if (this.formElement && this.formElement.template) {
                template = this.formElement.template;
            }
            else {
                template = this.view.template;
            }
            // Wrap the view template in the generic field template
            // (note the strict equality to 'false', needed as we fallback
            // to the view's setting otherwise)
            if ((this.fieldtemplate !== false) &&
                (this.fieldtemplate || this.view.fieldtemplate)) {
                template = jsonform.fieldTemplate(template);
            }
            // Wrap the content in the child template of its parent if necessary.
            if (this.parentNode && this.parentNode.view &&
                this.parentNode.view.childTemplate) {
                // Original:
                // template = this.parentNode.view.childTemplate(template, this.parentNode);
                /**
                 * 2015-02-28 Coridyn:
                 * Pass the current node data to the parent processor as the third parameter.
                 *
                 * This lets us do more-specific processing for each child.
                 */
                template = this.parentNode.view.childTemplate(template, data, this, parentData, this.parentNode);
            }
            // Prepare the HTML of the children
            var childrenhtml = '';
            /**
             * 2015-02-28 Coridyn:
             *
             * Keep track of the rendered child template.
             */
            _.each(this.children, function (child) {
                // Original:
                // childrenhtml += child.generate();
                var renderedChild = child.generate(data);
                if (child.parentNode &&
                    child.parentNode.view &&
                    child.parentNode.view.afterChildTemplate) {
                    renderedChild = child.parentNode.view.afterChildTemplate(renderedChild, child, child.parentNode);
                }
                childrenhtml += renderedChild;
            });
            /* END */
            data.children = childrenhtml;
            data.fieldHtmlClass = '';
            if (this.ownerTree &&
                this.ownerTree.formDesc &&
                this.ownerTree.formDesc.params &&
                this.ownerTree.formDesc.params.fieldHtmlClass) {
                data.fieldHtmlClass = this.ownerTree.formDesc.params.fieldHtmlClass;
            }
            if (this.formElement &&
                (typeof this.formElement.fieldHtmlClass !== 'undefined')) {
                data.fieldHtmlClass = this.formElement.fieldHtmlClass;
            }
            /**
             * 2013-10-16 Coridyn:
             * Add another callback here so we can perform finalisation
             * of the template just before it is rendered.
             *
             * onAfterRender(data, node);
             *
             * It's called `onAfterRender` to be consistent with
             * `onBeforeRender` but the template hasn't really
             * been rendered yet...
             */
            if (this.ownerTree.formDesc.onAfterRender) {
                this.ownerTree.formDesc.onAfterRender(data, this);
            }
            if (this.view.onAfterRender) {
                this.view.onAfterRender(data, this);
            }
            /* END */
            // Apply the HTML template
            html = jsonform.util._template(template, data, jsonform.util.fieldTemplateSettings);
            return html;
        };
        /**
         * Enhances the view with additional logic, binding event handlers
         * in particular.
         *
         * The function also runs the "insert" event handler of the view and
         * form element if they exist (starting with that of the view)
         *
         * @function
         *
         * 2016-04-09
         * Coridyn: candidate for refactoring
         */
        FormNode.prototype.enhance = function () {
            var _this = this;
            var node = this;
            var handlers = null;
            var handler = null;
            var formData = _.clone(this.ownerTree.formDesc.tpldata) || {};
            // Debugging - Coridyn: Callback to form-level onInsert method.
            // Always call this regardless of if there is a formElement.
            if (this.ownerTree.formDesc.onInsert) {
                // Coridyn: Need information about the parent element or the parent tree.
                this.ownerTree.formDesc.onInsert({ target: $(this.el) }, this);
            }
            // End of debugging.
            if (this.formElement) {
                // Check the view associated with the node as it may define an "onInsert"
                // event handler to be run right away
                if (this.view.onInsert) {
                    this.view.onInsert({ target: $(this.el) }, this);
                }
                handlers = this.handlers || this.formElement.handlers;
                // Trigger the "insert" event handler
                handler = this.onInsert || this.formElement.onInsert;
                if (handler) {
                    handler({ target: $(this.el) }, this);
                }
                if (handlers) {
                    _.each(handlers, function (handler, onevent) {
                        if (onevent === 'insert') {
                            handler({ target: $(this.el) }, this);
                        }
                    }, this);
                }
                // No way to register event handlers if the DOM element is unknown
                // TODO: find some way to register event handlers even when this.el is not set.
                if (this.el) {
                    // Register specific event handlers
                    // TODO: Add support for other event handlers
                    if (this.onChange)
                        $(this.el).bind('change', function (evt) { node.onChange(evt, node); });
                    if (this.view.onChange)
                        $(this.el).bind('change', function (evt) { node.view.onChange(evt, node); });
                    if (this.formElement.onChange)
                        $(this.el).bind('change', function (evt) { node.formElement.onChange(evt, node); });
                    if (this.onClick)
                        $(this.el).bind('click', function (evt) { node.onClick(evt, node); });
                    if (this.view.onClick)
                        $(this.el).bind('click', function (evt) { node.view.onClick(evt, node); });
                    if (this.formElement.onClick)
                        $(this.el).bind('click', function (evt) { node.formElement.onClick(evt, node); });
                    if (this.onKeyUp)
                        $(this.el).bind('keyup', function (evt) { node.onKeyUp(evt, node); });
                    if (this.view.onKeyUp)
                        $(this.el).bind('keyup', function (evt) { node.view.onKeyUp(evt, node); });
                    if (this.formElement.onKeyUp)
                        $(this.el).bind('keyup', function (evt) { node.formElement.onKeyUp(evt, node); });
                    if (handlers) {
                        _.each(handlers, function (handler, onevent) {
                            if (onevent !== 'insert') {
                                $(this.el).bind(onevent, function (evt) { handler(evt, node); });
                            }
                        }, this);
                    }
                }
                // Auto-update legend based on the input field that's associated with it
                if (this.formElement.legend && this.legendChild && this.legendChild.formElement) {
                    $(this.legendChild.el).on('keyup', function (e) {
                        _this._onLegendChildChange(e, node, formData);
                    });
                    $(this.legendChild.el).on('change', function (e) {
                        _this._onLegendChildChange(e, node, formData);
                    });
                }
            }
            // Recurse down the tree to enhance children
            _.each(this.children, function (child) {
                child.enhance();
            });
        };
        /**
         * 2017-02-07
         * This function was split out of `enhance()` because nested function definitions aren't
         * allowed in strict mode.
         *
         * Intead we've made the event listener a member method here.
         *
         * @param {Event}            evt      [description]
         * @param {FormNode}          node     [description]
         * @param {IFormTemplateData} formData [description]
         */
        FormNode.prototype._onLegendChildChange = function (evt, node, formData) {
            if (node.formElement && node.formElement.legend && node.parentNode) {
                var legendTmpl = applyArrayPath(node.formElement.legend, node.arrayPath);
                formData.idx = (node.arrayPath.length > 0) ?
                    node.arrayPath[node.arrayPath.length - 1] + 1 :
                    node.childPos + 1;
                formData.value = $(evt.target).val();
                node.legend = jsonform.util._template(legendTmpl, formData, jsonform.util.valueTemplateSettings);
                $(node.parentNode.el).trigger('legendUpdated');
            }
        };
        /**
         * Inserts an item in the array at the requested position and renders the item.
         *
         * @function
         * @param {Number} idx Insertion index
         */
        FormNode.prototype.insertArrayItem = function (idx, domElement /*: HTMLElement*/) {
            var i = 0;
            // Insert element at the end of the array if index is not given
            if (idx === undefined) {
                idx = this.children.length;
            }
            // Create the additional array item at the end of the list,
            // using the item template created when tree was initialized
            // (the call to resetValues ensures that 'arrayPath' is correctly set)
            var child = this.getChildTemplate().clone();
            this.appendChild(child);
            child.resetValues();
            // To create a blank array item at the requested position,
            // shift values down starting at the requested position
            // one to insert (note we start with the end of the array on purpose)
            for (i = this.children.length - 2; i >= idx; i--) {
                this.children[i].moveValuesTo(this.children[i + 1]);
            }
            // Initialize the blank node we've created with default values
            this.children[idx].resetValues();
            // XXX: new array item won't follow upper level default.
            this.children[idx].computeInitialValues(null, false, this.children[idx].arrayPath.length);
            // Re-render all children that have changed
            for (i = idx; i < this.children.length; i++) {
                this.children[i].render(domElement);
            }
        };
        /**
         * Remove an item from an array
         *
         * @function
         * @param {Number} idx The index number of the item to remove
         */
        FormNode.prototype.deleteArrayItem = function (idx) {
            var i = 0;
            var child = null;
            // Delete last item if no index is given
            if (idx === undefined) {
                idx = this.children.length - 1;
            }
            // Move values up in the array
            for (i = idx; i < this.children.length - 1; i++) {
                this.children[i + 1].moveValuesTo(this.children[i]);
                this.children[i].render();
            }
            // Remove the last array item from the DOM tree and from the form tree
            this.removeChild();
        };
        /**
         * Returns the minimum/maximum number of items that an array field
         * is allowed to have according to the schema definition of the fields
         * it contains.
         *
         * The function parses the schema definitions of the array items that
         * compose the current "array" node and returns the minimum value of
         * "maxItems" it encounters as the maximum number of items, and the
         * maximum value of "minItems" as the minimum number of items.
         *
         * The function reports a -1 for either of the boundaries if the schema
         * does not put any constraint on the number of elements the current
         * array may have of if the current node is not an array.
         *
         * Note that array boundaries should be defined in the JSON Schema using
         * "minItems" and "maxItems". The code also supports "minLength" and
         * "maxLength" as a fallback, mostly because it used to by mistake (see #22)
         * and because other people could make the same mistake.
         *
         * @function
         * @return {Object} An object with properties "minItems" and "maxItems"
         *  that reports the corresponding number of items that the array may
         *  have (value is -1 when there is no constraint for that boundary)
         */
        FormNode.prototype.getArrayBoundaries = function () {
            var boundaries = {
                minItems: -1,
                maxItems: -1
            };
            if (!this.view || !this.view.array)
                return boundaries;
            var getNodeBoundaries = function (node, initialNode) {
                var schemaKey = null;
                var arrayKey = null;
                var boundaries = {
                    minItems: -1,
                    maxItems: -1
                };
                initialNode = initialNode || node;
                if (node.view && node.view.array && (node !== initialNode)) {
                    // New array level not linked to an array in the schema,
                    // so no size constraints
                    return boundaries;
                }
                if (node.key) {
                    // Note the conversion to target the actual array definition in the
                    // schema where minItems/maxItems may be defined. If we're still looking
                    // at the initial node, the goal is to convert from:
                    //  foo[0].bar[3].baz to foo[].bar[].baz
                    // If we're not looking at the initial node, the goal is to look at the
                    // closest array parent:
                    //  foo[0].bar[3].baz to foo[].bar
                    arrayKey = node.key.replace(/\[[0-9]+\]/g, '[]');
                    if (node !== initialNode) {
                        arrayKey = arrayKey.replace(/\[\][^\[\]]*$/, '');
                    }
                    schemaKey = jsonform.util.getSchemaKey(node.ownerTree.formDesc.schema.properties, arrayKey);
                    if (!schemaKey)
                        return boundaries;
                    if (schemaKey.minItems >= 0) {
                        boundaries.minItems = schemaKey.minItems;
                    }
                    if (schemaKey.minLength >= 0) {
                        boundaries.minItems = schemaKey.minLength;
                    }
                    if (schemaKey.maxItems >= 0) {
                        boundaries.maxItems = schemaKey.maxItems;
                    }
                    if (schemaKey.maxLength >= 0) {
                        boundaries.maxItems = schemaKey.maxLength;
                    }
                    return boundaries;
                }
                else {
                    _.each(node.children, function (child) {
                        var subBoundaries = getNodeBoundaries(child, initialNode);
                        if (subBoundaries.minItems !== -1) {
                            if (boundaries.minItems !== -1) {
                                boundaries.minItems = Math.max(boundaries.minItems, subBoundaries.minItems);
                            }
                            else {
                                boundaries.minItems = subBoundaries.minItems;
                            }
                        }
                        if (subBoundaries.maxItems !== -1) {
                            if (boundaries.maxItems !== -1) {
                                boundaries.maxItems = Math.min(boundaries.maxItems, subBoundaries.maxItems);
                            }
                            else {
                                boundaries.maxItems = subBoundaries.maxItems;
                            }
                        }
                    });
                }
                return boundaries;
            };
            return getNodeBoundaries(this);
        };
        /**
         * Return the FormNode's IFormElement instance
         * or any empty object placeholder to avoid null
         * pointer exceptions.
         */
        FormNode.prototype.getFormElement = function () {
            return this.formElement || {};
        };
        return FormNode;
    }());
    jsonform.FormNode = FormNode;
    /**
     * Returns the initial value that a field identified by its key
     * should take.
     *
     * The "initial" value is defined as:
     * 1. the previously submitted value if already submitted
     * 2. the default value defined in the layout of the form
     * 3. the default value defined in the schema
     *
     * The "value" returned is intended for rendering purpose,
     * meaning that, for fields that define a titleMap property,
     * the function returns the label, and not the intrinsic value.
     *
     * The function handles values that contains template strings,
     * e.g. {{values.foo[].bar}} or {{idx}}.
     *
     * When the form is a string, the function truncates the resulting string
     * to meet a potential "maxLength" constraint defined in the schema, using
     * "..." to mark the truncation. Note it does not validate the resulting
     * string against other constraints (e.g. minLength, pattern) as it would
     * be hard to come up with an automated course of action to "fix" the value.
     *
     * @function
     * @param {Object} formDesc The JSON Form object
     * @param {String} key The generic key path (e.g. foo[].bar.baz[])
     * @param {Array(Number)} arrayPath The array path that identifies
     *  the unique value in the submitted form (e.g. [1, 3])
     * @param {Object} tpldata Template data object
     * @param {Boolean} usePreviousValues true to use previously submitted values
     *  if defined.
     *
     * 2016-04-09
     * Coridyn: candidate for refactoring
     */
    function getInitialValue(formDesc, key, arrayPath, tpldata, usePreviousValues) {
        var value = null;
        // Complete template data for template function
        tpldata = tpldata || {};
        tpldata.idx = tpldata.idx ||
            (arrayPath ? arrayPath[arrayPath.length - 1] : 1);
        tpldata.value = jsonform.util.isSet(tpldata.value) ? tpldata.value : '';
        tpldata.getValue = tpldata.getValue || function (key) {
            return getInitialValue(formDesc, key, arrayPath, tpldata, usePreviousValues);
        };
        // Helper function that returns the form element that explicitly
        // references the given key in the schema.
        var getFormElement = function (elements, key) {
            var formElement = null;
            if (!elements || !elements.length)
                return null;
            _.each(elements, function (elt) {
                if (formElement)
                    return;
                if (elt === key) {
                    formElement = { key: elt };
                    return;
                }
                if (_.isString(elt))
                    return;
                if (elt.key === key) {
                    formElement = elt;
                }
                else if (elt.items) {
                    formElement = getFormElement(elt.items, key);
                }
            });
            return formElement;
        };
        var formElement = getFormElement(formDesc.form || [], key);
        var schemaElement = jsonform.util.getSchemaKey(formDesc.schema.properties, key);
        if (usePreviousValues && formDesc.value) {
            // If values were previously submitted, use them directly if defined
            value = jsonform.util.getObjKey(formDesc.value, applyArrayPath(key, arrayPath));
        }
        if (!jsonform.util.isSet(value)) {
            if (formElement && (typeof formElement['value'] !== 'undefined')) {
                // Extract the definition of the form field associated with
                // the key as it may override the schema's default value
                // (note a "null" value overrides a schema default value as well)
                value = formElement['value'];
            }
            else if (schemaElement) {
                // Simply extract the default value from the schema
                if (jsonform.util.isSet(schemaElement['default'])) {
                    value = schemaElement['default'];
                }
            }
            if (value && value.indexOf('{{values.') !== -1) {
                // This label wants to use the value of another input field.
                // Convert that construct into {{getValue(key)}} for
                // Underscore to call the appropriate function of formData
                // when template gets called (note calling a function is not
                // exactly Mustache-friendly but is supported by Underscore).
                value = value.replace(/\{\{values\.([^\}]+)\}\}/g, '{{getValue("$1")}}');
            }
            if (value) {
                value = jsonform.util._template(value, tpldata, jsonform.util.valueTemplateSettings);
            }
        }
        // TODO: handle on the formElement.options, because user can setup it too.
        // Apply titleMap if needed
        if (jsonform.util.isSet(value) && formElement && jsonform.util.hasOwnProperty(formElement.titleMap, value)) {
            value = jsonform.util._template(formElement.titleMap[value], tpldata, jsonform.util.valueTemplateSettings);
        }
        // Check maximum length of a string
        if (value && _.isString(value) &&
            schemaElement && schemaElement.maxLength) {
            if (value.length > schemaElement.maxLength) {
                // Truncate value to maximum length, adding continuation dots
                value = value.substr(0, schemaElement.maxLength - 1) + '…';
            }
        }
        if (!jsonform.util.isSet(value)) {
            return null;
        }
        else {
            return value;
        }
    }
    jsonform.getInitialValue = getInitialValue;
    /**
     * Applies the array path to the key path.
     *
     * For instance, if the key path is:
     *  foo.bar[].baz.toto[].truc[].bidule
     * and the arrayPath [4, 2], the returned key will be:
     *  foo.bar[4].baz.toto[2].truc[].bidule
     *
     * @function
     * @param {String} key The path to the key in the schema, each level being
     *  separated by a dot and array items being flagged with [].
     * @param {Array(Number)} arrayPath The array path to apply, e.g. [4, 2]
     * @return {String} The path to the key that matches the array path.
     */
    function applyArrayPath(key, arrayPath) {
        var depth = 0;
        if (!key)
            return null;
        if (!arrayPath || (arrayPath.length === 0))
            return key;
        var newKey = key.replace(jsonform.util.reArray, function (str, p1) {
            // Note this function gets called as many times as there are [x] in the ID,
            // from left to right in the string. The goal is to replace the [x] with
            // the appropriate index in the new array path, if defined.
            var newIndex = str;
            if (jsonform.util.isSet(arrayPath[depth])) {
                newIndex = '[' + arrayPath[depth] + ']';
            }
            depth += 1;
            return newIndex;
        });
        return newKey;
    }
    jsonform.applyArrayPath = applyArrayPath;
    /**
     * Retrieves the key default value from the given schema.
     *
     * The key is identified by the path that leads to the key in the
     * structured object that the schema would generate. Each level is
     * separated by a '.'. Array levels are marked with [idx]. For instance:
     *  foo.bar[3].baz
     * ... to retrieve the definition of the key at the following location
     * in the JSON schema (using a dotted path notation):
     *  foo.properties.bar.items.properties.baz
     *
     * @function
     * @param {Object} schema The top level JSON schema to retrieve the key from
     * @param {String} key The path to the key, each level being separated
     *  by a dot and array items being flagged with [idx].
     * @param {Number} top array level of schema within it we search the default.
     * @return {Object} The key definition in the schema, null if not found.
     */
    function getSchemaDefaultByKeyWithArrayIdx(schema, key, topDefaultArrayLevel) {
        topDefaultArrayLevel = topDefaultArrayLevel || 0;
        var defaultValue = undefined;
        if (!jsonform.util.isSet(key) || key === '') {
            if (topDefaultArrayLevel == 0)
                defaultValue = schema.default;
        }
        else if (schema.default && topDefaultArrayLevel == 0) {
            defaultValue = jsonform.util.getObjKeyEx(schema.default, key);
        }
        else {
            var m = key.match(/^((([^\\\[.]|\\.)+)|\[(\d+)\])\.?(.*)$/);
            if (!m)
                throw new Error('bad format key: ' + key);
            if (typeof m[2] === 'string' && m[2].length > 0) {
                schema = schema.properties[m[2]];
            }
            else if (typeof m[4] === 'string' && m[4].length > 0) {
                schema = schema.items;
                if (topDefaultArrayLevel > 0)
                    --topDefaultArrayLevel;
            }
            else
                throw new Error('impossible reach here');
            if (schema) {
                if (schema.default && topDefaultArrayLevel == 0) {
                    defaultValue = jsonform.util.getObjKeyEx(schema.default, m[5]);
                }
                else {
                    defaultValue = getSchemaDefaultByKeyWithArrayIdx(schema, m[5], topDefaultArrayLevel);
                }
            }
        }
        return defaultValue;
    }
    jsonform.getSchemaDefaultByKeyWithArrayIdx = getSchemaDefaultByKeyWithArrayIdx;
})(jsonform || (jsonform = {}));
var jsonform;
(function (jsonform) {
    var global = jsonform.util.global;
    var $ = jsonform.util.$;
    var _ = jsonform.util._;
    /**
     * Form tree class.
     *
     * Holds the internal representation of the form.
     * The tree is always in sync with the rendered form, this allows to parse
     * it easily.
     *
     * @class
     */
    var FormTree = (function () {
        function FormTree() {
            // From `formTree` constructor
            this.root = null;
            this.formDesc = null;
            // Used by class
            this.domRoot = null;
            this.defaultClasses = null;
            /**
             * This placeholder schemaElement will be given to all
             * FormNodes that don't otherwise have a schemaElement
             * associated with them.
             *
             * This should avoid a lot of null-pointer checks/exceptions.
             *
             * @private
             */
            this._dummySchemaElement = {
                type: 'DUMMY_SCHEMA_ELEMENT'
            };
        }
        /**
         * Initializes the form tree structure from the JSONForm object
         *
         * This function is the main entry point of the JSONForm library.
         *
         * Initialization steps:
         * 1. the internal tree structure that matches the JSONForm object
         *  gets created (call to buildTree)
         * 2. initial values are computed from previously submitted values
         *  or from the default values defined in the JSON schema.
         *
         * When the function returns, the tree is ready to be rendered through
         * a call to "render".
         *
         * @function
         *
         *
         * 2016-04-09
         * Coridyn: candidate for refactoring
         */
        FormTree.prototype.initialize = function (formDesc) {
            formDesc = formDesc || {
                schema: {}
            };
            // Keep a pointer to the initial JSONForm
            // (note clone returns a shallow copy, only first-level is cloned)
            this.formDesc = _.clone(formDesc);
            var defaultClasses = jsonform.getDefaultClasses(this.formDesc.isBootstrap2 || jsonform.isBootstrap2);
            this.defaultClasses = _.clone(defaultClasses);
            if (this.formDesc.defaultClasses) {
                _.extend(this.defaultClasses, this.formDesc.defaultClasses);
            }
            // Compute form prefix if no prefix is given.
            this.formDesc.prefix = this.formDesc.prefix ||
                'jsonform-' + _.uniqueId();
            /**
             * 2016-05-01
             * Normalise the jsonform shorthand schema back into a proper full schema object.
             */
            this.formDesc.schema = this._normaliseRootSchema(this.formDesc.schema);
            /**
             * Rewrite V3 schema to V4
             */
            this._convertSchemaV3ToV4(this.formDesc.schema);
            if (this.formDesc.schema.definitions) {
                for (var definition in this.formDesc.schema.definitions) {
                    this._convertSchemaV3ToV4(this.formDesc.schema.definitions[definition]);
                }
            }
            this.formDesc._originalSchema = this.formDesc.schema;
            this.formDesc.schema = JSON.parse(JSON.stringify(this.formDesc.schema));
            /**
             * Resolve inline $ref definitions, result schema not work with z-schema so
             * it will be passed `_originalSchema`.
             */
            if (this.formDesc.schema.definitions) {
                this._resolveRefs(this.formDesc.schema, this.formDesc.schema.definitions);
            }
            // Ensure layout is set
            this.formDesc.form = this.formDesc.form || this._getDefaultFormElements();
            // Ensure `formDesc.form` is an array.
            this.formDesc.form = [].concat(this.formDesc.form);
            this.formDesc.params = this.formDesc.params || {};
            // Create the root of the tree
            this.root = this._getRootNode(this.formDesc.schema);
            // Generate the tree from the form description
            this.buildTree();
            // Compute the values associated with each node
            // (for arrays, the computation actually creates the form nodes)
            this.computeInitialValues();
        };
        /**
         * If we've been given a shorthand schema object then
         * expand it back out to a proper top-level schema object.
         *
         * @private
         */
        FormTree.prototype._normaliseRootSchema = function (rootSchema) {
            if (!rootSchema) {
                return rootSchema;
            }
            // TODO: Do we need to handle top-level array types?
            if (!rootSchema.properties) {
                /*
                // Rewrite a shorthand schema:
                {
                    "schema": {
                        "message": {
                            "type": "string",
                            "title": "Message"
                        },
                        "author": {
                            "type": "object",
                            "title": "Author",
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "title": "Name"
                                },
                            }
                        }
                    }
                }
                
                // Into a proper schema object:
                {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "message": {
                                "type": "string",
                                "title": "Message"
                            },
                            "author": {
                                "type": "object",
                                "title": "Author",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "title": "Name"
                                    },
                                }
                            }
                        }
                    }
                }
                */
                rootSchema = {
                    type: 'object',
                    properties: rootSchema
                };
            }
            else if (!rootSchema.type) {
                // Make sure we have a type.
                rootSchema.type = 'object';
            }
            return rootSchema;
        };
        /**
         * Initialise the root node.
         *
         * NOTE: We assign `schemaRoot` as `root.schemaElement` so
         * top-level required fields work with V4 schemas.
         *
         * @private
         */
        FormTree.prototype._getRootNode = function (schemaRoot) {
            var root = new jsonform.FormNode();
            root.ownerTree = this;
            root.view = jsonform.elementTypes['root'];
            root.schemaElement = schemaRoot;
            return root;
        };
        /**
         * Recurse through the schema structure and convert
         * jsonschemaV3 to jsonschemav4 structure.
         *
         * Generally this involves:
         *  - shift `required: true` properties up to the parent's
         *    `required: string[]` list.
         *
         *  - Make sure `array.items` is explicitly an object and not an array/tuple
         *    (i.e. enforce jsonform array schema limitation - all arrays must contain the same type)
         *
         * @param schema
         * @param processedSchemaNodes List of visited nodes - to avoid circular references.
         * @private
         */
        FormTree.prototype._convertSchemaV3ToV4 = function (_schema, processedSchemaNodes, parentSchemaProxy, keys) {
            if (processedSchemaNodes === void 0) { processedSchemaNodes = []; }
            if (parentSchemaProxy === void 0) { parentSchemaProxy = null; }
            if (keys === void 0) { keys = []; }
            if (!_schema) {
                // return schema;
                return;
            }
            var schema = _schema;
            if (_schema.schema) {
                // Unwrap incorrectly wrapped objects.
                schema = _schema.schema;
            }
            if (_.has(schema, 'readonly')) {
                schema.readOnly = schema['readonly'];
                delete schema.readonly;
            }
            /**
             * Check `required` property of this schema element.
             */
            if (schema.required === true) {
                var field = keys[keys.length - 1];
                // Check that `parentSchema` exists and has a list of required properties.
                if (parentSchemaProxy && parentSchemaProxy.required && parentSchemaProxy.required.indexOf(field) < 0) {
                    // Append to parent object's required list.
                    parentSchemaProxy.required.push(field);
                }
                else if (schema.type == 'string') {
                    // Special handling for different types and at different levels.
                    // We set a minimum string length as a proxy for `required`.
                    schema.minLength = schema.minLength || 1;
                }
                // TODO: Handle number (and other) types.
                // Remove `required` property from this child.
                delete schema.required;
            }
            else if (schema.required !== undefined && schema.required !== false && !Array.isArray(schema.required)) {
                throw new Error("field \"" + keys.join('.') + "\"'s required property should be either boolean or array of strings");
            }
            /**
             * Object and array handling.
             *
             * Choose which object to recurse into: `schema.properties` or `schema.items`
             */
            if (schema.properties) {
                // 'object' type.
                var required = _.isArray(schema.required) ? schema.required.concat() : [];
                var schemaProxy = {
                    required: required
                };
                /**
                 * Add each required child element to our `required` list.
                 */
                for (var field in schema.properties) {
                    var childSchema /*: ISchemaElement*/ = schema.properties[field];
                    if (childSchema && processedSchemaNodes.indexOf(childSchema) < 0) {
                        processedSchemaNodes.push(childSchema);
                        keys.push(field);
                        this._convertSchemaV3ToV4(childSchema, processedSchemaNodes, schemaProxy, keys);
                        keys.pop();
                    }
                }
                /**
                 * Schema V4 doesn't allow the `required` array to be empty if it is present :|
                 * So we'll only add it if it's not empty and will remove it otherwise.
                 */
                if (schemaProxy.required.length) {
                    schema.required = schemaProxy.required;
                }
                else if (schemaProxy.required.length == 0 && schema.required) {
                    delete schema.required;
                }
            }
            else if (schema.type == 'array') {
                // 'array' type.
                if (schema.items) {
                    if (Array.isArray(schema.items)) {
                        if (schema.items.length == 0) {
                            schema.items = {};
                        }
                        else if (schema.items.length == 1) {
                            schema.items = schema.items[0];
                        }
                        else if (schema.items.length > 1) {
                            throw new Error("the items property of array property \"" + keys.join('.') + "\" is an array with multiple definitions. The array 'items' must be an object, or array with a single element.");
                        }
                    }
                    // Process the array items in the same way
                    if (processedSchemaNodes.indexOf(schema.items) < 0) {
                        processedSchemaNodes.push(schema.items);
                        this._convertSchemaV3ToV4(schema.items, processedSchemaNodes, schema, keys);
                    }
                }
            }
            /**
             * TODO: Duplicate the object and omit the unnecessary properties.
             *
             * TODO: This might mess with the circular-reference detection...
             * Maybe just do a deep clone right at the end?
             */
            // schema = _.omit(schema, omitList);
            return _schema;
        };
        /**
         * Process $ref properties.
         *
         * Resolve them by replacing {$ref: string} with the actual
         * schema representation.
         *
         * @param obj
         * @param defs
         * @private
         */
        FormTree.prototype._resolveRefs = function (obj, defs, resolvedSchemaRefNodes) {
            var _this = this;
            // TODO: Resolve nested $ref in `defs` first, then check `obj`.
            if (!resolvedSchemaRefNodes) {
                resolvedSchemaRefNodes = [];
            }
            // Object.keys(obj).forEach(function(prop, index, array) {
            _.forEach(obj, function (def, prop) {
                if (def !== null && typeof def === 'object') {
                    if (def.$ref) {
                        if (def.$ref.slice(0, 14) === '#/definitions/') {
                            var ref = def.$ref.replace(/^#\/definitions\//, '');
                            obj[prop] = defs[ref];
                        }
                        else {
                            console.log('Unresolved $ref: ' + def.$ref);
                        }
                    }
                    else if (resolvedSchemaRefNodes.indexOf(def) < 0) {
                        resolvedSchemaRefNodes.push(def);
                        _this._resolveRefs(def, defs, resolvedSchemaRefNodes);
                    }
                }
            });
            return obj;
        };
        /**
         * Return the default FormElement definition.
         *
         * This is a shorthand for include all schema elements and
         * then append an 'actions' element with a submit button.
         *
         * @private
         */
        FormTree.prototype._getDefaultFormElements = function () {
            return [
                '*',
                {
                    type: 'actions',
                    items: [
                        {
                            type: 'submit',
                            value: 'Submit'
                        }
                    ]
                }
            ];
        };
        /**
         * Constructs the tree from the form description.
         *
         * The function must be called once when the tree is first created.
         *
         * @function
         */
        FormTree.prototype.buildTree = function () {
            var _this = this;
            // Parse and generate the form structure based on the elements encountered:
            // - '*' means "generate all possible fields using default layout"
            // - a key reference to target a specific data element
            // - a more complex object to generate specific form sections
            _.each(this.formDesc.form, function (formElement) {
                if (formElement === '*') {
                    _.each(_this.formDesc.schema.properties, function (element, key) {
                        if (_this.formDesc.nonDefaultFormItems && _this.formDesc.nonDefaultFormItems.indexOf(key) >= 0) {
                            return;
                        }
                        /**
                         * 2016-04-10
                         * We might need to try and interpole the `keyOnParent`
                         * because the key might be a complex 'a.b.c[2]' path.
                         */
                        _this.root.appendChild(_this.buildFromLayout({
                            key: key,
                            keyOnParent: key
                        }));
                    });
                }
                else {
                    if (_.isString(formElement)) {
                        formElement = {
                            key: formElement,
                            keyOnParent: formElement
                        };
                    }
                    _this.root.appendChild(_this.buildFromLayout(formElement));
                }
            });
        };
        /**
         * Builds the internal form tree representation from the requested layout.
         *
         * The function is recursive, generating the node children as necessary.
         * The function extracts the values from the previously submitted values
         * (this.formDesc.value) or from default values defined in the schema.
         *
         * @function
         * @param {Object} formElement JSONForm element to render
         * @param {Object} context The parsing context (the array depth in particular)
         * @return {FormNode} The node that matches the element.
         *
         * 2016-04-09
         * Coridyn: candidate for refactoring
         */
        FormTree.prototype.buildFromLayout = function (formElement, context) {
            var _this = this;
            var schemaElement = null;
            var node = new jsonform.FormNode();
            var view = null;
            var key = null;
            // XXX: we now support setup formElement for specific key by customFormItems
            if (formElement.key && this.formDesc.customFormItems) {
                var formEl = this.formDesc.customFormItems[formElement.key];
                if (formEl !== undefined) {
                    formEl.key = formElement.key;
                    formEl.keyOnParent = formElement.keyOnParent;
                    formElement = formEl;
                }
            }
            // The form element parameter directly comes from the initial
            // JSONForm object. We'll make a shallow copy of it and of its children
            // not to pollute the original object.
            // (note JSON.parse(JSON.stringify()) cannot be used since there may be
            // event handlers in there!)
            formElement = _.clone(formElement);
            if (formElement.items) {
                if (_.isArray(formElement.items)) {
                    formElement.items = _.map(formElement.items, _.clone);
                }
                else {
                    formElement.items = [_.clone(formElement.items)];
                }
            }
            if (formElement.key) {
                // Get the schemaElement and update formElement properties.
                schemaElement = this._getSchemaElementByFormElementKey(formElement);
            }
            else {
                // Debug: find out what is creating nodes without keys.
                // Answer: Elements defined in the top-level `{ form: [] }`
                // list - i.e. controls that are shown on-screen but aren't linked
                // with a schema element.
                var a = true;
            }
            formElement.type = formElement.type || 'text';
            view = jsonform.elementTypes[formElement.type];
            if (!view) {
                throw new Error('The JSONForm contains an element whose type is unknown: "' +
                    formElement.type + '"');
            }
            if (schemaElement) {
                // The form element is linked to an element in the schema.
                // Let's make sure the types are compatible.
                // In particular, the element must not be a "container"
                // (or must be an "object" or "array" container)
                if (!view.inputfield && !view.array &&
                    (formElement.type !== 'selectfieldset') &&
                    (schemaElement.type !== 'object')) {
                    throw new Error('The JSONForm contains an element that links to an ' +
                        'element in the JSON schema (key: "' + formElement.key + '") ' +
                        'and that should not based on its type ("' + formElement.type + '")');
                }
            }
            else {
                // The form element is not linked to an element in the schema.
                // This means the form element must be a "container" element,
                // and must not define an input field.
                if (view.inputfield && (formElement.type !== 'selectfieldset')) {
                    throw new Error('The JSONForm defines an element of type ' +
                        '"' + formElement.type + '" ' +
                        'but no "key" property to link the input field to the JSON schema');
                }
            }
            // A few characters need to be escaped to use the ID as jQuery selector
            formElement.iddot = jsonform.util.escapeSelector(formElement.id || '');
            // Initialize the form node from the form element and schema element
            node.formElement = formElement;
            node.view = view;
            node.ownerTree = this;
            /**
             * 2016-04-30
             * To make templating easier we will make sure there is always
             * a `schemaElement` object available.
             *
             * If a schemaElement isn't associated by now then we will just
             * assign a dummy placeholder instance.
             */
            node.schemaElement = schemaElement || this._dummySchemaElement;
            /**
             * 2016-04-10
             * Process child elements after linking up the
             * formElement and schemaElement with the FormNode instance.
             */
            if (schemaElement) {
                // If the form element targets an "object" in the JSON schema,
                // we need to recurse through the list of children to create an
                // input field per child property of the object in the JSON schema
                if (schemaElement.type === 'object') {
                    _.each(schemaElement.properties, function (prop, propName) {
                        var key = formElement.key + '.' + propName;
                        if (_this.formDesc.nonDefaultFormItems && _this.formDesc.nonDefaultFormItems.indexOf(key) >= 0) {
                            return;
                        }
                        node.appendChild(_this.buildFromLayout({
                            key: key,
                            keyOnParent: propName
                        }));
                    });
                }
            }
            // Set event handlers
            if (!formElement.handlers) {
                formElement.handlers = {};
            }
            // Parse children recursively
            if (node.view.array) {
            }
            else if (formElement.items) {
                // The form element defines children elements
                _.each(formElement.items, function (item) {
                    if (_.isString(item)) {
                        item = { key: item };
                    }
                    /**
                     * Array elements don't have a 'keyOnParent' value,
                     * that only applies to direct children of objects.
                     */
                    node.appendChild(_this.buildFromLayout(item));
                });
            }
            else if (formElement.otherField) {
                var item = formElement.otherField;
                if (_.isString(item)) {
                    item = formElement.otherField = { key: item, notitle: true };
                }
                else if (item.notitle === undefined) {
                    item.notitle = true;
                }
                if (item.inline === undefined) {
                    item.inline = formElement.inline;
                }
                // Print a warning so we know we need to investigate
                // how this is supposed to work.
                console.warn('(FormTree) buildFromLayout: processing `formElement.otherField` but this hasn\'t been fully checked yet.\n\nMight need to raise an issue in Github for this with an example of how `otherField` is being used.');
                var tempItem = item;
                node.appendChild(this.buildFromLayout(tempItem));
            }
            return node;
        };
        /**
         * Look up a schema element with the key given on the `formElement`.
         *
         * The formElement is mutated based on properties on the schemaElement.
         *
         * @private
         */
        FormTree.prototype._getSchemaElementByFormElementKey = function (formElement) {
            var schemaElement = null;
            // The form element is directly linked to an element in the JSON
            // schema. The properties of the form element override those of the
            // element in the JSON schema. Properties from the JSON schema complete
            // those of the form element otherwise.
            // Retrieve the element from the JSON schema
            schemaElement = jsonform.util.getSchemaKey(this.formDesc.schema.properties, formElement.key);
            if (!schemaElement) {
                // The JSON Form is invalid!
                throw new Error('The JSONForm object references the schema key "' +
                    formElement.key + '" but that key does not exist in the JSON schema');
            }
            // Schema element has just been found, let's trigger the
            // "onElementSchema" event
            // (tidoust: not sure what the use case for this is, keeping the
            // code for backward compatibility)
            if (this.formDesc.onElementSchema) {
                this.formDesc.onElementSchema(formElement, schemaElement);
            }
            formElement.name =
                formElement.name ||
                    formElement.key;
            formElement.title =
                formElement.title ||
                    schemaElement.title;
            formElement.description =
                formElement.description ||
                    schemaElement.description;
            formElement.readOnly =
                formElement.readOnly ||
                    schemaElement.readOnly ||
                    formElement.readonly;
            // A input field should be marked required unless formElement mark required
            // or it's an array's item's required field
            // or it's a required field of a required object (need verify the object parent chain's required)
            // function isRequiredField(key, schema) {
            //     var parts = key.split('.');
            //     var field = parts.pop();
            //     // whether an array element field is required?
            //     // array element has minItems and maxItems which control whether the item is required
            //     // so, for array item, we do not consider it as required
            //     // then for array itself? it maybe required or not, yes. so, what does it matter?
            //     // a required array always has value, even empty array, it still cound has value.
            //     // a non-required array, can not appear in the result json at all.
            //     // here we try to figure out whether a form input element should be mark required.
            //     // all of them are default non-required, unless:
            //     // 1. it's top level element and it's marked required
            //     // 2. it's direct child of an array item and it's marked required
            //     // 3. it's direct child of an object and both it and its parent are marked required.
            //     if (field.slice(-2) == '[]') return false;
            //     var parentKey = parts.join('.');
            //     var required = false;
            //     // we need get parent schema's required value
            //     if (!parentKey) {
            //         required = schema.required && schema.required.indexOf(field) >= 0;
            //     }
            //     else {
            //         var parentSchema = util.getSchemaKey(schema.properties, parentKey);
            //         required = parentSchema.required && parentSchema.required.indexOf(field) >= 0;
            //         if (required)
            //             required = parentKey.slice(-2) == '[]' || isRequiredField(parentKey, schema);
            //     }
            //     return required;
            // }
            // formElement.required = formElement.required === true || schemaElement.required === true || isRequiredField(formElement.key, this.formDesc.schema);
            /**
             * 2016-04-10 Coridyn:
             * I've removed the check for `schemaElement.required` because this is
             * now shifted up to the parent schemaElement and will be processed
             * when appending this `FormNode` to it's parent.
             */
            // formElement.required = formElement.required === true || 
            //     // schemaElement.required === true || 
            //     isRequiredField(formElement.key, this.formDesc.schema);
            // Compute the ID of the input field
            if (!formElement.id) {
                formElement.id = jsonform.util.escapeSelector(this.formDesc.prefix) +
                    '-elt-' + formElement.key;
            }
            // Should empty strings be included in the final value?
            // TODO: it's rather unclean to pass it through the schema.
            if (formElement.allowEmpty) {
                schemaElement._jsonform_allowEmpty = true;
            }
            // If the form element does not define its type, use the type of
            // the schema element.
            if (!formElement.type) {
                if ((schemaElement.type === 'string') &&
                    (schemaElement.format === 'color')) {
                    formElement.type = 'color';
                }
                else if ((schemaElement.type === 'number' ||
                    schemaElement.type === 'integer') &&
                    !schemaElement['enum']) {
                    formElement.type = 'number';
                }
                else if ((schemaElement.type === 'string' ||
                    schemaElement.type === 'any') &&
                    !schemaElement['enum']) {
                    formElement.type = 'text';
                }
                else if (schemaElement.type === 'boolean') {
                    formElement.type = 'checkbox';
                }
                else if (schemaElement.type === 'object') {
                    if (schemaElement.properties) {
                        formElement.type = 'fieldset';
                    }
                    else {
                        formElement.type = 'textarea';
                    }
                }
                else if (!_.isUndefined(schemaElement['enum'])) {
                    formElement.type = 'select';
                }
                else {
                    formElement.type = schemaElement.type;
                }
            }
            // Unless overridden in the definition of the form element (or unless
            // there's a titleMap defined), use the enumeration list defined in
            // the schema
            if (formElement.options) {
                // FIXME: becareful certin type form element may has special format for options
                this._prepareOptions(formElement);
            }
            else if (schemaElement['enum'] || schemaElement.type === 'boolean') {
                var enumValues = schemaElement['enum'];
                if (!enumValues) {
                    enumValues = formElement.type === 'select' ? ['', true, false] : [true, false];
                }
                else {
                    formElement.optionsAsEnumOrder = true;
                }
                this._prepareOptions(formElement, enumValues);
            }
            // Flag a list of checkboxes with multiple choices
            if ((formElement.type === 'checkboxes' || formElement.type === 'checkboxbuttons') && schemaElement.items) {
                var theItem = Array.isArray(schemaElement.items) ? schemaElement.items[0] : schemaElement.items;
                if (formElement.options) {
                    // options only but no enum mode, since no enum, we can use only the value mode
                    this._prepareOptions(formElement);
                    theItem._jsonform_checkboxes_as_array = 'value';
                }
                else {
                    var enumValues = theItem['enum'];
                    if (enumValues) {
                        this._prepareOptions(formElement, enumValues);
                        formElement.optionsAsEnumOrder = true;
                        theItem._jsonform_checkboxes_as_array = formElement.type === 'checkboxes' ? true : 'value';
                    }
                }
            }
            if (formElement.getValue === 'tagsinput') {
                schemaElement._jsonform_get_value_by_tagsinput = 'tagsinput';
            }
            return schemaElement;
        };
        /**
         * Process select menu options into a list of
         *
         *     [
         *         {
         *             value: any;
         *             title: string;
         *         },
         *         ...
         *     ]
         *
         * @param formElement
         * @param enumValues
         * @private
         */
        FormTree.prototype._prepareOptions = function (formElement, enumValues) {
            if (formElement.options) {
                if (Array.isArray(formElement.options)) {
                    formElement.options = formElement.options.map(function (value) {
                        return jsonform.util.hasOwnProperty(value, 'value') ? value : {
                            value: value,
                            title: value
                        };
                    });
                }
                else if (typeof formElement.options === 'object') {
                    // titleMap like options
                    formElement.options = Object.keys(formElement.options).map(function (value) {
                        return {
                            value: value,
                            title: formElement.options[value]
                        };
                    });
                }
            }
            else if (formElement.titleMap) {
                formElement.options = _.map(enumValues, function (value) {
                    var title = value.toString();
                    return {
                        value: value,
                        title: jsonform.util.hasOwnProperty(formElement.titleMap, title) ? formElement.titleMap[title] : title
                    };
                });
            }
            else {
                formElement.options = enumValues.map(function (value) {
                    return {
                        value: value,
                        title: value.toString()
                    };
                });
            }
        };
        /**
         * Computes the values associated with each input field in the tree based
         * on previously submitted values or default values in the JSON schema.
         *
         * For arrays, the function actually creates and inserts additional
         * nodes in the tree based on previously submitted values (also ensuring
         * that the array has at least one item).
         *
         * The function sets the array path on all nodes.
         * It should be called once in the lifetime of a form tree right after
         * the tree structure has been created.
         *
         * @function
         */
        FormTree.prototype.computeInitialValues = function () {
            /**
             * 2016-04-09
             * TODO: Check if `formDesc.value` is ever set.
             */
            var value = this.formDesc.value;
            this.root.computeInitialValues(value);
        };
        /**
         * Renders the form tree
         *
         * @function
         * @param {Node} domRoot The "form" element in the DOM tree that serves as
         *  root for the form
         */
        FormTree.prototype.render = function (domRoot) {
            if (!domRoot)
                return;
            this.domRoot = domRoot;
            this.root.render();
            // If the schema defines required fields, flag the form with the
            // "jsonform-hasrequired" class for styling purpose
            // (typically so that users may display a legend)
            if (this.hasRequiredField()) {
                $(domRoot).addClass('jsonform-hasrequired');
            }
            $(domRoot).addClass('jsonform');
        };
        /**
         * Walks down the element tree with a callback
         *
         * @function
         * @param {Function} callback The callback to call on each element
         */
        FormTree.prototype.forEachElement = function (callback) {
            var f = function (root /*: formNode*/) {
                for (var i = 0; i < root.children.length; i++) {
                    callback(root.children[i]);
                    f(root.children[i]);
                }
            };
            f(this.root);
        };
        FormTree.prototype.validate = function (noErrorDisplay) {
            if (noErrorDisplay === void 0) { noErrorDisplay = false; }
            var values = jsonform.getFormValue(this.domRoot);
            var errors = false;
            var options = this.formDesc;
            if (options.validate !== false) {
                var validator = false;
                if (typeof options.validate != "object") {
                    if (global.ZSchema) {
                        validator = new global.ZSchema();
                        validator._vendor = 'z-schema';
                    }
                    else if (global.jjv) {
                        validator = global.jjv();
                        validator._vendor = 'jjv';
                    }
                    else if (global.JSONFormValidator) {
                        validator = global.JSONFormValidator.createEnvironment("json-schema-draft-03");
                        validator._vendor = 'jsv';
                    }
                }
                else {
                    validator = options.validate;
                }
                if (validator) {
                    $(this.domRoot).jsonFormErrors(false, options);
                    if (validator._vendor == 'jjv') {
                        var v = validator.validate(this.formDesc._originalSchema, values);
                        if (v) {
                            errors = [v];
                        }
                    }
                    else {
                        var v = validator.validate(values, this.formDesc._originalSchema);
                        if (validator._vendor == 'z-schema') {
                            errors = validator.getLastErrors();
                            v = v ? null : { errors: errors };
                        }
                        else if (v && v.errors && v.errors.length) {
                            if (!errors)
                                errors = [];
                            errors = errors.concat(v.errors);
                        }
                    }
                }
            }
            /**
             * 2016-04-09 Coridyn:
             * Custom error handling here.
             * Look into using `displayErrors(..)` to call
             * `$(this.domRoot).jsonFormErrors(...)` as well.
             */
            if (errors && !noErrorDisplay) {
                if (options.displayErrors) {
                    options.displayErrors(errors, this.domRoot);
                }
                else {
                    $(this.domRoot).jsonFormErrors(errors, options);
                }
            }
            return { "errors": errors, "values": values };
        };
        FormTree.prototype.submit = function (evt /*: Event*/) {
            var stopEvent = function () {
                if (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                return false;
            };
            var values = jsonform.getFormValue(this.domRoot);
            var options = this.formDesc;
            var brk = false;
            this.forEachElement(function (elt /*: formNode*/) {
                if (brk)
                    return;
                if (elt.view.onSubmit) {
                    brk = !elt.view.onSubmit(evt, elt); //may be called multiple times!!
                }
            });
            if (brk)
                return stopEvent();
            var validated = this.validate();
            if (options.onSubmit && !options.onSubmit(validated.errors, values)) {
                return stopEvent();
            }
            if (validated.errors)
                return stopEvent();
            if (options.onSubmitValid && !options.onSubmitValid(values)) {
                return stopEvent();
            }
            return false;
        };
        /**
         * Returns true if the form displays a "required" field.
         *
         * To keep things simple, the function just return true if detect any
         * jsonform-required class in the form dom.
         *
         * @function
         * @return {boolean} True when the form has some required field,
         *  false otherwise.
         */
        FormTree.prototype.hasRequiredField = function () {
            return $(this.domRoot).find('.jsonform-required').length > 0;
        };
        return FormTree;
    }());
    jsonform.FormTree = FormTree;
})(jsonform || (jsonform = {}));
var jsonform;
(function (jsonform) {
    var global = jsonform.util.global;
    var $ = jsonform.util.$;
    var _ = jsonform.util._;
    // Twitter bootstrap-friendly HTML boilerplate for standard inputs
    function fieldTemplate(inner) {
        return '<div class="<%= cls.groupClass %> jsonform-node jsonform-error-<%= keydash %> <%= node.formElement.type?"_jsonform-"+node.formElement.type:"" %>' +
            '<%= elt.htmlClass ? " " + elt.htmlClass : "" %>' +
            '<%= (node.required && node.formElement && (node.formElement.type !== "checkbox") ? " jsonform-required" : "") %>' +
            '<%= (node.isReadOnly() ? " jsonform-readonly" : "") %>' +
            '<%= (node.disabled ? " jsonform-disabled" : "") %>' +
            '" data-jsonform-type="<%= node.formElement.type %>">' +
            '<% if (node.title && !elt.notitle && elt.inlinetitle !== true) { %>' +
            '<label class="<%= cls.labelClass %>" for="<%= node.id %>"><%= node.title %></label>' +
            '<% } %>' +
            '<div class="<%= cls.controlClass %>">' +
            '<% if (node.description) { %>' +
            '<span class="help-block jsonform-description"><%= node.description %></span>' +
            '<% } %>' +
            '<% if (node.prepend || node.append) { %>' +
            '<div class="<%= node.prepend ? cls.prependClass : "" %> ' +
            '<%= node.append ? cls.appendClass : "" %>">' +
            '<% if (node.prepend && node.prepend.indexOf("<button ") >= 0) { %>' +
            '<% if (cls.buttonAddonClass) { %>' +
            '<span class="<%= cls.buttonAddonClass %>"><%= node.prepend %></span>' +
            '<% } else { %>' +
            '<%= node.prepend %>' +
            '<% } %>' +
            '<% } %>' +
            '<% if (node.prepend && node.prepend.indexOf("<button ") < 0) { %>' +
            '<span class="<%= cls.addonClass %>"><%= node.prepend %></span>' +
            '<% } %>' +
            '<% } %>' +
            inner +
            '<% if (node.append && node.append.indexOf("<button ") >= 0) { %>' +
            '<% if (cls.buttonAddonClass) { %>' +
            '<span class="<%= cls.buttonAddonClass %>"><%= node.append %></span>' +
            '<% } else { %>' +
            '<%= node.append %>' +
            '<% } %>' +
            '<% } %>' +
            '<% if (node.append && node.append.indexOf("<button ") < 0) { %>' +
            '<span class="<%= cls.addonClass %>"><%= node.append %></span>' +
            '<% } %>' +
            '<% if (node.prepend || node.append) { %>' +
            '</div>' +
            '<% } %>' +
            '<span class="help-block jsonform-errortext" style="display:none;"></span>' +
            '</div></div>';
    }
    jsonform.fieldTemplate = fieldTemplate;
    ;
    jsonform.fileDisplayTemplate = '<div class="_jsonform-preview">' +
        '<% if (value.type=="image") { %>' +
        '<img class="jsonform-preview" id="jsonformpreview-<%= id %>" src="<%= value.url %>" />' +
        '<% } else { %>' +
        '<a href="<%= value.url %>"><%= value.name %></a> (<%= Math.ceil(value.size/1024) %>kB)' +
        '<% } %>' +
        '</div>' +
        '<a href="#" class="<%= cls.buttonClass %> _jsonform-delete"><i class="<%= cls.iconClassPrefix %>-remove" title="Remove"></i></a> ';
    jsonform.inputFieldTemplate = function (type, isTextualInput, extraOpts) {
        var templ = {
            'template': '<input type="' + type + '" ' +
                'class="<%= fieldHtmlClass' + (isTextualInput ? ' || cls.textualInputClass' : '') + ' %>" ' +
                'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
                '<%= (node.disabled? " disabled" : "")%>' +
                '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
                '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
                '<%= (node.required|| node.schemaElement.minLength ? " required=\'required\'" : "") %>' +
                '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
                ' /> <pre>required=<%= node.required %></pre> ',
            'fieldtemplate': true,
            'inputfield': true,
            'onInsert': function (evt, node) {
                if (node.formElement && node.formElement.autocomplete) {
                    var $input = $(node.el).find('input');
                    if ($input.autocomplete) {
                        $input.autocomplete(node.formElement.autocomplete);
                    }
                }
                if (node.formElement && (node.formElement.tagsinput || node.formElement.getValue === 'tagsvalue')) {
                    if (!$.fn.tagsinput)
                        throw new Error('tagsinput is not found');
                    var $input = $(node.el).find('input');
                    var isArray = Array.isArray(node.value);
                    if (isArray)
                        $input.attr('value', '').val('');
                    $input.tagsinput(node.formElement ? (node.formElement.tagsinput || {}) : {});
                    if (isArray) {
                        node.value.forEach(function (value) {
                            $input.tagsinput('add', value);
                        });
                    }
                }
                if (node.formElement && node.formElement.typeahead) {
                    var $input = $(node.el).find('input');
                    if ($input.typeahead) {
                        if (Array.isArray(node.formElement.typeahead)) {
                            for (var i = 1; i < node.formElement.typeahead.length; ++i) {
                                var dataset = node.formElement.typeahead[i];
                                if (dataset.source && Array.isArray(dataset.source)) {
                                    var source = dataset.source;
                                    dataset.source = function (query, cb) {
                                        var lq = query.toLowerCase();
                                        cb(source.filter(function (v) {
                                            return v.toLowerCase().indexOf(lq) >= 0;
                                        }).map(function (v) {
                                            return (typeof v === 'string') ? { value: v } : v;
                                        }));
                                    };
                                }
                            }
                            $.fn.typeahead.apply($input, node.formElement.typeahead);
                        }
                        else {
                            $input.typeahead(node.formElement.typeahead);
                        }
                    }
                }
            }
        };
        if (extraOpts)
            templ = _.extend(templ, extraOpts);
        return templ;
    };
    jsonform.numberFieldTemplate = function (type, isTextualInput) {
        if (isTextualInput === void 0) { isTextualInput = false; }
        return {
            'template': '<input type="' + type + '" ' +
                'class="<%= fieldHtmlClass' + (isTextualInput ? ' || cls.textualInputClass' : '') + ' %>" ' +
                'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
                '<%= (node.disabled? " disabled" : "")%>' +
                '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
                '<%= (range.min !== undefined ? " min="+range.min : "")%>' +
                '<%= (range.max !== undefined ? " max="+range.max : "")%>' +
                '<%= (range.step !== undefined ? " step="+range.step : "")%>' +
                '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
                '<%= (node.required ? " required=\'required\'" : "") %>' +
                '<%= (node.placeholder? "placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
                ' />',
            'fieldtemplate': true,
            'inputfield': true,
            'onBeforeRender': function (data /*: IRenderData*/, node) {
                data.range = {
                    step: 1
                };
                if (type == 'range') {
                    data.range.min = 1;
                    data.range.max = 100;
                }
                if (!node || !node.schemaElement)
                    return;
                if (node.formElement && node.formElement.step) {
                    data.range.step = node.formElement.step;
                }
                else if (node.schemaElement.type == 'number') {
                    data.range.step = 'any';
                }
                var step = data.range.step === 'any' ? 1 : data.range.step;
                if (typeof node.schemaElement.minimum !== 'undefined') {
                    if (node.schemaElement.exclusiveMinimum) {
                        data.range.min = node.schemaElement.minimum + step;
                    }
                    else {
                        data.range.min = node.schemaElement.minimum;
                    }
                }
                if (typeof node.schemaElement.maximum !== 'undefined') {
                    if (node.schemaElement.exclusiveMaximum) {
                        data.range.max = node.schemaElement.maximum - step;
                    }
                    else {
                        data.range.max = node.schemaElement.maximum;
                    }
                }
            }
        };
    };
    jsonform.elementTypes = {
        'none': {
            'template': ''
        },
        'root': {
            'template': '<div><%= children %></div>'
        },
        'text': jsonform.inputFieldTemplate('text', true),
        'password': jsonform.inputFieldTemplate('password', true),
        'date': jsonform.inputFieldTemplate('date', true, {
            'onInsert': function (evt, node) {
                if (window.Modernizr && window.Modernizr.inputtypes && !window.Modernizr.inputtypes.date) {
                    var $input = $(node.el).find('input');
                    if ($input.datepicker) {
                        var opt = { dateFormat: "yy-mm-dd" };
                        if (node.formElement && node.formElement.datepicker && typeof node.formElement.datepicker === 'object')
                            _.extend(opt, node.formElement.datepicker);
                        $input.datepicker(opt);
                    }
                }
            }
        }),
        'datetime': jsonform.inputFieldTemplate('datetime', true),
        'datetime-local': jsonform.inputFieldTemplate('datetime-local', true, {
            'onBeforeRender': function (data, node) {
                if (data.value && data.value.getTime) {
                    data.value = new Date(data.value.getTime() - data.value.getTimezoneOffset() * 60000).toISOString().slice(0, -1);
                }
            }
        }),
        'email': jsonform.inputFieldTemplate('email', true),
        'month': jsonform.inputFieldTemplate('month', true),
        'number': jsonform.numberFieldTemplate('number', true),
        'search': jsonform.inputFieldTemplate('search', true),
        'tel': jsonform.inputFieldTemplate('tel', true),
        'time': jsonform.inputFieldTemplate('time', true),
        'url': jsonform.inputFieldTemplate('url', true),
        'week': jsonform.inputFieldTemplate('week', true),
        'range': jsonform.numberFieldTemplate('range'),
        'color': {
            'template': '<input type="text" ' +
                '<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
                'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
                '<%= (node.disabled? " disabled" : "")%>' +
                '<%= (node.required ? " required=\'required\'" : "") %>' +
                ' />',
            'fieldtemplate': true,
            'inputfield': true,
            'onInsert': function (evt, node) {
                $(node.el).find('#' + jsonform.util.escapeSelector(node.id)).spectrum({
                    preferredFormat: "hex",
                    showInput: true
                });
            }
        },
        'textarea': {
            'template': '<textarea id="<%= id %>" name="<%= node.name %>" ' +
                'class="<%= fieldHtmlClass || cls.textualInputClass %>" ' +
                'style="<%= elt.height ? "height:" + elt.height + ";" : "" %>width:<%= elt.width || "100%" %>;"' +
                '<%= (node.disabled? " disabled" : "")%>' +
                '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
                '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
                '<%= (node.required ? " required=\'required\'" : "") %>' +
                '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
                '><%= value %></textarea>',
            'fieldtemplate': true,
            'inputfield': true
        },
        'wysihtml5': {
            'template': '<textarea id="<%= id %>" name="<%= node.name %>" style="height:<%= elt.height || "300px" %>;width:<%= elt.width || "100%" %>;"' +
                '<%= (node.disabled? " disabled" : "")%>' +
                '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
                '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
                '<%= (node.required ? " required=\'required\'" : "") %>' +
                '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
                '><%= value %></textarea>',
            'fieldtemplate': true,
            'inputfield': true,
            'onInsert': function (evt, node) {
                var setup = function () {
                    //protect from double init
                    if ($(node.el).data("wysihtml5"))
                        return;
                    $(node.el).data("wysihtml5_loaded", true);
                    $(node.el).find('#' + jsonform.util.escapeSelector(node.id)).wysihtml5({
                        "html": true,
                        "link": true,
                        "font-styles": true,
                        "image": true,
                        "events": {
                            "load": function () {
                                // In chrome, if an element is required and hidden, it leads to
                                // the error 'An invalid form control with name='' is not focusable'
                                // See http://stackoverflow.com/questions/7168645/invalid-form-control-only-in-google-chrome
                                $(this.textareaElement).removeAttr('required');
                            }
                        }
                    });
                };
                // Is there a setup hook?
                if (window.jsonform_wysihtml5_setup) {
                    window.jsonform_wysihtml5_setup(setup);
                    return;
                }
                // Wait until wysihtml5 is loaded
                var itv = window.setInterval(function () {
                    if (window.wysihtml5) {
                        window.clearInterval(itv);
                        setup();
                    }
                }, 1000);
            }
        },
        'ace': {
            'template': '<div id="<%= id %>" style="position:relative;height:<%= elt.height || "300px" %>;"><div id="<%= id %>__ace" style="width:<%= elt.width || "100%" %>;height:<%= elt.height || "300px" %>;"></div><input type="hidden" name="<%= node.name %>" id="<%= id %>__hidden" value="<%= escape(value) %>"/></div>',
            'fieldtemplate': true,
            'inputfield': true,
            'onBeforeRender': function (data, node) {
                if (data.value && typeof data.value == 'object' || Array.isArray(data.value))
                    data.value = JSON.stringify(data.value, null, 2);
            },
            'onInsert': function (evt, node) {
                // 2016-08-14
                // TODO: See here on making editor resizable: http://jsbin.com/ojijeb/645/edit?html,css,js,output
                var setup = function () {
                    var formElement = node.formElement || {};
                    var ace = window.ace;
                    var editor = ace.edit($(node.el).find('#' + jsonform.util.escapeSelector(node.id) + '__ace').get(0));
                    /**
                     * 2017-01-13
                     * Work around `worker-html.js` 404 - just set a no-op $startWorker function.
                     * https://github.com/angular-ui/ui-ace/issues/106
                     *
                     * Doesn't seem to affect editing functionality...
                     */
                    editor.getSession().$startWorker = function () { };
                    // Turn off message about scrolling being removed in future.
                    editor.$blockScrolling = Number.POSITIVE_INFINITY;
                    var idSelector = '#' + jsonform.util.escapeSelector(node.id) + '__hidden';
                    // Force editor to use "\n" for new lines, not to bump into ACE "\r" conversion issue
                    // (ACE is ok with "\r" on pasting but fails to return "\r" when value is extracted)
                    editor.getSession().setNewLineMode('unix');
                    editor.renderer.setShowPrintMargin(false);
                    editor.setTheme("ace/theme/" + (formElement.aceTheme || "twilight"));
                    editor.setFontSize(14);
                    if (formElement.aceMode) {
                        editor.getSession().setMode("ace/mode/" + formElement.aceMode);
                    }
                    if (formElement.aceOptions) {
                        editor.setOptions(formElement.aceOptions);
                    }
                    editor.getSession().setTabSize(2);
                    // Set the contents of the initial manifest file
                    editor.getSession().setValue(node.value || "");
                    /**
                     * Make editor resizeable
                     */
                    initResizable(node.el, editor);
                    //TODO this is clearly sub-optimal
                    // 'Lazily' bind to the onchange 'ace' event to give
                    // priority to user edits
                    var lazyChanged = _.debounce(function () {
                        $(node.el).find(idSelector).val(editor.getSession().getValue());
                        $(node.el).find(idSelector).change();
                    }, 600);
                    editor.getSession().on('change', lazyChanged);
                    editor.on('blur', function () {
                        $(node.el).find(idSelector).change();
                        $(node.el).find(idSelector).trigger("blur");
                    });
                    editor.on('focus', function () {
                        $(node.el).find(idSelector).trigger("focus");
                    });
                };
                function initResizable(el, editor) {
                    if ($.fn.resizable) {
                        var $r = $(el).find('.resizable');
                        $r.resizable({
                            // Allow v-resizing.
                            handles: 's',
                            resize: function (event, ui) {
                                editor.resize();
                            },
                            create: function (event) {
                                // Double-click on edge to resize to full height of content.
                                $(event.target).find('.ui-resizable-s').on('dblclick', function () {
                                    var newHeight = editor.renderer.scrollBarV.scrollHeight + 30;
                                    $r.height(newHeight);
                                    editor.resize();
                                });
                            }
                        });
                    }
                }
                // Is there a setup hook?
                if (window.jsonform_ace_setup) {
                    window.jsonform_ace_setup(setup);
                    return;
                }
                if (window.ace) {
                    // Setup immediately
                    setup();
                }
                else {
                    // Wait until ACE is loaded
                    var itv = window.setInterval(function () {
                        if (window.ace) {
                            window.clearInterval(itv);
                            setup();
                        }
                    }, 1000);
                }
            }
        },
        'checkbox': {
            'template': '<div class="checkbox"><label><input type="checkbox" id="<%= id %>" ' +
                'name="<%= node.name %>" value="1" <% if (value) {%>checked<% } %>' +
                '<%= (node.disabled? " disabled" : "")%>' +
                '<%= (node.required && node.schemaElement && (node.schemaElement.type !== "boolean") ? " required=\'required\'" : "") %>' +
                ' /><span><%= (node.inlinetitle === true ? node.title : node.inlinetitle) || "" %></span>' +
                '</label></div>',
            'fieldtemplate': true,
            'inputfield': true,
            'onInsert': function (evt, node) {
                if (node.formElement.toggleNext) {
                    var nextN = node.formElement.toggleNext === true ? 1 : node.formElement.toggleNext;
                    var toggleNextClass = 'jsonform-toggle-next jsonform-toggle-next-' + nextN;
                    var $next = nextN === 1 ? $(node.el).next() : (nextN === 'all' ? $(node.el).nextAll() : $(node.el).nextAll().slice(0, nextN));
                    $next.addClass('jsonform-toggle-next-target');
                    $(node.el).addClass(toggleNextClass).find(':checkbox').on('change', function () {
                        var $this = $(this);
                        var checked = $this.is(':checked');
                        $(node.el).toggleClass('checked', checked);
                        $next.toggle(checked).toggleClass('jsonform-toggled-visible', checked);
                    }).change();
                }
            },
            'getElement': function (el) {
                return $(el).parent().parent().get(0);
            }
        },
        'file': {
            'template': '<input class="input-file" id="<%= id %>" name="<%= node.name %>" type="file" ' +
                '<%= (node.required ? " required=\'required\'" : "") %>' +
                '/>',
            'fieldtemplate': true,
            'inputfield': true
        },
        'file-hosted-public': {
            'template': '<span><% if (value && (value.type||value.url)) { %>' + jsonform.fileDisplayTemplate + '<% } %><input class="input-file" id="_transloadit_<%= id %>" type="file" name="<%= transloaditname %>" /><input data-transloadit-name="_transloadit_<%= transloaditname %>" type="hidden" id="<%= id %>" name="<%= node.name %>" value=\'<%= escape(JSON.stringify(node.value)) %>\' /></span>',
            'fieldtemplate': true,
            'inputfield': true,
            'getElement': function (el) {
                return $(el).parent().get(0);
            },
            'onBeforeRender': function (data, node) {
                var ownerTree = node.ownerTree;
                if (!ownerTree._transloadit_generic_public_index) {
                    ownerTree._transloadit_generic_public_index = 1;
                }
                else {
                    ownerTree._transloadit_generic_public_index++;
                }
                data.transloaditname = "_transloadit_jsonform_genericupload_public_" + ownerTree._transloadit_generic_public_index;
                if (!ownerTree._transloadit_generic_elts)
                    ownerTree._transloadit_generic_elts = {};
                ownerTree._transloadit_generic_elts[data.transloaditname] = node;
            },
            'onChange': function (evt, elt) {
                // The "transloadit" function should be called only once to enable
                // the service when the form is submitted. Has it already been done?
                if (elt.ownerTree._transloadit_bound) {
                    return false;
                }
                elt.ownerTree._transloadit_bound = true;
                // Call the "transloadit" function on the form element
                var formElt = $(elt.ownerTree.domRoot);
                formElt.transloadit({
                    autoSubmit: false,
                    wait: true,
                    onSuccess: function (assembly) {
                        // Image has been uploaded. Check the "results" property that
                        // contains the list of files that Transloadit produced. There
                        // should be one image per file input in the form at most.
                        // console.log(assembly.results);
                        var results = _.values(assembly.results);
                        results = _.flatten(results);
                        _.each(results, function (result) {
                            // Save the assembly result in the right hidden input field
                            var id = elt.ownerTree._transloadit_generic_elts[result.field].id;
                            var input = formElt.find('#' + jsonform.util.escapeSelector(id));
                            var nonEmptyKeys = _.filter(_.keys(result.meta), function (key) {
                                return !!jsonform.util.isSet(result.meta[key]);
                            });
                            result.meta = _.pick(result.meta, nonEmptyKeys);
                            input.val(JSON.stringify(result));
                        });
                        // Unbind transloadit from the form
                        elt.ownerTree._transloadit_bound = false;
                        formElt.unbind('submit.transloadit');
                        // Submit the form on next tick
                        _.delay(function () {
                            console.log('submit form');
                            elt.ownerTree.submit();
                        }, 10);
                    },
                    onError: function (assembly) {
                        // TODO: report the error to the user
                        console.log('assembly error', assembly);
                    }
                });
            },
            'onInsert': function (evt, node) {
                $(node.el).find('a._jsonform-delete').on('click', function (evt) {
                    $(node.el).find('._jsonform-preview').remove();
                    $(node.el).find('a._jsonform-delete').remove();
                    $(node.el).find('#' + jsonform.util.escapeSelector(node.id)).val('');
                    evt.preventDefault();
                    return false;
                });
            },
            'onSubmit': function (evt, elt) {
                if (elt.ownerTree._transloadit_bound) {
                    return false;
                }
                return true;
            }
        },
        'file-transloadit': {
            'template': '<span><% if (value && (value.type||value.url)) { %>' + jsonform.fileDisplayTemplate + '<% } %><input class="input-file" id="_transloadit_<%= id %>" type="file" name="_transloadit_<%= node.name %>" /><input type="hidden" id="<%= id %>" name="<%= node.name %>" value=\'<%= escape(JSON.stringify(node.value)) %>\' /></span>',
            'fieldtemplate': true,
            'inputfield': true,
            'getElement': function (el) {
                return $(el).parent().get(0);
            },
            'onChange': function (evt, elt) {
                // The "transloadit" function should be called only once to enable
                // the service when the form is submitted. Has it already been done?
                if (elt.ownerTree._transloadit_bound) {
                    return false;
                }
                elt.ownerTree._transloadit_bound = true;
                // Call the "transloadit" function on the form element
                var formElt = $(elt.ownerTree.domRoot);
                formElt.transloadit({
                    autoSubmit: false,
                    wait: true,
                    onSuccess: function (assembly) {
                        // Image has been uploaded. Check the "results" property that
                        // contains the list of files that Transloadit produced. Note
                        // JSONForm only supports 1-to-1 associations, meaning it
                        // expects the "results" property to contain only one image
                        // per file input in the form.
                        // console.log(assembly.results);
                        var results = _.values(assembly.results);
                        results = _.flatten(results);
                        _.each(results, function (result) {
                            // Save the assembly result in the right hidden input field
                            var input = formElt.find('input[name="' +
                                result.field.replace(/^_transloadit_/, '') +
                                '"]');
                            var nonEmptyKeys = _.filter(_.keys(result.meta), function (key) {
                                return !!jsonform.util.isSet(result.meta[key]);
                            });
                            result.meta = _.pick(result.meta, nonEmptyKeys);
                            input.val(JSON.stringify(result));
                        });
                        // Unbind transloadit from the form
                        elt.ownerTree._transloadit_bound = false;
                        formElt.unbind('submit.transloadit');
                        // Submit the form on next tick
                        _.delay(function () {
                            console.log('submit form');
                            elt.ownerTree.submit();
                        }, 10);
                    },
                    onError: function (assembly) {
                        // TODO: report the error to the user
                        console.log('assembly error', assembly);
                    }
                });
            },
            'onInsert': function (evt, node) {
                $(node.el).find('a._jsonform-delete').on('click', function (evt) {
                    $(node.el).find('._jsonform-preview').remove();
                    $(node.el).find('a._jsonform-delete').remove();
                    $(node.el).find('#' + jsonform.util.escapeSelector(node.id)).val('');
                    evt.preventDefault();
                    return false;
                });
            },
            'onSubmit': function (evt, elt) {
                if (elt.ownerTree._transloadit_bound) {
                    return false;
                }
                return true;
            }
        },
        'select': {
            'template': '<select name="<%= node.name %>" id="<%= id %>"' +
                ' class="<%= fieldHtmlClass || cls.textualInputClass %>"' +
                '<%= (node.disabled? " disabled" : "")%>' +
                '<%= (node.required ? " required=\'required\'" : "") %>' +
                '> ' +
                '<% _.each(node.options, function(key, val) { if(key instanceof Object) { if (value === key.value) { %> <option selected value="<%= key.value %>"><%= key.title %></option> <% } else { %> <option value="<%= key.value %>"><%= key.title %></option> <% }} else { if (value === key) { %> <option selected value="<%= key %>"><%= key %></option> <% } else { %><option value="<%= key %>"><%= key %></option> <% }}}); %> ' +
                '</select>',
            'fieldtemplate': true,
            'inputfield': true
        },
        'tagsinput': {
            'template': '<select name="<%= node.name %><%= node.formElement.getValue === "tagsinput" ? "" : "[]" %>" id="<%= id %>"' +
                ' class="<%= fieldHtmlClass || cls.textualInputClass %>" multiple' +
                '<%= (node.disabled? " disabled" : "")%>' +
                '<%= (node.required ? " required=\'required\'" : "") %>' +
                '> ' +
                '</select>',
            'fieldtemplate': true,
            'inputfield': true,
            'onInsert': function (evt, node) {
                if (!$.fn.tagsinput)
                    throw new Error('tagsinput is not found');
                var $input = $(node.el).find('select');
                $input.tagsinput(node.formElement ? (node.formElement.tagsinput || {}) : {});
                if (node.value) {
                    node.value.forEach(function (value) {
                        $input.tagsinput('add', value);
                    });
                }
            }
        },
        'imageselect': {
            'template': '<div>' +
                '<input type="hidden" name="<%= node.name %>" id="<%= node.id %>" value="<%= value %>" />' +
                '<div class="dropdown">' +
                '<a class="<%= node.value ? buttonClass : cls.buttonClass %>" data-toggle="dropdown" href="#"<% if (node.value) { %> style="max-width:<%= width %>px;max-height:<%= height %>px"<% } %>>' +
                '<% if (node.value) { %><img src="<% if (!node.value.match(/^https?:/)) { %><%= prefix %><% } %><%= node.value %><%= suffix %>" alt="" /><% } else { %><%= buttonTitle %><% } %>' +
                '</a>' +
                '<div class="dropdown-menu navbar" id="<%= node.id %>_dropdown">' +
                '<div>' +
                '<% _.each(node.options, function(key, idx) { if ((idx > 0) && ((idx % columns) === 0)) { %></div><div><% } %><a class="<%= buttonClass %>" style="max-width:<%= width %>px;max-height:<%= height %>px"><% if (key instanceof Object) { %><img src="<% if (!key.value.match(/^https?:/)) { %><%= prefix %><% } %><%= key.value %><%= suffix %>" alt="<%= key.title %>" /></a><% } else { %><img src="<% if (!key.match(/^https?:/)) { %><%= prefix %><% } %><%= key %><%= suffix %>" alt="" /><% } %></a> <% }); %>' +
                '</div>' +
                '<div class="pagination-right"><a class="<%= cls.buttonClass %>">Reset</a></div>' +
                '</div>' +
                '</div>' +
                '</div>',
            'fieldtemplate': true,
            'inputfield': true,
            'onBeforeRender': function (data, node) {
                var elt = node.getFormElement();
                var nbRows = null;
                var maxColumns = elt.imageSelectorColumns || 5;
                data.buttonTitle = elt.imageSelectorTitle || 'Select...';
                data.prefix = elt.imagePrefix || '';
                data.suffix = elt.imageSuffix || '';
                data.width = elt.imageWidth || 32;
                data.height = elt.imageHeight || 32;
                data.buttonClass = elt.imageButtonClass || data.cls.buttonClass;
                if (node.options.length > maxColumns) {
                    nbRows = Math.ceil(node.options.length / maxColumns);
                    data.columns = Math.ceil(node.options.length / nbRows);
                }
                else {
                    data.columns = maxColumns;
                }
            },
            'getElement': function (el) {
                return $(el).parent().get(0);
            },
            'onInsert': function (evt, node) {
                $(node.el).on('click', '.dropdown-menu a', function (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    var img = (evt.target.nodeName.toLowerCase() === 'img') ?
                        $(evt.target) :
                        $(evt.target).find('img');
                    var value = img.attr('src');
                    var elt = node.getFormElement();
                    var prefix = elt.imagePrefix || '';
                    var suffix = elt.imageSuffix || '';
                    var width = elt.imageWidth || 32;
                    var height = elt.imageHeight || 32;
                    if (value) {
                        if (value.indexOf(prefix) === 0) {
                            value = value.substring(prefix.length);
                        }
                        value = value.substring(0, value.length - suffix.length);
                        $(node.el).find('input').attr('value', value);
                        $(node.el).find('a[data-toggle="dropdown"]')
                            .addClass(elt.imageButtonClass)
                            .attr('style', 'max-width:' + width + 'px;max-height:' + height + 'px')
                            .html('<img src="' + (!value.match(/^https?:/) ? prefix : '') + value + suffix + '" alt="" />');
                    }
                    else {
                        $(node.el).find('input').attr('value', '');
                        $(node.el).find('a[data-toggle="dropdown"]')
                            .removeClass(elt.imageButtonClass)
                            .removeAttr('style')
                            .html(elt.imageSelectorTitle || 'Select...');
                    }
                });
            }
        },
        'iconselect': {
            'template': '<div>' +
                '<input type="hidden" name="<%= node.name %>" id="<%= node.id %>" value="<%= value %>" />' +
                '<div class="dropdown">' +
                '<a class="<%= node.value ? buttonClass : cls.buttonClass %>" data-toggle="dropdown" href="#"<% if (node.value) { %> style="max-width:<%= width %>px;max-height:<%= height %>px"<% } %>>' +
                '<% if (node.value) { %><i class="<%= cls.iconClassPrefix %>-<%= node.value %>" /><% } else { %><%= buttonTitle %><% } %>' +
                '</a>' +
                '<div class="dropdown-menu navbar" id="<%= node.id %>_dropdown">' +
                '<div>' +
                '<% _.each(node.options, function(key, idx) { if ((idx > 0) && ((idx % columns) === 0)) { %></div><div><% } %><a class="<%= buttonClass %>" ><% if (key instanceof Object) { %><i class="<%= cls.iconClassPrefix %>-<%= key.value %>" alt="<%= key.title %>" /></a><% } else { %><i class="<%= cls.iconClassPrefix %>-<%= key %>" alt="" /><% } %></a> <% }); %>' +
                '</div>' +
                '<div class="pagination-right"><a class="<%= cls.buttonClass %>">Reset</a></div>' +
                '</div>' +
                '</div>' +
                '</div>',
            'fieldtemplate': true,
            'inputfield': true,
            'onBeforeRender': function (data, node) {
                var elt = node.getFormElement();
                var nbRows = null;
                var maxColumns = elt.imageSelectorColumns || 5;
                data.buttonTitle = elt.imageSelectorTitle || 'Select...';
                data.buttonClass = elt.imageButtonClass || data.cls.buttonClass;
                if (node.options.length > maxColumns) {
                    nbRows = Math.ceil(node.options.length / maxColumns);
                    data.columns = Math.ceil(node.options.length / nbRows);
                }
                else {
                    data.columns = maxColumns;
                }
            },
            'getElement': function (el) {
                return $(el).parent().get(0);
            },
            'onInsert': function (evt, node) {
                $(node.el).on('click', '.dropdown-menu a', function (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    var i = (evt.target.nodeName.toLowerCase() === 'i') ?
                        $(evt.target) :
                        $(evt.target).find('i');
                    var value = i.attr('class');
                    var elt = node.getFormElement();
                    if (value) {
                        value = value;
                        $(node.el).find('input').attr('value', value);
                        $(node.el).find('a[data-toggle="dropdown"]')
                            .addClass(elt.imageButtonClass)
                            .html('<i class="' + value + '" alt="" />');
                    }
                    else {
                        $(node.el).find('input').attr('value', '');
                        $(node.el).find('a[data-toggle="dropdown"]')
                            .removeClass(elt.imageButtonClass)
                            .html(elt.imageSelectorTitle || 'Select...');
                    }
                });
            }
        },
        'radios': {
            'template': '<div id="<%= node.id %>"><% _.each(node.options, function(key, val) { %>' +
                '<% if (!elt.inline) { %><div class="radio"><label><% } else { %>' +
                '<label class="radio<%= cls.inlineClassSuffix %>"><% } %>' +
                '<input type="radio" <% if (((key instanceof Object) && (value === key.value)) || (value === key)) { %> checked="checked" <% } %> name="<%= node.name %>" value="<%= (key instanceof Object ? key.value : key) %>"' +
                '<%= (node.disabled? " disabled" : "")%>' +
                '<%= (node.required ? " required=\'required\'" : "") %>' +
                '/><span><%= (key instanceof Object ? key.title : key) %></span></label><%= elt.inline ? "" : "</div>" %> <% }); %></div>',
            'fieldtemplate': true,
            'inputfield': true,
            'onInsert': function (evt, node) {
                if (node.formElement.toggleNextMap) {
                    var valueMapToNext = {};
                    for (var value in node.formElement.toggleNextMap) {
                        var toggleNext = node.formElement.toggleNextMap[value];
                        var nextN = toggleNext === true ? 1 : toggleNext;
                        var toggleNextClass = 'jsonform-toggle-next jsonform-toggle-next-' + nextN;
                        var $next = nextN === 1 ? $(node.el).next() : (nextN === 'all' ? $(node.el).nextAll() : $(node.el).nextAll().slice(0, nextN));
                        $next.addClass('jsonform-toggle-next-target');
                        valueMapToNext[value] = $next;
                    }
                    $(node.el).addClass(toggleNextClass).find(':radio').on('change', function () {
                        var $this = $(this);
                        var val = $this.val();
                        var checked = $this.is(':checked');
                        if (checked) {
                            for (var v in valueMapToNext) {
                                var $n = valueMapToNext[v];
                                if (v === val)
                                    $n.toggle(checked).toggleClass('jsonform-toggled-visible', checked);
                                else
                                    $n.toggle(!checked).toggleClass('jsonform-toggled-visible', !checked);
                            }
                        }
                        else {
                            // no option checked yet
                            for (var v in valueMapToNext) {
                                var $n = valueMapToNext[v];
                                $n.toggle(false).toggleClass('jsonform-toggled-visible', false);
                            }
                        }
                    }).change();
                }
            }
        },
        'radiobuttons': {
            'template': '<div id="<%= node.id %>" ' + ' class="<%= elt.htmlClass ? " " + elt.htmlClass : "" %>">' +
                '<% _.each(node.options, function(key, val) { %>' +
                '<label class="<%= cls.buttonClass %>">' +
                '<input type="radio" style="position:absolute;left:-9999px;" ' +
                '<% if (((key instanceof Object) && (value === key.value)) || (value === key)) { %> checked="checked" <% } %> name="<%= node.name %>" value="<%= (key instanceof Object ? key.value : key) %>" />' +
                '<span><%= (key instanceof Object ? key.title : key) %></span></label> ' +
                '<% }); %>' +
                '</div>',
            'fieldtemplate': true,
            'inputfield': true,
            'onInsert': function (evt, node) {
                var activeClass = 'active';
                var elt = node.getFormElement();
                if (elt.activeClass) {
                    activeClass += ' ' + elt.activeClass;
                }
                $(node.el).find('label').on('click', function () {
                    $(this).parent().find('label').removeClass(activeClass);
                    $(this).addClass(activeClass);
                }).find(':checked').closest('label').addClass(activeClass);
            }
        },
        'checkboxes': {
            'template': '<div id="<%= node.id %>"><%= choiceshtml %><%= children %></div>',
            'fieldtemplate': true,
            'inputfield': true,
            'childTemplate': function (inner, data, node) {
                // non-inline style, we do not wrap it.
                if (!node.formElement.otherField)
                    return inner;
                var template = '';
                if (node.formElement.otherField.asArrayValue) {
                    // XXX: for the novalue mode, the checkbox has no value, value is in the input field
                    if (node.otherValues) {
                        template += '<% value = node.parentNode.otherValues.join(", ") %>';
                    }
                }
                template += '<input type="checkbox"<%= value !== undefined && value !== null && value !== "" ? " checked=\'checked\'" : "" %>';
                if (!node.formElement.otherField.asArrayValue && node.formElement.otherField.novalue !== true || node.formElement.otherField.novalue === false) {
                    template += ' name="' + node.key + '[' + (node.formElement.otherField.idx !== undefined ? node.formElement.otherField.idx : node.formElement.options.length) + ']" value="' + (node.formElement.optionsAsEnumOrder ? 1 : (node.formElement.otherField.otherValue || 'OTHER')) + '"';
                }
                template += '<%= node.disabled? " disabled" : "" %> />';
                template += '<span><%= node.title || "Other" %> </span>';
                var otherFieldClass = 'other-field';
                if (node.formElement.otherField.inline) {
                    // put the other field just after the checkbox, wrapped in the label tag
                    template += '<div class="other-field-content">' + inner + '</div>';
                    otherFieldClass = 'inline-' + otherFieldClass;
                }
                if (node.formElement.inline) {
                    template = '<label class="' + otherFieldClass + ' checkbox<%= cls.inlineClassSuffix %>">' + template + '</label>';
                }
                else {
                    template = '<div class="' + otherFieldClass + ' checkbox"><label>' + template + '</label></div>';
                }
                if (!node.formElement.otherField.inline) {
                    // put the other field just after the checkbox's label/div
                    template += '<div class="other-field-content">' + inner + '</div>';
                }
                return template;
            },
            'onBeforeRender': function (data, node) {
                // Build up choices from the enumeration/options list
                if (!node || !node.schemaElement || !node.schemaElement.items)
                    return;
                var choices = node.formElement.options;
                if (!choices)
                    return;
                var template = '<input type="checkbox"<%= checked ? " checked=\'checked\'" : "" %> name="<%= name %>" value="<%= escape(value) %>"<%= node.disabled? " disabled" : "" %> /><span><%= title %></span>';
                if (node.formElement.inline) {
                    template = '<label class="checkbox' + data.cls.inlineClassSuffix + '">' + template + '</label>';
                }
                else {
                    template = '<div class="checkbox"><label>' + template + '</label></div>';
                }
                var choiceshtml = '';
                if (node.formElement.otherField && node.formElement.otherField.asArrayValue && node.value) {
                    var choiceValues = choices.map(function (choice) { return choice.value; });
                    // we detect values which are not within our choice values.
                    var otherValues = [];
                    node.value.forEach(function (val) {
                        if (!_.include(choiceValues, val)) {
                            otherValues.push(val);
                        }
                    });
                    if (otherValues.length > 0)
                        node.otherValues = otherValues;
                }
                else {
                    delete node.otherValues;
                }
                _.each(choices, function (choice, idx) {
                    if (node.formElement.otherField && choice.value === (node.formElement.otherField.otherValue || 'OTHER')) {
                        node.formElement.otherField.idx = idx;
                        return;
                    }
                    choiceshtml += jsonform.util._template(template, {
                        name: node.key + '[' + idx + ']',
                        value: node.formElement.optionsAsEnumOrder ? 1 : choice.value,
                        checked: _.include(node.value, choice.value),
                        title: choice.title,
                        node: node,
                        escape: jsonform.util.escapeHTML
                    }, jsonform.util.fieldTemplateSettings);
                });
                // the otherField could be?
                // 1. key, then use the key as inputField? wrap or not? type?
                // 2. {key: theKey, inline: boolean} type?
                // 2.1 about the type, can it be text type? if so, it will use the title, the template
                //     etc. it's good, but we do not want the title, then use notitle?
                // 3. {nokey, items: [custom elementes]} type?
                if (node.formElement.otherField) {
                }
                data.choiceshtml = choiceshtml;
            },
            'onInsert': function (evt, node) {
                // FIXME: consider default values?
                function inputHasAnyValue(inputs) {
                    var anyValue = false;
                    inputs.each(function () {
                        var $input = $(this);
                        if ($input.is(':checkbox, :radio')) {
                            if ($input.prop('checked')) {
                                anyValue = true;
                                return false;
                            }
                        }
                        if ($input.is('button'))
                            return;
                        if ($(this).val() !== '') {
                            anyValue = true;
                            return false;
                        }
                    });
                    return anyValue;
                }
                var $checkbox = node.formElement.otherField && node.formElement.otherField.inline ? $(node.el).find('.inline-other-field :checkbox').first() : $(node.el).find('.other-field :checkbox');
                var $inputs = $(node.el).find('.other-field-content :input');
                function otherFieldValueChange() {
                    $checkbox.prop('checked', inputHasAnyValue($inputs));
                }
                $inputs.on('keyup', otherFieldValueChange).on('change', otherFieldValueChange).change();
                $checkbox.on('change', function () {
                    if (this.checked) {
                        this.checked = false;
                        $inputs.not(':checkbox,:radio,button').focus();
                    }
                    else {
                        // FIXME: reset back to default?
                        $inputs.filter('input[type=text], textarea').val('');
                    }
                });
            }
        },
        'checkboxbuttons': {
            'template': '<div id="<%= node.id %>"><%= choiceshtml %></div>',
            'fieldtemplate': true,
            'inputfield': true,
            'onBeforeRender': function (data, node) {
                // Build up choices from the enumeration list
                var choices = null;
                var choiceshtml = null;
                var template = '<label class="<%= cls.buttonClass %> ' + data.fieldHtmlClass + '">' +
                    '<input type="checkbox" style="position:absolute;left:-9999px;" <% if (checked) { %> checked="checked" <% } %> name="<%= name %>" value="<%= value %>"' +
                    '<%= (node.disabled? " disabled" : "")%>' +
                    '/><span><%= title %></span></label>';
                if (!node || !node.schemaElement || !node.schemaElement.items)
                    return;
                choices = node.formElement.options;
                if (!choices)
                    return;
                if (!node.value || !Array.isArray(node.value))
                    node.value = [];
                choiceshtml = '';
                _.each(choices, function (choice, idx) {
                    choiceshtml += jsonform.util._template(template, {
                        name: node.key + '[' + idx + ']',
                        checked: _.include(node.value, choice.value),
                        value: choice.value,
                        title: choice.title,
                        node: node,
                        cls: data.cls
                    }, jsonform.util.fieldTemplateSettings);
                });
                data.choiceshtml = choiceshtml;
            },
            'onInsert': function (evt, node) {
                var activeClass = 'active';
                var elt = node.getFormElement();
                if (elt.activeClass) {
                    activeClass += ' ' + elt.activeClass;
                }
                $(node.el).find('label').on('click', function () {
                    $(this).toggleClass(activeClass, $(this).find('input:checkbox').prop('checked'));
                }).find(':checked').closest('label').addClass(activeClass);
            }
        },
        'tablearray': {
            'template': '<div id="<%= id %>">' +
                '<table class="_jsonform-tablearray table <%= elt.htmlClass?elt.htmlClass:"" %>">' +
                '<thead></thead>' +
                '<%= children %>' +
                '</table>' +
                '<span class="_jsonform-array-buttons">' +
                '<a href="#" class="btn _jsonform-array-addmore"><i class="icon-plus-sign" title="Add new"></i></a> ' +
                '<a href="#" class="btn _jsonform-array-deletelast"><i class="icon-minus-sign" title="Delete last"></i></a>' +
                '</span>' +
                '</div>',
            'array': true,
            'fieldtemplate': true,
            // 'childTemplate': function(inner){
            //   // Wrap everything in a <tbody></tbody>??
            //   return;
            // },
            'onBeforeRender': function (data, node) {
                // Can we change the parent/child data types?
                // Set the view on the children?
                var append = " _jsonform-tablearray";
                data.elt.htmlClass = data.elt.htmlClass ? data.elt.htmlClass += append : append;
            },
            'onInsert': function (evt, node) {
                var $nodeid = $(node.el).find('#' + jsonform.util.escapeSelector(node.id));
                var boundaries = node.getArrayBoundaries();
                // TODO: Render the heading row.
                // TODO: Take a count of the number of children so we know how many columns there are.
                // How do we handle nested arrays?
                // If any items have a sub-array then do all of the children need to be in a full table?
                if (node.children && node.children.length) {
                    var headerNode = node.children[0];
                    var header = $nodeid.find('> table > thead');
                    var headerRow = [];
                    // Iterate over each of the children and render out the header.
                    _.each(headerNode.children, function (formNode) {
                        // TODO: Skip nested array object types, they'll be put in as their own tables.
                        // What about Object types?
                        // if (formNode.schemaElement.type != 'array'){
                        // Everything should have a title.
                        headerRow.push('<th>');
                        headerRow.push(formNode.title);
                        headerRow.push('</th>');
                        // }
                    });
                    // Wrap with a row and render.
                    if (headerRow.length) {
                        headerRow.unshift('<tr>');
                        headerRow.push('</tr>');
                        header.append(headerRow.join(''));
                    }
                }
                // // Switch two nodes in an array
                // var moveNodeTo = function (fromIdx, toIdx) {
                //   // Note "switchValuesWith" extracts values from the DOM since field
                //   // values are not synchronized with the tree data structure, so calls
                //   // to render are needed at each step to force values down to the DOM
                //   // before next move.
                //   // TODO: synchronize field values and data structure completely and
                //   // call render only once to improve efficiency.
                //   if (fromIdx === toIdx) return;
                //   var incr = (fromIdx < toIdx) ? 1: -1;
                //   var i = 0;
                //   var parentEl = $('> ul', $nodeid);
                //   for (i = fromIdx; i !== toIdx; i += incr) {
                //     node.children[i].switchValuesWith(node.children[i + incr]);
                //     node.children[i].render(parentEl.get(0));
                //     node.children[i + incr].render(parentEl.get(0));
                //   }
                //   // No simple way to prevent DOM reordering with jQuery UI Sortable,
                //   // so we're going to need to move sorted DOM elements back to their
                //   // origin position in the DOM ourselves (we switched values but not
                //   // DOM elements)
                //   var fromEl = $(node.children[fromIdx].el);
                //   var toEl = $(node.children[toIdx].el);
                //   fromEl.detach();
                //   toEl.detach();
                //   if (fromIdx < toIdx) {
                //     if (fromIdx === 0) parentEl.prepend(fromEl);
                //     else $(node.children[fromIdx-1].el).after(fromEl);
                //     $(node.children[toIdx-1].el).after(toEl);
                //   }
                //   else {
                //     if (toIdx === 0) parentEl.prepend(toEl);
                //     else $(node.children[toIdx-1].el).after(toEl);
                //     $(node.children[fromIdx-1].el).after(fromEl);
                //   }
                // };
                // TODO: Allow deleting arbitrary rows.
                var addButton = $nodeid.find('> span > a._jsonform-array-addmore');
                var deleteButton = $nodeid.find('> span > a._jsonform-array-deletelast');
                var addItem = function (idx) {
                    if (boundaries.maxItems >= 0) {
                        if (node.children.length > boundaries.maxItems - 2) {
                            addButton.addClass('disabled');
                        }
                        if (node.children.length > boundaries.maxItems - 1) {
                            return false;
                        }
                    }
                    // node.insertArrayItem(idx, $('> ul', $nodeid).get(0));
                    node.insertArrayItem(idx, $('> table', $nodeid).get(0));
                    if ((boundaries.minItems <= 0) ||
                        ((boundaries.minItems > 0) &&
                            (node.children.length > boundaries.minItems - 1))) {
                        deleteButton.removeClass('disabled');
                    }
                };
                var deleteItem = function (idx) {
                    if (boundaries.minItems > 0) {
                        if (node.children.length < boundaries.minItems + 2) {
                            deleteButton.addClass('disabled');
                        }
                        if (node.children.length <= boundaries.minItems) {
                            return false;
                        }
                    }
                    else if (node.children.length === 1) {
                        deleteButton.addClass('disabled');
                    }
                    node.deleteArrayItem(idx);
                    if ((boundaries.maxItems >= 0) && (idx <= boundaries.maxItems - 1)) {
                        addButton.removeClass('disabled');
                    }
                };
                addButton.click(function (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    var idx = node.children.length;
                    addItem(idx);
                });
                //Simulate Users click to setup the form with its minItems
                // var curItems = $('> ul > li', $nodeid).length;
                var tableSelector = '> table';
                var bodySelector = '> table > tbody';
                var curItems = $(bodySelector, $nodeid).length;
                if ((boundaries.minItems > 0) &&
                    (curItems < boundaries.minItems)) {
                    for (var i = 0; i < (boundaries.minItems - 1) && ($nodeid.find(bodySelector).length < boundaries.minItems); i++) {
                        //console.log('Calling click: ',$nodeid);
                        //$('> span > a._jsonform-array-addmore', $nodeid).click();
                        // node.insertArrayItem(curItems, $nodeid.find('> ul').get(0));
                        node.insertArrayItem(curItems, $nodeid.find('> table').get(0));
                    }
                }
                if ((boundaries.minItems > 0) &&
                    (node.children.length <= boundaries.minItems)) {
                    deleteButton.addClass('disabled');
                }
                deleteButton.click(function (evt) {
                    var idx = node.children.length - 1;
                    evt.preventDefault();
                    evt.stopPropagation();
                    deleteItem(idx);
                });
                // Allows deleting any index in the array.
                $nodeid.on('click', '._jsonform-array-item-delete', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var idx = $(e.currentTarget).parent().data('idx');
                    deleteItem(idx);
                });
                // if ($(node.el).sortable) {
                //   $('> ul', $nodeid).sortable();
                //   $('> ul', $nodeid).bind('sortstop', function (event, ui) {
                //     var idx = $(ui.item).data('idx');
                //     var newIdx = $(ui.item).index();
                //     moveNodeTo(idx, newIdx);
                //   });
                // }
            }
        },
        'tableobject': {
            // A sub-child of tablearray.
            // Need to know if we should render the header.
            // 'template': '<tbody><tr><td>table object</td></tr></tbody>',
            'template': '<tbody id="<%= id %>"><%= children %></tbody>',
            'fieldtemplate': false,
            'childSelector': '> tbody',
            'onBeforeRender': function (data, node) {
                // Check the index here -> output that in the 
                //console.log('tableobject: data=', data, '\nnode=', node);
                // Create a map of children and their types.
                // Simple children just go in a <td> but complex types might need their own <tr>.
                //data.
                data.childMap = {
                    simple: [],
                    complex: [] // a single row for every item, wrap each item in a <tr><td colspan="x"></td></tr>
                };
                // TODO: Handle multiple <tr> elements for nested tables.
                // TODO: Need to count the number of 'simple' elements that will form the rows.
                if (data.schema && data.schema.properties) {
                    var simpleCount = 0;
                    _.each(data.schema.properties, function (dataType) {
                        if (dataType.type != 'array') {
                            simpleCount++;
                        }
                    });
                    data.columnCount = simpleCount;
                }
            },
            'childTemplate': function (inner, data, node, parentData, parentNode) {
                //'<td></td>'
                // TODO: How do we know how many children we have?
                // // Check the child's type.
                // if (parentData.childMap && node.schemaElement){
                //   if (node.schemaElement.type == 'array'){
                //     // Complex type.
                //     // TODO: Need to know the colspan.
                //     parentData.childMap.complex.push('<tr>', '<td colspan="'+parentData.columnCount+'">', inner, '</td>', '</tr>');
                //   } else {
                //     // simple type
                //     parentData.childMap.simple.push('<td>'+inner+'</td>');
                //   }
                // }
                // return inner;
                return '<td>' + inner + '</td>';
            },
            onAfterRender: function (data, node) {
                // if (data.childMap){
                //   var childMap = data.childMap;
                //   // NOTE: At some point we need to wrap the simple elements in a row.
                //   // Squash the child data down to a string and then set as `node.children`.
                //   if (childMap.simple.length){
                //     childMap.simple.unshift('<tr>');
                //     childMap.simple.push('</tr>');
                //   }
                //   data.children = childMap.simple.join('') + childMap.complex.join('');
                // }
            }
        },
        'array': {
            'template': '<div id="<%= id %>"><ul class="_jsonform-array-ul" style="list-style-type:none;"><%= children %></ul>' +
                '<% if (!node.isReadOnly()) { %><span class="_jsonform-array-buttons">' +
                '<a href="#" class="<%= cls.buttonClass %> _jsonform-array-addmore"><i class="<%= cls.iconClassPrefix %>-plus-sign" title="Add new"></i></a> ' +
                '<a href="#" class="<%= cls.buttonClass %> _jsonform-array-deletelast"><i class="<%= cls.iconClassPrefix %>-minus-sign" title="Delete last"></i></a>' +
                '</span><% } %>' +
                '</div>',
            'fieldtemplate': true,
            'array': true,
            'childTemplate': function (inner, data, node) {
                if (!node.isReadOnly() && $('').sortable) {
                    // Insert a "draggable" icon
                    // floating to the left of the main element
                    return '<li data-idx="<%= node.childPos %>">' +
                        '<span class="draggable line"><i class="<%= cls.iconClassPrefix %>-list" title="Move item"></i></span>' +
                        ' <a href="#" class="_jsonform-array-item-delete"><i class="<%= cls.iconClassPrefix %>-remove" title="Remove item"></i></a>' +
                        inner +
                        '</li>';
                }
                else {
                    return '<li data-idx="<%= node.childPos %>">' +
                        inner +
                        '</li>';
                }
            },
            'onInsert': function (evt, node) {
                var $nodeid = $(node.el).find('#' + jsonform.util.escapeSelector(node.id));
                var boundaries = node.getArrayBoundaries();
                // Switch two nodes in an array
                var moveNodeTo = function (fromIdx, toIdx) {
                    // Note "switchValuesWith" extracts values from the DOM since field
                    // values are not synchronized with the tree data structure, so calls
                    // to render are needed at each step to force values down to the DOM
                    // before next move.
                    // TODO: synchronize field values and data structure completely and
                    // call render only once to improve efficiency.
                    if (fromIdx === toIdx)
                        return;
                    var incr = (fromIdx < toIdx) ? 1 : -1;
                    var i = 0;
                    var parentEl = $('> ul', $nodeid);
                    for (i = fromIdx; i !== toIdx; i += incr) {
                        node.children[i].switchValuesWith(node.children[i + incr]);
                        node.children[i].render(parentEl.get(0));
                        node.children[i + incr].render(parentEl.get(0));
                    }
                    // No simple way to prevent DOM reordering with jQuery UI Sortable,
                    // so we're going to need to move sorted DOM elements back to their
                    // origin position in the DOM ourselves (we switched values but not
                    // DOM elements)
                    var fromEl = $(node.children[fromIdx].el);
                    var toEl = $(node.children[toIdx].el);
                    fromEl.detach();
                    toEl.detach();
                    if (fromIdx < toIdx) {
                        if (fromIdx === 0)
                            parentEl.prepend(fromEl);
                        else
                            $(node.children[fromIdx - 1].el).after(fromEl);
                        $(node.children[toIdx - 1].el).after(toEl);
                    }
                    else {
                        if (toIdx === 0)
                            parentEl.prepend(toEl);
                        else
                            $(node.children[toIdx - 1].el).after(toEl);
                        $(node.children[fromIdx - 1].el).after(fromEl);
                    }
                };
                var addItem = function (idx) {
                    if (boundaries.maxItems >= 0) {
                        var slotNum = boundaries.maxItems - node.children.length;
                        $nodeid.find('> span > a._jsonform-array-addmore')
                            .toggleClass('disabled', slotNum <= 1);
                        if (slotNum < 1) {
                            return false;
                        }
                    }
                    node.insertArrayItem(idx, $('> ul', $nodeid).get(0));
                    var canDelete = node.children.length > boundaries.minItems;
                    $nodeid.find('> span > a._jsonform-array-deletelast')
                        .toggleClass('disabled', !canDelete);
                    $nodeid.find('> ul > li > a._jsonform-array-item-delete').toggle(canDelete);
                };
                var deleteItem = function (idx) {
                    var itemNumCanDelete = node.children.length - Math.max(boundaries.minItems, 0);
                    $nodeid.find('> span > a._jsonform-array-deletelast')
                        .toggleClass('disabled', itemNumCanDelete <= 1);
                    $nodeid.find('> ul > li > a._jsonform-array-item-delete').toggle(itemNumCanDelete > 1);
                    if (itemNumCanDelete < 1) {
                        return false;
                    }
                    node.deleteArrayItem(idx);
                    $nodeid.find('> span > a._jsonform-array-addmore')
                        .toggleClass('disabled', boundaries.maxItems >= 0 && node.children.length >= boundaries.maxItems);
                };
                $('> span > a._jsonform-array-addmore', $nodeid).click(function (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    var idx = node.children.length;
                    addItem(idx);
                });
                //Simulate Users click to setup the form with its minItems
                var curItems = $('> ul > li', $nodeid).length;
                if (boundaries.minItems > 0) {
                    for (var i = node.children.length; i < boundaries.minItems; i++) {
                        //console.log('Calling click: ',$nodeid);
                        //$('> span > a._jsonform-array-addmore', $nodeid).click();
                        node.insertArrayItem(node.children.length, $nodeid.find('> ul').get(0));
                    }
                }
                var itemNumCanDelete = node.children.length - Math.max(boundaries.minItems, 0);
                $nodeid.find('> span > a._jsonform-array-deletelast')
                    .toggleClass('disabled', itemNumCanDelete <= 0);
                $nodeid.find('> ul > li > a._jsonform-array-item-delete').toggle(itemNumCanDelete > 0);
                $nodeid.find('> span > a._jsonform-array-addmore')
                    .toggleClass('disabled', boundaries.maxItems >= 0 && node.children.length >= boundaries.maxItems);
                $('> span > a._jsonform-array-deletelast', $nodeid).click(function (evt) {
                    var idx = node.children.length - 1;
                    evt.preventDefault();
                    evt.stopPropagation();
                    deleteItem(idx);
                });
                $nodeid.on('click', '> ul > li > a._jsonform-array-item-delete', function (e) {
                    e.preventDefault();
                    var $li = $(e.currentTarget).parent();
                    if ($li.parent().parent().attr('id') != node.id)
                        return;
                    e.stopPropagation();
                    var idx = $li.data('idx');
                    deleteItem(idx);
                });
                if (!node.isReadOnly() && $(node.el).sortable) {
                    $('> ul', $nodeid).sortable();
                    $('> ul', $nodeid).bind('sortstop', function (event, ui) {
                        var idx = $(ui.item).data('idx');
                        var newIdx = $(ui.item).index();
                        moveNodeTo(idx, newIdx);
                    });
                }
            }
        },
        'tabarray': {
            'template': '<div id="<%= id %>"><div class="tabbable tabs-left">' +
                '<ul class="nav nav-tabs">' +
                '<%= tabs %>' +
                '</ul>' +
                '<div class="tab-content">' +
                '<%= children %>' +
                '</div>' +
                '</div>' +
                '</div>',
            'fieldtemplate': true,
            'array': true,
            'childTemplate': function (inner) {
                return '<div data-idx="<%= node.childPos %>" class="tab-pane">' +
                    inner +
                    '</div>';
            },
            'onBeforeRender': function (data, node) {
                // Generate the initial 'tabs' from the children
                /*var tabs = '';
                _.each(node.children, function (child, idx) {
                  var title = child.legend ||
                    child.title ||
                    ('Item ' + (idx+1));
                  tabs += '<li data-idx="' + idx + '"' +
                    ((idx === 0) ? ' class="active"' : '') +
                    '><a class="draggable tab" data-toggle="tab">' + util.escapeHTML(title);
                  if (!node.isReadOnly()) {
                    tabs += ' <span href="#" class="_jsonform-array-item-delete"><i class="' +
                    node.ownerTree.defaultClasses.iconClassPrefix + '-remove" title="Remove item"></i></span>' +
                    '</a>';
                  }
                  tabs +=  '</li>';
                });
                var boundaries = node.getArrayBoundaries();
                if (!node.isReadOnly() && (boundaries.maxItems < 0 || node.children.length < boundaries.maxItems)) {
                  tabs += '<li data-idx="-1" class="_jsonform-array-addmore"><a class="tab _jsonform-array-addmore" title="'+(node.formElement.addMoreTooltip ? util.escapeHTML(node.formElement.addMoreTooltip) : 'Add new item')+'"><i class="' +
                  node.ownerTree.defaultClasses.iconClassPrefix + '-plus-sign"></i> '+(node.formElement.addMoreTitle || 'New')+'</a></li>';
                }
                data.tabs = tabs;*/
                data.tabs = '';
            },
            'onInsert': function (evt, node) {
                var $nodeid = $(node.el).find('#' + jsonform.util.escapeSelector(node.id));
                var boundaries = node.getArrayBoundaries();
                var moveNodeTo = function (fromIdx, toIdx) {
                    // Note "switchValuesWith" extracts values from the DOM since field
                    // values are not synchronized with the tree data structure, so calls
                    // to render are needed at each step to force values down to the DOM
                    // before next move.
                    // TODO: synchronize field values and data structure completely and
                    // call render only once to improve efficiency.
                    if (fromIdx === toIdx)
                        return;
                    var incr = (fromIdx < toIdx) ? 1 : -1;
                    var i = 0;
                    var tabEl = $('> .tabbable > .tab-content', $nodeid).get(0);
                    for (i = fromIdx; i !== toIdx; i += incr) {
                        node.children[i].switchValuesWith(node.children[i + incr]);
                        node.children[i].render(tabEl);
                        node.children[i + incr].render(tabEl);
                    }
                };
                // Refreshes the list of tabs
                var updateTabs = function (selIdx) {
                    var tabs = '';
                    var activateFirstTab = false;
                    if (selIdx === undefined) {
                        selIdx = $('> .tabbable > .nav-tabs .active', $nodeid).data('idx');
                        if (selIdx) {
                            selIdx = parseInt(selIdx, 10);
                        }
                        else {
                            activateFirstTab = true;
                            selIdx = 0;
                        }
                    }
                    if (selIdx >= node.children.length) {
                        selIdx = node.children.length - 1;
                    }
                    _.each(node.children, function (child, idx) {
                        var title = child.legend ||
                            child.title ||
                            ('Item ' + (idx + 1));
                        tabs += '<li data-idx="' + idx + '">' +
                            '<a class="draggable tab" data-toggle="tab">' + jsonform.util.escapeHTML(title);
                        if (!node.isReadOnly()) {
                            tabs += ' <span href="#" class="_jsonform-array-item-delete"><i class="' +
                                node.ownerTree.defaultClasses.iconClassPrefix + '-remove" title="Remove item"></i></span>' +
                                '</a>';
                        }
                        tabs += '</li>';
                    });
                    if (!node.isReadOnly() && (boundaries.maxItems < 0 || node.children.length < boundaries.maxItems)) {
                        tabs += '<li data-idx="-1"><a class="tab _jsonform-array-addmore" title="' + (node.formElement.addMoreTooltip ? jsonform.util.escapeHTML(node.formElement.addMoreTooltip) : 'Add new item') + '"><i class="' +
                            node.ownerTree.defaultClasses.iconClassPrefix + '-plus-sign"></i> ' + (node.formElement.addMoreTitle || 'New') + '</a></li>';
                    }
                    $('> .tabbable > .nav-tabs', $nodeid).html(tabs);
                    var canDelete = boundaries.minItems >= 0 && node.children.length <= boundaries.minItems;
                    $nodeid.find('> .tabbable > .nav-tabs > li > a > ._jsonform-array-item-delete').toggle(!canDelete);
                    if (activateFirstTab) {
                        $('> .tabbable > .nav-tabs [data-idx="0"]', $nodeid).addClass('active');
                    }
                    $('> .tabbable > .nav-tabs [data-toggle="tab"]', $nodeid).eq(selIdx).click();
                };
                var deleteItem = function (idx) {
                    var itemNumCanDelete = node.children.length - Math.max(boundaries.minItems, 0);
                    $nodeid.find('> a._jsonform-array-deleteitem')
                        .toggleClass('disabled', itemNumCanDelete <= 1);
                    $nodeid.find('> .tabbable > .nav-tabs > li > a > ._jsonform-array-item-delete').toggle(itemNumCanDelete > 1);
                    if (itemNumCanDelete < 1) {
                        return false;
                    }
                    node.deleteArrayItem(idx);
                    updateTabs();
                    $nodeid.find('> a._jsonform-array-addmore')
                        .toggleClass('disabled', boundaries.maxItems >= 0 && node.children.length >= boundaries.maxItems);
                };
                var addItem = function (idx) {
                    if (boundaries.maxItems >= 0) {
                        var slotNum = boundaries.maxItems - node.children.length;
                        $nodeid.find('> a._jsonform-array-addmore')
                            .toggleClass('disabled', slotNum <= 1);
                        if (slotNum < 1) {
                            return false;
                        }
                    }
                    node.insertArrayItem(idx, $nodeid.find('> .tabbable > .tab-content').get(0));
                    updateTabs(idx);
                    $nodeid.find('> a._jsonform-array-deleteitem')
                        .toggleClass('disabled', node.children.length <= boundaries.minItems);
                };
                $('> a._jsonform-array-deleteitem', $nodeid).click(function (evt) {
                    var idx = $('> .tabbable > .nav-tabs .active', $nodeid).data('idx');
                    evt.preventDefault();
                    evt.stopPropagation();
                    deleteItem(idx);
                });
                //$('> a._jsonform-array-addmore, > .tabbable > .nav-tabs > li > ._jsonform-array-addmore', $nodeid).click(function (evt) {
                $nodeid.on('click', '> a._jsonform-array-addmore, > .tabbable > .nav-tabs > li > ._jsonform-array-addmore', function (evt) {
                    var idx = node.children.length;
                    evt.preventDefault();
                    evt.stopPropagation();
                    addItem(idx);
                });
                $nodeid.on('click', '> .tabbable > .nav-tabs > li > a > ._jsonform-array-item-delete', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var idx = $(e.currentTarget).closest('li').data('idx');
                    deleteItem(idx);
                });
                $(node.el).on('legendUpdated', function (evt) {
                    updateTabs();
                    evt.preventDefault();
                    evt.stopPropagation();
                });
                if (!node.isReadOnly() && $(node.el).sortable) {
                    $('> .tabbable > .nav-tabs', $nodeid).sortable({
                        containment: node.el,
                        cancel: '._jsonform-array-addmore',
                        tolerance: 'pointer'
                    }).on('sortchange', function (event, ui) {
                        if (ui.placeholder.index() == $(this).children().length - 1 && ui.placeholder.prev().data('idx') == -1) {
                            ui.placeholder.prev().before(ui.placeholder);
                        }
                    }).on('sortstop', function (event, ui) {
                        var idx = $(ui.item).data('idx');
                        var newIdx = $(ui.item).index();
                        moveNodeTo(idx, newIdx);
                        updateTabs(newIdx);
                    });
                }
                // Simulate User's click to setup the form with its minItems
                if (boundaries.minItems >= 0) {
                    for (var i = node.children.length; i < boundaries.minItems; i++) {
                        addItem(node.children.length);
                    }
                    updateTabs(0);
                }
                else
                    updateTabs();
                $nodeid.find('> a._jsonform-array-addmore')
                    .toggleClass('disabled', boundaries.maxItems >= 0 && node.children.length >= boundaries.maxItems);
                var canDelete = boundaries.minItems >= 0 && node.children.length <= boundaries.minItems;
                $nodeid.find('> a._jsonform-array-deleteitem')
                    .toggleClass('disabled', canDelete);
                $nodeid.find('> .tabbable > .nav-tabs > li > a > ._jsonform-array-item-delete').toggle(!canDelete);
            }
        },
        'help': {
            'template': '<span <%= id ? \'id="\' + id + \'"\' : "" %> class="help-block" style="padding-top:5px"><%= node.helpvalue || elt.helpvalue %></span>',
            'fieldtemplate': true
        },
        'msg': {
            'template': '<%= elt.msg %>'
        },
        'html': {
            'template': '<%= elt.html %>'
        },
        'textview': {
            'template': '<pre id="<%= id %>" name="<%= node.name %>"><%= value %></pre>',
            'inputfield': true,
            'fieldtemplate': true
        },
        'fieldset': {
            'template': '<fieldset class="jsonform-node jsonform-error-<%= keydash %> <% if (elt.expandable) { %>expandable<% } %> <%= elt.htmlClass?elt.htmlClass:"" %>" ' +
                '<% if (id) { %> id="<%= id %>"<% } %>' +
                ' data-jsonform-type="fieldset">' +
                '<% if (node.title || node.legend) { %><legend><%= node.title || node.legend %></legend><% } %>' +
                '<% if (elt.expandable) { %><div hidden class="<%= cls.groupClass %>"><% } %>' +
                '<%= children %>' +
                '<% if (elt.expandable) { %></div><% } %>' +
                '<span class="help-block jsonform-errortext" style="display:none;"></span>' +
                '</fieldset>'
        },
        'advancedfieldset': {
            'template': '<fieldset' +
                '<% if (id) { %> id="<%= id %>"<% } %>' +
                ' class="expandable jsonform-node jsonform-error-<%= keydash %> <%= elt.htmlClass?elt.htmlClass:"" %>" data-jsonform-type="advancedfieldset">' +
                '<legend>Advanced options</legend>' +
                '<div hidden class="<%= cls.groupClass %>">' +
                '<%= children %>' +
                '</div>' +
                '<span class="help-block jsonform-errortext" style="display:none;"></span>' +
                '</fieldset>'
        },
        'authfieldset': {
            'template': '<fieldset' +
                '<% if (id) { %> id="<%= id %>"<% } %>' +
                ' class="expandable jsonform-node jsonform-error-<%= keydash %> <%= elt.htmlClass?elt.htmlClass:"" %>" data-jsonform-type="authfieldset">' +
                '<legend>Authentication settings</legend>' +
                '<div hidden class="<%= cls.groupClass %>">' +
                '<%= children %>' +
                '</div>' +
                '<span class="help-block jsonform-errortext" style="display:none;"></span>' +
                '</fieldset>'
        },
        'submit': {
            'template': '<input type="submit" <% if (id) { %> id="<%= id %>" <% } %> class="btn btn-primary <%= elt.htmlClass?elt.htmlClass:"" %>" value="<%= value || node.title %>"<%= (node.disabled? " disabled" : "")%>/>'
        },
        'button': {
            'template': ' <button <% if (id) { %> id="<%= id %>" <% } %> class="<%= cls.buttonClass %> <%= elt.htmlClass?elt.htmlClass:"" %>"><%= node.title %></button> '
        },
        'actions': {
            'template': '<div class="form-actions <%= elt.htmlClass?elt.htmlClass:"" %>"><%= children %></div>'
        },
        'hidden': {
            'template': '<input type="hidden" id="<%= id %>" name="<%= node.name %>" value="<%= escape(value) %>" <%= (node.disabled? " disabled" : "")%> />',
            'inputfield': true
        },
        'selectfieldset': {
            'template': '<fieldset class="tab-container <%= elt.htmlClass?elt.htmlClass:"" %>">' +
                '<% if (node.legend) { %><legend><%= node.legend %></legend><% } %>' +
                '<% if (node.formElement.key) { %><input type="hidden" id="<%= node.id %>" name="<%= node.name %>" value="<%= escape(value) %>" /><% } else { %>' +
                '<a id="<%= node.id %>"></a><% } %>' +
                '<div class="tabbable">' +
                '<div class="<%= cls.groupClass %><%= node.formElement.hideMenu ? " hide" : "" %>">' +
                '<% if (node.title && !elt.notitle) { %><label class="<%= cls.labelClass %>" for="<%= node.id %>"><%= node.title %></label><% } %>' +
                '<div class="<%= cls.controlClass %>"><%= tabs %></div>' +
                '</div>' +
                '<div class="tab-content">' +
                '<%= children %>' +
                '</div>' +
                '</div>' +
                '</fieldset>',
            'inputfield': true,
            'getElement': function (el) {
                return $(el).parent().get(0);
            },
            'childTemplate': function (inner) {
                return '<div data-idx="<%= node.childPos %>" class="tab-pane' +
                    '<% if (node.active) { %> active<% } %>">' +
                    inner +
                    '</div>';
            },
            'onBeforeRender': function (data, node) {
                // Before rendering, this function ensures that:
                // 1. direct children have IDs (used to show/hide the tabs contents)
                // 2. the tab to active is flagged accordingly. The active tab is
                // the first one, except if form values are available, in which case
                // it's the first tab for which there is some value available (or back
                // to the first one if there are none)
                // 3. the HTML of the select field used to select tabs is exposed in the
                // HTML template data as "tabs"
                var children = null;
                var choices = [];
                if (node.schemaElement) {
                    choices = node.schemaElement['enum'] || [];
                }
                if (node.options) {
                    children = _.map(node.options, function (option, idx) {
                        var child = node.children[idx];
                        if (option instanceof Object) {
                            option = _.extend({ node: child }, option);
                            option.title = option.title ||
                                child.legend ||
                                child.title ||
                                ('Option ' + (child.childPos + 1));
                            option.value = jsonform.util.isSet(option.value) ? option.value :
                                jsonform.util.isSet(choices[idx]) ? choices[idx] : idx;
                            return option;
                        }
                        else {
                            return {
                                title: option,
                                value: jsonform.util.isSet(choices[child.childPos]) ?
                                    choices[child.childPos] :
                                    child.childPos,
                                node: child
                            };
                        }
                    });
                }
                else {
                    children = _.map(node.children, function (child, idx) {
                        return {
                            title: child.legend || child.title || ('Option ' + (child.childPos + 1)),
                            value: choices[child.childPos] || child.childPos,
                            node: child
                        };
                    });
                }
                var activeChild = null;
                if (data.value) {
                    activeChild = _.find(children, function (child) {
                        return (child.value === node.value);
                    });
                }
                if (!activeChild) {
                    activeChild = _.find(children, function (child) {
                        return child.node.hasNonDefaultValue();
                    });
                }
                if (!activeChild) {
                    activeChild = children[0];
                }
                activeChild.node.active = true;
                data.value = activeChild.value;
                var elt = node.formElement;
                var tabs = '<select class="nav ' + (data.cls.textualInputClass) + '"' +
                    (node.disabled ? ' disabled' : '') +
                    '>';
                _.each(children, function (child, idx) {
                    tabs += '<option data-idx="' + idx + '" value="' + child.value + '"' +
                        (child.node.active ? ' class="active"' : '') +
                        '>' +
                        jsonform.util.escapeHTML(child.title) +
                        '</option>';
                });
                tabs += '</select>';
                data.tabs = tabs;
                return data;
            },
            'onInsert': function (evt, node) {
                $(node.el).find('select.nav').first().on('change', function (evt) {
                    var $option = $(this).find('option:selected');
                    $(node.el).find('input[type="hidden"]').first().val($option.attr('value'));
                });
            }
        },
        'optionfieldset': {
            'template': '<div' +
                '<% if (node.id) { %> id="<%= node.id %>"<% } %>' +
                '>' +
                '<%= children %>' +
                '</div>'
        },
        'section': {
            'template': '<div' +
                '<% if (node.id) { %> id="<%= node.id %>"<% } %> class="jsonform-node jsonform-error-<%= keydash %> <%= elt.htmlClass?elt.htmlClass:"" %>"' +
                '><%= children %></div>'
        },
        /**
         * A "questions" field renders a series of question fields and binds the
         * result to the value of a schema key.
         */
        'questions': {
            'template': '<div>' +
                '<input type="hidden" id="<%= node.id %>" name="<%= node.name %>" value="<%= escape(value) %>" />' +
                '<%= children %>' +
                '</div>',
            'fieldtemplate': true,
            'inputfield': true,
            'getElement': function (el) {
                return $(el).parent().get(0);
            },
            'onInsert': function (evt, node) {
                if (!node.children || (node.children.length === 0))
                    return;
                _.each(node.children, function (child) {
                    $(child.el).hide();
                });
                $(node.children[0].el).show();
            }
        },
        /**
         * A "question" field lets user choose a response among possible choices.
         * The field is not associated with any schema key. A question should be
         * part of a "questions" field that binds a series of questions to a
         * schema key.
         */
        'question': {
            'template': '<div id="<%= node.id %>"><% _.each(node.options, function(key, val) { %>' +
                '<% if (elt.optionsType === "radiobuttons") { %><label class="<%= cls.buttonClass%> <%= ((key instanceof Object && key.htmlClass) ? " " + key.htmlClass : "") %>"><% } else { %>' +
                '<% if (!elt.inline) { %><div class="radio"><% } %>' +
                '<label class="<%= elt.inline ? "radio"+cls.inlineClassSuffix : "" %> <%= ((key instanceof Object && key.htmlClass) ? " " + key.htmlClass : "") %>">' +
                '<% } %><input type="radio" <% if (elt.optionsType === "radiobuttons") { %> style="position:absolute;left:-9999px;" <% } %>name="<%= node.id %>" value="<%= val %>"<%= (node.disabled? " disabled" : "")%>/><span><%= (key instanceof Object ? key.title : key) %></span></label><%= elt.optionsType !== "radiobuttons" && !elt.inline ? "</div>" : "" %> <% }); %></div>',
            'fieldtemplate': true,
            'onInsert': function (evt, node) {
                var activeClass = 'active';
                var elt = node.getFormElement();
                if (elt.activeClass) {
                    activeClass += ' ' + elt.activeClass;
                }
                // Bind to change events on radio buttons
                $(node.el).find('input[type="radio"]').on('change', function (evt) {
                    var questionNode = null;
                    var option = node.options[$(this).val()];
                    if (!node.parentNode || !node.parentNode.el)
                        return;
                    $(node.el).find('label').removeClass(activeClass);
                    $(this).parent().addClass(activeClass);
                    $(node.el).nextAll().hide();
                    $(node.el).nextAll().find('input[type="radio"]').prop('checked', false);
                    // Execute possible actions (set key value, form submission, open link,
                    // move on to next question)
                    if (option.value) {
                        // Set the key of the 'Questions' parent
                        $(node.parentNode.el).find('input[type="hidden"]').val(option.value);
                    }
                    if (option.next) {
                        questionNode = _.find(node.parentNode.children, function (child) {
                            return (child.formElement && (child.formElement.qid === option.next));
                        });
                        $(questionNode.el).show();
                        $(questionNode.el).nextAll().hide();
                        $(questionNode.el).nextAll().find('input[type="radio"]').prop('checked', false);
                    }
                    if (option.href) {
                        if (option.target) {
                            window.open(option.href, option.target);
                        }
                        else {
                            window.location = option.href;
                        }
                    }
                    if (option.submit) {
                        setTimeout(function () {
                            node.ownerTree.submit();
                        }, 0);
                    }
                });
            }
        }
    };
})(jsonform || (jsonform = {}));
/*global window*/
/**
 * The jsonform object whose methods will be exposed to the window object
 */
var jsonform;
(function (jsonform) {
    var global = jsonform.util.global;
    var $ = jsonform.util.$;
    var _ = jsonform.util._;
    jsonform.isBootstrap2 = false;
    jsonform._bs2Classes = {
        groupClass: 'control-group',
        groupMarkClassPrefix: '',
        labelClass: 'control-label',
        controlClass: 'controls',
        iconClassPrefix: 'icon',
        buttonClass: 'btn',
        textualInputClass: '',
        prependClass: 'input-prepend',
        appendClass: 'input-append',
        addonClass: 'add-on',
        buttonAddonClass: '',
        inlineClassSuffix: ' inline'
    };
    jsonform._bs3Classes = {
        groupClass: 'form-group',
        groupMarkClassPrefix: 'has-',
        labelClass: 'control-label',
        controlClass: 'controls',
        iconClassPrefix: 'glyphicon glyphicon',
        buttonClass: 'btn btn-default',
        textualInputClass: 'form-control',
        prependClass: 'input-group',
        appendClass: 'input-group',
        addonClass: 'input-group-addon',
        buttonAddonClass: 'input-group-btn',
        inlineClassSuffix: '-inline'
    };
    function getDefaultClasses(isBootstrap2) {
        return isBootstrap2 ? jsonform._bs2Classes : jsonform._bs3Classes;
    }
    jsonform.getDefaultClasses = getDefaultClasses;
    /**
     * Initializes tabular sections in forms. Such sections are generated by the
     * 'selectfieldset' type of elements in JSON Form.
     *
     * Input fields that are not visible are automatically disabled
     * not to appear in the submitted form. That's on purpose, as tabs
     * are meant to convey an alternative (and not a sequence of steps).
     *
     * The tabs menu is not rendered as tabs but rather as a select field because
     * it's easier to grasp that it's an alternative.
     *
     * Code based on bootstrap-tabs.js, updated to:
     * - react to option selection instead of tab click
     * - disable input fields in non visible tabs
     * - disable the possibility to have dropdown menus (no meaning here)
     * - act as a regular function instead of as a jQuery plug-in.
     *
     * @function
     * @param {Object} tabs jQuery object that contains the tabular sections
     *  to initialize. The object may reference more than one element.
     * @param {Object} options JSONForm options object - lets us specify
     *  if the input fields should be disabled in non-visible tabs (true by default).
     */
    var initializeTabs = function (tabs, options) {
        var activate = function (element, container) {
            container
                .find('> .active')
                .removeClass('active');
            element.addClass('active');
        };
        var enableFields = function ($target, targetIndex) {
            // Enable all fields in the targeted tab
            $target.find('input, textarea, select').removeAttr('disabled');
            /**
             * 2015-02-28 Coridyn:
             *
             * We actually want non-visible content to remain active
             * because the tabs/select menu is a nice way of splitting
             * up large forms.
             *
             * Add the `options.disableInactiveTabs` to indicate if
             * these non-visible tabs should be disabled or should
             * remain enabled.
             *
             * NOTE: The default has been changed to keep other tabs enabled.
             * This is a better default for wiwo projects.
             */
            if (options.disableInactiveTabs) {
                // Disable all fields in other tabs
                $target.parent()
                    .children(':not([data-idx=' + targetIndex + '])')
                    .find('input, textarea, select')
                    .attr('disabled', 'disabled');
            }
            /* END */
        };
        var optionSelected = function (e) {
            var $option = $("option:selected", $(this)), $select = $(this), 
            // do not use .attr() as it sometimes unexplicably fails
            targetIdx = $option.get(0).getAttribute('data-idx') || $option.attr('value'), $target;
            e.preventDefault();
            if ($option.hasClass('active')) {
                return;
            }
            $target = $(this).parents('.tabbable').eq(0).find('> .tab-content > [data-idx=' + targetIdx + ']');
            activate($option, $select);
            activate($target, $target.parent());
            enableFields($target, targetIdx);
        };
        var tabClicked = function (e) {
            var $a = $('a', $(this));
            var $content = $(this).parents('.tabbable').first()
                .find('.tab-content').first();
            var targetIdx = $(this).index();
            var $target = $content.find('> [data-idx=' + targetIdx + ']');
            e.preventDefault();
            activate($(this), $(this).parent());
            activate($target, $target.parent());
            if ($(this).parent().hasClass('jsonform-alternative')) {
                enableFields($target, targetIdx);
            }
        };
        tabs.each(function () {
            $(this).delegate('select.nav', 'change', optionSelected);
            $(this).find('select.nav').each(function () {
                $(this).val($(this).find('.active').attr('value'));
                // do not use .attr() as it sometimes unexplicably fails
                var targetIdx = $(this).find('option:selected').get(0).getAttribute('data-idx') ||
                    $(this).find('option:selected').attr('value');
                var $target = $(this).parents('.tabbable').eq(0).find('> .tab-content > [data-idx=' + targetIdx + ']');
                enableFields($target, targetIdx);
            });
            $(this).delegate('ul.nav li', 'click', tabClicked);
            $(this).find('ul.nav li.active').click();
        });
    };
    /**
     * Truncates the key path to the requested depth.
     *
     * For instance, if the key path is:
     *  foo.bar[].baz.toto[].truc[].bidule
     * and the requested depth is 1, the returned key will be:
     *  foo.bar[].baz.toto
     *
     * Note the function includes the path up to the next depth level.
     *
     * @function
     * @param {String} key The path to the key in the schema, each level being
     *  separated by a dot and array items being flagged with [].
     * @param {Number} depth The array depth
     * @return {String} The path to the key truncated to the given depth.
     */
    var truncateToArrayDepth = function (key, arrayDepth) {
        var depth = 0;
        var pos = 0;
        if (!key)
            return null;
        if (arrayDepth > 0) {
            while (depth < arrayDepth) {
                pos = key.indexOf('[]', pos);
                if (pos === -1) {
                    // Key path is not "deep" enough, simply return the full key
                    return key;
                }
                pos = pos + 2;
                depth += 1;
            }
        }
        // Move one step further to the right without including the final []
        pos = key.indexOf('[]', pos);
        if (pos === -1)
            return key;
        else
            return key.substring(0, pos);
    };
    /**
     * Returns the structured object that corresponds to the form values entered
     * by the use for the given form.
     *
     * The form must have been previously rendered through a call to jsonform.
     *
     * @function
     * @param {Node} The <form> tag in the DOM
     * @return {Object} The object that follows the data schema and matches the
     *  values entered by the user.
     */
    function getFormValue(formelt) {
        var form = $(formelt).data('jsonform-tree');
        if (!form)
            return null;
        return form.root.getFormValues();
    }
    jsonform.getFormValue = getFormValue;
    ;
    /**
     * Highlights errors reported by the JSON schema validator in the document.
     *
     * @function
     * @param {Object} errors List of errors reported by the JSON schema validator
     * @param {Object} options The JSON Form object that describes the form
     *  (unused for the time being, could be useful to store example values or
     *   specific error messages)
     */
    $.fn.jsonFormErrors = function (errors, options) {
        var form = $(this).data("jsonform-tree");
        $("." + form.defaultClasses.groupMarkClassPrefix + "error", this).removeClass(form.defaultClasses.groupMarkClassPrefix + "error");
        $("." + form.defaultClasses.groupMarkClassPrefix + "warning", this).removeClass(form.defaultClasses.groupMarkClassPrefix + "warning");
        $(".jsonform-errortext", this).hide();
        if (!errors)
            return;
        var errorSelectors = [];
        for (var i = 0; i < errors.length; i++) {
            // Compute the address of the input field in the form from the URI
            // returned by the JSON schema validator.
            // These URIs typically look like:
            //  urn:uuid:cccc265e-ffdd-4e40-8c97-977f7a512853#/pictures/1/thumbnail
            // What we need from that is the path in the value object:
            //  pictures[1].thumbnail
            // ... and the jQuery-friendly class selector of the input field:
            //  .jsonform-error-pictures\[1\]---thumbnail
            var key = errors[i].uri || errors[i].path;
            if (['OBJECT_DEPENDENCY_KEY', 'OBJECT_MISSING_REQUIRED_PROPERTY'].indexOf(errors[i].code) >= 0) {
                if (key.slice(-1) != '/')
                    key += '/';
                key += errors[i].params[0];
            }
            if (key) {
                key = key.replace(/.*#\//, '')
                    .replace(/\//g, '.')
                    .replace(/\.([0-9]+)(?=\.|$)/g, '[$1]');
                //var formElement = getSchemaKey(formSchema.properties, name);
                var errormarkerclass = ".jsonform-error-" +
                    jsonform.util.escapeSelector(key.replace(/\./g, "---"));
                //        console.log(errormarkerclass);
                errorSelectors.push(errormarkerclass);
                var errorType = errors[i].type || "error";
                var $node = $(errormarkerclass, this);
                // FIXME: Ideally, we should retrieve the formNode or formElement
                //        But becuase we generate html as text, and did not have a direct
                //        way get the formNode or formElement from the key...
                if (errors[i].code == 'ARRAY_LENGTH_SHORT' && ['checkboxes', 'checkboxbuttons'].indexOf($node.data('jsonform-type')) >= 0) {
                    errors[i].message = 'Please select at least ' + errors[i].params[1] + (errors[i].params[1] > 1 ? ' options' : ' option') + ' above.';
                }
                $node.addClass(form.defaultClasses.groupMarkClassPrefix + errorType);
                $node.find("> div > .jsonform-errortext, > .jsonform-errortext").text(errors[i].message).show();
            }
        }
        // Look for the first error in the DOM and ensure the element
        // is visible so that the user understands that something went wrong
        var errorSelectorsStr = errorSelectors.join(',');
        var $errorSelectors = $(errorSelectorsStr, this);
        // XXX: check invisible panels if error happens there
        var $errorInvisiblePanels = $errorSelectors.parents('.tab-pane');
        var $errorTabs = $();
        $errorInvisiblePanels.each(function () {
            var $this = $(this);
            $errorTabs = $errorTabs.add($this.closest('.tabbable').find('> .nav > li').eq($this.index()).addClass(form.defaultClasses.groupMarkClassPrefix + 'error'));
        });
        var firstError = $errorSelectors.filter(':visible').get(0);
        if (!firstError && $errorTabs.length > 0) {
            firstError = $errorTabs.get(0);
        }
        if (firstError && firstError.scrollIntoView) {
            firstError.scrollIntoView(true, {
                behavior: 'smooth'
            });
        }
    };
    /**
     * Generates the HTML form from the given JSON Form object and renders the form.
     *
     * Main entry point of the library. Defined as a jQuery function that typically
     * needs to be applied to a <form> element in the document.
     *
     * The function handles the following properties for the JSON Form object it
     * receives as parameter:
     * - schema (required): The JSON Schema that describes the form to render
     * - form: The options form layout description, overrides default layout
     * - prefix: String to use to prefix computed IDs. Default is an empty string.
     *  Use this option if JSON Form is used multiple times in an application with
     *  schemas that have overlapping parameter names to avoid running into multiple
     *  IDs issues. Default value is "jsonform-[counter]".
     * - transloadit: Transloadit parameters when transloadit is used
     * - validate: Validates form against schema upon submission. Uses the value
     * of the "validate" property as validator if it is an object.
     * - displayErrors: Function to call with errors upon form submission.
     *  Default is to render the errors next to the input fields.
     * - submitEvent: Name of the form submission event to bind to.
     *  Default is "submit". Set this option to false to avoid event binding.
     * - onSubmit: Callback function to call when form is submitted
     * - onSubmitValid: Callback function to call when form is submitted without
     *  errors.
     *
     * @function
     * @param {Object} options The JSON Form object to use as basis for the form
     */
    $.fn.jsonForm = function (options, param1) {
        var form;
        if (options === 'values') {
            return jsonform.getFormValue(this);
        }
        if (options === 'submit') {
            form = this.data('jsonform-tree');
            if (!form)
                return null;
            return form.submit();
        }
        if (options === 'validate') {
            form = this.data('jsonform-tree');
            if (!form)
                return null;
            return form.validate(param1);
        }
        var formElt = this;
        options = _.defaults({}, options, {
            submitEvent: 'submit',
            disableInactiveTabs: false
        });
        form = new jsonform.FormTree();
        form.initialize(options);
        form.render(formElt.get(0));
        // TODO: move that to formTree.render
        if (options.transloadit) {
            formElt.append('<input type="hidden" name="params" value=\'' +
                jsonform.util.escapeHTML(JSON.stringify(options.transloadit.params)) +
                '\'>');
        }
        // Keep a direct pointer to the JSON schema for form submission purpose
        formElt.data("jsonform-tree", form);
        if (options.submitEvent) {
            formElt.unbind((options.submitEvent) + '.jsonform');
            formElt.bind((options.submitEvent) + '.jsonform', function (evt) {
                form.submit(evt);
            });
        }
        // Initialize tabs sections, if any
        initializeTabs(formElt, options);
        // Initialize expandable sections, if any
        $('.expandable > div, .expandable > fieldset', formElt).hide();
        // Hide all which are not expanded.
        formElt.find('.expandable:not(.expanded)').find('> div, > fieldset').hide();
        formElt.on('click', '.expandable > legend', function () {
            var parent = $(this).parent();
            parent.toggleClass('expanded');
            $('> div', parent).slideToggle(100);
        });
        return form;
    };
    /**
     * Retrieves the structured values object generated from the values
     * entered by the user and the data schema that gave birth to the form.
     *
     * Defined as a jQuery function that typically needs to be applied to
     * a <form> element whose content has previously been generated by a
     * call to "jsonForm".
     *
     * Unless explicitly disabled, the values are automatically validated
     * against the constraints expressed in the schema.
     *
     * @function
     * @return {Object} Structured values object that matches the user inputs
     *  and the data schema.
     */
    $.fn.jsonFormValue = function () {
        return jsonform.getFormValue(this);
    };
    // Expose the getFormValue method to the global object
    // (other methods exposed as jQuery functions)
    if (!global.JSONForm) {
        global.JSONForm = jsonform;
    }
})(jsonform || (jsonform = {}));
var jsonform;
(function (jsonform) {
    var schema;
    (function (schema) {
        schema.Type = {
            array: 'array',
            boolean: 'boolean',
            integer: 'integer',
            number: 'number',
            null: 'null',
            object: 'object',
            string: 'string'
        };
        schema.Format = {
            // Formats defined in json-schema.
            'date-time': 'date-time',
            email: 'email',
            hostname: 'hostname',
            ipv4: 'ipv4',
            ipv6: 'ipv6',
            uri: 'uri',
            // Additional formats:
            color: 'color',
            html: 'html',
        };
    })(schema = jsonform.schema || (jsonform.schema = {}));
})(jsonform || (jsonform = {}));
