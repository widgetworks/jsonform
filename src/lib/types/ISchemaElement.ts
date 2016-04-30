namespace jsonform {
    
    export namespace schema {
        export var Type = {
            array: 'array',
            boolean: 'boolean',
            integer: 'integer',
            number: 'number',
            null: 'null',
            object: 'object',
            string: 'string'
        };
        
        export var Format = {
            // Formats defined in json-schema.
            'date-time': 'date-time',
            email: 'email',
            hostname: 'hostname',
            ipv4: 'ipv4',
            ipv6: 'ipv6',
            uri: 'uri',
            
            // Additional formats:
            color: 'color',
            html: 'html',
        };
    }
    
    
    export type ISchemaElementAny = ISchemaElement & ISchemaElementV3;
    export type ISchemaElement = ISchemaElementBase & ISchemaObject;
    export type ISchemaElementV3 = ISchemaElementBase & ISchemaObjectV3;
    // export interface ISchemaElement extends ISchemaElementBase, ISchemaObjectV4 {}
    // export interface ISchemaElementV3 extends ISchemaElementBase, ISchemaObjectV3 {}
    
    
    /**
     * ISchemaElement
     * 
     * JSON schema metadata - this is the node of data
     * representing an item in the schema 
     */
    export interface ISchemaElementBase extends IJsonSchemaAny {
        // key: string;
        
        // Transient property used during `FormTree#buildFromLayout()`
        _jsonform_allowEmpty?: boolean;
        _jsonform_get_value_by_tagsinput?: string;
    }
    
    
    export interface IJsonSchemaRoot extends IJsonSchemaAny, ISchemaObject {
        $schema: string;
    }
    export interface IJsonSchemaRootV3 extends IJsonSchemaAnyBase, ISchemaObjectV3 {
        $schema: string;
    }
    
    
    /**
     * JsonSchema element definition
     */
    export type JsonItemOrRef = IJsonSchemaAny | IJsonSchemaRef;
    
    
    export interface IJsonSchemaAny extends 
        ISchemaNumber, 
        ISchemaInteger, 
        ISchemaString, 
        ISchemaArray, 
        ISchemaObject
    {}
    
    
    export interface IJsonSchemaAnyBase extends 
        ISchemaNumber, 
        ISchemaInteger, 
        ISchemaString, 
        ISchemaArray, 
        ISchemaObjectBase
    {}
    
    
    /**
     * Common schema elements.
     */
    export interface IJsonSchemaRef {
        $ref: string;
    }
    
    
    export interface IJsonSchemaItem {
        $schema?: string;
        id?:string;
        
        type: string;
        enum?: any[];
        allOf?: any[];
        anyOf?: any[];
        oneOf?: any[];
        not?: any;
        format?: string;
        
        title?: string;
        description?: string;
        default?: any;
        
        definitions?: {[id: string]: IJsonSchemaAny};
    }
    
    export interface ISchemaNumber extends IJsonSchemaItem {
        multipleOf?: number;
        maximum?: number;
        minimum?: number;
        exclusiveMaximum?: number;
        exclusiveMinimum?: number;
    }
    export interface ISchemaInteger extends ISchemaNumber {}
    
    export interface ISchemaString extends IJsonSchemaItem {
        maxLength?: number;
        minLength?: number;
        pattern?: string;   // RegExp string
    }
    
    export interface ISchemaArray extends IJsonSchemaItem {
        additionalItems?: boolean | JsonItemOrRef;
        items?: JsonItemOrRef | JsonItemOrRef[];
        maxItems?: number;
        minItems?: number;
        uniqueItems?: boolean;
    }
    
    export interface ISchemaObjectBase extends IJsonSchemaItem {
        maxProperties?: number;
        minProperties?: number;
        
        additionalProperties?: boolean | JsonItemOrRef;
        properties?: {[property: string]: JsonItemOrRef};
        patternProperties?: {[propertyRegExp: string]: JsonItemOrRef};
        
        dependencies?: {[withProperty: string]: IJsonSchemaAny | string[]};
    }
    
    // jsonschema v4 specification
    export interface ISchemaObject extends ISchemaObjectBase {
        // List of child properties that are required.
        required?: string[];
        readOnly?: boolean;
    }
    
    // jsonschema v3 specification
    export interface ISchemaObjectV3 extends ISchemaObjectBase {
        // Indicates if this item is required
        required?: boolean;
        'readonly'?: boolean;
    }
    
    
}