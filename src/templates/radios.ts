import {FormNode} from "../lib/FormNode";
import $ from "jquery";
import {ITemplateMap} from "../lib/types/ITemplate";


var inputs: ITemplateMap = {
    'radios': {
		'template': '<div id="<%= node.id %>"><% _.each(node.options, function(key, val) { %>' +
		'<% if (!elt.inline) { %><div class="radio"><label><% } else { %>' +
		'<label class="radio<%= cls.inlineClassSuffix %>"><% } %>' +
		'<input type="radio" <% if (((key instanceof Object) && (value === key.value)) || (value === key)) { %> checked="checked" <% } %> name="<%= node.name %>" value="<%= (key instanceof Object ? key.value : key) %>"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		'/><span><%= (key instanceof Object ? key.title : key) %></span></label><%= elt.inline ? "" : "</div>" %> <% }); %></div>',
		'fieldtemplate': true,
		'inputfield': true,
		'onInsert': function(evt, node: FormNode) {
			if (node.formElement.toggleNextMap) {
				var valueMapToNext = {};
				for (var value in node.formElement.toggleNextMap) {
					var toggleNext = node.formElement.toggleNextMap[value];
					var nextN = toggleNext === true ? 1 : toggleNext;
					var toggleNextClass = 'jsonform-toggle-next jsonform-toggle-next-' + nextN;
					var $next = nextN === 1 ? $(node.el).next() : (nextN === 'all' ? $(node.el).nextAll() : $(node.el).nextAll().slice(0, nextN));
					$next.addClass('jsonform-toggle-next-target');
					valueMapToNext[value] = $next;
				}
				$(node.el).addClass(toggleNextClass).find(':radio').on('change', function() {
					var $this = $(this);
					var val = $this.val();
					var checked = $this.is(':checked');
					if (checked) {
						for (var v in valueMapToNext) {
							var $n = valueMapToNext[v];
							if (v === val)
								$n.toggle(checked).toggleClass('jsonform-toggled-visible', checked);
							else
								$n.toggle(!checked).toggleClass('jsonform-toggled-visible', !checked);
						}
					}
					else {
						// no option checked yet
						for (var v in valueMapToNext) {
							var $n = valueMapToNext[v];
							$n.toggle(false).toggleClass('jsonform-toggled-visible', false);
						}
					}
				}).change();
			}
		}
	},
};

export default inputs;
