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
    
});