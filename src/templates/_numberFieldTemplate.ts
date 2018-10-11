import {FormNode} from "../lib/FormNode";

var numberFieldTemplate = function(type: string, isTextualInput = false) {
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

export default numberFieldTemplate;
