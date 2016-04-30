/// <reference path="../../build/jsonform.d.ts" />
/// <reference path="../references.d.ts" />

interface JQuery {
    jsonForm: (options, param1?) => any;
}

declare function fetch(input, options?);