import _ from 'lodash';

import inputTypes from './inputs';
// import imageTypes from './imageselect';
// import transloadit from './transloadit';


// Merge all the template groups together
let elementTypes = _.extend(
    {},
    inputTypes,
);
export default elementTypes;

