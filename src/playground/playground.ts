/*global $, ace, console*/
import JSONForm from './JsonFormProxy';

export class Playground {
    
    
    /**
     * Extracts a potential form to load from query string
     */
    getRequestedExample() {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        var param = null;
        for (var i = 0; i < vars.length; i++) {
            param = vars[i].split('=');
            if (param[0] === 'example') {
                if (param[1].slice(-1) == '/')
                    return param[1].slice(0, -1);
                return param[1];
            }
        }
        return null;
    }
    
    
    /**
     * Loads and displays the example identified by the given name
     */
    loadExample(example) {
        var isBootstrap2 = JSONForm.isBootstrap2 = location.pathname.indexOf('bootstrap3') < 0;
        var exampleDir = !isBootstrap2 ? '../examples/' : 'examples/';
        $.ajax({
            url: exampleDir + example + '.json',
            dataType: 'text'
        }).done(function (code) {
            var aceId = $('#form .ace_editor').attr('id');
            var editor = ace.edit(aceId);
            editor.getSession().setValue(code);
        }).fail(function () {
            $('#result').html('Sorry, I could not retrieve the example!');
        });
    }
    
    
    /**
     * Displays the form entered by the user
     * (this function runs whenever once per second whenever the user
     * changes the contents of the ACE input field)
     */
    generateForm() {
        var values = $('#form').jsonFormValue();
        
        // Reset result pane
        $('#result').html('');
        
        // Parse entered content as JavaScript
        // (mostly JSON but functions are possible)
        var createdForm = null;
        try {
            // Most examples should be written in pure JSON,
            // but playground is helpful to check behaviors too!
            eval('createdForm=' + values.greatform);
        }
        catch (e) {
            $('#result').html('<pre>Entered content is not yet a valid' +
                ' JSON Form object.\n\nJavaScript parser returned:\n' +
                e + '</pre>');
            return;
        }
        
        // Render the resulting form, binding to onSubmitValid
        try {
            createdForm.onSubmitValid = function (values) {
                if (console && console.log) {
                    console.log('Values extracted from submitted form', values);
                }
                window.alert('Form submitted. Values object:\n' +
                    JSON.stringify(values, null, 2));
            };
            createdForm.onSubmit = function (errors, values) {
                if (errors) {
                    console.log('Validation errors', errors);
                    return false;
                }
                return true;
            };
            $('#result').html('<form id="result-form" class="form-vertical"></form>');
            
            var formTree = $('#result-form').jsonForm(createdForm);
            $(document).trigger('jsonform.create', formTree);
            
        }
        catch (e) {
            var stack = '';
            if (e.stack) {
                stack = e.stack;
                console.error(e);
            }
            
            $('#result').html(
`<pre>Entered content is not yet a valid JSON Form object.

The JSON Form library returned:
${e}</pre>
<pre>${stack}</pre>
`
            );
            return;
        }
    }
    
}

var playground = new Playground();
export default playground;
