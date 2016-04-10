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
                        properties: jasmine.any(Object),
                        required: jasmine.any(Array)
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
        
        var _schema: jsonform.IFormDescriptor;
        
        beforeEach(function(){
            
        });
        
        
        
        // in and out expectations.
        
    });
    // End of '#_convertSchemaV3ToV4()'.
    
    
    /**
     * #_resolveRefs()
     */
    describe('#_resolveRefs()', function(){
        
        var _schema: jsonform.IFormDescriptor;
        
        
        
    });
    // End of '#_resolveRefs()'.
	
});
// End of 'FormTree'.