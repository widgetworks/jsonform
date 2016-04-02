/**
* jsonform
*/
describe('jsonform', function(){
    
    var schema;
    
    beforeEach(function(){
        
        schema = {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "id": "http://jsonschema.net",
            "type": "object",
            "properties": {
                "address": {
                "id": "http://jsonschema.net/address",
                "type": "object",
                "properties": {
                    "streetAddress": {
                    "id": "http://jsonschema.net/address/streetAddress",
                    "type": "string"
                    },
                    "city": {
                    "id": "http://jsonschema.net/address/city",
                    "type": "string"
                    }
                },
                "required": [
                    "streetAddress",
                    "city"
                ]
                },
                "phoneNumber": {
                "id": "http://jsonschema.net/phoneNumber",
                "type": "array",
                "items": {
                    "id": "http://jsonschema.net/phoneNumber/0",
                    "type": "object",
                    "properties": {
                    "location": {
                        "id": "http://jsonschema.net/phoneNumber/0/location",
                        "type": "string"
                    },
                    "code": {
                        "id": "http://jsonschema.net/phoneNumber/0/code",
                        "type": "integer"
                    }
                    }
                }
                }
            },
            "required": [
                "address",
                "phoneNumber"
            ]
        };
        
    });
    
    
    it('renders form from schema', function(){
        var options = {
            schema: schema
        };
        
        var $f = $(document.createElement('form'));
        var formTree = $f.jsonForm(options);
        
        // Check what `f` holds now
        expect($f.html()).toEqual('');
    });
    
});
// End of 'jsonform'