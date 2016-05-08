$(function ($){
    var jsonFormInstance;
    
    $(document).on('jsonform.create', function(event, formTreeInstance){
        jsonFormInstance = formTreeInstance;
        
        console.log('formTreeInstance=', formTreeInstance);
        
        showDebugSchema(jsonFormInstance)
    });
    
    
    function showDebugSchema(jsonFormInstance){
        var schema = jsonFormInstance.formDesc.schema;
        var json = stringify(schema, null, '|   ');
        $('#debug-schema').text(json);
    }
    
    
    /**
     * TODO: Cycle test - load remote schema and json, then save
     * and compare against original.
     * 
     * We expect that the saved version is the same as the original.
     * 
     * Use json-diff-patch to show differences.
     */
    
});