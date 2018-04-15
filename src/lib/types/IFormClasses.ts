/**
 * Classes to use when rendering form elements
 * 
 * Common interface to abstract away from the specific
 * view-framework being used. 
 * 
 * e.g. Could hold Bootstrap 2, Bootstrap 3 or other sets of classes
 */
export interface IFormClasses {
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
