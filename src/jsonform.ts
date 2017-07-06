/*global window*/

/**
 * The jsonform object whose methods will be exposed to the window object
 */
namespace jsonform {

    var global = util.global;
    var $ = util.$;
    var _ = util._;

    export var isBootstrap2 = false;
    
    export var _bs2Classes: IFormClasses = {
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
    
    export var _bs3Classes: IFormClasses = {
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
    

    export function getDefaultClasses(isBootstrap2: boolean): IFormClasses {
        return isBootstrap2 ? _bs2Classes : _bs3Classes;
    }


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
    var initializeTabs = function(tabs, options) {
        var activate = function(element, container) {
            container
                .find('> .active')
                .removeClass('active');
            element.addClass('active');
        };

        var enableFields = function($target, targetIndex) {
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

        var optionSelected = function(e) {
            var $option = $("option:selected", $(this)),
                $select = $(this),
                // do not use .attr() as it sometimes unexplicably fails
                targetIdx = $option.get(0).getAttribute('data-idx') || $option.attr('value'),
                $target;

            e.preventDefault();
            if ($option.hasClass('active')) {
                return;
            }

            $target = $(this).parents('.tabbable').eq(0).find('> .tab-content > [data-idx=' + targetIdx + ']');

            activate($option, $select);
            activate($target, $target.parent());
            enableFields($target, targetIdx);
        };

        var tabClicked = function(e) {
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

        tabs.each(function() {
            $(this).delegate('select.nav', 'change', optionSelected);
            $(this).find('select.nav').each(function() {
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
    var truncateToArrayDepth = function(key, arrayDepth) {
        var depth = 0;
        var pos = 0;
        if (!key) return null;

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
        if (pos === -1) return key;
        else return key.substring(0, pos);
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
    export function getFormValue(formelt) {
        var form = $(formelt).data('jsonform-tree');
        if (!form) return null;
        return form.root.getFormValues();
    };


    /**
     * Highlights errors reported by the JSON schema validator in the document.
     *
     * @function
     * @param {Object} errors List of errors reported by the JSON schema validator
     * @param {Object} options The JSON Form object that describes the form
     *  (unused for the time being, could be useful to store example values or
     *   specific error messages)
     */
    $.fn.jsonFormErrors = function(errors, options) {
        var form = $(this).data("jsonform-tree");
        $("." + form.defaultClasses.groupMarkClassPrefix + "error", this).removeClass(form.defaultClasses.groupMarkClassPrefix + "error");
        $("." + form.defaultClasses.groupMarkClassPrefix + "warning", this).removeClass(form.defaultClasses.groupMarkClassPrefix + "warning");

        $(".jsonform-errortext", this).hide();
        if (!errors) return;

        var errorSelectors: string[] = [];
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
                    util.escapeSelector(key.replace(/\./g, "---"));
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
        var errorSelectorsStr: string = errorSelectors.join(',');
        var $errorSelectors = $(errorSelectorsStr, this);
        // XXX: check invisible panels if error happens there
        var $errorInvisiblePanels = $errorSelectors.parents('.tab-pane');
        var $errorTabs = $();
        $errorInvisiblePanels.each(function() {
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
    $.fn.jsonForm = function(options, param1) {
        var form: FormTree;

        if (options === 'values') {
            return jsonform.getFormValue(this);
        }
        if (options === 'submit') {
            form = this.data('jsonform-tree');
            if (!form) return null;
            return form.submit();
        }
        if (options === 'validate') {
            form = this.data('jsonform-tree');
            if (!form) return null;
            return form.validate(param1);
        }

        var formElt = this;

        options = _.defaults(
            {},
            options,
            {
                submitEvent: 'submit',
                disableInactiveTabs: false
            }
        );

        form = new FormTree();
        form.initialize(options);
        form.render(formElt.get(0));

        // TODO: move that to formTree.render
        if (options.transloadit) {
            formElt.append('<input type="hidden" name="params" value=\'' +
                util.escapeHTML(JSON.stringify(options.transloadit.params)) +
                '\'>');
        }

        // Keep a direct pointer to the JSON schema for form submission purpose
        formElt.data("jsonform-tree", form);
        
        /**
         * Add marker class indicating this is the root of a jsonform tree.
         */
        formElt.addClass("jsonform--root");

        if (options.submitEvent) {
            formElt.unbind((options.submitEvent) + '.jsonform');
            formElt.bind((options.submitEvent) + '.jsonform', function(evt) {
                form.submit(evt);
            });
        }

        // Initialize tabs sections, if any
        initializeTabs(formElt, options);

        // Initialize expandable sections, if any
        $('.expandable > div, .expandable > fieldset', formElt).hide();

        // Hide all which are not expanded.
        formElt.find('.expandable:not(.expanded)').find('> div, > fieldset').hide();

        formElt.on('click', '.expandable > legend', function() {
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
    $.fn.jsonFormValue = function() {
        return jsonform.getFormValue(this);
    };

    // Expose the getFormValue method to the global object
    // (other methods exposed as jQuery functions)
    if (!global.JSONForm) {
        global.JSONForm = jsonform;
    }

}
