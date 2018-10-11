import _ from "lodash";
import $ from "jquery";

import {IRenderData} from "../lib/types/IRenderData";
import {FormNode} from "../lib/FormNode";
import * as util from "../lib/jsonform-util";
import {ITemplateMap} from "../lib/types/ITemplate";


var inputs: ITemplateMap = {
    'ace': {
		'template': `
<div id="<%= id %>" style="position:relative;height:<%= elt.height || "300px" %>;">
	<div id="<%= id %>__ace" style="width:<%= elt.width || "100%" %>;height:<%= elt.height || "300px" %>;"></div>
	<input type="hidden" name="<%= node.name %>" id="<%= id %>__hidden" value="<%= escape(value) %>"/>
</div>
`,
		
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
};

export default inputs;
