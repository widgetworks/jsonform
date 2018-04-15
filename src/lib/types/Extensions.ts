import {FormNode} from "../FormNode";
import {FormTree} from "../FormTree";


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
export interface FormNode_TransloadIt extends FormNode {
    ownerTree: FormTree_TransloadIt;
}

export interface FormTree_TransloadIt extends FormTree {
    _transloadit_generic_public_index?: number;
    _transloadit_generic_elts?: any;
    _transloadit_bound?: boolean;
}
// End of 'transloadIt' types
//------------------------------------------------------
