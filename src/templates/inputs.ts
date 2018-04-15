import $ from 'jquery';
import _ from 'lodash';

import * as util from "../lib/jsonform-util";
import {FormNode} from "../lib/FormNode";
import {ITemplate} from "../lib/types/ITemplate";
import {IRenderData} from "../lib/types/IRenderData";
import {
    ICheckboxesRenderData,
    ISelectFieldsetRenderData,
    ITableObjectRenderData,
    ITabRenderData
} from "../lib/types/inputtypes";

import {
	inputFieldTemplate,
	numberFieldTemplate,
} from "./_base";


var elementTypes: {[type:string]: ITemplate} = {
	'none': {
		'template': ''
	},
	'root': {
		'template': '<div><%= children %></div>'
	},
	'text': inputFieldTemplate('text', true),
	'password': inputFieldTemplate('password', true),
	'date': inputFieldTemplate('date', true, {
		'onInsert': function(evt, node: FormNode) {
			if (window.Modernizr && window.Modernizr.inputtypes && !window.Modernizr.inputtypes.date) {
				var $input = $(node.el).find('input');
				if ($input.datepicker) {
					var opt = { dateFormat: "yy-mm-dd" };
					if (node.formElement && node.formElement.datepicker && typeof node.formElement.datepicker === 'object')
						_.extend(opt, node.formElement.datepicker);
					$input.datepicker(opt);
				}
			}
		}
	}),
	'datetime': inputFieldTemplate('datetime', true),
	'datetime-local': inputFieldTemplate('datetime-local', true, {
		'onBeforeRender': function(data, node: FormNode) {
			if (data.value && data.value.getTime) {
				data.value = new Date(data.value.getTime() - data.value.getTimezoneOffset() * 60000).toISOString().slice(0, -1);
			}
		}
	}),
	'email': inputFieldTemplate('email', true),
	'month': inputFieldTemplate('month', true),
	'number': numberFieldTemplate('number', true),
	'search': inputFieldTemplate('search', true),
	'tel': inputFieldTemplate('tel', true),
	'time': inputFieldTemplate('time', true),
	'url': inputFieldTemplate('url', true),
	'week': inputFieldTemplate('week', true),
	'range': numberFieldTemplate('range'),
	'color': {
		'template': '<input type="text" ' +
		'<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
		'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		' />',
		'fieldtemplate': true,
		'inputfield': true,
		'onInsert': function(evt, node: FormNode) {
			$(node.el).find('#' + util.escapeSelector(node.id)).spectrum({
				preferredFormat: "hex",
				showInput: true
			});
		}
	},
	'textarea': {
		'template': '<textarea id="<%= id %>" name="<%= node.name %>" ' +
		'class="<%= fieldHtmlClass || cls.textualInputClass %>" ' +
		'style="<%= elt.height ? "height:" + elt.height + ";" : "" %>width:<%= elt.width || "100%" %>;"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
		'<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		'<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
		'><%= value %></textarea>',
		'fieldtemplate': true,
		'inputfield': true
	},
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
	'ace': {
		'template': '<div id="<%= id %>" style="position:relative;height:<%= elt.height || "300px" %>;"><div id="<%= id %>__ace" style="width:<%= elt.width || "100%" %>;height:<%= elt.height || "300px" %>;"></div><input type="hidden" name="<%= node.name %>" id="<%= id %>__hidden" value="<%= escape(value) %>"/></div>',
		'fieldtemplate': true,
		'inputfield': true,
		'onBeforeRender': function(data: IRenderData, node: FormNode) {
			if (data.value && typeof data.value == 'object' || Array.isArray(data.value))
				data.value = JSON.stringify(data.value, null, 2);
		},
		'onInsert': function(evt, node: FormNode) {
			
			// 2016-08-14
			// TODO: See here on making editor resizable: http://jsbin.com/ojijeb/645/edit?html,css,js,output

			var setup = function () {
				var formElement = node.formElement || {};
				var ace = window.ace;
				var editor = ace.edit($(node.el).find('#' + util.escapeSelector(node.id) + '__ace').get(0));

				/**
				 * 2017-01-13
				 * Work around `worker-html.js` 404 - just set a no-op $startWorker function.
				 * https://github.com/angular-ui/ui-ace/issues/106
				 * 
				 * Doesn't seem to affect editing functionality...
				 */
				editor.getSession().$startWorker = function(){};
				
				// Turn off message about scrolling being removed in future.
				editor.$blockScrolling = Number.POSITIVE_INFINITY;
				
				var idSelector = '#' + util.escapeSelector(node.id) + '__hidden';
				// Force editor to use "\n" for new lines, not to bump into ACE "\r" conversion issue
				// (ACE is ok with "\r" on pasting but fails to return "\r" when value is extracted)
				editor.getSession().setNewLineMode('unix');
				editor.renderer.setShowPrintMargin(false);
				editor.setTheme("ace/theme/"+(formElement.aceTheme || "twilight"));
				editor.setFontSize(14);

				if (formElement.aceMode) {
					editor.getSession().setMode("ace/mode/"+formElement.aceMode);
				}
				if (formElement.aceOptions){
					editor.setOptions(formElement.aceOptions);
				}
				editor.getSession().setTabSize(2);

				// Set the contents of the initial manifest file
				editor.getSession().setValue(node.value||"");

				
				/**
				 * Make editor resizeable
				 */
				initResizable(node.el, editor);
				

				//TODO this is clearly sub-optimal
				// 'Lazily' bind to the onchange 'ace' event to give
				// priority to user edits
				var lazyChanged = _.debounce(function () {
					$(node.el).find(idSelector).val(editor.getSession().getValue());
					$(node.el).find(idSelector).change();
				}, 600);
				editor.getSession().on('change', lazyChanged);

				editor.on('blur', function() {
					$(node.el).find(idSelector).change();
					$(node.el).find(idSelector).trigger("blur");
				});
				editor.on('focus', function() {
					$(node.el).find(idSelector).trigger("focus");
				});
			};
			
			
			function initResizable(el, editor){
				if ($.fn.resizable){
					var $r = $(el).find('.resizable');
					$r.resizable({
						// Allow v-resizing.
						handles: 's',
						resize: function(event, ui){
							editor.resize();
						},
						create: function(event){
							// Double-click on edge to resize to full height of content.
							$(event.target).find('.ui-resizable-s').on('dblclick', function(){
								var newHeight = editor.renderer.scrollBarV.scrollHeight + 30;
								$r.height(newHeight);
								
								editor.resize();
							});
						}
					});
				}
			}

			// Is there a setup hook?
			if (window.jsonform_ace_setup) {
				window.jsonform_ace_setup(setup);
				return;
			}

			if (window.ace){
				// Setup immediately
				setup();
			} else {
				// Wait until ACE is loaded
				var itv = window.setInterval(function() {
					if (window.ace) {
						window.clearInterval(itv);
						setup();
					}
				},1000);
			}
		}
	},
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
	'select': {
		'template': '<select name="<%= node.name %>" id="<%= id %>"' +
		' class="<%= fieldHtmlClass || cls.textualInputClass %>"' +
		'<%= (node.disabled? " disabled" : "")%>' +
		'<%= (node.required ? " required=\'required\'" : "") %>' +
		'> ' +
		'<% _.each(node.options, function(key, val) { if(key instanceof Object) { if (value === key.value) { %> <option selected value="<%= key.value %>"><%= key.title %></option> <% } else { %> <option value="<%= key.value %>"><%= key.title %></option> <% }} else { if (value === key) { %> <option selected value="<%= key %>"><%= key %></option> <% } else { %><option value="<%= key %>"><%= key %></option> <% }}}); %> ' +
		'</select>',
		'fieldtemplate': true,
		'inputfield': true
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
	'radiobuttons': {
		'template': '<div id="<%= node.id %>" ' + ' class="<%= elt.htmlClass ? " " + elt.htmlClass : "" %>">' +
		'<% _.each(node.options, function(key, val) { %>' +
		'<label class="<%= cls.buttonClass %>">' +
		'<input type="radio" style="position:absolute;left:-9999px;" ' +
		'<% if (((key instanceof Object) && (value === key.value)) || (value === key)) { %> checked="checked" <% } %> name="<%= node.name %>" value="<%= (key instanceof Object ? key.value : key) %>" />' +
		'<span><%= (key instanceof Object ? key.title : key) %></span></label> ' +
		'<% }); %>' +
		'</div>',
		'fieldtemplate': true,
		'inputfield': true,
		'onInsert': function(evt, node: FormNode) {
			var activeClass = 'active';
			var elt = node.getFormElement();
			if (elt.activeClass) {
				activeClass += ' ' + elt.activeClass;
			}
			$(node.el).find('label').on('click', function() {
				$(this).parent().find('label').removeClass(activeClass);
				$(this).addClass(activeClass);
			}).find(':checked').closest('label').addClass(activeClass);
		}
	},
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
					if (!_.include(choiceValues, val)) {
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
					checked: _.include(node.value, choice.value),
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
	'checkboxbuttons': {
		'template': '<div id="<%= node.id %>"><%= choiceshtml %></div>',
		'fieldtemplate': true,
		'inputfield': true,
		'onBeforeRender': function(data: ICheckboxesRenderData, node: FormNode) {
			// Build up choices from the enumeration list
			var choices = null;
			var choiceshtml = null;
			var template = '<label class="<%= cls.buttonClass %> ' + data.fieldHtmlClass + '">' +
				'<input type="checkbox" style="position:absolute;left:-9999px;" <% if (checked) { %> checked="checked" <% } %> name="<%= name %>" value="<%= value %>"' +
				'<%= (node.disabled? " disabled" : "")%>' +
				'/><span><%= title %></span></label>';
			if (!node || !node.schemaElement || !node.schemaElement.items) return;
			choices = node.formElement.options;
			if (!choices) return;
			if (!node.value || !Array.isArray(node.value))
				node.value = [];
			choiceshtml = '';
			_.each(choices, function(choice, idx) {
				choiceshtml += util._template(template, {
					name: node.key + '[' + idx + ']',
					checked: _.include(node.value, choice.value),
					value: choice.value,
					title: choice.title,
					node: node,
					cls: data.cls
				}, util.fieldTemplateSettings);
			});

			data.choiceshtml = choiceshtml;
		},
		'onInsert': function(evt, node) {
			var activeClass = 'active';
			var elt = node.getFormElement();
			if (elt.activeClass) {
				activeClass += ' ' + elt.activeClass;
			}
			$(node.el).find('label').on('click', function() {
				$(this).toggleClass(activeClass, $(this).find('input:checkbox').prop('checked'));
			}).find(':checked').closest('label').addClass(activeClass);
		}
	},
	
	'tablearray': {
		'template': '<div id="<%= id %>">' +
		'<table class="_jsonform-tablearray table <%= elt.htmlClass?elt.htmlClass:"" %>">' +
		'<thead></thead>' +
		'<%= children %>' +
		'</table>' +
		'<span class="_jsonform-array-buttons">' +
		'<a href="#" class="btn _jsonform-array-addmore"><i class="icon-plus-sign" title="Add new"></i></a> ' +
		'<a href="#" class="btn _jsonform-array-deletelast"><i class="icon-minus-sign" title="Delete last"></i></a>' +
		'</span>' +
		'</div>',
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
	'tableobject': {
		// A sub-child of tablearray.
		// Need to know if we should render the header.
		// 'template': '<tbody><tr><td>table object</td></tr></tbody>',
		'template': '<tbody id="<%= id %>"><%= children %></tbody>',
		'fieldtemplate': false,
		'childSelector': '> tbody',
		'onBeforeRender': function(data: ITableObjectRenderData, node: FormNode) {
			// Check the index here -> output that in the 
			//console.log('tableobject: data=', data, '\nnode=', node);

			// Create a map of children and their types.
			// Simple children just go in a <td> but complex types might need their own <tr>.
			//data.
			data.childMap = {
				simple: [], // a single row holds everything, wrap each item in a <td></td>
				complex: [] // a single row for every item, wrap each item in a <tr><td colspan="x"></td></tr>
			};

			// TODO: Handle multiple <tr> elements for nested tables.
			// TODO: Need to count the number of 'simple' elements that will form the rows.
			if (data.schema && data.schema.properties) {
				var simpleCount = 0;
				_.each(data.schema.properties, function(dataType) {
					if (dataType.type != 'array') {
						simpleCount++;
					}
				});
				data.columnCount = simpleCount;
			}
		},
		'childTemplate': function(inner, data: IRenderData, node: FormNode, parentData: IRenderData, parentNode: FormNode) {
			//'<td></td>'
			// TODO: How do we know how many children we have?

			// // Check the child's type.
			// if (parentData.childMap && node.schemaElement){
			//   if (node.schemaElement.type == 'array'){
			//     // Complex type.
			//     // TODO: Need to know the colspan.
			//     parentData.childMap.complex.push('<tr>', '<td colspan="'+parentData.columnCount+'">', inner, '</td>', '</tr>');
			//   } else {
			//     // simple type
			//     parentData.childMap.simple.push('<td>'+inner+'</td>');
			//   }
			// }

			// return inner;
			return '<td>' + inner + '</td>';
		},
		onAfterRender: function(data, node) {


			// if (data.childMap){
			//   var childMap = data.childMap;
			//   // NOTE: At some point we need to wrap the simple elements in a row.
			//   // Squash the child data down to a string and then set as `node.children`.
			//   if (childMap.simple.length){
			//     childMap.simple.unshift('<tr>');
			//     childMap.simple.push('</tr>');
			//   }

			//   data.children = childMap.simple.join('') + childMap.complex.join('');
			// }
		}
	},
	
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
			}
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
	'help': {
		'template': '<span <%= id ? \'id="\' + id + \'"\' : "" %> class="help-block" style="padding-top:5px"><%= node.helpvalue || elt.helpvalue %></span>',
		'fieldtemplate': true
	},
	'msg': {
		'template': '<%= elt.msg %>'
	},
	'html': {
		'template': '<%= elt.html %>'
	},
	'textview': {
		'template': '<pre id="<%= id %>" name="<%= node.name %>"><%= value %></pre>',
		'inputfield': true,
		'fieldtemplate': true
	},
	'fieldset': {
		'template': '<fieldset class="jsonform-node jsonform-error-<%= keydash %> <% if (elt.expandable) { %>expandable<% } %> <%= elt.htmlClass?elt.htmlClass:"" %>" ' +
		'<% if (id) { %> id="<%= id %>"<% } %>' +
		' data-jsonform-type="fieldset">' +
		'<% if (node.title || node.legend) { %><legend><%= node.title || node.legend %></legend><% } %>' +
		'<% if (elt.expandable) { %><div hidden class="<%= cls.groupClass %>"><% } %>' +
		'<%= children %>' +
		'<% if (elt.expandable) { %></div><% } %>' +
		'<span class="help-block jsonform-errortext" style="display:none;"></span>' +
		'</fieldset>'
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
	'submit': {
		'template': '<input type="submit" <% if (id) { %> id="<%= id %>" <% } %> class="btn btn-primary <%= elt.htmlClass?elt.htmlClass:"" %>" value="<%= value || node.title %>"<%= (node.disabled? " disabled" : "")%>/>'
	},
	'button': {
		'template': ' <button <% if (id) { %> id="<%= id %>" <% } %> class="<%= cls.buttonClass %> <%= elt.htmlClass?elt.htmlClass:"" %>"><%= node.title %></button> '
	},
	'actions': {
		'template': '<div class="form-actions <%= elt.htmlClass?elt.htmlClass:"" %>"><%= children %></div>'
	},
	'hidden': {
		'template': '<input type="hidden" id="<%= id %>" name="<%= node.name %>" value="<%= escape(value) %>" <%= (node.disabled? " disabled" : "")%> />',
		'inputfield': true
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
export default elementTypes;

