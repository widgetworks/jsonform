import {ITemplateMap} from "../lib/types/ITemplate";

var inputs: ITemplateMap = {
    'json':{
		'template':'<textarea id="<%= id %>" name="<%= node.name %>" ' +
			'style="height:<%= elt.height || "150px" %>;width:<%= elt.width || "100%" %>;"' +
			'<%= (node.disabled? " disabled" : "")%>' +
			'<%= (node.readOnly ? " readonly=\'readonly\'" : "") %>' +
			'<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
			'<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
			'<%= (node.placeholder? "placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
			'><%= JSON.stringify(value, null, 2) %></textarea>',
		'fieldtemplate': true,
		'inputfield': true
	},
};

export default inputs;
