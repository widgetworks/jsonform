import {IFormClasses} from "./IFormClasses";


/**
 * Data made available when rendering an item
 */
export interface IRenderData {
    id: string;
    keydash: string;
    elt: /* FormElement */ any;
    schema: /* SchemaElement */ any;
    node: /* FormNode */ any;
    value: string;
    cls: IFormClasses;
    escape: (content: string) => string;
    
    children: string;   // Rendered child content
    
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
