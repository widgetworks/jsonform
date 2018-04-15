/*
Util for handling global library references
*/
var global = (typeof global !== 'undefined') ? global : window;

const result = {
    ZSchema: global.ZSchema,
    jjv: global.jjv,
    JSONFormValidator: global.JSONFormValidator,
};

export default result;
