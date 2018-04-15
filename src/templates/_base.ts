import $ from 'jquery';
import _ from 'lodash';

import {FormNode} from "../lib/FormNode";

// Twitter bootstrap-friendly HTML boilerplate for standard inputs
export function fieldTemplate(inner: string) {
	
	return '<div class="<%= cls.groupClass %> jsonform-node jsonform-error-<%= keydash %> <%= node.formElement.type?"_jsonform-"+node.formElement.type:"" %>' +
		'<%= elt.htmlClass ? " " + elt.htmlClass : "" %>' +
		'<%= (node.required && node.formElement && (node.formElement.type !== "checkbox") ? " jsonform-required" : "") %>' +
		'<%= (node.isReadOnly() ? " jsonform-readonly" : "") %>' +
		'<%= (node.disabled ? " jsonform-disabled" : "") %>' +
		'" data-jsonform-type="<%= node.formElement.type %>">' +
		'<% if (node.title && !elt.notitle && elt.inlinetitle !== true) { %>' +
		'<label class="<%= cls.labelClass %>" for="<%= node.id %>"><%= node.title %></label>' +
		'<% } %>' +
		'<div class="<%= cls.controlClass %>">' +
		'<% if (node.description) { %>' +
		'<span class="help-block jsonform-description"><%= node.description %></span>' +
		'<% } %>' +
		'<% if (node.prepend || node.append) { %>' +
		'<div class="<%= node.prepend ? cls.prependClass : "" %> ' +
		'<%= node.append ? cls.appendClass : "" %>">' +
		'<% if (node.prepend && node.prepend.indexOf("<button ") >= 0) { %>' +
		'<% if (cls.buttonAddonClass) { %>' +
		'<span class="<%= cls.buttonAddonClass %>"><%= node.prepend %></span>' +
		'<% } else { %>' +
		'<%= node.prepend %>' +
		'<% } %>' +
		'<% } %>' +
		'<% if (node.prepend && node.prepend.indexOf("<button ") < 0) { %>' +
		'<span class="<%= cls.addonClass %>"><%= node.prepend %></span>' +
		'<% } %>' +
		'<% } %>' +
		inner +
		'<% if (node.append && node.append.indexOf("<button ") >= 0) { %>' +
		'<% if (cls.buttonAddonClass) { %>' +
		'<span class="<%= cls.buttonAddonClass %>"><%= node.append %></span>' +
		'<% } else { %>' +
		'<%= node.append %>' +
		'<% } %>' +
		'<% } %>' +
		'<% if (node.append && node.append.indexOf("<button ") < 0) { %>' +
		'<span class="<%= cls.addonClass %>"><%= node.append %></span>' +
		'<% } %>' +
		'<% if (node.prepend || node.append) { %>' +
		'</div>' +
		'<% } %>' +
		'<span class="help-block jsonform-errortext" style="display:none;"></span>' +
		'</div></div>';
};

export var fileDisplayTemplate = '<div class="_jsonform-preview">' +
	'<% if (value.type=="image") { %>' +
	'<img class="jsonform-preview" id="jsonformpreview-<%= id %>" src="<%= value.url %>" />' +
	'<% } else { %>' +
	'<a href="<%= value.url %>"><%= value.name %></a> (<%= Math.ceil(value.size/1024) %>kB)' +
	'<% } %>' +
	'</div>' +
	'<a href="#" class="<%= cls.buttonClass %> _jsonform-delete"><i class="<%= cls.iconClassPrefix %>-remove" title="Remove"></i></a> ';

export var inputFieldTemplate = function(type: string, isTextualInput: boolean, extraOpts?: any) {
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
	}
	if (extraOpts)
		templ = _.extend(templ, extraOpts);
	return templ;
};

export var numberFieldTemplate = function(type: string, isTextualInput = false) {
	return {
		'template': '<input type="' + type + '" ' +
		'class="<%= fieldHtmlClass' + (isTextualInput ? ' || cls.textualInputClass' : '') + ' %>" ' +
		'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
		'<%= (range.min !== undefined ? " min="+range.min : "")%>' +
		'<%= (range.max !== undefined ? " max="+range.max : "")%>' +
		'<%= (range.step !== undefined ? " step="+range.step : "")%>' +
		'<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		'<%= (node.placeholder? "placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
		' />',
		'fieldtemplate': true,
		'inputfield': true,
		'onBeforeRender': function(data/*: IRenderData*/, node: FormNode) {
			data.range = {
				step: 1
			};
			if (type == 'range') {
				data.range.min = 1;
				data.range.max = 100;
			}
			if (!node || !node.schemaElement) return;
			if (node.formElement && node.formElement.step) {
				data.range.step = node.formElement.step;
			}
			else if (node.schemaElement.type == 'number') {
				data.range.step = 'any';
			}
			var step = data.range.step === 'any' ? 1 : data.range.step;
			if (typeof node.schemaElement.minimum !== 'undefined') {
				if (node.schemaElement.exclusiveMinimum) {
					data.range.min = node.schemaElement.minimum + step;
				}
				else {
					data.range.min = node.schemaElement.minimum;
				}
			}
			if (typeof node.schemaElement.maximum !== 'undefined') {
				if (node.schemaElement.exclusiveMaximum) {
					data.range.max = node.schemaElement.maximum - step;
				}
				else {
					data.range.max = node.schemaElement.maximum;
				}
			}
		}
	};
};
