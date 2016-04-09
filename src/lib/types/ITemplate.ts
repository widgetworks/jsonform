namespace jsonform {
    
    export interface EventLike {
        target: /*$(HTMLElement)*/ any;
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
    export interface ITemplate {
        template: string;
        childTemplate?: (
            inner: string,
            data: IRenderData,
            node: FormNode,
            parentData: IRenderData,
            parentNode: FormNode
        ) => string;
        
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
        getElement?: (el: /*HTMLElement*/ any) => /*HTMLElement*/ any;
        
        
        /**
         * JsonForm event callbacks
         */
        onBeforeRender?: (data: IRenderData, node: FormNode) => void;
        onInsert?: (event: EventLike, node: FormNode) => void;
        onChange?: (event: EventLike, node: FormNode) => void;
        onAfterRender?: (data: IRenderData, node: FormNode) => void;
        afterChildTemplate?: (renderedChild: string, node: FormNode, parentNode: FormNode) => string;
        
        // `onSubmit()` is invoked on each template just before
        // submitting the form. The template may prevent submission
        // by returning a falsy value.
        onSubmit?: (event: Event, node: FormNode) => boolean;
        
        /**
         * DOM event callbacks
         */
        onClick?: (event: Event, node: FormNode) => void;
        onKeyUp?: (event: Event, node: FormNode) => void;
        
    }
    
}