import _ from 'lodash';

import {ITemplateMap} from "../lib/types/ITemplate";

import ace from "./ace";
import array from "./array";
import checkbox from "./checkbox";
import checkboxbuttons from "./checkboxbuttons";
import checkboxes from "./checkboxes";
import inputs from "./inputs";
import json from "./json";
import others from "./others";
import radiobuttons from "./radiobuttons";
import radios from "./radios";
import tabarray from "./tabarray";
import tablearray from "./tablearray";
import tableobject from "./tableobject";

// import imageTypes from './imageselect';
// import transloadit from './transloadit';


// Merge all the template groups together
let elementTypes: ITemplateMap = _.extend(
    {},
    ace,
    array,
    checkbox,
    checkboxbuttons,
    checkboxes,
    inputs,
    json,
    others,
    radiobuttons,
    radios,
    tabarray,
    tablearray,
    tableobject,
);
export default elementTypes;

