import $ from 'jquery';
import _ from "lodash";

import {FormNode} from "../lib/FormNode";

var inputFieldTemplate = function(type: string, isTextualInput: boolean, extraOpts?: any) {
	var templ = {
		'template': '<input type="' + type + '" ' +
		'class="<%= fieldHtmlClass' + (isTextualInput ? ' || cls.textualInputClass' : '') + ' %>" ' +
		'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
		'<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
		'<%= (node.required|| node.schemaElement.minLength ? " required=\'required\'" : "") %>' +
		'<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
		' /> <pre>required=<%= node.required %></pre> ',
		'fieldtemplate': true,
		'inputfield': true,
		'onInsert': function(evt, node: FormNode) {
			if (node.formElement && node.formElement.autocomplete) {
				var $input = $(node.el).find('input');
				if ($input.autocomplete) {
					$input.autocomplete(node.formElement.autocomplete);
				}
			}
			if (node.formElement && (node.formElement.tagsinput || node.formElement.getValue === 'tagsvalue')) {
				if (!$.fn.tagsinput)
					throw new Error('tagsinput is not found');
				var $input = $(node.el).find('input');
				var isArray = Array.isArray(node.value);
				if (isArray)
					$input.attr('value', '').val('');
				$input.tagsinput(node.formElement ? (node.formElement.tagsinput || {}) : {});
				if (isArray) {
					node.value.forEach(function(value) {
						$input.tagsinput('add', value);
					});
				}
			}
			if (node.formElement && node.formElement.typeahead) {
				var $input = $(node.el).find('input');
				if ($input.typeahead) {
					if (Array.isArray(node.formElement.typeahead)) {
						for (var i = 1; i < node.formElement.typeahead.length; ++i) {
							var dataset = node.formElement.typeahead[i];
							if (dataset.source && Array.isArray(dataset.source)) {
								var source = dataset.source;
								dataset.source = function(query, cb) {
									var lq = query.toLowerCase();
									cb(source.filter(function(v) {
										return v.toLowerCase().indexOf(lq) >= 0;
									}).map(function(v) {
										return (typeof v === 'string') ? { value: v } : v;
									}));
								}
							}
						}
						$.fn.typeahead.apply($input, node.formElement.typeahead);
					}
					else {
						$input.typeahead(node.formElement.typeahead);
					}
				}
			}
		}
	};
	if (extraOpts){
		templ = _.extend(templ, extraOpts);
    }
    
	return templ;
};

export default inputFieldTemplate;
