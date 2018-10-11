import $ from "jquery";

import {FormNode} from "../lib/FormNode";
import {ITemplateMap} from "../lib/types/ITemplate";


var inputs: ITemplateMap = {
    'checkbox': {
		'template': '<div class="checkbox"><label><input type="checkbox" id="<%= id %>" ' +
		'name="<%= node.name %>" value="1" <% if (value) {%>checked<% } %>' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.required && node.schemaElement && (node.schemaElement.type !== "boolean") ? " required=\'required\'" : "") %>' +
		' /><span><%= (node.inlinetitle === true ? node.title : node.inlinetitle) || "" %></span>' +
		'</label></div>',
		'fieldtemplate': true,
		'inputfield': true,
		'onInsert': function(evt, node: FormNode) {
			if (node.formElement.toggleNext) {
				var nextN = node.formElement.toggleNext === true ? 1 : node.formElement.toggleNext;
				var toggleNextClass = 'jsonform-toggle-next jsonform-toggle-next-' + nextN;
				var $next = nextN === 1 ? $(node.el).next() : (nextN === 'all' ? $(node.el).nextAll() : $(node.el).nextAll().slice(0, nextN));
				$next.addClass('jsonform-toggle-next-target');
				$(node.el).addClass(toggleNextClass).find(':checkbox').on('change', function() {
					var $this = $(this);
					var checked = $this.is(':checked');
					$(node.el).toggleClass('checked', checked);
					$next.toggle(checked).toggleClass('jsonform-toggled-visible', checked);
				}).change();
			}
		},
		'getElement': function(el) {
			return $(el).parent().parent().get(0);
		}
	},
};

export default inputs;
