import _ from "lodash";
import $ from "jquery";

import {IRenderData} from "../lib/types/IRenderData";
import {FormNode} from "../lib/FormNode";
import {ICheckboxesRenderData} from "../lib/types/inputtypes";
import * as util from "../lib/jsonform-util";
import {ITemplateMap} from "../lib/types/ITemplate";


var inputs: ITemplateMap = {
    'checkboxes': {
		'template': '<div id="<%= node.id %>"><%= choiceshtml %><%= children %></div>',
		'fieldtemplate': true,
		'inputfield': true,
		'childTemplate': function(inner, data:IRenderData, node: FormNode) {
			// non-inline style, we do not wrap it.
			if (!node.formElement.otherField)
				return inner;
			var template = '';
			if (node.formElement.otherField.asArrayValue) {
				// XXX: for the novalue mode, the checkbox has no value, value is in the input field
				if (node.otherValues) {
					template += '<% value = node.parentNode.otherValues.join(", ") %>';
				}
			}
			template += '<input type="checkbox"<%= value !== undefined && value !== null && value !== "" ? " checked=\'checked\'" : "" %>';
			if (!node.formElement.otherField.asArrayValue && node.formElement.otherField.novalue !== true || node.formElement.otherField.novalue === false) {
				template += ' name="' + node.key + '[' + (node.formElement.otherField.idx !== undefined ? node.formElement.otherField.idx : node.formElement.options.length) + ']" value="' + (node.formElement.optionsAsEnumOrder ? 1 : (node.formElement.otherField.otherValue || 'OTHER')) + '"';
			}
			template += '<%= node.disabled? " disabled" : "" %> />';
			template += '<span><%= node.title || "Other" %> </span>';
			var otherFieldClass = 'other-field';
			if (node.formElement.otherField.inline) {
				// put the other field just after the checkbox, wrapped in the label tag
				template += '<div class="other-field-content">' + inner + '</div>';
				otherFieldClass = 'inline-' + otherFieldClass;
			}
			if (node.formElement.inline) {
				template = '<label class="' + otherFieldClass + ' checkbox<%= cls.inlineClassSuffix %>">' + template + '</label>';
			}
			else {
				template = '<div class="' + otherFieldClass + ' checkbox"><label>' + template + '</label></div>';
			}
			if (!node.formElement.otherField.inline) {
				// put the other field just after the checkbox's label/div
				template += '<div class="other-field-content">' + inner + '</div>';
			}
			return template;
		},
		'onBeforeRender': function(data: ICheckboxesRenderData, node: FormNode) {
			// Build up choices from the enumeration/options list
			if (!node || !node.schemaElement || !node.schemaElement.items) return;
			var choices = node.formElement.options;
			if (!choices) return;

			var template = '<input type="checkbox"<%= checked ? " checked=\'checked\'" : "" %> name="<%= name %>" value="<%= escape(value) %>"<%= node.disabled? " disabled" : "" %> /><span><%= title %></span>';
			if (node.formElement.inline) {
				template = '<label class="checkbox' + data.cls.inlineClassSuffix + '">' + template + '</label>';
			}
			else {
				template = '<div class="checkbox"><label>' + template + '</label></div>';
			}

			var choiceshtml = '';
			if (node.formElement.otherField && node.formElement.otherField.asArrayValue && node.value) {
				var choiceValues = choices.map(function(choice) { return choice.value; });
				// we detect values which are not within our choice values.
				var otherValues = [];
				node.value.forEach(function(val) {
					if (!_.includes(choiceValues, val)) {
						otherValues.push(val);
					}
				});
				if (otherValues.length > 0)
					node.otherValues = otherValues;
			}
			else {
				delete node.otherValues;
			}
			_.each(choices, function(choice, idx) {
				if (node.formElement.otherField && choice.value === (node.formElement.otherField.otherValue || 'OTHER')) {
					node.formElement.otherField.idx = idx;
					return;
				}

				choiceshtml += util._template(template, {
					name: node.key + '[' + idx + ']',
					value: node.formElement.optionsAsEnumOrder ? 1 : choice.value,
					checked: _.includes(node.value, choice.value),
					title: choice.title,
					node: node,
					escape: util.escapeHTML
				}, util.fieldTemplateSettings);
			});

			// the otherField could be?
			// 1. key, then use the key as inputField? wrap or not? type?
			// 2. {key: theKey, inline: boolean} type?
			// 2.1 about the type, can it be text type? if so, it will use the title, the template
			//     etc. it's good, but we do not want the title, then use notitle?
			// 3. {nokey, items: [custom elementes]} type?
			if (node.formElement.otherField) {
				// XXX: other field rendered as child, with its own template? e.g. text input
				// Then what about the "Other" checkbox? there are options:
				// 1. "Other" checkbox was rendered already by the options, then the otherField
				//    will following last checkbox div or label (inline), and we need code to
				//    connect between the checkbox and the input.
				// 2. "Other" checkbox render with the textField together? embed the text field
				//    into the "Other" checkbox's label, but HOW?
				// 2.1 with childTemplate, the child text input field can be wrappered, but what
				//     should be for the checkbox's name, value, disabled, title, checked?
				// 2.1.1 title, checked, disabled == text field title, non-blank, disabled
				//       value can be non-value or some special value
				// 2.2 should the value be collected? and how?
				//     it's better it can be collected as a member of the array, maybe special value
				//     how the checkbox array got result value?
				// 2.2.1 if as_value collect, as it follow the name style here node.key[idx]
				//       its value can be collected.
				//       if as_value===true get value from enum then if it's previous rendered
				//       as the last item of enum, then it can get its value too.
			}

			data.choiceshtml = choiceshtml;
		},
		'onInsert': function(evt, node: FormNode) {
			// FIXME: consider default values?
			function inputHasAnyValue(inputs) {
				var anyValue = false;
				inputs.each(function() {
					var $input = $(this);
					if ($input.is(':checkbox, :radio')) {
						if ($input.prop('checked')) {
							anyValue = true;
							return false;
						}
					}
					if ($input.is('button'))
						return;
					if ($(this).val() !== '') {
						anyValue = true;
						return false;
					}
				});
				return anyValue;
			}
			var $checkbox = node.formElement.otherField && node.formElement.otherField.inline ? $(node.el).find('.inline-other-field :checkbox').first() : $(node.el).find('.other-field :checkbox');
			var $inputs = $(node.el).find('.other-field-content :input');

			function otherFieldValueChange() {
				$checkbox.prop('checked', inputHasAnyValue($inputs));
			}
			$inputs.on('keyup', otherFieldValueChange).on('change', otherFieldValueChange).change();

			$checkbox.on('change', function() {
				if (this.checked) {
					this.checked = false;
					$inputs.not(':checkbox,:radio,button').focus();
				} else {
					// FIXME: reset back to default?
					$inputs.filter('input[type=text], textarea').val('');
				}
			});
		}
	},
};

export default inputs;
