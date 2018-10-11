import _ from "lodash";
import $ from "jquery";

import {ISelectFieldsetRenderData} from "../lib/types/inputtypes";
import {FormNode} from "../lib/FormNode";
import * as util from "../lib/jsonform-util";
import {ITemplateMap} from "../lib/types/ITemplate";


var inputs: ITemplateMap = {
    'wysihtml5': {
		'template': '<textarea id="<%= id %>" name="<%= node.name %>" style="height:<%= elt.height || "300px" %>;width:<%= elt.width || "100%" %>;"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
		'<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		'<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
		'><%= value %></textarea>',
		'fieldtemplate': true,
		'inputfield': true,
		'onInsert': function(evt, node: FormNode) {
			var setup = function() {
				//protect from double init
				if ($(node.el).data("wysihtml5")) return;
				$(node.el).data("wysihtml5_loaded", true);

				$(node.el).find('#' + util.escapeSelector(node.id)).wysihtml5({
					"html": true,
					"link": true,
					"font-styles": true,
					"image": true,
					"events": {
						"load": function() {
							// In chrome, if an element is required and hidden, it leads to
							// the error 'An invalid form control with name='' is not focusable'
							// See http://stackoverflow.com/questions/7168645/invalid-form-control-only-in-google-chrome
							$(this.textareaElement).removeAttr('required');
						}
					}
				});
			};

			// Is there a setup hook?
			if (window.jsonform_wysihtml5_setup) {
				window.jsonform_wysihtml5_setup(setup);
				return;
			}

			// Wait until wysihtml5 is loaded
			var itv = window.setInterval(function() {
				if (window.wysihtml5) {
					window.clearInterval(itv);
					setup();
				}
			}, 1000);
		}
	},
	'tagsinput': {
		'template': '<select name="<%= node.name %><%= node.formElement.getValue === "tagsinput" ? "" : "[]" %>" id="<%= id %>"' +
		' class="<%= fieldHtmlClass || cls.textualInputClass %>" multiple' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		'> ' +
		'</select>',
		'fieldtemplate': true,
		'inputfield': true,
		'onInsert': function(evt, node: FormNode) {
			if (!$.fn.tagsinput)
				throw new Error('tagsinput is not found');
			var $input = $(node.el).find('select');
			$input.tagsinput(node.formElement ? (node.formElement.tagsinput || {}) : {});
			if (node.value) {
				node.value.forEach(function(value) {
					$input.tagsinput('add', value);
				});
			}
		}
	},
    'help': {
		'template': '<span <%= id ? \'id="\' + id + \'"\' : "" %> class="help-block" style="padding-top:5px"><%= node.helpvalue || elt.helpvalue %></span>',
		'fieldtemplate': true
	},
	'msg': {
		'template': '<%= elt.msg %>'
	},
	'textview': {
		'template': '<pre id="<%= id %>" name="<%= node.name %>"><%= value %></pre>',
		'inputfield': true,
		'fieldtemplate': true
	},
	'advancedfieldset': {
		'template': '<fieldset' +
		'<% if (id) { %> id="<%= id %>"<% } %>' +
		' class="expandable jsonform-node jsonform-error-<%= keydash %> <%= elt.htmlClass?elt.htmlClass:"" %>" data-jsonform-type="advancedfieldset">' +
		'<legend>Advanced options</legend>' +
		'<div hidden class="<%= cls.groupClass %>">' +
		'<%= children %>' +
		'</div>' +
		'<span class="help-block jsonform-errortext" style="display:none;"></span>' +
		'</fieldset>'
	},
	'authfieldset': {
		'template': '<fieldset' +
		'<% if (id) { %> id="<%= id %>"<% } %>' +
		' class="expandable jsonform-node jsonform-error-<%= keydash %> <%= elt.htmlClass?elt.htmlClass:"" %>" data-jsonform-type="authfieldset">' +
		'<legend>Authentication settings</legend>' +
		'<div hidden class="<%= cls.groupClass %>">' +
		'<%= children %>' +
		'</div>' +
		'<span class="help-block jsonform-errortext" style="display:none;"></span>' +
		'</fieldset>'
	},
	'selectfieldset': {
		'template': '<fieldset class="tab-container <%= elt.htmlClass?elt.htmlClass:"" %>">' +
		'<% if (node.legend) { %><legend><%= node.legend %></legend><% } %>' +
		'<% if (node.formElement.key) { %><input type="hidden" id="<%= node.id %>" name="<%= node.name %>" value="<%= escape(value) %>" /><% } else { %>' +
		'<a id="<%= node.id %>"></a><% } %>' +
		'<div class="tabbable">' +
		'<div class="<%= cls.groupClass %><%= node.formElement.hideMenu ? " hide" : "" %>">' +
		'<% if (node.title && !elt.notitle) { %><label class="<%= cls.labelClass %>" for="<%= node.id %>"><%= node.title %></label><% } %>' +
		'<div class="<%= cls.controlClass %>"><%= tabs %></div>' +
		'</div>' +
		'<div class="tab-content">' +
		'<%= children %>' +
		'</div>' +
		'</div>' +
		'</fieldset>',
		'inputfield': true,
		'getElement': function(el) {
			return $(el).parent().get(0);
		},
		'childTemplate': function(inner) {
			return '<div data-idx="<%= node.childPos %>" class="tab-pane' +
				'<% if (node.active) { %> active<% } %>">' +
				inner +
				'</div>';
		},
		'onBeforeRender': function(data: ISelectFieldsetRenderData, node: FormNode) {
			// Before rendering, this function ensures that:
			// 1. direct children have IDs (used to show/hide the tabs contents)
			// 2. the tab to active is flagged accordingly. The active tab is
			// the first one, except if form values are available, in which case
			// it's the first tab for which there is some value available (or back
			// to the first one if there are none)
			// 3. the HTML of the select field used to select tabs is exposed in the
			// HTML template data as "tabs"

			var children = null;
			var choices = [];
			if (node.schemaElement) {
				choices = node.schemaElement['enum'] || [];
			}
			if (node.options) {
				children = _.map(node.options, function(option, idx) {
					var child = node.children[idx];
					if (option instanceof Object) {
						option = _.extend({ node: child }, option);
						option.title = option.title ||
							child.legend ||
							child.title ||
							('Option ' + (child.childPos + 1));
						option.value = util.isSet(option.value) ? option.value :
							util.isSet(choices[idx]) ? choices[idx] : idx;
						return option;
					}
					else {
						return {
							title: option,
							value: util.isSet(choices[child.childPos]) ?
								choices[child.childPos] :
								child.childPos,
							node: child
						};
					}
				});
			}
			else {
				children = _.map(node.children, function(child, idx) {
					return {
						title: child.legend || child.title || ('Option ' + (child.childPos + 1)),
						value: choices[child.childPos] || child.childPos,
						node: child
					};
				});
			}

			var activeChild = null;
			if (data.value) {
				activeChild = _.find(children, function(child) {
					return (child.value === node.value);
				});
			}
			if (!activeChild) {
				activeChild = _.find(children, function(child) {
					return child.node.hasNonDefaultValue();
				});
			}
			if (!activeChild) {
				activeChild = children[0];
			}
			activeChild.node.active = true;
			data.value = activeChild.value;

			var elt = node.formElement;
			var tabs = '<select class="nav ' + (data.cls.textualInputClass) + '"' +
				(node.disabled ? ' disabled' : '') +
				'>';
			_.each(children, function(child, idx) {
				tabs += '<option data-idx="' + idx + '" value="' + child.value + '"' +
					(child.node.active ? ' class="active"' : '') +
					'>' +
					util.escapeHTML(child.title) +
					'</option>';
			});
			tabs += '</select>';

			data.tabs = tabs;
			return data;
		},
		'onInsert': function(evt, node: FormNode) {
			$(node.el).find('select.nav').first().on('change', function(evt) {
				var $option = $(this).find('option:selected');
				$(node.el).find('input[type="hidden"]').first().val($option.attr('value'));
			});
		}
	},
	'optionfieldset': {
		'template': '<div' +
		'<% if (node.id) { %> id="<%= node.id %>"<% } %>' +
		'>' +
		'<%= children %>' +
		'</div>'
	},
	'section': {
		'template': '<div' +
		'<% if (node.id) { %> id="<%= node.id %>"<% } %> class="jsonform-node jsonform-error-<%= keydash %> <%= elt.htmlClass?elt.htmlClass:"" %>"' +
		'><%= children %></div>'
	},

	/**
	 * A "questions" field renders a series of question fields and binds the
	 * result to the value of a schema key.
	 */
	'questions': {
		'template': '<div>' +
		'<input type="hidden" id="<%= node.id %>" name="<%= node.name %>" value="<%= escape(value) %>" />' +
		'<%= children %>' +
		'</div>',
		'fieldtemplate': true,
		'inputfield': true,
		'getElement': function(el) {
			return $(el).parent().get(0);
		},
		'onInsert': function(evt, node: FormNode) {
			if (!node.children || (node.children.length === 0)) return;
			_.each(node.children, function(child) {
				$(child.el).hide();
			});
			$(node.children[0].el).show();
		}
	},

	/**
	 * A "question" field lets user choose a response among possible choices.
	 * The field is not associated with any schema key. A question should be
	 * part of a "questions" field that binds a series of questions to a
	 * schema key.
	 */
	'question': {
		'template': '<div id="<%= node.id %>"><% _.each(node.options, function(key, val) { %>' +
		'<% if (elt.optionsType === "radiobuttons") { %><label class="<%= cls.buttonClass%> <%= ((key instanceof Object && key.htmlClass) ? " " + key.htmlClass : "") %>"><% } else { %>' +
		'<% if (!elt.inline) { %><div class="radio"><% } %>' +
		'<label class="<%= elt.inline ? "radio"+cls.inlineClassSuffix : "" %> <%= ((key instanceof Object && key.htmlClass) ? " " + key.htmlClass : "") %>">' +
		'<% } %><input type="radio" <% if (elt.optionsType === "radiobuttons") { %> style="position:absolute;left:-9999px;" <% } %>name="<%= node.id %>" value="<%= val %>"<%= (node.disabled? " disabled" : "")%>/><span><%= (key instanceof Object ? key.title : key) %></span></label><%= elt.optionsType !== "radiobuttons" && !elt.inline ? "</div>" : "" %> <% }); %></div>',
		'fieldtemplate': true,
		'onInsert': function(evt, node: FormNode) {
			var activeClass = 'active';
			var elt = node.getFormElement();
			if (elt.activeClass) {
				activeClass += ' ' + elt.activeClass;
			}

			// Bind to change events on radio buttons
			$(node.el).find('input[type="radio"]').on('change', function(evt) {
				var questionNode = null;
				var option = node.options[$(this).val()];
				if (!node.parentNode || !node.parentNode.el) return;

				$(node.el).find('label').removeClass(activeClass);
				$(this).parent().addClass(activeClass);
				$(node.el).nextAll().hide();
				$(node.el).nextAll().find('input[type="radio"]').prop('checked', false);

				// Execute possible actions (set key value, form submission, open link,
				// move on to next question)
				if (option.value) {
					// Set the key of the 'Questions' parent
					$(node.parentNode.el).find('input[type="hidden"]').val(option.value);
				}
				if (option.next) {
					questionNode = _.find(node.parentNode.children, function(child) {
						return (child.formElement && (child.formElement.qid === option.next));
					});
					$(questionNode.el).show();
					$(questionNode.el).nextAll().hide();
					$(questionNode.el).nextAll().find('input[type="radio"]').prop('checked', false);
				}
				if (option.href) {
					if (option.target) {
						window.open(option.href, option.target);
					}
					else {
						(<any>window).location = option.href;
					}
				}
				if (option.submit) {
					setTimeout(function() {
						node.ownerTree.submit();
					}, 0);
				}
			});
		}
	}
};

export default inputs;
