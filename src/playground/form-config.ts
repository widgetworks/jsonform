import {Playground} from './playground';

function getFormObject(playground: Playground){
    var formObject = {
        schema: {
          wiwoExample: {
            title: 'Schema + JSON example',
            type: 'string',
            'default': 'none'
          },
          example: {
            title: 'JSON Form example to start from',
            type: 'string',
            'default': 'gettingstarted'
          },
          greatform: {
            title: 'JSON Form object to render',
            type: 'string'
          }
        },
        form: [
          {
            key: 'wiwoExample',
            notitle: true,
            prepend: 'Wiwo demo',
            htmlClass: 'wiwoDemo',
            type: 'select',
            options: [
              {
                title: 'None',
                value: 'none',
                schemaUrl: '',
                jsonUrl: ''
              }
              ,{
                title: 'Repayment widget',
                value: 'repayment-widget',
                schemaUrl: 'https://wiwo-manager-uat.herokuapp.com/products/3/schema.js',
                jsonUrl: 'https://wiwo-manager-uat.herokuapp.com/c/bimade/qa/32'
              }
              ,{
                title: 'Repayment lite',
                value: 'repayment-lite',
                schemaUrl: 'https://wiwo-manager-uat.herokuapp.com/products/35/schema.js',
                jsonUrl: 'https://wiwo-manager-uat.herokuapp.com/c/bigodi/qa/15'
              }
              ,{
                title: 'Income tax',
                value: 'income-tax',
                schemaUrl: 'https://wiwo-manager-uat.herokuapp.com/products/33/schema.js',
                jsonUrl: 'https://wiwo-manager-uat.herokuapp.com/c/dawope/qa/16'
              }
            ],
            onChange: function(evt, node: jsonform.FormNode){
              // Find by ID
              var selected = $(evt.target).val();
              
              var item = _.find(node.formElement.options, (option) => {
                return option.value == selected;
              });
              
              if (item){
                playground.loadWiwoExample(item);
              }
            }
          },
          {
            key: 'example',
            notitle: true,
            prepend: 'Try with',
            htmlClass: 'trywith',
            type: 'select',
            options: {
              'gettingstarted': 'Getting started',
              'schema-basic': 'JSON Schema - A basic example',
              'schema-morecomplex': 'JSON Schema - Slightly more complex example',
              'schema-array': 'JSON Schema - Arrays',
              'schema-array-primitives': 'JSON Schema - Array primitives (strings)',
              'schema-required': 'JSON Schema - Required field',
              'schema-default': 'JSON Schema - Default values',
              'schema-inline-ref': 'JSON Schema - Inline $ref to definitions',
              'fields-common': 'Fields - Common properties',
              'fields-password': 'Fields - Gathering secrets: the password type',
              'fields-textarea': 'Fields - Large text: the textarea type',
              'fields-text-autocomplete': 'Fields - Text field with jquery-ui autocomplete',
              'fields-ace': 'Fields - Code (JavaScript, JSON...): the ace type',
              'fields-color': 'Fields - Color picker: the color type',
              'fields-checkbox': 'Fields - Boolean flag: the checkbox type',
              'fields-checkboxes': 'Fields - Multiple options: the checkboxes type',
              'fields-select': 'Fields - Selection list: the select type',
              'fields-radios': 'Fields - A list of radio buttons: the radios type',
              'fields-radiobuttons': 'Fields - Radio buttons as real buttons: the radio buttons type',
              'fields-checkboxbuttons': 'Fields - Checkbox buttons: the checkbox buttons type',
              'fields-range': 'Fields - Number: the range type',
              'fields-imageselect': 'Fields - Image selector: the imageselect type',
              'fields-iconselect': 'Fields - Icon selector: the iconselect type',
              'fields-fieldset': 'Fields - Grouping: the fieldset type',
              'fields-advancedfieldset': 'Fields - Advanced options section: the advancedfieldset type',
              'fields-authfieldset': 'Fields - Authentication settings section: the authfieldset type',
              'fields-section': 'Fields - Generic group: the section type',
              'fields-actions': 'Fields - Group of buttons: the actions type',
              'fields-array': 'Fields - Generic array: the array type',
              'fields-tabarray': 'Fields - Arrays with tabs: the tabarray type',
              'fields-tabarray-maxitems': 'Fields - Arrays with tabs: the tabarray type w/ maxItems',
              'fields-tabarray-value': 'Fields - Arrays with tabs: the tabarray type w/ default & legend',
              'fields-selectfieldset': 'Fields - Alternative: the selectfieldset type',
              'fields-selectfieldset-key': 'Fields - Alternative with schema key',
              'fields-submit': 'Fields - Submit the form: the submit type',
              'fields-help': 'Fields - Guide users: the help type',
              'fields-hidden': 'Fields - Hidden form values: the hidden type',
              'fields-questions': 'Fields - Series of questions: the questions type',
              'templating-idx': 'Templating - item index with idx',
              'templating-value': 'Templating - tab legend with value and valueInLegend',
              'templating-values': 'Templating - values.xxx to reference another field',
              'templating-tpldata': 'Templating - Using the tpldata property',
              'events': 'Using event handlers',
              'previousvalues': 'Using previously submitted values',
              'previousvalues-multi-array': 'Using previously submitted values - Multidimensional Arrays',
              'factory-sleek': 'Joshfire Factory - Sleek template'
            },
            onChange: function (evt) {
              var selected = $(evt.target).val();
    
              playground.loadExample(selected);
              if (history) history.pushState(
                { example: selected},
                'Example - ' + selected,
                '?example=' + selected);
            }
          },
          {
            key: 'greatform',
            type: 'ace',
            aceMode: 'json',
            width: '100%',
            height: '' + (window.innerHeight - 140) + 'px',
            notitle: true,
            onChange: function () {
              playground.generateForm();
            }
          }
        ]
      };
    
    return formObject;
}


export default getFormObject;