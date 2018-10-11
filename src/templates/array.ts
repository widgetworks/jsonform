import $ from "jquery";

import {IRenderData} from "../lib/types/IRenderData";
import {FormNode} from "../lib/FormNode";
import * as util from "../lib/jsonform-util";
import {ITemplateMap} from "../lib/types/ITemplate";


var inputs: ITemplateMap = {
    'array': {
		'template': '<div id="<%= id %>"><ul class="_jsonform-array-ul" style="list-style-type:none;"><%= children %></ul>' +
		'<% if (!node.isReadOnly()) { %><span class="_jsonform-array-buttons">' +
		'<a href="#" class="<%= cls.buttonClass %> _jsonform-array-addmore"><i class="<%= cls.iconClassPrefix %>-plus-sign" title="Add new"></i></a> ' +
		'<a href="#" class="<%= cls.buttonClass %> _jsonform-array-deletelast"><i class="<%= cls.iconClassPrefix %>-minus-sign" title="Delete last"></i></a>' +
		'</span><% } %>' +
		'</div>',
		'fieldtemplate': true,
		'array': true,
		'childTemplate': function(inner: string, data: IRenderData, node: FormNode) {
			if (!node.isReadOnly() && $('').sortable) {
				// Insert a "draggable" icon
				// floating to the left of the main element
				return '<li data-idx="<%= node.childPos %>">' +
					'<span class="draggable line"><i class="<%= cls.iconClassPrefix %>-list" title="Move item"></i></span>' +
					' <a href="#" class="_jsonform-array-item-delete"><i class="<%= cls.iconClassPrefix %>-remove" title="Remove item"></i></a>' +
					inner +
					'</li>';
			}
			else {
				return '<li data-idx="<%= node.childPos %>">' +
					inner +
					'</li>';
			}
		},
		'onInsert': function(evt, node: FormNode) {
			var $nodeid = $(node.el).find('#' + util.escapeSelector(node.id));
			var boundaries = node.getArrayBoundaries();

			// Switch two nodes in an array
			var moveNodeTo = function(fromIdx, toIdx) {
				// Note "switchValuesWith" extracts values from the DOM since field
				// values are not synchronized with the tree data structure, so calls
				// to render are needed at each step to force values down to the DOM
				// before next move.
				// TODO: synchronize field values and data structure completely and
				// call render only once to improve efficiency.
				if (fromIdx === toIdx) return;
				var incr = (fromIdx < toIdx) ? 1 : -1;
				var i = 0;
				var parentEl = $('> ul', $nodeid);
				for (i = fromIdx; i !== toIdx; i += incr) {
					node.children[i].switchValuesWith(node.children[i + incr]);
					node.children[i].render(parentEl.get(0));
					node.children[i + incr].render(parentEl.get(0));
				}

				// No simple way to prevent DOM reordering with jQuery UI Sortable,
				// so we're going to need to move sorted DOM elements back to their
				// origin position in the DOM ourselves (we switched values but not
				// DOM elements)
				var fromEl = $(node.children[fromIdx].el);
				var toEl = $(node.children[toIdx].el);
				fromEl.detach();
				toEl.detach();
				if (fromIdx < toIdx) {
					if (fromIdx === 0) parentEl.prepend(fromEl);
					else $(node.children[fromIdx - 1].el).after(fromEl);
					$(node.children[toIdx - 1].el).after(toEl);
				}
				else {
					if (toIdx === 0) parentEl.prepend(toEl);
					else $(node.children[toIdx - 1].el).after(toEl);
					$(node.children[fromIdx - 1].el).after(fromEl);
				}
			};

			var addItem = function(idx) {
				if (boundaries.maxItems >= 0) {
					var slotNum = boundaries.maxItems - node.children.length;
					$nodeid.find('> span > a._jsonform-array-addmore')
						.toggleClass('disabled', slotNum <= 1);
					if (slotNum < 1) {
						return false;
					}
				}

				node.insertArrayItem(idx, $('> ul', $nodeid).get(0));

				var canDelete = node.children.length > boundaries.minItems;
				$nodeid.find('> span > a._jsonform-array-deletelast')
					.toggleClass('disabled', !canDelete);
				$nodeid.find('> ul > li > a._jsonform-array-item-delete').toggle(canDelete);
			}

			var deleteItem = function(idx) {
				var itemNumCanDelete = node.children.length - Math.max(boundaries.minItems, 0);
				$nodeid.find('> span > a._jsonform-array-deletelast')
					.toggleClass('disabled', itemNumCanDelete <= 1);
				$nodeid.find('> ul > li > a._jsonform-array-item-delete').toggle(itemNumCanDelete > 1);
				if (itemNumCanDelete < 1) {
					return false;
				}

				node.deleteArrayItem(idx);

				$nodeid.find('> span > a._jsonform-array-addmore')
					.toggleClass('disabled', boundaries.maxItems >= 0 && node.children.length >= boundaries.maxItems);
			}

			$('> span > a._jsonform-array-addmore', $nodeid).click(function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				var idx = node.children.length;
				addItem(idx);
			});

			//Simulate Users click to setup the form with its minItems
			var curItems = $('> ul > li', $nodeid).length;
			if (boundaries.minItems > 0) {
				for (var i = node.children.length; i < boundaries.minItems; i++) {
					//console.log('Calling click: ',$nodeid);
					//$('> span > a._jsonform-array-addmore', $nodeid).click();
					node.insertArrayItem(node.children.length, $nodeid.find('> ul').get(0));
				}
			}
			var itemNumCanDelete = node.children.length - Math.max(boundaries.minItems, 0);
			$nodeid.find('> span > a._jsonform-array-deletelast')
				.toggleClass('disabled', itemNumCanDelete <= 0);
			$nodeid.find('> ul > li > a._jsonform-array-item-delete').toggle(itemNumCanDelete > 0);
			$nodeid.find('> span > a._jsonform-array-addmore')
				.toggleClass('disabled', boundaries.maxItems >= 0 && node.children.length >= boundaries.maxItems);

			$('> span > a._jsonform-array-deletelast', $nodeid).click(function(evt) {
				var idx = node.children.length - 1;
				evt.preventDefault();
				evt.stopPropagation();
				deleteItem(idx);
			});

			$nodeid.on('click', '> ul > li > a._jsonform-array-item-delete', function(e) {
				e.preventDefault();
				var $li = $(e.currentTarget).parent();
				if ($li.parent().parent().attr('id') != node.id) return;
				e.stopPropagation();
				var idx = $li.data('idx');
				deleteItem(idx);
			});

			if (!node.isReadOnly() && $(node.el).sortable) {
				$('> ul', $nodeid).sortable();
				$('> ul', $nodeid).on('sortstop', function(event, ui) {
					var idx = $(ui.item).data('idx');
					var newIdx = $(ui.item).index();
					moveNodeTo(idx, newIdx);
				});
			}
		}
	},
};

export default inputs;
