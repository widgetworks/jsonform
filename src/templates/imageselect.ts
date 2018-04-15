import $ from 'jquery';
import _ from 'lodash';

import * as util from "../lib/jsonform-util";
import {FormNode} from "../lib/FormNode";
import {ITemplate} from "../lib/types/ITemplate";
import {IRenderData} from "../lib/types/IRenderData";
import {IIconSelectRenderData, IImageSelectRenderData} from "../lib/types/inputtypes";


var elementTypes: {[type:string]: ITemplate} = {
    'imageselect': {
		'template': '<div>' +
		'<input type="hidden" name="<%= node.name %>" id="<%= node.id %>" value="<%= value %>" />' +
		'<div class="dropdown">' +
		'<a class="<%= node.value ? buttonClass : cls.buttonClass %>" data-toggle="dropdown" href="#"<% if (node.value) { %> style="max-width:<%= width %>px;max-height:<%= height %>px"<% } %>>' +
		'<% if (node.value) { %><img src="<% if (!node.value.match(/^https?:/)) { %><%= prefix %><% } %><%= node.value %><%= suffix %>" alt="" /><% } else { %><%= buttonTitle %><% } %>' +
		'</a>' +
		'<div class="dropdown-menu navbar" id="<%= node.id %>_dropdown">' +
		'<div>' +
		'<% _.each(node.options, function(key, idx) { if ((idx > 0) && ((idx % columns) === 0)) { %></div><div><% } %><a class="<%= buttonClass %>" style="max-width:<%= width %>px;max-height:<%= height %>px"><% if (key instanceof Object) { %><img src="<% if (!key.value.match(/^https?:/)) { %><%= prefix %><% } %><%= key.value %><%= suffix %>" alt="<%= key.title %>" /></a><% } else { %><img src="<% if (!key.match(/^https?:/)) { %><%= prefix %><% } %><%= key %><%= suffix %>" alt="" /><% } %></a> <% }); %>' +
		'</div>' +
		'<div class="pagination-right"><a class="<%= cls.buttonClass %>">Reset</a></div>' +
		'</div>' +
		'</div>' +
		'</div>',
		'fieldtemplate': true,
		'inputfield': true,
		'onBeforeRender': function(data: IImageSelectRenderData, node: FormNode) {
			var elt = node.getFormElement();
			var nbRows = null;
			var maxColumns = elt.imageSelectorColumns || 5;
			data.buttonTitle = elt.imageSelectorTitle || 'Select...';
			data.prefix = elt.imagePrefix || '';
			data.suffix = elt.imageSuffix || '';
			data.width = elt.imageWidth || 32;
			data.height = elt.imageHeight || 32;
			data.buttonClass = elt.imageButtonClass || data.cls.buttonClass;
			if (node.options.length > maxColumns) {
				nbRows = Math.ceil(node.options.length / maxColumns);
				data.columns = Math.ceil(node.options.length / nbRows);
			}
			else {
				data.columns = maxColumns;
			}
		},
		'getElement': function(el) {
			return $(el).parent().get(0);
		},
		'onInsert': function(evt, node: FormNode) {
			$(node.el).on('click', '.dropdown-menu a', function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				var img = (evt.target.nodeName.toLowerCase() === 'img') ?
					$(evt.target) :
					$(evt.target).find('img');
				var value = img.attr('src');
				var elt = node.getFormElement();
				var prefix = elt.imagePrefix || '';
				var suffix = elt.imageSuffix || '';
				var width = elt.imageWidth || 32;
				var height = elt.imageHeight || 32;
				if (value) {
					if (value.indexOf(prefix) === 0) {
						value = value.substring(prefix.length);
					}
					value = value.substring(0, value.length - suffix.length);
					$(node.el).find('input').attr('value', value);
					$(node.el).find('a[data-toggle="dropdown"]')
						.addClass(elt.imageButtonClass)
						.attr('style', 'max-width:' + width + 'px;max-height:' + height + 'px')
						.html('<img src="' + (!value.match(/^https?:/) ? prefix : '') + value + suffix + '" alt="" />');
				}
				else {
					$(node.el).find('input').attr('value', '');
					$(node.el).find('a[data-toggle="dropdown"]')
						.removeClass(elt.imageButtonClass)
						.removeAttr('style')
						.html(elt.imageSelectorTitle || 'Select...');
				}
			});
		}
	},
	'iconselect': {
		'template': '<div>' +
		'<input type="hidden" name="<%= node.name %>" id="<%= node.id %>" value="<%= value %>" />' +
		'<div class="dropdown">' +
		'<a class="<%= node.value ? buttonClass : cls.buttonClass %>" data-toggle="dropdown" href="#"<% if (node.value) { %> style="max-width:<%= width %>px;max-height:<%= height %>px"<% } %>>' +
		'<% if (node.value) { %><i class="<%= cls.iconClassPrefix %>-<%= node.value %>" /><% } else { %><%= buttonTitle %><% } %>' +
		'</a>' +
		'<div class="dropdown-menu navbar" id="<%= node.id %>_dropdown">' +
		'<div>' +
		'<% _.each(node.options, function(key, idx) { if ((idx > 0) && ((idx % columns) === 0)) { %></div><div><% } %><a class="<%= buttonClass %>" ><% if (key instanceof Object) { %><i class="<%= cls.iconClassPrefix %>-<%= key.value %>" alt="<%= key.title %>" /></a><% } else { %><i class="<%= cls.iconClassPrefix %>-<%= key %>" alt="" /><% } %></a> <% }); %>' +
		'</div>' +
		'<div class="pagination-right"><a class="<%= cls.buttonClass %>">Reset</a></div>' +
		'</div>' +
		'</div>' +
		'</div>',
		'fieldtemplate': true,
		'inputfield': true,
		'onBeforeRender': function(data: IIconSelectRenderData, node: FormNode) {
			var elt = node.getFormElement();
			var nbRows = null;
			var maxColumns = elt.imageSelectorColumns || 5;
			data.buttonTitle = elt.imageSelectorTitle || 'Select...';
			data.buttonClass = elt.imageButtonClass || data.cls.buttonClass;
			if (node.options.length > maxColumns) {
				nbRows = Math.ceil(node.options.length / maxColumns);
				data.columns = Math.ceil(node.options.length / nbRows);
			}
			else {
				data.columns = maxColumns;
			}
		},
		'getElement': function(el) {
			return $(el).parent().get(0);
		},
		'onInsert': function(evt, node: FormNode) {
			$(node.el).on('click', '.dropdown-menu a', function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				var i = (evt.target.nodeName.toLowerCase() === 'i') ?
					$(evt.target) :
					$(evt.target).find('i');
				var value = i.attr('class');
				var elt = node.getFormElement();
				if (value) {
					value = value;
					$(node.el).find('input').attr('value', value);
					$(node.el).find('a[data-toggle="dropdown"]')
						.addClass(elt.imageButtonClass)
						.html('<i class="' + value + '" alt="" />');
				}
				else {
					$(node.el).find('input').attr('value', '');
					$(node.el).find('a[data-toggle="dropdown"]')
						.removeClass(elt.imageButtonClass)
						.html(elt.imageSelectorTitle || 'Select...');
				}
			});
		}
	},
};
export default elementTypes;
