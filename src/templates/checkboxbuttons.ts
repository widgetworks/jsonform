import _ from "lodash";
import $ from "jquery";

import {ICheckboxesRenderData} from "../lib/types/inputtypes";
import {FormNode} from "../lib/FormNode";
import * as util from "../lib/jsonform-util";
import {ITemplateMap} from "../lib/types/ITemplate";

var inputs: ITemplateMap = {
    'checkboxbuttons': {
		'template': '<div id="<%= node.id %>"><%= choiceshtml %></div>',
		'fieldtemplate': true,
		'inputfield': true,
		'onBeforeRender': function(data: ICheckboxesRenderData, node: FormNode) {
			// Build up choices from the enumeration list
			var choices = null;
			var choiceshtml = null;
			var template = '<label class="<%= cls.buttonClass %> ' + data.fieldHtmlClass + '">' +
				'<input type="checkbox" style="position:absolute;left:-9999px;" <% if (checked) { %> checked="checked" <% } %> name="<%= name %>" value="<%= value %>"' +
				'<%= (node.disabled? " disabled" : "")%>' +
				'/><span><%= title %></span></label>';
			if (!node || !node.schemaElement || !node.schemaElement.items) return;
			choices = node.formElement.options;
			if (!choices) return;
			if (!node.value || !Array.isArray(node.value))
				node.value = [];
			choiceshtml = '';
			_.each(choices, function(choice, idx) {
				choiceshtml += util._template(template, {
					name: node.key + '[' + idx + ']',
					checked: _.includes(node.value, choice.value),
					value: choice.value,
					title: choice.title,
					node: node,
					cls: data.cls
				}, util.fieldTemplateSettings);
			});

			data.choiceshtml = choiceshtml;
		},
		'onInsert': function(evt, node) {
			var activeClass = 'active';
			var elt = node.getFormElement();
			if (elt.activeClass) {
				activeClass += ' ' + elt.activeClass;
			}
			$(node.el).find('label').on('click', function() {
				$(this).toggleClass(activeClass, $(this).find('input:checkbox').prop('checked'));
			}).find(':checked').closest('label').addClass(activeClass);
		}
	},
};

export default inputs;
