import $ from 'jquery';
import _ from 'lodash';

import * as util from "./jsonform-util";

import {
    IControlListener,
    IFormElement,
    ISchemaElement,
    ITemplate,
    IOption, IFormElementOrString,
} from "./types/types";
import {FormTree} from "./FormTree";
import {IHandlerMap, INodeEventHandler} from "./types/Events";
import {IJsonSchemaAny} from "./types/ISchemaElement";
import {IRenderData} from "./types/IRenderData";
import {IFormDescriptor, IFormTemplateData} from "./types/IFormDescriptor";

import {
    fieldTemplate as wrapFieldTemplate
} from "../templates/_base";


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
export class FormNode implements IControlListener {
    /**
     * The node's ID (may not be set)
     */
    id: string = null;

    /**
     * The node's key path (may not be set)
     */
    key: string = null;

    /**
     * Unwrapped DOM element associated witht the form element.
     *
     * The DOM element is set when the form element is rendered.
     */
    el: /* HTMLElement */ any = null;

    /**
     * Link to the form element that describes the node's layout
     * (note the form element is shared among nodes in arrays)
     */
    formElement: IFormElement = null;

    /**
     * Link to the schema element that describes the node's value constraints
     * (note the schema element is shared among nodes in arrays)
     */
    schemaElement: ISchemaElement = null;

    /**
     * Pointer to the "view" associated with the node, typically the right
     * object in jsonform.elementTypes
     */
    view: ITemplate = null;

    /**
     * Node's subtree (if one is defined)
     */
    children: FormNode[] = [];

    /**
     * A pointer to the form tree the node is attached to
     */
    ownerTree: FormTree = null;

    /**
     * A pointer to the parent node of the node in the tree
     */
    parentNode: FormNode = null;

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
    childTemplate: FormNode = null;


    /**
     * Direct children of array-like containers may use the value of a
     * specific input field in their subtree as legend. The link to the
     * legend child is kept here and initialized in computeInitialValues
     * when a child sets "valueInLegend"
     */
    legendChild: FormNode = null;


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
    arrayPath: number[] = [];

    /**
     * Position of the node in the list of children of its parents
     */
    childPos = 0;
    
    // End of parameters set by original constructor
    //---------------------------------------------------------------------
    
    
    //---------------------------------------------------------------------
    // Additional properties used by the rest of the class
    
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
    keydash: string = null;
    
    
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
    clone(parentNode: FormNode = this.parentNode): FormNode {
        var node = new FormNode();
        node.childPos = this.childPos;
        node.arrayPath = _.clone(this.arrayPath);
        node.ownerTree = this.ownerTree;
        node.parentNode = parentNode;
        node.formElement = this.formElement;
        node.schemaElement = this.schemaElement;
        node.view = this.view;
        node.children = _.map(this.children, function(child) {
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
    }


    /**
     * Returns true if the subtree that starts at the current node
     * has some non empty value attached to it
     */
    hasNonDefaultValue() {

        // hidden elements don't count because they could make the wrong selectfieldset element active
        if (this.formElement && this.formElement.type == "hidden") {
            return false;
        }

        if (this.value && !this.defaultValue) {
            return true;
        }
        var child = _.find(this.children, function(child) {
            return child.hasNonDefaultValue();
        });
        return !!child;
    }


    /**
     * Returns a property value of node, optional look for in parents chain
     *
     * @function
     * @param {String} prop Property name for looking
     * @param {Boolean} searchInParents Search the property in parents chain if not found in current node
     * @return {Any} The property value
     */
    getProperty(prop, searchInParents) {
        var value = this[prop];
        if (value !== undefined || !searchInParents || !this.parentNode)
            return value;
        return this.parentNode.getProperty(prop, true);
    }
    
    
    /**
     * The `readOnly` property is propagated 
     * to all children as well.
     * 
     * Setting `readOnly: true` on this element will
     * make all children readOnly as well.
     * 
     * Returns a truthy/falsy value.
     */
    isReadOnly() {
        return this.getProperty('readOnly', true);
    }
    
    
    /**
     * Attaches a child node to the current node.
     *
     * The child node is appended to the end of the list.
     *
     * @function
     * @param {FormNode} node The child node to append
     * @return {FormNode} The inserted node (same as the one given as parameter)
     */
    appendChild(node: FormNode) {
        node.parentNode = this;
        node.childPos = this.children.length;
        this.children.push(node);

        this._updateChildOnAppend(node);

        return node;
    }


    /**
     * Removes the last child of the node.
     *
     * @function
     */
    removeChild() {
        var child = this.children[this.children.length - 1];
        if (!child) return;

        // Remove the child from the DOM
        $(child.el).remove();

        // Remove the child from the array
        return this.children.pop();
    }


    /**
     * Update any parent-dependant properties on this child node.
     * 
     * e.g. in V4 schema the state of the  `required` property is determined by the parent node.
     * 
     * @param node
     * @private
     */
    _updateChildOnAppend(node: FormNode){
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
    }
    
    
    /**
     * Return true if the child is considered
     * to be required when appended to this
     * FormNode.
     * 
     * @param childNode
     * @private
     */
    _isChildRequired(childNode: FormNode): boolean{
        var isRequired = childNode.formElement.required;
        
        // Only check schemaElement if the formElement doesn't already have a value.
        if (!_.isBoolean(isRequired) && this.schemaElement){
            var requiredList = this.schemaElement.required;
            if (this.schemaElement.type == 'array'){
                requiredList = (<IJsonSchemaAny>this.schemaElement.items).required;
            }
            requiredList = requiredList || [];
            
            // If we are the root element then we don't have a `schemaElement`.
            var childKey = childNode.formElement.keyOnParent;
            isRequired = requiredList.indexOf(childKey) >= 0;
        }
        
        return isRequired;
    }


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
    moveValuesTo(node) {
        var values = this.getFormValues(node.arrayPath);
        node.resetValues();
        node.computeInitialValues(values, true);
    }


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
    switchValuesWith(node) {
        var values = this.getFormValues(node.arrayPath);
        var nodeValues = node.getFormValues(this.arrayPath);
        node.resetValues();
        node.computeInitialValues(values, true);
        this.resetValues();
        this.computeInitialValues(nodeValues, true);
    }


    /**
     * Resets all DOM values in the node's subtree.
     *
     * This operation also drops all array item nodes.
     * Note values are not reset to their default values, they are rather removed!
     *
     * @function
     */
    resetValues() {
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
            _.each(params, function(param) {
                // TODO: check this, there may exist corner cases with this approach
                // (with multiple checkboxes for instance)
                $('[name="' + util.escapeSelector(param.name) + '"]', $(this.el)).val('');
            }, this);
        }
        else if (this.view && this.view.array) {
            // The current node is an array, drop all children
            while (this.children.length > 0) {
                this.removeChild();
            }
        }

        // Recurse down the tree
        _.each(this.children, function(child) {
            child.resetValues();
        });
    }


    /**
     * Sets the child template node for the current node.
     *
     * The child template node is used to create additional children
     * in an array-like form element. The template is never rendered.
     *
     * @function
     * @param {FormNode} node The child template node to set
     */
    setChildTemplate(node) {
        this.childTemplate = node;
        node.parentNode = this;
    }

    /**
     * Gets the child template node for the current node.
     *
     * The child template node is used to create additional children
     * in an array-like form element. We delay create it when first use.
     */
    getChildTemplate() {
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
                var key/*: IFormElement*/;
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
    }


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
    computeInitialValues(values, ignoreDefaultValues: boolean = false, topDefaultArrayLevel = 0) {
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
        formData.getValue = function(key) {
            return getInitialValue(
                self.ownerTree.formDesc,
                key,
                self.arrayPath,
                formData,
                !!values
            );
        };

        if (this.formElement) {
            // Compute the ID of the field (if needed)
            if (this.formElement.id) {
                this.id = applyArrayPath(this.formElement.id, this.arrayPath);
            }
            else if (this.view && this.view.array) {
                this.id = util.escapeSelector(this.ownerTree.formDesc.prefix) +
                    '-elt-counter-' + _.uniqueId();
            }
            else if (this.parentNode && this.parentNode.view &&
                this.parentNode.view.array) {
                // Array items need an array to associate the right DOM element
                // to the form node when the parent is rendered.
                this.id = util.escapeSelector(this.ownerTree.formDesc.prefix) +
                    '-elt-counter-' + _.uniqueId();
            }
            else if ((this.formElement.type === 'button') ||
                (this.formElement.type === 'selectfieldset') ||
                (this.formElement.type === 'question') ||
                (this.formElement.type === 'buttonquestion')) {
                // Buttons do need an id for "onClick" purpose
                this.id = util.escapeSelector(this.ownerTree.formDesc.prefix) +
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
            ], (prop) => {
                
                var propVal = self.formElement[prop];
                if (_.isString(propVal)) {
                    propVal = applyInterpOrArrayPath(propVal, self.arrayPath);
                    if (propVal) {
                        // propVal = _.template(propVal, formData, util.valueTemplateSettings);
                        propVal = util._template(propVal, formData, util.valueTemplateSettings);
                    }
                }
                self[prop] = propVal;
                
            });

            // Apply templating to options created with "titleMap" as well
            if (this.formElement.options) {
                this.options = _.map(this.formElement.options, (option: IOption): IOption => {
                    
                    let resultOption: IOption = option;
                    if (_.isObject(option) && option.title) {
                        
                        let titleValue = applyInterpOrArrayPath(option.title, self.arrayPath);
                        // titleValue = _.template(titleValue, formData, util.valueTemplateSettings);
                        titleValue = util._template(titleValue, formData, util.valueTemplateSettings);
                        
                        resultOption = _.extend(
                            {},
                            option,
                            {
                                value: option.value || '',
                                title: titleValue
                            }
                        );
                    }
                    
                    return resultOption;
                    
                });
            }
        }

        if (this.view && this.view.inputfield && this.schemaElement) {
            /**
             * 2017-07-06 Coridyn
             * Previous value was to not set defaults if there is any sort of json structure passed to jsonform.
             * This doesn't work for us where we have an existing data structure to which we want to add new properties
             * with default values (i.e. as schemas change over time).
             * 
             * This change will take the default value if there is not an explicit value given on `values`.
             * 
             * TODO: Consider only using default if value is `undefined` and not `null`.
             * e.g. `undefined` indicates there is no value at all so take default, whereas `null` indicates there is a value but that value is empty
             */
            
            // Case 1: simple input field
            if (values) {
                // Form has already been submitted, use former value if defined.
                // Note we won't set the field to its default value otherwise
                // (since the user has already rejected it)
                if (util.isSet(util.getObjKey(values, this.key))) {
                    this.value = util.getObjKey(values, this.key);
                }
            }
            
            /**
             * Coridyn: Set the default value if no value was retrieved above 
             */
            if (!ignoreDefaultValues) {
                // No previously submitted form result, use default value
                // defined in the schema if it's available and not already
                // defined in the form element
                if (!util.isSet(this.value)) {
                    // XXX: the default value could comes from the top upper level default
                    //      value in the schema parent chain, maybe under a certain parent
                    //      level(e.g. when handle new itemn for array)
                    var schemaDefault = getSchemaDefaultByKeyWithArrayIdx(self.ownerTree.formDesc.schema, this.key, topDefaultArrayLevel);
                    if (util.isSet(schemaDefault)) {
                        
                        let _valueDefault = schemaDefault;
                        if (_.isString(_valueDefault)) {
                            _valueDefault = applyInterpOrArrayPath(_valueDefault, this.arrayPath);
                            if (_valueDefault) {
                                // _valueDefault = _.template(_valueDefault, formData, util.valueTemplateSettings);
                                _valueDefault = util._template(_valueDefault, formData, util.valueTemplateSettings);
                            }
                        }
                        
                        this.value = _valueDefault;
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
                var previousArrayValue = util.getObjKeyEx(values, this.key);
                if (previousArrayValue && Array.isArray(previousArrayValue)) {
                    nbChildren = previousArrayValue.length;
                }
            }
            // TODO: use default values at the array level when form has not been
            // submitted before. Note it's not that easy because each value may
            // be a complex structure that needs to be pushed down the subtree.
            // The easiest way is probably to generate a "values" object and
            // compute initial values from that object
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
        _.each(this.children, function(child) {
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
                        formData.value = util.isSet(this.value) ? this.value : '';
                        node.legend = util._template(node.legend, formData, util.valueTemplateSettings);
                        break;
                    }
                }
                node = node.parentNode;
            }
        }
    }


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
    getFormValues(updateArrayPath?: number[]) {
        // The values object that will be returned
        var values = {};

        if (!this.el) {
            throw new Error('formNode.getFormValues can only be called on nodes that are associated with a DOM element in the tree');
        }

        // Form fields values
        var formArray/*: JQuerySerializeArrayElement (sort of)*/: any = $(':input', this.el).serializeArray();

        // Set values to false for unset checkboxes and radio buttons
        // because serializeArray() ignores them
        formArray = formArray.concat(
            $(':input[type=checkbox]:not(:disabled):not(:checked)[name]', this.el).map(function() {
                return { "name": this.name, "value": this.checked }
            }).get()
        );

        if (updateArrayPath) {
            _.each(formArray, function(param) {
                param.name = applyArrayPath(param.name, updateArrayPath);
            });
        }

        // The underlying data schema
        var formSchema = this.ownerTree.formDesc.schema;

        for (var i = 0; i < formArray.length; i++) {
            // Retrieve the key definition from the data schema
            var name = formArray[i].name;
            var eltSchema = util.getSchemaKey(formSchema.properties, name);
            var arrayMatch = null;
            var cval = null;

            // Skip the input field if it's not part of the schema
            if (!eltSchema) continue;
            
            // 2017-03-10: Handle arrays of schema types.
            var eltSchemaType = util.normaliseType(eltSchema.type);
            

            // Handle multiple checkboxes separately as the idea is to generate
            // an array that contains the list of enumeration items that the user
            // selected.
            if (eltSchema._jsonform_checkboxes_as_array) {
                arrayMatch = name.match(/\[([0-9]*)\]$/);
                if (arrayMatch) {
                    name = name.replace(/\[([0-9]*)\]$/, '');
                    cval = util.getObjKey(values, name) || [];
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
                    util.setObjKey(values, name, cval);
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
                util.setObjKey(values, name, vals);
                continue;
            }
            
            if (name.slice(-2) === '[]') {
                name = name.slice(0, -2);
                eltSchema = util.getSchemaKey(formSchema.properties, name);
                if (eltSchemaType === 'array') {
                    cval = util.getObjKey(values, name) || [];
                    if (cval.indexOf(formArray[i].value) < 0) {
                        cval.push(formArray[i].value);
                        util.setObjKey(values, name, cval);
                    }
                    continue;
                }
            }

            // Type casting
            if (eltSchemaType === 'boolean') {
                if (formArray[i].value === '0' || formArray[i].value === 'false') {
                    formArray[i].value = false;
                } else if (formArray[i].value === '') {
                    formArray[i].value = null;
                } else {
                    formArray[i].value = !!formArray[i].value;
                }
            }
            if ((eltSchemaType === 'number') ||
                (eltSchemaType === 'integer') ||
                (eltSchemaType === 'number,string')) {
                if (_.isString(formArray[i].value)) {
                    if (!formArray[i].value.length) {
                        formArray[i].value = null;
                    } else if (!isNaN(Number(formArray[i].value))) {
                        formArray[i].value = Number(formArray[i].value);
                    }
                }
            }
            if ((eltSchemaType === 'string') &&
                (formArray[i].value === '') &&
                !eltSchema._jsonform_allowEmpty) {
                formArray[i].value = null;
            }
            if ((eltSchemaType === 'object') &&
                _.isString(formArray[i].value) &&
                (formArray[i].value.substring(0, 1) === '{')) {
                try {
                    formArray[i].value = JSON.parse(formArray[i].value);
                } catch (e) {
                    formArray[i].value = {};
                }
            }
            if ((eltSchemaType === 'array') && _.isString(formArray[i].value)) {
                if (formArray[i].value.substring(0, 1) === '[') {
                    try {
                        formArray[i].value = JSON.parse(formArray[i].value);
                    } catch (e) {
                        formArray[i].value = []; // or null?
                    }
                }
                else
                    formArray[i].value = null;
            }
            
            //TODO is this due to a serialization bug?
            /**
             * 2017-01-13
             * Special handling for object type that gets rendered as a string.
             * 
             * `formNode.prototype.generate()` will convert `null` values to an empty string,
             * which stuffs up the `data -> editor -> data` round-trip.
             * 
             * Coerce "null", "", or '""' to a null object.
             */
            if ((eltSchemaType === 'object') &&
                (formArray[i].value === 'null' || formArray[i].value === '' || formArray[i].value === '""')) {
                formArray[i].value = null;
            }

            if (formArray[i].name && (formArray[i].value !== null)) {
                util.setObjKey(values, formArray[i].name, formArray[i].value);
            }
        }
        // console.log("Form value",values);
        return values;
    }



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
    render(el?/*: HTMLElement*/) {
        console.log(`(FormNode) render: ${this.key}`);
        
        var html = this.generate();
        this.setContent(html, el);
        this.enhance();
    }


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
    setContent(html, parentEl?/*: HTMLElement*/) {
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
    }


    /**
     * Updates the DOM element associated with the node.
     *
     * Only nodes that have ID are directly associated with a DOM element.
     *
     * @function
     */
    updateElement(domNode) {
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
                this.el = $('#' + util.escapeSelector(this.id), domNode).get(0);
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
        _.each(this.children, (child) => {
            child.updateElement(this.el || domNode);
        });
    }


    /**
     * Generates the view's HTML content for the underlying model.
     *
     * @function
     */
    generate(parentData?: IRenderData) {
        var data: IRenderData = {
            id: this.id,
            keydash: this.keydash,
            elt: this.formElement,
            schema: this.schemaElement,
            node: this,
            value: util.isSet(this.value) ? this.value : '',
            cls: this.ownerTree.defaultClasses,
            escape: util.escapeHTML,

            children: '',
            fieldHtmlClass: ''
        };
        var template: string = null;
        var html = '';
        
        var keyOnParent = this.formElement ? this.formElement.keyOnParent : null;
        console.log(`(FormNode) generate: keyOnParent=${keyOnParent}, required?=${this.required}`);

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
            template = wrapFieldTemplate(template);
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
            /* END */
        }

        // Prepare the HTML of the children
        var childrenhtml = '';
        /**
         * 2015-02-28 Coridyn:
         * 
         * Keep track of the rendered child template.
         */
        _.each(this.children, (child: FormNode) => {
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
        html = util._template(template, data, util.fieldTemplateSettings);
        return html;
    }


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
    enhance() {
        var node = this;
        var handlers = null;
        var handler = null;
        var formData: IFormTemplateData = _.clone(this.ownerTree.formDesc.tpldata) || {};
        
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
                _.each(handlers, function(handler, onevent) {
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
                    $(this.el).bind('change', function(evt) { node.onChange(evt, node); });
                if (this.view.onChange)
                    $(this.el).bind('change', function(evt) { node.view.onChange(evt, node); });
                if (this.formElement.onChange)
                    $(this.el).bind('change', function(evt) { node.formElement.onChange(evt, node); });

                if (this.onClick)
                    $(this.el).bind('click', function(evt) { node.onClick(evt, node); });
                if (this.view.onClick)
                    $(this.el).bind('click', function(evt) { node.view.onClick(evt, node); });
                if (this.formElement.onClick)
                    $(this.el).bind('click', function(evt) { node.formElement.onClick(evt, node); });

                if (this.onKeyUp)
                    $(this.el).bind('keyup', function(evt) { node.onKeyUp(evt, node); });
                if (this.view.onKeyUp)
                    $(this.el).bind('keyup', function(evt) { node.view.onKeyUp(evt, node); });
                if (this.formElement.onKeyUp)
                    $(this.el).bind('keyup', function(evt) { node.formElement.onKeyUp(evt, node); });

                if (handlers) {
                    _.each(handlers, function(handler, onevent) {
                        if (onevent !== 'insert') {
                            $(this.el).bind(onevent, function(evt) { handler(evt, node); });
                        }
                    }, this);
                }
            }

            // Auto-update legend based on the input field that's associated with it
            if (this.formElement.legend && this.legendChild && this.legendChild.formElement) {
                $(this.legendChild.el).on('keyup', (e) => {
                    this._onLegendChildChange(e, node, formData);
                });
                $(this.legendChild.el).on('change', (e) => {
                    this._onLegendChildChange(e, node, formData);
                });
            }
        }

        // Recurse down the tree to enhance children
        _.each(this.children, function(child) {
            child.enhance();
        });
    }
    
    
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
    _onLegendChildChange(evt, node: FormNode, formData: IFormTemplateData) {
        if (node.formElement && node.formElement.legend && node.parentNode) {
            var legendTmpl = applyArrayPath(node.formElement.legend, node.arrayPath);
            formData.idx = (node.arrayPath.length > 0) ?
                node.arrayPath[node.arrayPath.length - 1] + 1 :
                node.childPos + 1;
            formData.value = $(evt.target).val();
            node.legend = util._template(legendTmpl, formData, util.valueTemplateSettings);
            $(node.parentNode.el).trigger('legendUpdated');
        }
    }


    /**
     * Inserts an item in the array at the requested position and renders the item.
     *
     * @function
     * @param {Number} idx Insertion index
     */
    insertArrayItem(idx: number, domElement/*: HTMLElement*/) {
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
    }


    /**
     * Remove an item from an array
     *
     * @function
     * @param {Number} idx The index number of the item to remove
     */
    deleteArrayItem(idx) {
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
    }

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
    getArrayBoundaries() {
        var boundaries = {
            minItems: -1,
            maxItems: -1
        };

        if (!this.view || !this.view.array) return boundaries;

        var getNodeBoundaries = function(node, initialNode?) {
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
                schemaKey = util.getSchemaKey(
                    node.ownerTree.formDesc.schema.properties,
                    arrayKey
                );
                if (!schemaKey) return boundaries;

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
                _.each(node.children, function(child) {
                    var subBoundaries = getNodeBoundaries(child, initialNode);
                    if (subBoundaries.minItems !== -1) {
                        if (boundaries.minItems !== -1) {
                            boundaries.minItems = Math.max(
                                boundaries.minItems,
                                subBoundaries.minItems
                            );
                        }
                        else {
                            boundaries.minItems = subBoundaries.minItems;
                        }
                    }
                    if (subBoundaries.maxItems !== -1) {
                        if (boundaries.maxItems !== -1) {
                            boundaries.maxItems = Math.min(
                                boundaries.maxItems,
                                subBoundaries.maxItems
                            );
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
    }
    
    
    /**
     * Return the FormNode's IFormElement instance
     * or any empty object placeholder to avoid null
     * pointer exceptions.
     */
    getFormElement(){
        return this.formElement || <IFormElement>{};
    }
    
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
export function getInitialValue(
    formDesc: IFormDescriptor,
    key: string,
    arrayPath: number[],
    tpldata: IFormTemplateData,
    usePreviousValues: boolean
) {
    var value = null;

    // Complete template data for template function
    tpldata = tpldata || {};
    tpldata.idx = tpldata.idx ||
        (arrayPath ? arrayPath[arrayPath.length - 1] : 1);
    tpldata.value = util.isSet(tpldata.value) ? tpldata.value : '';
    tpldata.getValue = tpldata.getValue || function(key) {
        return getInitialValue(formDesc, key, arrayPath, tpldata, usePreviousValues);
    };

    var formElement = getFormElement(formDesc.form || [], key);
    var schemaElement = util.getSchemaKey(formDesc.schema.properties, key);

    if (usePreviousValues && formDesc.value) {
        // If values were previously submitted, use them directly if defined
        value = util.getObjKey(formDesc.value, applyArrayPath(key, arrayPath));
    }
    if (!util.isSet(value)) {
        if (formElement && (typeof formElement['value'] !== 'undefined')) {
            // Extract the definition of the form field associated with
            // the key as it may override the schema's default value
            // (note a "null" value overrides a schema default value as well)
            value = formElement['value'];
        }
        else if (schemaElement) {
            // Simply extract the default value from the schema
            if (util.isSet(schemaElement['default'])) {
                value = schemaElement['default'];
            }
        }
        
        if (util.hasInterp(value)) {
            // This label wants to use the value of another input field.
            value = util.normaliseInterp(value);
        }
        
        if (value) {
            value = util._template(value, tpldata, util.valueTemplateSettings);
        }
    }

    // TODO: handle on the formElement.options, because user can setup it too.
    // Apply titleMap if needed
    if (util.isSet(value) && formElement && util.hasOwnProperty(formElement.titleMap, value)) {
        value = util._template(formElement.titleMap[value], tpldata, util.valueTemplateSettings);
    }

    // Check maximum length of a string
    if (value && _.isString(value) &&
        schemaElement && schemaElement.maxLength) {
        if (value.length > schemaElement.maxLength) {
            // Truncate value to maximum length, adding continuation dots
            value = value.substr(0, schemaElement.maxLength - 1) + '…';
        }
    }

    if (!util.isSet(value)) {
        return null;
    }
    else {
        return value;
    }
}


// Helper function that returns the form element that explicitly
// references the given key in the schema.
function getFormElement(elements: IFormElementOrString[], key: string): IFormElement {
    var formElement = null;
    if (!elements || !elements.length) return null;
    _.each(elements, function(elt) {
        if (formElement) return;
        if (elt === key) {
            formElement = { key: elt };
            return;
        }
        if (_.isString(elt)) return;
        if (elt.key === key) {
            formElement = elt;
        } else if (elt.items) {
            formElement = getFormElement(elt.items, key);
        }
    });
    return formElement;
}


/**
 * Remove duplicate code and implement common behaviour to set up 
 * underscore interpolation or apply an array path to the given value.
 */
export function applyInterpOrArrayPath(value: string, arrayPath: number[]){
    var result = value;
    if (util.hasInterp(value)){
        // This label wants to use the value of another input field.
        result = util.normaliseInterp(value);
    } else {
        // Note applying the array path probably doesn't make any sense,
        // but some geek might want to have a label "foo[].bar[].baz",
        // with the [] replaced by the appropriate array path.
        result = applyArrayPath(value, arrayPath);
    }
    
    return result;
}


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
export function applyArrayPath(key: string, arrayPath: number[]) {
    var depth = 0;
    if (!key) return null;
    if (!arrayPath || (arrayPath.length === 0)) return key;
    var newKey = key.replace(util.reArray, function(str, p1) {
        // Note this function gets called as many times as there are [x] in the ID,
        // from left to right in the string. The goal is to replace the [x] with
        // the appropriate index in the new array path, if defined.
        var newIndex = str;
        if (util.isSet(arrayPath[depth])) {
            newIndex = '[' + arrayPath[depth] + ']';
        }
        depth += 1;
        return newIndex;
    });
    return newKey;
}


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
export function getSchemaDefaultByKeyWithArrayIdx(schema, key, topDefaultArrayLevel) {
    topDefaultArrayLevel = topDefaultArrayLevel || 0;
    var defaultValue = undefined;
    if (!util.isSet(key) || key === '') {
        if (topDefaultArrayLevel == 0)
            defaultValue = schema.default;
    }
    else if (schema.default && topDefaultArrayLevel == 0) {
        defaultValue = util.getObjKeyEx(schema.default, key);
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
                defaultValue = util.getObjKeyEx(schema.default, m[5]);
            }
            else {
                defaultValue = getSchemaDefaultByKeyWithArrayIdx(schema, m[5], topDefaultArrayLevel);
            }
        }
    }
    return defaultValue;
}
