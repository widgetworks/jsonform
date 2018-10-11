import _ from 'lodash';

import {IFormClasses} from "./types/IFormClasses";

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
    let result = isBootstrap2 ? _bs2Classes : _bs3Classes;
    result = _.clone(result);
    return result;
}
