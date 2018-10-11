import $ from 'jquery';
import _ from 'lodash';

import * as util from "../lib/jsonform-util";
import {FormNode} from "../lib/FormNode";
import {ITemplateMap} from "../lib/types/ITemplate";

import inputFieldTemplate from './_inputFieldTemplate';
import numberFieldTemplate from "./_numberFieldTemplate";


var inputs: ITemplateMap = {
	'none': {
		'template': ''
	},
	'root': {
		'template': '<div><%= children %></div>'
	},
	'text': inputFieldTemplate('text', true),
	'password': inputFieldTemplate('password', true),
	'date': inputFieldTemplate('date', true, {
		'onInsert': function(evt, node: FormNode) {
			if (window.Modernizr && window.Modernizr.inputtypes && !window.Modernizr.inputtypes.date) {
				var $input = $(node.el).find('input');
				if ($input.datepicker) {
					var opt = { dateFormat: "yy-mm-dd" };
					if (node.formElement && node.formElement.datepicker && typeof node.formElement.datepicker === 'object')
						_.extend(opt, node.formElement.datepicker);
					$input.datepicker(opt);
				}
			}
		}
	}),
	'datetime': inputFieldTemplate('datetime', true),
	'datetime-local': inputFieldTemplate('datetime-local', true, {
		'onBeforeRender': function(data, node: FormNode) {
			if (data.value && data.value.getTime) {
				data.value = new Date(data.value.getTime() - data.value.getTimezoneOffset() * 60000).toISOString().slice(0, -1);
			}
		}
	}),
	'email': inputFieldTemplate('email', true),
	'month': inputFieldTemplate('month', true),
	'number': numberFieldTemplate('number', true),
	'search': inputFieldTemplate('search', true),
	'tel': inputFieldTemplate('tel', true),
	'time': inputFieldTemplate('time', true),
	'url': inputFieldTemplate('url', true),
	'week': inputFieldTemplate('week', true),
	'range': numberFieldTemplate('range'),
	'color': {
		'template': '<input type="text" ' +
		'<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
		'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		' />',
		'fieldtemplate': true,
		'inputfield': true,
		'onInsert': function(evt, node: FormNode) {
			$(node.el).find('#' + util.escapeSelector(node.id)).spectrum({
				preferredFormat: "hex",
				showInput: true
			});
		}
	},
	'textarea': {
		'template': '<textarea id="<%= id %>" name="<%= node.name %>" ' +
		'class="<%= fieldHtmlClass || cls.textualInputClass %>" ' +
		'style="<%= elt.height ? "height:" + elt.height + ";" : "" %>width:<%= elt.width || "100%" %>;"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
		'<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		'<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
		'><%= value %></textarea>',
		'fieldtemplate': true,
		'inputfield': true
	},
	'select': {
		'template': '<select name="<%= node.name %>" id="<%= id %>"' +
		' class="<%= fieldHtmlClass || cls.textualInputClass %>"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		'> ' +
		'<% _.each(node.options, function(key, val) { if(key instanceof Object) { if (value === key.value) { %> <option selected value="<%= key.value %>"><%= key.title %></option> <% } else { %> <option value="<%= key.value %>"><%= key.title %></option> <% }} else { if (value === key) { %> <option selected value="<%= key %>"><%= key %></option> <% } else { %><option value="<%= key %>"><%= key %></option> <% }}}); %> ' +
		'</select>',
		'fieldtemplate': true,
		'inputfield': true
	},
	'html': {
		'template': '<%= elt.html %>'
	},
	'fieldset': {
		'template': '<fieldset class="jsonform-node jsonform-error-<%= keydash %> <% if (elt.expandable) { %>expandable<% } %> <%= elt.htmlClass?elt.htmlClass:"" %>" ' +
		'<% if (id) { %> id="<%= id %>"<% } %>' +
		' data-jsonform-type="fieldset">' +
		'<% if (node.title || node.legend) { %><legend><%= node.title || node.legend %></legend><% } %>' +
		'<% if (elt.expandable) { %><div hidden class="<%= cls.groupClass %>"><% } %>' +
		'<%= children %>' +
		'<% if (elt.expandable) { %></div><% } %>' +
		'<span class="help-block jsonform-errortext" style="display:none;"></span>' +
		'</fieldset>'
	},
	'submit': {
		'template': '<input type="submit" <% if (id) { %> id="<%= id %>" <% } %> class="btn btn-primary <%= elt.htmlClass?elt.htmlClass:"" %>" value="<%= value || node.title %>"<%= (node.disabled? " disabled" : "")%>/>'
	},
	'button': {
		'template': ' <button <% if (id) { %> id="<%= id %>" <% } %> class="<%= cls.buttonClass %> <%= elt.htmlClass?elt.htmlClass:"" %>"><%= node.title %></button> '
	},
	'actions': {
		'template': '<div class="form-actions <%= elt.htmlClass?elt.htmlClass:"" %>"><%= children %></div>'
	},
	'hidden': {
		'template': '<input type="hidden" id="<%= id %>" name="<%= node.name %>" value="<%= escape(value) %>" <%= (node.disabled? " disabled" : "")%> />',
		'inputfield': true
	},
};
export default inputs;

