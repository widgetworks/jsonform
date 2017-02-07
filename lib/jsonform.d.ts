/*! Copyright (c) 2012 Joshfire - MIT license */
declare namespace jsonform.util {
    var global: any;
    var $: any;
    var _: any;
    /**
     * Regular expressions used to extract array indexes in input field names
     */
    var reArray: RegExp;
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
    var escapeSelector: (selector: any) => any;
    var escapeHTML: (string: any) => any;
    /**
     * Returns true if given value is neither "undefined" nor null
     */
    var isSet: (value: any) => boolean;
    /**
     * Template settings for form views
     */
    var fieldTemplateSettings: {
        evaluate: RegExp;
        interpolate: RegExp;
    };
    /**
     * Template settings for value replacement
     */
    var valueTemplateSettings: {
        evaluate: RegExp;
        interpolate: RegExp;
    };
    var _template: any;
    /**
     * Returns true if given property is directly property of an object
     */
    var hasOwnProperty: (obj: any, prop: any) => any;
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
    function getObjKey(obj: any, key: string, ignoreArrays?: boolean): any;
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
    function getObjKeyEx(obj: any, key: string, objKey?: string): any;
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
    function setObjKey(obj: any, key: any, value: any): void;
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
    var getSchemaKey: (schema: any, key: any) => any;
    /**
     * TypeScript type guards
     */
    function isObject(schema: ISchemaElement): schema is ISchemaObject;
}
declare namespace jsonform {
    /**
     * Classes to use when rendering form elements
     *
     * Common interface to abstract away from the specific
     * view-framework being used.
     *
     * e.g. Could hold Bootstrap 2, Bootstrap 3 or other sets of classes
     */
    interface IFormClasses {
        groupClass: string;
        groupMarkClassPrefix: string;
        labelClass: string;
        controlClass: string;
        iconClassPrefix: string;
        buttonClass: string;
        textualInputClass: string;
        prependClass: string;
        appendClass: string;
        addonClass: string;
        buttonAddonClass: string;
        inlineClassSuffix: string;
    }
    /**
     * Data made available when rendering an item
     */
    interface IRenderData {
        id: string;
        keydash: string;
        elt: any;
        schema: any;
        node: any;
        value: string;
        cls: IFormClasses;
        escape: (content: string) => string;
        children: string;
        /**
         * Class applied to input elements in the template.
         *
         * This value is set in this order (highest precedence
         * to lowest)
         *
         *  - `FormNode.formElement.fieldHtmlClass`
         *  - `IFormDescriptor.params.fieldHtmlClass`
         *  - ''
         */
        fieldHtmlClass: string;
    }
    /**
     * Config for HTML option lists.
     */
    interface IOption {
        value: string;
        title: string;
    }
}
declare namespace jsonform {
    interface ITransloadItRenderData extends IRenderData {
        transloaditname?: string;
    }
    interface IImageSelectRenderData extends IRenderData {
        buttonTitle?: string;
        buttonClass?: string;
        prefix?: string;
        suffix?: string;
        width?: number;
        height?: number;
        columns?: number;
    }
    interface IIconSelectRenderData extends IRenderData {
        buttonTitle?: string;
        buttonClass?: string;
        columns?: number;
    }
    interface ICheckboxesRenderData extends IRenderData {
        choiceshtml?: string;
    }
    interface ITableObjectRenderData extends IRenderData {
        columnCount?: number;
        childMap?: {
            simple: string[];
            complex: string[];
        };
    }
    interface ITabRenderData extends IRenderData {
        tabs?: string;
    }
    interface ISelectFieldsetRenderData extends IRenderData {
        tabs?: string;
    }
}
declare namespace jsonform {
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
    class FormNode implements IControlListener {
        /**
         * The node's ID (may not be set)
         */
        id: string;
        /**
         * The node's key path (may not be set)
         */
        key: string;
        /**
         * Unwrapped DOM element associated witht the form element.
         *
         * The DOM element is set when the form element is rendered.
         */
        el: any;
        /**
         * Link to the form element that describes the node's layout
         * (note the form element is shared among nodes in arrays)
         */
        formElement: IFormElement;
        /**
         * Link to the schema element that describes the node's value constraints
         * (note the schema element is shared among nodes in arrays)
         */
        schemaElement: ISchemaElement;
        /**
         * Pointer to the "view" associated with the node, typically the right
         * object in jsonform.elementTypes
         */
        view: ITemplate;
        /**
         * Node's subtree (if one is defined)
         */
        children: FormNode[];
        /**
         * A pointer to the form tree the node is attached to
         */
        ownerTree: FormTree;
        /**
         * A pointer to the parent node of the node in the tree
         */
        parentNode: FormNode;
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
        childTemplate: FormNode;
        /**
         * Direct children of array-like containers may use the value of a
         * specific input field in their subtree as legend. The link to the
         * legend child is kept here and initialized in computeInitialValues
         * when a child sets "valueInLegend"
         */
        legendChild: FormNode;
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
        arrayPath: number[];
        /**
         * Position of the node in the list of children of its parents
         */
        childPos: number;
        /**
         * The current value of this control.
         *
         * Kept in sync as the input control is edited.
         */
        value: any;
        /**
         * The default value of this control that may be
         * defined by the JSON schema.
         */
        defaultValue: any;
        /**
         * Hyphenated version of the property's key path with
         * dots replaced with triple dashes so it can be used
         * as an HTML class
         */
        keydash: string;
        /**
         * Whether this element should be wrapped with the standard
         * `fieldTemplate` boilerplate when rendering.
         */
        fieldtemplate: boolean;
        /**
         * The uncompiled template string that has been associated with this FormNode.
         *
         * The `onBeforeRender` callback may set a specific template to
         * be used for this specific node instance.
         *
         * If there is no explicit template then we fall back to the
         * `formElement.template` and finall the `view.template`
         */
        template: string;
        /**
         * List of data used to generate select list option elements
         * and other list-like types (e.g. lists of radiobuttons).
         */
        options: IOption[] | any[];
        /**
         * Used by `checkboxes` template.
         *
         * Something to do with storing values of associated controls?
         */
        otherValues: any[];
        /**
         * Map of event names to event handlers that will be
         * registered when this FormNode is rendered
         */
        handlers: IHandlerMap;
        /**
         * Optional event callbacks
         */
        onInsert: INodeEventHandler;
        onChange: INodeEventHandler;
        onClick: INodeEventHandler;
        onKeyUp: INodeEventHandler;
        /**
         * The following properties come directly from the JSON schema
         * and are usually referenced inside the control template string.
         */
        /**
         * HTML content shown as the title or legend for this control.
         *
         * NOTE: Need to check the specific template to see how these
         * properties are handled for that particular control.
         */
        title: string;
        inlinetitle: string;
        legend: string;
        name: string;
        /**
         * Optional additional content that can be prepended/appended
         * to the element when it is rendered.
         *
         * If the content is not undefined then it will be rendered
         * before/after the regular template content as appropriate.
         *
         * e.g. Can be used to
         */
        prepend: string;
        append: string;
        description: string;
        helpvalue: string;
        disabled: boolean;
        required: boolean;
        placeholder: string;
        readOnly: boolean;
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
        clone(parentNode?: FormNode): FormNode;
        /**
         * Returns true if the subtree that starts at the current node
         * has some non empty value attached to it
         */
        hasNonDefaultValue(): boolean;
        /**
         * Returns a property value of node, optional look for in parents chain
         *
         * @function
         * @param {String} prop Property name for looking
         * @param {Boolean} searchInParents Search the property in parents chain if not found in current node
         * @return {Any} The property value
         */
        getProperty(prop: any, searchInParents: any): any;
        /**
         * The `readOnly` property is propagated
         * to all children as well.
         *
         * Setting `readOnly: true` on this element will
         * make all children readOnly as well.
         *
         * Returns a truthy/falsy value.
         */
        isReadOnly(): any;
        /**
         * Attaches a child node to the current node.
         *
         * The child node is appended to the end of the list.
         *
         * @function
         * @param {FormNode} node The child node to append
         * @return {FormNode} The inserted node (same as the one given as parameter)
         */
        appendChild(node: FormNode): FormNode;
        /**
         * Removes the last child of the node.
         *
         * @function
         */
        removeChild(): FormNode;
        /**
         * Update any parent-dependant properties on this child node.
         *
         * e.g. in V4 schema the state of the  `required` property is determined by the parent node.
         *
         * @param node
         * @private
         */
        _updateChildOnAppend(node: FormNode): void;
        /**
         * Return true if the child is considered
         * to be required when appended to this
         * FormNode.
         *
         * @param childNode
         * @private
         */
        _isChildRequired(childNode: FormNode): boolean;
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
        moveValuesTo(node: any): void;
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
        switchValuesWith(node: any): void;
        /**
         * Resets all DOM values in the node's subtree.
         *
         * This operation also drops all array item nodes.
         * Note values are not reset to their default values, they are rather removed!
         *
         * @function
         */
        resetValues(): void;
        /**
         * Sets the child template node for the current node.
         *
         * The child template node is used to create additional children
         * in an array-like form element. The template is never rendered.
         *
         * @function
         * @param {FormNode} node The child template node to set
         */
        setChildTemplate(node: any): void;
        /**
         * Gets the child template node for the current node.
         *
         * The child template node is used to create additional children
         * in an array-like form element. We delay create it when first use.
         */
        getChildTemplate(): FormNode;
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
        computeInitialValues(values: any, ignoreDefaultValues?: boolean, topDefaultArrayLevel?: number): void;
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
        getFormValues(updateArrayPath: any): {};
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
        render(el?: any): void;
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
        setContent(html: any, parentEl?: any): void;
        /**
         * Updates the DOM element associated with the node.
         *
         * Only nodes that have ID are directly associated with a DOM element.
         *
         * @function
         */
        updateElement(domNode: any): void;
        /**
         * Generates the view's HTML content for the underlying model.
         *
         * @function
         */
        generate(parentData?: IRenderData): string;
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
        enhance(): void;
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
        _onLegendChildChange(evt: any, node: FormNode, formData: IFormTemplateData): void;
        /**
         * Inserts an item in the array at the requested position and renders the item.
         *
         * @function
         * @param {Number} idx Insertion index
         */
        insertArrayItem(idx: number, domElement: any): void;
        /**
         * Remove an item from an array
         *
         * @function
         * @param {Number} idx The index number of the item to remove
         */
        deleteArrayItem(idx: any): void;
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
        getArrayBoundaries(): {
            minItems: number;
            maxItems: number;
        };
        /**
         * Return the FormNode's IFormElement instance
         * or any empty object placeholder to avoid null
         * pointer exceptions.
         */
        getFormElement(): IFormElement;
    }
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
    function getInitialValue(formDesc: IFormDescriptor, key: string, arrayPath: number[], tpldata: IFormTemplateData, usePreviousValues: boolean): any;
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
    function applyArrayPath(key: any, arrayPath: any): any;
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
    function getSchemaDefaultByKeyWithArrayIdx(schema: any, key: any, topDefaultArrayLevel: any): any;
}
declare namespace jsonform {
    /**
     * Form tree class.
     *
     * Holds the internal representation of the form.
     * The tree is always in sync with the rendered form, this allows to parse
     * it easily.
     *
     * @class
     */
    class FormTree {
        root: FormNode;
        formDesc: IFormDescriptor;
        domRoot: any;
        defaultClasses: IFormClasses;
        /**
         * This placeholder schemaElement will be given to all
         * FormNodes that don't otherwise have a schemaElement
         * associated with them.
         *
         * This should avoid a lot of null-pointer checks/exceptions.
         *
         * @private
         */
        _dummySchemaElement: ISchemaElement;
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
        initialize(formDesc: IFormDescriptor): void;
        /**
         * If we've been given a shorthand schema object then
         * expand it back out to a proper top-level schema object.
         *
         * @private
         */
        _normaliseRootSchema(rootSchema: any): any;
        /**
         * Initialise the root node.
         *
         * NOTE: We assign `schemaRoot` as `root.schemaElement` so
         * top-level required fields work with V4 schemas.
         *
         * @private
         */
        _getRootNode(schemaRoot: any): FormNode;
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
        _convertSchemaV3ToV4(_schema: any, processedSchemaNodes?: any[], parentSchemaProxy?: any, keys?: string[]): any;
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
        _resolveRefs(obj: any, defs: any, resolvedSchemaRefNodes?: any[]): any;
        /**
         * Return the default FormElement definition.
         *
         * This is a shorthand for include all schema elements and
         * then append an 'actions' element with a submit button.
         *
         * @private
         */
        _getDefaultFormElements(): IFormElementOrString[];
        /**
         * Constructs the tree from the form description.
         *
         * The function must be called once when the tree is first created.
         *
         * @function
         */
        buildTree(): void;
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
        buildFromLayout(formElement: IFormElement, context?: any): FormNode;
        /**
         * Look up a schema element with the key given on the `formElement`.
         *
         * The formElement is mutated based on properties on the schemaElement.
         *
         * @private
         */
        _getSchemaElementByFormElementKey(formElement: IFormElement): ISchemaElement;
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
        _prepareOptions(formElement: any, enumValues?: any[]): void;
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
        computeInitialValues(): void;
        /**
         * Renders the form tree
         *
         * @function
         * @param {Node} domRoot The "form" element in the DOM tree that serves as
         *  root for the form
         */
        render(domRoot: any): void;
        /**
         * Walks down the element tree with a callback
         *
         * @function
         * @param {Function} callback The callback to call on each element
         */
        forEachElement(callback: (node) => void): void;
        validate(noErrorDisplay?: boolean): {
            "errors": any;
            "values": any;
        };
        submit(evt?: any): boolean;
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
        hasRequiredField(): boolean;
    }
}
declare namespace jsonform {
    function fieldTemplate(inner: string): string;
    var fileDisplayTemplate: string;
    var inputFieldTemplate: (type: string, isTextualInput: boolean, extraOpts?: any) => {
        'template': string;
        'fieldtemplate': boolean;
        'inputfield': boolean;
        'onInsert': (evt: any, node: FormNode) => void;
    };
    var numberFieldTemplate: (type: string, isTextualInput?: boolean) => {
        'template': string;
        'fieldtemplate': boolean;
        'inputfield': boolean;
        'onBeforeRender': (data: any, node: FormNode) => void;
    };
    var elementTypes: {
        [type: string]: ITemplate;
    };
}
/**
 * The jsonform object whose methods will be exposed to the window object
 */
declare namespace jsonform {
    var isBootstrap2: boolean;
    var _bs2Classes: IFormClasses;
    var _bs3Classes: IFormClasses;
    function getDefaultClasses(isBootstrap2: boolean): IFormClasses;
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
    function getFormValue(formelt: any): any;
}
declare namespace jsonform {
    /**
     * Event listener signature for FormNode events
     */
    interface INodeEventHandler {
        (evt: any, node: FormNode): void;
    }
    /**
     * Map of event names to event handlers that will be
     * registered when this FormNode is rendered.
     *
     * Shared between FormNode and IFormElement.
     */
    interface IHandlerMap {
        [event: string]: INodeEventHandler;
    }
    /**
     * Standard event interface for listening
     * to control changes/events.
     *
     * Shared between FormNode, IFormElement, and view.
     */
    interface IControlListener {
        onInsert?: INodeEventHandler;
        onChange?: INodeEventHandler;
        onClick?: INodeEventHandler;
        onKeyUp?: INodeEventHandler;
    }
}
declare namespace jsonform {
    type IFormElementOrString = IFormElement | string;
    /**
     * Interface for the object passed through when
     * initialising the JsonForm
     */
    interface IFormDescriptor {
        /**
         * 2016-04-09
         * TODO: Support short-hand schema and full schema objects.
         * Currently only supports the short-hand schema (despite what
         * the documentation says).
         */
        schema: any;
        /**
         * JsonForm metadata used control which controls are shown and
         * how they are presented.
         */
        form?: IFormElementOrString[];
        /**
         * Optional - additional map of IFormElement instances
         * mapped by their key value.
         *
         * This lets the `form` list be a simple list of strings
         * which are indexed into this map to return the IFormElement.
         */
        customFormItems?: {
            [id: string]: IFormElement;
        };
        params?: IFormParams;
        tpldata?: IFormTemplateData;
        /**
         * Used to control which top-level schema properties are
         * displayed in the form when there is an '*' item in the
         * `IFormDescriptor.form` list.
         *
         * Logic works like this:
         *
         *   For each `IFormDescriptor.form` item then:
         *     If the item == '*' then:
         *       For each top-level `IFormDescriptor.schema.properties` item
         *         If it exists in the `nonDefaultFormItems` array then:
         *           exclude it from the form
         *         Else:
         *           include it in the form
         *     Else:
         *       include it in the form
         */
        nonDefaultFormItems?: string[];
        /**
         * 2016-04-09
         * Coridyn: This is supposed to contain the object graph
         * of any previously submitted form.
         *
         * However, I can't see where this would be set so I'm
         * not sure if this is ever anything other than `undefined`.
         */
        value?: any;
        _originalSchema?: any;
        /**
         * Prefix applied when generating form elements.
         *
         * If none given it defaults to 'jsonform-' + unique string.
         */
        prefix?: string;
        /**
         * When `true` then form elements will be disabled when
         * swapping between jsonform tab sections (and will be
         * excluded from form submission).
         *
         * If `false` then all form elements are enabled, even
         * when not visible, and will be included in the form submission.
         */
        disableInactiveTabs?: boolean;
        /**
         * Form class configuration.
         *
         * Determine which classes are used to render
         * the form controls.
         */
        /**
         * If `true` then use Bootstrap 2 classes,
         * otherwise use Bootstrap 3 classes.
         */
        isBootstrap2?: boolean;
        /**
         * Additional form classes to mix into the
         * default classes.
         *
         * See `jsonform.getDefaultClasses()`
         */
        defaultClasses?: {
            [classId: string]: string;
        };
        validate?: ValidateForm;
        displayErrors?: (errors: any[], domRoot) => void;
        /**
         * Event callbacks
         */
        onBeforeRender?: (data: IRenderData, node: FormNode) => void;
        onInsert?: (event: EventLike, node: FormNode) => void;
        onAfterRender?: (data: IRenderData, node: FormNode) => void;
        onElementSchema?: (formElement: IFormElement, schemaElement: ISchemaElement) => void;
        /**
         * Invoked when the form is about to be submitted.
         *
         * This is invoked after validation has been run and will
         * pass a list of errors (if any) and the data from the
         * schema editor.
         *
         * Return `false` from this function to prevent form submission.
         *
         * @param errors
         * @param values
         */
        onSubmit?: (errors: any[], values: any) => boolean;
        /**
         * Invoked after `onSubmit()` only if there weren't
         * any errors and if `onSubmit()` did not return `false`.
         *
         * @param values
         */
        onSubmitValid?: (values: any) => boolean;
        /**
         * Alternative event to listen for to trigger form submission.
         *
         * This allows other plugins to raise an event to trigger
         * the jsonform to submit.
         */
        submitEvent?: string;
    }
    /**
     * Parameters for form elements.
     */
    interface IFormParams {
        /**
         * CSS class to apply to *every* input field unless
         * overridden in `formElement#fieldHtmlClass` (for
         * specific elements).
         */
        fieldHtmlClass?: string;
    }
    /**
     * Definition of interpolation metadata available
     * when rendering form elements.
     *
     * See the `tpldata property` section of the wiki.
     */
    interface IFormTemplateData {
        /**
         * Transient properties on the template
         * object that will change as different
         * elements are rendered.
         *
         * See `FormNode#computeInitialValues()` and `FormNode#getInitialValue()`.
         */
        idx?: number;
        value?: string;
        getValue?: (key: string) => any;
    }
    type ValidateForm = boolean | IValidator;
    interface IValidator {
        _vendor: string;
        validate(schema: any, values: any): any;
        validate(values: any, schema: any): any;
    }
}
declare namespace jsonform {
    /**
     * IFormElement
     *
     * Bag of data used to control how this
     * JSON schema node is rendered in the form.
     *
     * This is the type in the top-level `form` property:
     *
     *  {
     *      "schema": {},
     *      "form": IFormElement[] [
     *
     *      ]
     *  }
     */
    interface IFormElement extends IControlListener, IOtherField, IFormElementExtend {
        /**
         * Unique identifier for this FormElement.
         *
         * Made up of the path of this element in the schema.
         */
        id?: string;
        key?: string;
        keyOnParent?: string;
        name?: string;
        iddot?: string;
        /**
         * Input control type:
         *  - checkbox
         *  -
         */
        type?: string;
        value?: string;
        title?: string;
        description?: string;
        required?: boolean;
        readOnly?: boolean;
        'readonly'?: boolean;
        allowEmpty?: boolean;
        inline?: boolean;
        activeClass?: string;
        options?: IOption[];
        valueInLegend?: boolean;
        fieldHtmlClass?: string;
        /**
         * Key ID
         * Path to element whose value will be used for legend.
         */
        legend?: string;
        /**
         * The template string to use when rendering this control.
         */
        template?: string;
        /**
         * JSON Schema array item definitions.
         */
        items?: IFormElement[];
        /**
         * Event handler callbacks
         */
        handlers?: IHandlerMap;
    }
    /**
     * Additional properties that may be made available
     * on the IFormElement, but which aren't part of
     * the jsonform IFormElement interface.
     *
     * e.g. to be used by custom templates.
     */
    interface IFormElementExtend {
        /**
         * Optional stepping applied to HTML5 range inputs.
         */
        step?: number;
        /**
         * Used by `selectfieldset` template.
         */
        hideMenu?: boolean;
        /**
         * Used by `tabarray` template.
         */
        addMoreTitle?: string;
        addMoreTooltip?: string;
        /**
         * ACE editor configuration options
         */
        aceTheme?: string;
        aceMode?: string;
        aceOptions?: any;
        /**
         * Used by the `checkboxes` template.
         */
        otherField?: IOtherField;
        /**
         * For `checkbox` template
         *
         * Dynamically show additional content when ticked.
         *
         * If `true` then show next element.
         * If 'all' then show all remaining elements.
         * Otherwise if a number then show that many elements.
         */
        toggleNext?: boolean | 'all' | number;
        /**
         * For `radios` template
         *
         * Define a mapping of questions that should be displayed
         * when a particular value is selected.
         *
         * Allows dynamic behaviour (e.g. asking a series of questions).
         *
         * I think the configuration is a map of `toggleNext` values
         * as given above (mapping a radio key to a `toggleNext` value).
         */
        toggleNextMap?: any;
        /**
         * Used by `question` template - "Question ID".
         *
         * Used to determine if this question should be displayed
         * based on the configured `toggleNext`/`toggleNextMap`
         */
        qid?: string;
        /**
         * Configuration for jquery-ui datepicker:
         * https://jqueryui.com/datepicker/
         *
         * If `true` then the control will be converted to
         * a datepicker with 'yy-mm-dd' format.
         *
         * Otherwise if it's an object the control is initialised
         * as a datepicker with those configuration options.
         */
        datepicker?: boolean | any;
        /**
         * jquery-ui autocomplete config object:
         * https://jqueryui.com/autocomplete/
         */
        autocomplete?: any;
        /**
         * Configuration for dynamic tag input control:
         * https://github.com/xoxco/jQuery-Tags-Input
         */
        tagsinput?: any;
        getValue?: 'tagsvalue' | 'tagsinput';
        /**
         * Configuration object *OR* datasets to be passed
         * to Twitter typeahead library:
         * https://twitter.github.io/typeahead.js/
         */
        typeahead?: any[] | any;
        /**
         * Used by `imageselect` template.
         */
        imageSelectorColumns?: number;
        imageSelectorTitle?: string;
        imagePrefix?: string;
        imageSuffix?: string;
        imageWidth?: number;
        imageHeight?: number;
        imageButtonClass?: string;
    }
    /**
     * Definition of the `otherField` structure.
     *
     * NOTE: Not sure how this works at runtime.
     * This is some sort of FormElement configuration option
     * and the IOtherField is supposed to actually be
     * a FormElement instance as well.
     */
    interface IOtherField {
        key?: string;
        idx?: number;
        options?: IOption[];
        optionsAsEnumOrder?: boolean;
        otherValue?: string;
        inline?: boolean;
        asArrayValue?: boolean;
        novalue?: boolean;
        notitle?: boolean;
    }
}
declare namespace jsonform {
    namespace schema {
        var Type: {
            array: string;
            boolean: string;
            integer: string;
            number: string;
            null: string;
            object: string;
            string: string;
        };
        var Format: {
            'date-time': string;
            email: string;
            hostname: string;
            ipv4: string;
            ipv6: string;
            uri: string;
            color: string;
            html: string;
        };
    }
    type ISchemaElementAny = ISchemaElement & ISchemaElementV3;
    type ISchemaElement = ISchemaElementBase & ISchemaObject;
    type ISchemaElementV3 = ISchemaElementBase & ISchemaObjectV3;
    /**
     * ISchemaElement
     *
     * JSON schema metadata - this is the node of data
     * representing an item in the schema
     */
    interface ISchemaElementBase extends IJsonSchemaAny {
        _jsonform_allowEmpty?: boolean;
        _jsonform_get_value_by_tagsinput?: string;
    }
    interface IJsonSchemaRoot extends IJsonSchemaAny, ISchemaObject {
        $schema: string;
    }
    interface IJsonSchemaRootV3 extends IJsonSchemaAnyBase, ISchemaObjectV3 {
        $schema: string;
    }
    /**
     * JsonSchema element definition
     */
    type JsonItemOrRef = IJsonSchemaAny | IJsonSchemaRef;
    interface IJsonSchemaAny extends ISchemaNumber, ISchemaInteger, ISchemaString, ISchemaArray, ISchemaObject {
    }
    interface IJsonSchemaAnyBase extends ISchemaNumber, ISchemaInteger, ISchemaString, ISchemaArray, ISchemaObjectBase {
    }
    /**
     * Common schema elements.
     */
    interface IJsonSchemaRef {
        $ref: string;
    }
    interface IJsonSchemaItem {
        $schema?: string;
        id?: string;
        type: string;
        enum?: any[];
        allOf?: any[];
        anyOf?: any[];
        oneOf?: any[];
        not?: any;
        format?: string;
        title?: string;
        description?: string;
        default?: any;
        definitions?: {
            [id: string]: IJsonSchemaAny;
        };
    }
    interface ISchemaNumber extends IJsonSchemaItem {
        multipleOf?: number;
        maximum?: number;
        minimum?: number;
        exclusiveMaximum?: number;
        exclusiveMinimum?: number;
    }
    interface ISchemaInteger extends ISchemaNumber {
    }
    interface ISchemaString extends IJsonSchemaItem {
        maxLength?: number;
        minLength?: number;
        pattern?: string;
    }
    interface ISchemaArray extends IJsonSchemaItem {
        additionalItems?: boolean | JsonItemOrRef;
        items?: JsonItemOrRef | JsonItemOrRef[];
        maxItems?: number;
        minItems?: number;
        uniqueItems?: boolean;
    }
    interface ISchemaObjectBase extends IJsonSchemaItem {
        maxProperties?: number;
        minProperties?: number;
        additionalProperties?: boolean | JsonItemOrRef;
        properties?: {
            [property: string]: JsonItemOrRef;
        };
        patternProperties?: {
            [propertyRegExp: string]: JsonItemOrRef;
        };
        dependencies?: {
            [withProperty: string]: IJsonSchemaAny | string[];
        };
    }
    interface ISchemaObject extends ISchemaObjectBase {
        required?: string[];
        readOnly?: boolean;
    }
    interface ISchemaObjectV3 extends ISchemaObjectBase {
        required?: boolean;
        'readonly'?: boolean;
    }
}
declare namespace jsonform {
    interface EventLike {
        target: any;
    }
    /**
     * ITemplate
     *
     * View template information definition
     *
     * Contains the template and behaviour for each type
     * of input rendered by the jsonform editor.
     *
     * NOTE: The ITemplate should be stateless. The same template
     * reference is shared between all controls of the same type.
     */
    interface ITemplate {
        template: string;
        childTemplate?: (inner: string, data: IRenderData, node: FormNode, parentData: IRenderData, parentNode: FormNode) => string;
        fieldtemplate?: boolean;
        inputfield?: boolean;
        /**
         * jQuery selector string to match the child elements
         * inside the rendered form content.
         */
        childSelector?: string;
        /**
         * Is this a template for an array of items.
         *
         * If `true` then we will invoke the `childTemplate()`
         * method multiple times, once for each element of the array.
         */
        array?: boolean;
        /**
         * Methods
         */
        /**
         * 2016-04-09
         * NOTE: Review the `getElement()` function.
         *
         */
        getElement?: (el: any) => any;
        /**
         * JsonForm event callbacks
         */
        onBeforeRender?: (data: IRenderData, node: FormNode) => void;
        onInsert?: (event: EventLike, node: FormNode) => void;
        onChange?: (event: EventLike, node: FormNode) => void;
        onAfterRender?: (data: IRenderData, node: FormNode) => void;
        afterChildTemplate?: (renderedChild: string, node: FormNode, parentNode: FormNode) => string;
        onSubmit?: (event: Event, node: FormNode) => boolean;
        /**
         * DOM event callbacks
         */
        onClick?: (event: Event, node: FormNode) => void;
        onKeyUp?: (event: Event, node: FormNode) => void;
    }
}
declare namespace jsonform {
    /**
     * Add additonal types here (or extend the `jsonform` namespace
     * and your interfaces there) so they can be used by your custom
     * template definitions.
     */
    /**
     * Custom types for "transloadIt" form elements.
     *
     * Used by these templates:
     *  - 'file-hosted-public'
     *  - 'file-transloadit'
     */
    interface FormNode_TransloadIt extends FormNode {
        ownerTree: FormTree_TransloadIt;
    }
    interface FormTree_TransloadIt extends FormTree {
        _transloadit_generic_public_index?: number;
        _transloadit_generic_elts?: any;
        _transloadit_bound?: boolean;
    }
}
