namespace jsonform {
    
    var global = util.global;
    var $ = util.$;
    var _ = util._;
    
    
    /**
     * Form tree class.
     *
     * Holds the internal representation of the form.
     * The tree is always in sync with the rendered form, this allows to parse
     * it easily.
     *
     * @class
     */
    export class FormTree {
        
        // From `formTree` constructor
        root: FormNode = null;
        formDesc: IFormDescriptor = null;
        
        // Used by class
        domRoot: /* jQuery-wrapped element */ any = null;
        defaultClasses: IFormClasses = null;
        
        
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
        initialize(formDesc: IFormDescriptor) {
            formDesc = formDesc || {
                    schema: {}
                };

            // Keep a pointer to the initial JSONForm
            // (note clone returns a shallow copy, only first-level is cloned)
            this.formDesc = _.clone(formDesc);

            var defaultClasses: IFormClasses = getDefaultClasses(this.formDesc.isBootstrap2 || jsonform.isBootstrap2);
            this.defaultClasses = _.clone(defaultClasses);
            if (this.formDesc.defaultClasses){
                _.extend(this.defaultClasses, this.formDesc.defaultClasses);
            }

            // Compute form prefix if no prefix is given.
            this.formDesc.prefix = this.formDesc.prefix ||
                'jsonform-' + _.uniqueId();

            /**
             * 2016-04-09
             * TODO: Update this to allow full schema as well as shorthand.
             */
            // JSON schema shorthand
            if (this.formDesc.schema && !this.formDesc.schema.properties) {
                this.formDesc.schema = {
                    properties: this.formDesc.schema
                };
            }
            
            
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
            this.root = new FormNode();
            this.root.ownerTree = this;
            this.root.view = jsonform.elementTypes['root'];

            // Generate the tree from the form description
            this.buildTree();

            // Compute the values associated with each node
            // (for arrays, the computation actually creates the form nodes)
            this.computeInitialValues();
        }
    
    
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
        _convertSchemaV3ToV4(schema: any, processedSchemaNodes: any[] = []){
            if (!schema){
                // return schema;
                return;
            }
            
            if (_.has(schema, 'readonly')){
                schema.readOnly = schema['readonly'];
                delete schema.readonly;
            }
            
            if (schema.properties) {
                var required = [];
                if (_.isArray(schema.required)){
                    required = schema.required;
                }
    
                /**
                 * Add each required child element to our `required` list.
                 */
                for (var field in schema.properties) {
                    var childSchema/*: ISchemaElement*/ = schema.properties[field];
                    if (childSchema.required === true) {
                        if (required.indexOf(field) < 0){
                            required.push(field);
                        }
                        
                        // Remove `required` property from this child.
                        delete childSchema.required;
                    }
                    else if (childSchema.required !== undefined && childSchema.required !== false && !Array.isArray(childSchema.required)){
                        throw new Error('field "' + field + '"\'s required property should be either boolean or array of strings');
                    }
                        
                    if (childSchema.type === 'object') {
                        // Recurse into child objects.
                        if (processedSchemaNodes.indexOf(childSchema) < 0) {
                            processedSchemaNodes.push(childSchema);
                            this._convertSchemaV3ToV4(childSchema, processedSchemaNodes);
                        }
                    }
                    else {
                        // Remove required property from non-object types.
                        delete childSchema.required;
                    }
                    
                    if (childSchema.type === 'array' && childSchema.items) {
                        if (Array.isArray(childSchema.items)) {
                            throw new Error('the items property of array property "' + field + '" in the schema definition must be an object');
                        }
                        
                        if (childSchema.items.type === 'object') {
                            if (processedSchemaNodes.indexOf(childSchema.items) < 0) {
                                processedSchemaNodes.push(childSchema.items);
                                this._convertSchemaV3ToV4(childSchema.items, processedSchemaNodes);
                            }
                        }
                    }
                }
                
                if (required.length > 0){
                    schema.required = required;
                } else {
                    delete schema.required;
                }
            }

            /**
             * TODO: Duplicate the object and omit the unnecessary properties.
             * 
             * TODO: This might mess with the circular-reference detection...
             * Maybe just do a deep clone right at the end?
             */
            // schema = _.omit(schema, omitList);
            return schema;
        }
    
    
        /**
         * Preprocess $ref properties.
         * 
         * Resolve them and replace {$ref: string} with the actual
         * schema representation.
         * 
         * @param obj
         * @param defs
         * @private
         */
        _resolveRefs(obj: any, defs: any, resolvedSchemaRefNodes: any[] = []){
            // Object.keys(obj).forEach(function(prop, index, array) {
            _.forEach(obj, (def: any, prop: string) => {
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
                        this._resolveRefs(def, defs, resolvedSchemaRefNodes);
                    }
                }
            });
        }
    
    
        /**
         * Return the default FormElement definition.
         * 
         * This is a shorthand for include all schema elements and
         * then append an 'actions' element with a submit button.
         * 
         * @private
         */
        _getDefaultFormElements(): IFormElementOrString[]{
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
        }
        
        
        /**
         * Constructs the tree from the form description.
         *
         * The function must be called once when the tree is first created.
         *
         * @function
         */
        buildTree() {
            // Parse and generate the form structure based on the elements encountered:
            // - '*' means "generate all possible fields using default layout"
            // - a key reference to target a specific data element
            // - a more complex object to generate specific form sections
            _.each(this.formDesc.form, (formElement) => {
                if (formElement === '*') {
                    _.each(this.formDesc.schema.properties, (element, key: string) => {
                        if (this.formDesc.nonDefaultFormItems && this.formDesc.nonDefaultFormItems.indexOf(key) >= 0){
                            return;
                        }
    
                        /**
                         * 2016-04-10
                         * We might need to try and interpole the `keyOnParent`
                         * because the key might be a complex 'a.b.c[2]' path.
                         */
                        this.root.appendChild(this.buildFromLayout({
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
                    this.root.appendChild(this.buildFromLayout(formElement));
                }
            });
        }


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
        buildFromLayout(formElement: IFormElement, context?): FormNode {
            var schemaElement: ISchemaElement = null;
            var node = new FormNode();
            var view: ITemplate = null;
            var key = null;

            // XXX: we now support setup formElement for specific key by customFormItems
            if (formElement.key && this.formDesc.customFormItems) {
                var formEl = this.formDesc.customFormItems[formElement.key];
                if (formEl !== undefined) {
                    formEl.key = formElement.key;
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
                // The form element is directly linked to an element in the JSON
                // schema. The properties of the form element override those of the
                // element in the JSON schema. Properties from the JSON schema complete
                // those of the form element otherwise.

                // Retrieve the element from the JSON schema
                schemaElement = util.getSchemaKey(
                    this.formDesc.schema.properties,
                    formElement.key
                );
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
                function isRequiredField(key, schema) {
                    var parts = key.split('.');
                    var field = parts.pop();
                    // whether an array element field is required?
                    // array element has minItems and maxItems which control whether the item is required
                    // so, for array item, we do not consider it as required
                    // then for array itself? it maybe required or not, yes. so, what does it matter?
                    // a required array always has value, even empty array, it still cound has value.
                    // a non-required array, can not appear in the result json at all.
                    // here we try to figure out whether a form input element should be mark required.
                    // all of them are default non-required, unless:
                    // 1. it's top level element and it's marked required
                    // 2. it's direct child of an array item and it's marked required
                    // 3. it's direct child of an object and both it and its parent are marked required.
                    if (field.slice(-2) == '[]') return false;
                    var parentKey = parts.join('.');
                    var required = false;
                    // we need get parent schema's required value
                    if (!parentKey) {
                        required = schema.required && schema.required.indexOf(field) >= 0;
                    }
                    else {
                        var parentSchema = util.getSchemaKey(schema.properties, parentKey);
                        required = parentSchema.required && parentSchema.required.indexOf(field) >= 0;
                        if (required)
                            required = parentKey.slice(-2) == '[]' || isRequiredField(parentKey, schema);
                    }
                    return required;
                }
                
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
                    formElement.id = util.escapeSelector(this.formDesc.prefix) +
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
                    } else if ((schemaElement.type === 'number' ||
                        schemaElement.type === 'integer') &&
                        !schemaElement['enum']) {
                        formElement.type = 'number';
                    } else if ((schemaElement.type === 'string' ||
                        schemaElement.type === 'any') &&
                        !schemaElement['enum']) {
                        formElement.type = 'text';
                    } else if (schemaElement.type === 'boolean') {
                        formElement.type = 'checkbox';
                    } else if (schemaElement.type === 'object') {
                        if (schemaElement.properties) {
                            formElement.type = 'fieldset';
                        } else {
                            formElement.type = 'textarea';
                        }
                    } else if (!_.isUndefined(schemaElement['enum'])) {
                        formElement.type = 'select';
                    } else {
                        formElement.type = schemaElement.type;
                    }
                }

                // Unless overridden in the definition of the form element (or unless
                // there's a titleMap defined), use the enumeration list defined in
                // the schema
                if (formElement.options) {
                    // FIXME: becareful certin type form element may has special format for options
                    this._prepareOptions(formElement);
                } else if (schemaElement['enum'] || schemaElement.type === 'boolean') {
                    var enumValues: any[] = schemaElement['enum'];
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
                        var enumValues: any[] = theItem['enum'];
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
            } else {
                // Debug: find out what is creating nodes without keys.
                // Answer: Elements defined in the top-level `{ form: [] }`
                // list - i.e. controls that are shown on-screen but aren't linked
                // with a schema element.
                var a = true;
            }

            if (!formElement.type) {
                formElement.type = 'text';
            }
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
            } else {
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
            formElement.iddot = util.escapeSelector(formElement.id || '');

            // Initialize the form node from the form element and schema element
            node.formElement = formElement;
            node.schemaElement = schemaElement;
            node.view = view;
            node.ownerTree = this;
    
    
            /**
             * 2016-04-10
             * Process child elements after linking up the
             * formElement and schemaElement with the FormNode instance.
             */
            if (schemaElement){
                // If the form element targets an "object" in the JSON schema,
                // we need to recurse through the list of children to create an
                // input field per child property of the object in the JSON schema
                if (schemaElement.type === 'object') {
                    _.each(schemaElement.properties, (prop, propName) => {
                        var key = formElement.key + '.' + propName;
                        if (this.formDesc.nonDefaultFormItems && this.formDesc.nonDefaultFormItems.indexOf(key) >= 0){
                            return;
                        }
                            
                        node.appendChild(this.buildFromLayout({
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
                // Do not create childTemplate until we first use it.
            } else if (formElement.items) {
                // The form element defines children elements
                _.each(formElement.items, (item) => {
                    if (_.isString(item)) {
                        item = { key: item };
                    }
                    
                    /**
                     * Array elements don't have a 'keyOnParent' value,
                     * that only applies to direct children of objects.
                     */
                    node.appendChild(this.buildFromLayout(item));
                });
            }
            else if (formElement.otherField) {
                var item: /*IOtherField*/ any = formElement.otherField;
                if (_.isString(item)) {
                    item = formElement.otherField = { key: item, notitle: true };
                }
                else if (item.notitle === undefined) {
                    item.notitle = true;
                }
                if (item.inline === undefined){
                    item.inline = formElement.inline;
                }
                
                // Print a warning so we know we need to investigate
                // how this is supposed to work.
                console.warn('(FormTree) buildFromLayout: processing `formElement.otherField` but this hasn\'t been fully checked yet.\n\nMight need to raise an issue in Github for this with an example of how `otherField` is being used.');
                var tempItem = <IFormElement>item;
                node.appendChild(this.buildFromLayout(tempItem));
            }

            return node;
        }
    
    
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
        _prepareOptions(formElement, enumValues?: any[]) {
            if (formElement.options) {
                if (Array.isArray(formElement.options)) {
                    formElement.options = formElement.options.map(function(value) {
                        return util.hasOwnProperty(value, 'value') ? value : {
                            value: value,
                            title: value
                        };
                    });
                }
                else if (typeof formElement.options === 'object') {
                    // titleMap like options
                    formElement.options = Object.keys(formElement.options).map(function(value) {
                        return {
                            value: value,
                            title: formElement.options[value]
                        };
                    });
                }
            }
            else if (formElement.titleMap) {
                formElement.options = _.map(enumValues, function(value) {
                    var title = value.toString();
                    return {
                        value: value,
                        title: util.hasOwnProperty(formElement.titleMap, title) ? formElement.titleMap[title] : title
                    };
                });
            }
            else {
                formElement.options = enumValues.map(function(value) {
                    return {
                        value: value,
                        title: value.toString()
                    };
                });
            }
        }


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
        computeInitialValues() {
            /**
             * 2016-04-09
             * TODO: Check if `formDesc.value` is ever set.
             */
            var value = (<any>this.formDesc).value;
            this.root.computeInitialValues(value);
        }


        /**
         * Renders the form tree
         *
         * @function
         * @param {Node} domRoot The "form" element in the DOM tree that serves as
         *  root for the form
         */
        render(domRoot) {
            if (!domRoot) return;
            this.domRoot = domRoot;
            this.root.render();

            // If the schema defines required fields, flag the form with the
            // "jsonform-hasrequired" class for styling purpose
            // (typically so that users may display a legend)
            if (this.hasRequiredField()) {
                $(domRoot).addClass('jsonform-hasrequired');
            }
            $(domRoot).addClass('jsonform');
        }

        /**
         * Walks down the element tree with a callback
         *
         * @function
         * @param {Function} callback The callback to call on each element
         */
        forEachElement(callback: (node/*: formNode*/) => void) {

            var f = function(root/*: formNode*/) {
                for (var i = 0; i < root.children.length; i++) {
                    callback(root.children[i]);
                    f(root.children[i]);
                }
            };
            f(this.root);

        }

        validate(noErrorDisplay = false) {

            var values = jsonform.getFormValue(this.domRoot);
            var errors: any = false;

            var options = this.formDesc;

            if (options.validate !== false) {
                var validator: any = false;
                if (typeof options.validate != "object") {
                    if (global.ZSchema) {
                        validator = new global.ZSchema();
                        validator._vendor = 'z-schema';
                    } else if (global.jjv) {
                        validator = global.jjv();
                        validator._vendor = 'jjv';
                    } else if (global.JSONFormValidator) {
                        validator = global.JSONFormValidator.createEnvironment("json-schema-draft-03");
                        validator._vendor = 'jsv';
                    }
                } else {
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
                            if (!errors) errors = [];
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
                } else {
                    $(this.domRoot).jsonFormErrors(errors, options);
                }
            }

            return { "errors": errors, "values": values };

        }
        

        submit(evt?/*: Event*/) {

            var stopEvent = function() {
                if (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                return false;
            };
            var values = jsonform.getFormValue(this.domRoot);
            var options = this.formDesc;

            var brk = false;
            this.forEachElement(function(elt/*: formNode*/) {
                if (brk) return;
                if (elt.view.onSubmit) {
                    brk = !elt.view.onSubmit(evt, elt); //may be called multiple times!!
                }
            });

            if (brk) return stopEvent();

            var validated = this.validate();

            if (options.onSubmit && !options.onSubmit(validated.errors, values)) {
                return stopEvent();
            }

            if (validated.errors) return stopEvent();

            if (options.onSubmitValid && !options.onSubmitValid(values)) {
                return stopEvent();
            }

            return false;

        }


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
        hasRequiredField() {
            return $(this.domRoot).find('.jsonform-required').length > 0;
        }
        
    }

}