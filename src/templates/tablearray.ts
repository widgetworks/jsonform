import * as util from "../lib/jsonform-util";
import _ from "lodash";
import $ from "jquery";
import {ITemplateMap} from "../lib/types/ITemplate";

var inputs: ITemplateMap = {
    'tablearray': {
        'template': `

<div id="<%= id %>">
	<table class="_jsonform-tablearray table <%= elt.htmlClass ? elt.htmlClass : "" %>">
		<thead></thead>
		<%= children %>
	</table>
	<span class="_jsonform-array-buttons">
		<a href="#" class="btn _jsonform-array-addmore"> <i class="icon-plus-sign" title="Add new"></i> </a> 
		<a href="#" class="btn _jsonform-array-deletelast"><i class="icon-minus-sign" title="Delete last"></i></a>
	</span>
</div>
`,
		
		'array': true,
		'fieldtemplate': true,
		// 'childTemplate': function(inner){
		//   // Wrap everything in a <tbody></tbody>??
		//   return;
		// },
		'onBeforeRender': function(data, node) {
			// Can we change the parent/child data types?
			// Set the view on the children?
			var append = " _jsonform-tablearray";
			data.elt.htmlClass = data.elt.htmlClass ? data.elt.htmlClass += append : append;

		},
		'onInsert': function(evt, node) {
			var $nodeid = $(node.el).find('#' + util.escapeSelector(node.id));
			var boundaries = node.getArrayBoundaries();

			// TODO: Render the heading row.
			// TODO: Take a count of the number of children so we know how many columns there are.
			// How do we handle nested arrays?
			// If any items have a sub-array then do all of the children need to be in a full table?
			if (node.children && node.children.length) {
				var headerNode = node.children[0];
				var header = $nodeid.find('> table > thead');
				var headerRow = [];

				// Iterate over each of the children and render out the header.
				_.each(headerNode.children, function(formNode) {
					// Assign a unique path-based id for this table heading
					let headerId = formNode.formElement.id;
					
					// Everything should have a title.
					headerRow.push(`<th id="${headerId}">`);
					headerRow.push(formNode.title);
					headerRow.push('</th>');
				});

				// Wrap with a row and render.
				if (headerRow.length) {
					headerRow.unshift('<tr>');
					headerRow.push('</tr>');
					header.append(headerRow.join(''));
				}
			}

			// // Switch two nodes in an array
			// var moveNodeTo = function (fromIdx, toIdx) {
			//   // Note "switchValuesWith" extracts values from the DOM since field
			//   // values are not synchronized with the tree data structure, so calls
			//   // to render are needed at each step to force values down to the DOM
			//   // before next move.
			//   // TODO: synchronize field values and data structure completely and
			//   // call render only once to improve efficiency.
			//   if (fromIdx === toIdx) return;
			//   var incr = (fromIdx < toIdx) ? 1: -1;
			//   var i = 0;
			//   var parentEl = $('> ul', $nodeid);
			//   for (i = fromIdx; i !== toIdx; i += incr) {
			//     node.children[i].switchValuesWith(node.children[i + incr]);
			//     node.children[i].render(parentEl.get(0));
			//     node.children[i + incr].render(parentEl.get(0));
			//   }

			//   // No simple way to prevent DOM reordering with jQuery UI Sortable,
			//   // so we're going to need to move sorted DOM elements back to their
			//   // origin position in the DOM ourselves (we switched values but not
			//   // DOM elements)
			//   var fromEl = $(node.children[fromIdx].el);
			//   var toEl = $(node.children[toIdx].el);
			//   fromEl.detach();
			//   toEl.detach();
			//   if (fromIdx < toIdx) {
			//     if (fromIdx === 0) parentEl.prepend(fromEl);
			//     else $(node.children[fromIdx-1].el).after(fromEl);
			//     $(node.children[toIdx-1].el).after(toEl);
			//   }
			//   else {
			//     if (toIdx === 0) parentEl.prepend(toEl);
			//     else $(node.children[toIdx-1].el).after(toEl);
			//     $(node.children[fromIdx-1].el).after(fromEl);
			//   }
			// };

			// TODO: Allow deleting arbitrary rows.
			var addButton = $nodeid.find('> span > a._jsonform-array-addmore');
			var deleteButton = $nodeid.find('> span > a._jsonform-array-deletelast');

			var addItem = function(idx) {
				if (boundaries.maxItems >= 0) {
					if (node.children.length > boundaries.maxItems - 2) {
						addButton.addClass('disabled');
					}
					if (node.children.length > boundaries.maxItems - 1) {
						return false;
					}
				}
				// node.insertArrayItem(idx, $('> ul', $nodeid).get(0));
				node.insertArrayItem(idx, $('> table', $nodeid).get(0));
				if ((boundaries.minItems <= 0) ||
					((boundaries.minItems > 0) &&
						(node.children.length > boundaries.minItems - 1))) {
					deleteButton.removeClass('disabled');
				}
			}

			var deleteItem = function(idx) {
				if (boundaries.minItems > 0) {
					if (node.children.length < boundaries.minItems + 2) {
						deleteButton.addClass('disabled');
					}
					if (node.children.length <= boundaries.minItems) {
						return false;
					}
				}
				else if (node.children.length === 1) {
					deleteButton.addClass('disabled');
				}
				node.deleteArrayItem(idx);
				if ((boundaries.maxItems >= 0) && (idx <= boundaries.maxItems - 1)) {
					addButton.removeClass('disabled');
				}
			}

			addButton.click(function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				var idx = node.children.length;
				addItem(idx);
			});

			//Simulate Users click to setup the form with its minItems
			// var curItems = $('> ul > li', $nodeid).length;
			var tableSelector = '> table';
			var bodySelector = '> table > tbody';

			var curItems = $(bodySelector, $nodeid).length;
			if ((boundaries.minItems > 0) &&
				(curItems < boundaries.minItems)) {
				for (var i = 0; i < (boundaries.minItems - 1) && ($nodeid.find(bodySelector).length < boundaries.minItems); i++) {
					//console.log('Calling click: ',$nodeid);
					//$('> span > a._jsonform-array-addmore', $nodeid).click();
					// node.insertArrayItem(curItems, $nodeid.find('> ul').get(0));
					node.insertArrayItem(curItems, $nodeid.find('> table').get(0));
				}
			}
			if ((boundaries.minItems > 0) &&
				(node.children.length <= boundaries.minItems)) {
				deleteButton.addClass('disabled');
			}

			deleteButton.click(function(evt) {
				var idx = node.children.length - 1;
				evt.preventDefault();
				evt.stopPropagation();
				deleteItem(idx);
			});

			// Allows deleting any index in the array.
			$nodeid.on('click', '._jsonform-array-item-delete', function(e) {
				e.preventDefault();
				e.stopPropagation();
				var idx = $(e.currentTarget).parent().data('idx');
				deleteItem(idx);
			});

			// if ($(node.el).sortable) {
			//   $('> ul', $nodeid).sortable();
			//   $('> ul', $nodeid).bind('sortstop', function (event, ui) {
			//     var idx = $(ui.item).data('idx');
			//     var newIdx = $(ui.item).index();
			//     moveNodeTo(idx, newIdx);
			//   });
			// }
		}
	},
};

export default inputs;

