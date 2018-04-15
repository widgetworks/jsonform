import {FormNode} from "../FormNode";


/**
 * Event listener signature for FormNode events
 */
export interface INodeEventHandler {
    (evt/*: Event*/, node: FormNode): void;
}


/**
 * Map of event names to event handlers that will be 
 * registered when this FormNode is rendered.
 * 
 * Shared between FormNode and IFormElement.
 */
export interface IHandlerMap {
    [event: string]: INodeEventHandler;
}


/**
 * Standard event interface for listening
 * to control changes/events.
 * 
 * Shared between FormNode, IFormElement, and view.
 */
export interface IControlListener {
    onInsert?: INodeEventHandler;
    onChange?: INodeEventHandler;
    onClick?: INodeEventHandler;
    onKeyUp?: INodeEventHandler;
}
