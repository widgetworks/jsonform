/// <reference path="../../build/jsonform.d.ts" />
/// <reference path="../references.d.ts" />
/// <reference path="../references-dev.d.ts" />

interface JQuery {
    jsonForm: (options, param1?) => any;
}

declare function Promise();
declare module Promise {
    function all(...any);
}

declare function fetch(input, options?);