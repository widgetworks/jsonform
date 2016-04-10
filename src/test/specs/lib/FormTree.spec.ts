/**
 * FormTree
 */
describe('FormTree', function(){
    
    var FormTree: typeof jsonform.FormTree;
    var formTree: jsonform.FormTree;
    
    
    /**
     * #initialize()
     */
    describe('#initialize()', function(){
        
        beforeEach(function(){
            FormTree = jsonform.FormTree;
            formTree = new FormTree();
            
            spyOn(formTree, '_convertSchemaV3ToV4').and.callThrough();
            spyOn(formTree, '_resolveRefs').and.callThrough();
        });
        
        
    	xit('clone `formDesc` parameter', function(){
            var formDesc = {
                schema: {
                    key: 'value'
                }
            };
    		formTree.initialize(formDesc);
            
            expect(formTree.formDesc).toEqual(formDesc);
            expect(formTree.formDesc).not.toBe(formDesc);
            
            fail('test not ready yet');
    	});
        
        
        /**
         * #defaultClasses
         */
        describe('#defaultClasses', function(){
            
            var _schema: jsonform.IFormDescriptor;
            
            beforeEach(function(){
            	spyOn(jsonform, 'getDefaultClasses').and.callThrough();
                
                _schema = {
                    schema: {}
                };
            });
            
            
            afterEach(function(){
            	jsonform.isBootstrap2 = false;
            });
            
            
            it('export `defaultClasses`', function(){
                expect(formTree.defaultClasses).toBeNull();
                
                formTree.initialize(_schema);
                
                expect(jsonform.getDefaultClasses).toHaveBeenCalled();
                expect(formTree.defaultClasses).not.toBeNull();
            });
            
            
            it('choose bootstrap3 by default', function(){
                formTree.initialize(_schema);
                
                expect(jsonform.getDefaultClasses).toHaveBeenCalledWith(false);
                expect(formTree.defaultClasses).toEqual(jasmine.objectContaining({
                    groupClass: 'form-group' // bootstrap 3 class
                }));
            });
            
            
            it('choose bootstrap2 from `formDesc.isBootstrap2`', function(){
                _schema = {
                    schema: {},
                    isBootstrap2: true
                };
                formTree.initialize(_schema);
                
                expect(jsonform.getDefaultClasses).toHaveBeenCalledWith(true);
                expect(formTree.defaultClasses).toEqual(jasmine.objectContaining({
                    groupClass: 'control-group' // bootstrap 2 class
                }));
            });
            
            
            it('choose bootstrap2 from `jsonform.isBootstrap2`', function(){
                jsonform.isBootstrap2 = true;
                formTree.initialize(_schema);
                
                expect(jsonform.getDefaultClasses).toHaveBeenCalledWith(true);
                expect(formTree.defaultClasses).toEqual(jasmine.objectContaining({
                    groupClass: 'control-group' // bootstrap 2 class
                }));
            });
            
            
            it('merge `formDesc.defaultClasses` over selected classes', function(){
                _schema = {
                    schema: {},
                    defaultClasses: {
                        test: 'value',
                        labelClass: 'overridden value'
                    }
                };
                formTree.initialize(_schema);
                
                expect(formTree.defaultClasses).toEqual(jasmine.objectContaining({
                    test: 'value', // custom property
                    labelClass: 'overridden value'  // merged property
                }));
            });
        	
        });
        // End of '#defaultClasses'.
        
        
        /**
         * initialisation process
         */
        describe('initialisation process', function(){
            
            var _schema: jsonform.IFormDescriptor;
            
            
        	it('invoke `#_convertSchemaV3ToV4()` with `formDesc.schema`', function(){
                _schema = {
                    schema: {
                        properties: {
                            'key': 'value'
                        }
                    }
                };
                formTree.initialize(_schema);
                
                expect(formTree._convertSchemaV3ToV4).toHaveBeenCalledWith(_schema.schema);
            });
            
            
            it('invoked `#_convertSchemaV3ToV4()` with each `formDesc.schema.definitions` property', function(){
                _schema = {
                    schema: {
                        properties: {},
                        
                        definitions: {
                            key1: 'value1',
                            key2: 'value2'
                        }
                    }
                };
                formTree.initialize(_schema);
                
            	expect(formTree._convertSchemaV3ToV4).toHaveBeenCalledWith('value1');
            	expect(formTree._convertSchemaV3ToV4).toHaveBeenCalledWith('value2');
            });
            
            
            it('does not invoke `#_resolveRefs` if `schema.definitions` is missing', function(){
                _schema = {
                    schema: {
                    }
                };
                
                expect(formTree._resolveRefs).not.toHaveBeenCalled();
            });
            
            
            it('invokes `#_resolveRefs()` with `schema` and `schema.definitions`', function(){
                _schema = {
                    schema: {
                        properties: {},
                        definitions: {
                            key1: 'value1',
                            key2: 'value2'
                        }
                    }
                };
                formTree.initialize(_schema);
                
                expect(formTree._resolveRefs).toHaveBeenCalledWith(
                    // _schema.schema:
                    jasmine.objectContaining({
                        definitions: jasmine.any(Object),
                        properties: jasmine.any(Object)
                    }),
                    
                    
                    // _schema.schema.definitions:
                    jasmine.objectContaining({
                        key1: 'value1',
                        key2: 'value2'
                    })
                );
            });
    
    
            /**
             * Add a note of current behaviour here that will be fixed later.
             * 
             * If `formDesc.schema.properties` doesn't exist then we lose
             * the other properties on `formDesc.schema` when it re-writes the
             * schema object.
             */
            it('messes up schema if `schema.properties` is missing', function(){
            	_schema = {
                    schema: {
                        definitions: {}
                    }
                };
                formTree.initialize(_schema);
    
                /**
                 * Currently incorrect but will be fixed later.
                 */
                expect(formTree.formDesc.schema).toEqual(jasmine.objectContaining({
                    properties: {
                        definitions: {}
                    }
                }));
    
    
                /**
                 * This is *really* what we want this to be in the end.
                 */
                // expect(formTree.formDesc.schema).toEqual(jasmine.objectContaining({
                //     properties: {
                //        
                //     },
                //     definitions: {
                //        
                //     }
                // }));
            });
        	
        });
        // End of 'initialisation process'.
        
        
    });
    // End of '#initialize()'.
    
    
    /**
     * #_convertSchemaV3ToV4()
     */
    describe('#_convertSchemaV3ToV4()', function(){
        
        var schema;
        
        beforeEach(function(){
            schema = {
                properties: {}
            };
        });
        
        
        it('convert `readonly` to `readOnly`', function(){
        	_.extend(schema, {
                readonly: true
            });
            var result = formTree._convertSchemaV3ToV4(schema);
            
            expect(result).toEqual(jasmine.objectContaining({
                readOnly: true
            }));
            expect(result.readonly).toBeUndefined();
        });
        
        
        /**
         * convert `required`
         */
        describe('convert `required`', function(){
            
            it('convert boolean required to parent string list', function(){
                
            	// V3 schema
                schema = {
                    "title": "Customer",
                    "description": "json-schema v3 style 'required'",
                    "type": "object",
                    "required": true,
                    "properties": {
                        "name": {
                            "required": true,
                            "title": "Name",
                            "type": "string"
                        },
                        "address": {
                            "title": "Address",
                            "type": "object",
                            "properties": {
                                "city": {
                                    "required": true,
                                    "title": "City",
                                    "type": "string"
                                },
                                "street": {
                                    "required": true,
                                    "title": "Street",
                                    "type": "string"
                                },
                                "zip": {
                                    "title": "Zip",
                                    "type": "string"
                                }
                            }
                        },
                        "phoneNumber": {
                            "type": "array",
                            "required": true,
                            "items": {
                                "type": "object",
                                "required": true,
                                "properties": {
                                    "location": {
                                        "required": true,
                                        "type": "string"
                                    },
                                    "code": {
                                        "required": true,
                                        "type": "integer"
                                    }
                                }
                            }
                        }
                    }
                };
                
                var v4Result = {
                    "title": "Customer",
                    "description": "json-schema v3 style 'required'",
                    "type": "object",
                    "required": ["name", "phoneNumber"],
                    "properties": {
                        "name": {
                            "title": "Name",
                            "type": "string"
                        },
                        "address": {
                            "title": "Address",
                            "type": "object",
                            "required": ["city", "street"],
                            "properties": {
                                "city": {
                                    "title": "City",
                                    "type": "string"
                                },
                                "street": {
                                    "title": "Street",
                                    "type": "string"
                                },
                                "zip": {
                                    "title": "Zip",
                                    "type": "string"
                                }
                            }
                        },
                        "phoneNumber": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["location", "code"],
                                "properties": {
                                    "location": {
                                        "type": "string"
                                    },
                                    "code": {
                                        "type": "integer"
                                    }
                                }
                            }
                        }
                    }
                };
                
                
                var result = formTree._convertSchemaV3ToV4(schema);
                expect(result).toEqual(v4Result);
            	
            });
            
            
            it('throws error if `required` is not boolean or array', function(){
                schema = {
                    properties: {
                        customer: {
                            "title": "Customer",
                            "description": "json-schema v3 style 'required'",
                            "type": "object",
                            "properties": {
                                "name": {
                                    "required": {},
                                    "title": "Name",
                                    "type": "string"
                                }
                            }
                        }
                    }
                };
                
                expect(function(){
                    formTree._convertSchemaV3ToV4(schema);
                }).toThrowError('field "name"\'s required property should be either boolean or array of strings');
            });
            
            
            it('throws error if array `items` is not an object', function(){
                schema = {
                    properties: {
                        customer: {
                            "title": "Customer",
                            "description": "json-schema v3 style 'required'",
                            "type": "array",
                            "items": [
                                {
                                    "type": "object",
                                    "required": ["location", "code"],
                                    "properties": {
                                        "location": {
                                            "type": "string"
                                        },
                                        "code": {
                                            "type": "integer"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                };
                
                expect(function(){
                    formTree._convertSchemaV3ToV4(schema);
                }).toThrowError('the items property of array property "customer" in the schema definition must be an object');
            });
            
        });
        // End of 'convert `required`'.
        
        
        it('does not alter exiting V4 objects', function(){
        	schema = {
                "title": "CustomerV4",
                "description": "json-schema v4 style 'required'",
                "type": "object",
                "required": [
                    "name",
                    "address",
                    "phoneNumber"
                ],
                "properties": {
                    "name": {
                        "title": "Name",
                        "type": "string"
                    },
                    "address": {
                        "title": "Address",
                        "type": "object",
                        "required": [
                            "steet",
                            "city"
                        ],
                        "properties": {
                            "city": {
                                "title": "City",
                                "type": "string"
                            },
                            "street": {
                                "title": "Street",
                                "type": "string"
                            },
                            "zip": {
                                "title": "Zip",
                                "type": "string"
                            }
                        }
                    },
                    "phoneNumber": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["location", "code"],
                            "properties": {
                                "location": {
                                    "type": "string"
                                },
                                "code": {
                                    "type": "integer"
                                }
                            }
                        }
                    }
                }
            };
            var v4Result = _.cloneDeep(schema);
            
            var result = formTree._convertSchemaV3ToV4(schema);
            expect(result).toEqual(v4Result);
        });
        
    });
    // End of '#_convertSchemaV3ToV4()'.
    
    
    /**
     * #_resolveRefs()
     */
    describe('#_resolveRefs()', function(){
        
        var schema: jsonform.IJsonSchemaAny;
        
        beforeEach(function(){
        	schema = {
                "properties": {
                    "type": "object",
                    "required": [
                        "name"
                    ],
                    "properties": {
                        "name": {
                            "title": "Name",
                            "type": "string"
                        },
                        "homeAddress": {
                            "$ref": "#/definitions/address"
                        }
                    }
                },
                "definitions": {
                    // "contactDetails": {
                    //     "type": "object",
                    //     "properties": {
                    //         "address": {
                    //             "$ref": "#/definitions/address"
                    //         },
                    //         "phoneNumber": {
                    //             "$ref": "#/definitions/phoneNumber"
                    //         }
                    //     }
                    // },
                    "address": {
                        "title": "Address",
                        "type": "object",
                        "required": [
                            "steet",
                            "city"
                        ],
                        "properties": {
                            "city": {
                                "title": "City",
                                "type": "string"
                            },
                            "street": {
                                "title": "Street",
                                "type": "string"
                            },
                            "zip": {
                                "title": "Zip",
                                "type": "string"
                            }
                        }
                    },
                    
                    "phoneNumber": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["location", "code"],
                            "properties": {
                                "location": {
                                    "type": "string"
                                },
                                "code": {
                                    "type": "integer"
                                }
                            }
                        }
                    }
                }
            };
        });
        
        
        it('resolves $ref values to `definitions` lookup', function(){
            var v4Result = {
                "properties": {
                    "type": "object",
                    "required": [
                        "name"
                    ],
                    "properties": {
                        "name": {
                            "title": "Name",
                            "type": "string"
                        },
                        "homeAddress": {
                            "title": "Address",
                            "type": "object",
                            "required": [
                                "steet",
                                "city"
                            ],
                            "properties": {
                                "city": {
                                    "title": "City",
                                    "type": "string"
                                },
                                "street": {
                                    "title": "Street",
                                    "type": "string"
                                },
                                "zip": {
                                    "title": "Zip",
                                    "type": "string"
                                }
                            }
                        }
                    }
                }
            };
            
            formTree._resolveRefs(schema, schema.definitions);
            
            var result = {
                properties: schema.properties
            };
            expect(result).toEqual(v4Result);
        });
        
        
        xit('resolves nested references', function(){
        	// To be completed later
        });
        
        
        xit('allows forward-referencing definitions', function(){
        	// To be completed later
        });
        
    });
    // End of '#_resolveRefs()'.
	
});
// End of 'FormTree'.