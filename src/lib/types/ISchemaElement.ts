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
    export type ISchemaElement = ISchemaElementBase & ISchemaObjectV4;
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
    
    
    export interface IJsonSchemaRoot extends IJsonSchemaAny, ISchemaObjectV4 {
        $schema: string;
    }
    export interface IJsonSchemaRootV3 extends IJsonSchemaAny, ISchemaObjectV3 {
        $schema: string;
    }
    
    
    /**
     * JsonSchema element definition
     */
    export interface IJsonSchemaAny extends ISchemaNumber, ISchemaInteger, ISchemaString, ISchemaArray, ISchemaObject{}
    
    
    /**
     * Common schema elements.
     */
    export interface IJsonSchemaItem {
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
        
        $ref?: string;
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
        additionalItems?: boolean | IJsonSchemaAny;
        items?: IJsonSchemaAny | IJsonSchemaAny[];
        maxItems?: number;
        minItems?: number;
        uniqueItems?: boolean;
    }
    
    export interface ISchemaObject extends IJsonSchemaItem {
        maxProperties?: number;
        minProperties?: number;
        
        additionalProperties?: boolean | IJsonSchemaAny;
        properties?: {[property: string]: IJsonSchemaAny};
        patternProperties?: {[propertyRegExp: string]: IJsonSchemaAny};
        
        dependencies?: {[withProperty: string]: IJsonSchemaAny | string[]};
    }
    
    // jsonschema v4 specification
    export interface ISchemaObjectV4 extends ISchemaObject {
        // List of child properties that are required.
        required?: string[];
        readOnly?: boolean;
    }
    
    // jsonschema v3 specification
    export interface ISchemaObjectV3 extends ISchemaObject {
        // Indicates if this item is required
        required?: boolean;
        'readonly'?: boolean;
    }
    
    
}