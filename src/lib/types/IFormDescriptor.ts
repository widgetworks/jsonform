namespace jsonform {
    
    export type IFormElementOrString = IFormElement | string;
    
    
    /**
     * Interface for the object passed through when 
     * initialising the JsonForm
     */
    export interface IFormDescriptor {
        
        /**
         * 2016-04-09
         * TODO: Support short-hand schema and full schema objects.
         * Currently only supports the short-hand schema (despite what
         * the documentation says).
         */
        schema;     // The JSON schema object.
        
        /**
         * JsonForm metadata used control which controls are shown and 
         * how they are presented.
         */
        form: IFormElementOrString[];
    
        /**
         * Optional - additional map of IFormElement instances
         * mapped by their key value.
         * 
         * This lets the `form` list be a simple list of strings
         * which are indexed into this map to return the IFormElement.
         */
        customFormItems?: {[id: string]: IFormElement};
        
        params?: IFormParams;
        tpldata?: IFormTemplateData;
    
    
        /**
         * 2016-04-09
         * Coridyn: This is supposed to contain the object graph
         * of any previously submitted form.
         * 
         * However, I can't see where this would be set so I'm
         * not sure if this is ever anything other than `undefined`.
         */
        value?: any;
        
        
        
        // The "original" schema passed to the constructor.
        // This has actually been converted from a V3 to V4 JSON schema,
        // but otherwise matches the original.
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
        defaultClasses?: {[classId: string]: string};
    
    
        /**
         * Event callbacks
         */
        // Invoke callback when any form element is rendered.
        // Allows global manipulation of elements as they are rendered. 
        onBeforeRender?: (data: IRenderData, node: FormNode) => void;
        onInsert?: (event: EventLike, node: FormNode) => void;
        onAfterRender?: (data: IRenderData, node: FormNode) => void;
        onElementSchema: () => void;
    
    
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
    export interface IFormParams {
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
    export interface IFormTemplateData {
        
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
    
}