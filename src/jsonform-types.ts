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
        elt: /* FormElement */ any;
        schema: /* SchemaElement */ any;
        node: /* FormNode */ any;
        value: string;
        cls: IFormClasses;
        escape: (content: string) => string;
        
        children: string;   // Rendered child content
        fieldHtmlClass: string;
    }
    
}
