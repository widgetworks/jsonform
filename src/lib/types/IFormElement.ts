namespace jsonform {
    
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
    export interface IFormElement extends IControlListener, IOtherField, IFormElementExtend {
        
        /**
         * Unique identifier for this FormElement.
         * 
         * Made up of the path of this element in the schema.
         */
        id?: string;
        key?: string;
        name?: string;
        iddot?: string; // Escaped "dotted" version of `id`
        
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
        'readonly'?: boolean; // For backward compatibility only. Use `readOnly` instead.
        
        allowEmpty?: boolean;
        
        inline?: boolean;
        activeClass?: string;
        options?: IOption[];
        valueInLegend?: boolean;
        
        // CSS class applied to input elements in this element's rendered content.
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
        // NOTE: See additional events in `IControlListener`
    }
    
    
    /**
     * Additional properties that may be made available
     * on the IFormElement, but which aren't part of
     * the jsonform IFormElement interface.
     * 
     * e.g. to be used by custom templates.
     */
    export interface IFormElementExtend {
        //---------------------------------------------------------------------
        // Template-specific properties
        
        
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
        addMoreTitle?: string;    // Text for the 'Add' button.
        addMoreTooltip?: string;  // Title attribute for the 'Add' button. Defaults to 'Add new item'.
        
        
        /**
         * ACE editor configuration options
         */
        aceTheme?: string;  // Otherwise theme defaults to 'twilight'
        aceMode?: string;
        
        
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
    export interface IOtherField {
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