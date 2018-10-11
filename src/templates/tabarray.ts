import _ from "lodash";
import $ from "jquery";

import {ITabRenderData} from "../lib/types/inputtypes";
import {FormNode} from "../lib/FormNode";
import * as util from "../lib/jsonform-util";
import {ITemplateMap} from "../lib/types/ITemplate";


var inputs: ITemplateMap = {
    'tabarray': {
		'template': '<div id="<%= id %>"><div class="tabbable tabs-left">' +
		'<ul class="nav nav-tabs">' +
		'<%= tabs %>' +
		'</ul>' +
		'<div class="tab-content">' +
		'<%= children %>' +
		'</div>' +
		'</div>' +
		'</div>',
		'fieldtemplate': true,
		'array': true,
		'childTemplate': function(inner) {
			return '<div data-idx="<%= node.childPos %>" class="tab-pane">' +
				inner +
				'</div>';
		},
		'onBeforeRender': function(data: ITabRenderData, node: FormNode) {
			// Generate the initial 'tabs' from the children
			/*var tabs = '';
			_.each(node.children, function (child, idx) {
			  var title = child.legend ||
				child.title ||
				('Item ' + (idx+1));
			  tabs += '<li data-idx="' + idx + '"' +
				((idx === 0) ? ' class="active"' : '') +
				'><a class="draggable tab" data-toggle="tab">' + util.escapeHTML(title);
			  if (!node.isReadOnly()) {
				tabs += ' <span href="#" class="_jsonform-array-item-delete"><i class="' +
				node.ownerTree.defaultClasses.iconClassPrefix + '-remove" title="Remove item"></i></span>' +
				'</a>';
			  }
			  tabs +=  '</li>';
			});
			var boundaries = node.getArrayBoundaries();
			if (!node.isReadOnly() && (boundaries.maxItems < 0 || node.children.length < boundaries.maxItems)) {
			  tabs += '<li data-idx="-1" class="_jsonform-array-addmore"><a class="tab _jsonform-array-addmore" title="'+(node.formElement.addMoreTooltip ? util.escapeHTML(node.formElement.addMoreTooltip) : 'Add new item')+'"><i class="' +
			  node.ownerTree.defaultClasses.iconClassPrefix + '-plus-sign"></i> '+(node.formElement.addMoreTitle || 'New')+'</a></li>';
			}
			data.tabs = tabs;*/
			data.tabs = '';
		},
		'onInsert': function(evt, node: FormNode) {
			var $nodeid = $(node.el).find('#' + util.escapeSelector(node.id));
			var boundaries = node.getArrayBoundaries();

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
				var tabEl = $('> .tabbable > .tab-content', $nodeid).get(0);
				for (i = fromIdx; i !== toIdx; i += incr) {
					node.children[i].switchValuesWith(node.children[i + incr]);
					node.children[i].render(tabEl);
					node.children[i + incr].render(tabEl);
				}
			};


			// Refreshes the list of tabs
			var updateTabs = function(selIdx?: number) {
				var tabs = '';
				var activateFirstTab = false;
				if (selIdx === undefined) {
					selIdx = $('> .tabbable > .nav-tabs .active', $nodeid).data('idx');
					if (selIdx) {
						selIdx = parseInt(<any>selIdx, 10);
					}
					else {
						activateFirstTab = true;
						selIdx = 0;
					}
				}
				if (selIdx >= node.children.length) {
					selIdx = node.children.length - 1;
				}
				_.each(node.children, function(child, idx) {
					var title = child.legend ||
						child.title ||
						('Item ' + (idx + 1));
					tabs += '<li data-idx="' + idx + '">' +
						'<a class="draggable tab" data-toggle="tab">' + util.escapeHTML(title);
					if (!node.isReadOnly()) {
						tabs += ' <span href="#" class="_jsonform-array-item-delete"><i class="' +
							node.ownerTree.defaultClasses.iconClassPrefix + '-remove" title="Remove item"></i></span>' +
							'</a>';
					}
					tabs += '</li>';
				});
				if (!node.isReadOnly() && (boundaries.maxItems < 0 || node.children.length < boundaries.maxItems)) {
					tabs += '<li data-idx="-1"><a class="tab _jsonform-array-addmore" title="' + (node.formElement.addMoreTooltip ? util.escapeHTML(node.formElement.addMoreTooltip) : 'Add new item') + '"><i class="' +
						node.ownerTree.defaultClasses.iconClassPrefix + '-plus-sign"></i> ' + (node.formElement.addMoreTitle || 'New') + '</a></li>';
				}
				$('> .tabbable > .nav-tabs', $nodeid).html(tabs);
				var canDelete = boundaries.minItems >= 0 && node.children.length <= boundaries.minItems;
				$nodeid.find('> .tabbable > .nav-tabs > li > a > ._jsonform-array-item-delete').toggle(!canDelete);
				if (activateFirstTab) {
					$('> .tabbable > .nav-tabs [data-idx="0"]', $nodeid).addClass('active');
				}
				$('> .tabbable > .nav-tabs [data-toggle="tab"]', $nodeid).eq(selIdx).click();
			};

			var deleteItem = function(idx) {
				var itemNumCanDelete = node.children.length - Math.max(boundaries.minItems, 0);
				$nodeid.find('> a._jsonform-array-deleteitem')
					.toggleClass('disabled', itemNumCanDelete <= 1);
				$nodeid.find('> .tabbable > .nav-tabs > li > a > ._jsonform-array-item-delete').toggle(itemNumCanDelete > 1);
				if (itemNumCanDelete < 1) {
					return false;
				}

				node.deleteArrayItem(idx);
				updateTabs();

				$nodeid.find('> a._jsonform-array-addmore')
					.toggleClass('disabled', boundaries.maxItems >= 0 && node.children.length >= boundaries.maxItems);
			};
			var addItem = function(idx) {
				if (boundaries.maxItems >= 0) {
					var slotNum = boundaries.maxItems - node.children.length;
					$nodeid.find('> a._jsonform-array-addmore')
						.toggleClass('disabled', slotNum <= 1);
					if (slotNum < 1) {
						return false;
					}
				}

				node.insertArrayItem(idx,
					$nodeid.find('> .tabbable > .tab-content').get(0));
				updateTabs(idx);

				$nodeid.find('> a._jsonform-array-deleteitem')
					.toggleClass('disabled', node.children.length <= boundaries.minItems);
			}

			$('> a._jsonform-array-deleteitem', $nodeid).click(function(evt) {
				var idx = $('> .tabbable > .nav-tabs .active', $nodeid).data('idx');
				evt.preventDefault();
				evt.stopPropagation();
				deleteItem(idx);
			});

			//$('> a._jsonform-array-addmore, > .tabbable > .nav-tabs > li > ._jsonform-array-addmore', $nodeid).click(function (evt) {
			$nodeid.on('click', '> a._jsonform-array-addmore, > .tabbable > .nav-tabs > li > ._jsonform-array-addmore', function(evt) {
				var idx = node.children.length;
				evt.preventDefault();
				evt.stopPropagation();
				addItem(idx);
			});

			$nodeid.on('click', '> .tabbable > .nav-tabs > li > a > ._jsonform-array-item-delete', function(e) {
				e.preventDefault();
				e.stopPropagation();
				var idx = $(e.currentTarget).closest('li').data('idx');
				deleteItem(idx);
			});

			$(node.el).on('legendUpdated', function(evt) {
				updateTabs();
				evt.preventDefault();
				evt.stopPropagation();
			});

			if (!node.isReadOnly() && $(node.el).sortable) {
				$('> .tabbable > .nav-tabs', $nodeid).sortable({
					containment: node.el,
					cancel: '._jsonform-array-addmore',
					tolerance: 'pointer'
				}).on('sortchange', function(event, ui) {
					if (ui.placeholder.index() == $(this).children().length - 1 && ui.placeholder.prev().data('idx') == -1) {
						ui.placeholder.prev().before(ui.placeholder);
					}
				}).on('sortstop', function(event, ui) {
					var idx = $(ui.item).data('idx');
					var newIdx = $(ui.item).index();
					moveNodeTo(idx, newIdx);
					updateTabs(newIdx);
				});
			}

			// Simulate User's click to setup the form with its minItems
			if (boundaries.minItems >= 0) {
				for (var i = node.children.length; i < boundaries.minItems; i++) {
					addItem(node.children.length);
				}
				updateTabs(0);
			}
			else
				updateTabs();

			$nodeid.find('> a._jsonform-array-addmore')
				.toggleClass('disabled', boundaries.maxItems >= 0 && node.children.length >= boundaries.maxItems);
			var canDelete = boundaries.minItems >= 0 && node.children.length <= boundaries.minItems;
			$nodeid.find('> a._jsonform-array-deleteitem')
				.toggleClass('disabled', canDelete);
			$nodeid.find('> .tabbable > .nav-tabs > li > a > ._jsonform-array-item-delete').toggle(!canDelete);
		}
	},
};

export default inputs;
