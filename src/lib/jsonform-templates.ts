namespace jsonform {
    
    var global = util.global;
    var $ = util.$;
    var _ = util._;
	
	// Twitter bootstrap-friendly HTML boilerplate for standard inputs
	export function fieldTemplate(inner: string) {
		
		return '<div class="<%= cls.groupClass %> jsonform-node jsonform-error-<%= keydash %> <%= node.formElement.type?"_jsonform-"+node.formElement.type:"" %>' +
			'<%= elt.htmlClass ? " " + elt.htmlClass : "" %>' +
			'<%= (node.required && node.formElement && (node.formElement.type !== "checkbox") ? " jsonform-required" : "") %>' +
			'<%= (node.isReadOnly() ? " jsonform-readonly" : "") %>' +
			'<%= (node.disabled ? " jsonform-disabled" : "") %>' +
			'" data-jsonform-type="<%= node.formElement.type %>">' +
			'<% if (node.title && !elt.notitle && elt.inlinetitle !== true) { %>' +
			'<label class="<%= cls.labelClass %>" for="<%= node.id %>"><%= node.title %></label>' +
			'<% } %>' +
			'<div class="<%= cls.controlClass %>">' +
			'<% if (node.description) { %>' +
			'<span class="help-block jsonform-description"><%= node.description %></span>' +
			'<% } %>' +
			'<% if (node.prepend || node.append) { %>' +
			'<div class="<%= node.prepend ? cls.prependClass : "" %> ' +
			'<%= node.append ? cls.appendClass : "" %>">' +
			'<% if (node.prepend && node.prepend.indexOf("<button ") >= 0) { %>' +
			'<% if (cls.buttonAddonClass) { %>' +
            '<span class="<%= cls.buttonAddonClass %>"><%= node.prepend %></span>' +
			'<% } else { %>' +
            '<%= node.prepend %>' +
			'<% } %>' +
			'<% } %>' +
			'<% if (node.prepend && node.prepend.indexOf("<button ") < 0) { %>' +
			'<span class="<%= cls.addonClass %>"><%= node.prepend %></span>' +
			'<% } %>' +
			'<% } %>' +
			inner +
			'<% if (node.append && node.append.indexOf("<button ") >= 0) { %>' +
			'<% if (cls.buttonAddonClass) { %>' +
			'<span class="<%= cls.buttonAddonClass %>"><%= node.append %></span>' +
			'<% } else { %>' +
			'<%= node.append %>' +
			'<% } %>' +
			'<% } %>' +
			'<% if (node.append && node.append.indexOf("<button ") < 0) { %>' +
			'<span class="<%= cls.addonClass %>"><%= node.append %></span>' +
			'<% } %>' +
			'<% if (node.prepend || node.append) { %>' +
			'</div>' +
			'<% } %>' +
			'<span class="help-block jsonform-errortext" style="display:none;"></span>' +
			'</div></div>';
	};

	export var fileDisplayTemplate = '<div class="_jsonform-preview">' +
		'<% if (value.type=="image") { %>' +
		'<img class="jsonform-preview" id="jsonformpreview-<%= id %>" src="<%= value.url %>" />' +
		'<% } else { %>' +
		'<a href="<%= value.url %>"><%= value.name %></a> (<%= Math.ceil(value.size/1024) %>kB)' +
		'<% } %>' +
		'</div>' +
		'<a href="#" class="<%= cls.buttonClass %> _jsonform-delete"><i class="<%= cls.iconClassPrefix %>-remove" title="Remove"></i></a> ';

	export var inputFieldTemplate = function(type: string, isTextualInput: boolean, extraOpts?: any) {
		var templ = {
			'template': '<input type="' + type + '" ' +
			'class="<%= fieldHtmlClass' + (isTextualInput ? ' || cls.textualInputClass' : '') + ' %>" ' +
			'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
			'<%= (node.disabled? " disabled" : "")%>' +
			'<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
			'<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
			'<%= (node.required ? " required=\'required\'" : "") %>' +
			'<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
			' />',
			'fieldtemplate': true,
			'inputfield': true,
			'onInsert': function(evt, node: FormNode) {
				if (node.formElement && node.formElement.autocomplete) {
					var $input = $(node.el).find('input');
					if ($input.autocomplete) {
						$input.autocomplete(node.formElement.autocomplete);
					}
				}
				if (node.formElement && (node.formElement.tagsinput || node.formElement.getValue === 'tagsvalue')) {
					if (!$.fn.tagsinput)
						throw new Error('tagsinput is not found');
					var $input = $(node.el).find('input');
					var isArray = Array.isArray(node.value);
					if (isArray)
						$input.attr('value', '').val('');
					$input.tagsinput(node.formElement ? (node.formElement.tagsinput || {}) : {});
					if (isArray) {
						node.value.forEach(function(value) {
							$input.tagsinput('add', value);
						});
					}
				}
				if (node.formElement && node.formElement.typeahead) {
					var $input = $(node.el).find('input');
					if ($input.typeahead) {
						if (Array.isArray(node.formElement.typeahead)) {
							for (var i = 1; i < node.formElement.typeahead.length; ++i) {
								var dataset = node.formElement.typeahead[i];
								if (dataset.source && Array.isArray(dataset.source)) {
									var source = dataset.source;
									dataset.source = function(query, cb) {
										var lq = query.toLowerCase();
										cb(source.filter(function(v) {
											return v.toLowerCase().indexOf(lq) >= 0;
										}).map(function(v) {
											return (typeof v === 'string') ? { value: v } : v;
										}));
									}
								}
							}
							$.fn.typeahead.apply($input, node.formElement.typeahead);
						}
						else {
							$input.typeahead(node.formElement.typeahead);
						}
					}
				}
			}
		}
		if (extraOpts)
			templ = _.extend(templ, extraOpts);
		return templ;
	};

	export var numberFieldTemplate = function(type: string, isTextualInput = false) {
		return {
			'template': '<input type="' + type + '" ' +
			'class="<%= fieldHtmlClass' + (isTextualInput ? ' || cls.textualInputClass' : '') + ' %>" ' +
			'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
			'<%= (node.disabled? " disabled" : "")%>' +
			'<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
			'<%= (range.min !== undefined ? " min="+range.min : "")%>' +
			'<%= (range.max !== undefined ? " max="+range.max : "")%>' +
			'<%= (range.step !== undefined ? " step="+range.step : "")%>' +
			'<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
			'<%= (node.required ? " required=\'required\'" : "") %>' +
			'<%= (node.placeholder? "placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
			' />',
			'fieldtemplate': true,
			'inputfield': true,
			'onBeforeRender': function(data/*: IRenderData*/, node: FormNode) {
				data.range = {
					step: 1
				};
				if (type == 'range') {
					data.range.min = 1;
					data.range.max = 100;
				}
				if (!node || !node.schemaElement) return;
				if (node.formElement && node.formElement.step) {
					data.range.step = node.formElement.step;
				}
				else if (node.schemaElement.type == 'number') {
					data.range.step = 'any';
				}
				var step = data.range.step === 'any' ? 1 : data.range.step;
				if (typeof node.schemaElement.minimum !== 'undefined') {
					if (node.schemaElement.exclusiveMinimum) {
						data.range.min = node.schemaElement.minimum + step;
					}
					else {
						data.range.min = node.schemaElement.minimum;
					}
				}
				if (typeof node.schemaElement.maximum !== 'undefined') {
					if (node.schemaElement.exclusiveMaximum) {
						data.range.max = node.schemaElement.maximum - step;
					}
					else {
						data.range.max = node.schemaElement.maximum;
					}
				}
			}
		};
	}

	export var elementTypes = {
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
				var setup = function() {
					var formElement = node.getFormElement();
					var ace = window.ace;
					var editor = ace.edit($(node.el).find('#' + util.escapeSelector(node.id) + '__ace').get(0));
					var idSelector = '#' + util.escapeSelector(node.id) + '__hidden';
					// Force editor to use "\n" for new lines, not to bump into ACE "\r" conversion issue
					// (ACE is ok with "\r" on pasting but fails to return "\r" when value is extracted)
					editor.getSession().setNewLineMode('unix');
					editor.renderer.setShowPrintMargin(false);
					editor.setTheme("ace/theme/" + (formElement.aceTheme || "twilight"));

					if (formElement.aceMode) {
						editor.getSession().setMode("ace/mode/" + formElement.aceMode);
					}
					editor.getSession().setTabSize(2);

					// Set the contents of the initial manifest file
					var valueStr = node.value;
					if (valueStr === null || valueStr === undefined)
						valueStr = '';
					else if (typeof valueStr == 'object' || Array.isArray(valueStr))
						valueStr = JSON.stringify(valueStr, null, 2);
					editor.getSession().setValue(valueStr);

					//TODO this is clearly sub-optimal
					// 'Lazily' bind to the onchange 'ace' event to give
					// priority to user edits
					var lazyChanged = _.debounce(function() {
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

				// Is there a setup hook?
				if (window.jsonform_ace_setup) {
					window.jsonform_ace_setup(setup);
					return;
				}

				// Wait until ACE is loaded
				var itv = window.setInterval(function() {
					if (window.ace) {
						window.clearInterval(itv);
						setup();
					}
				}, 1000);
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
		'file': {
			'template': '<input class="input-file" id="<%= id %>" name="<%= node.name %>" type="file" ' +
			'<%= (node.required ? " required=\'required\'" : "") %>' +
			'/>',
			'fieldtemplate': true,
			'inputfield': true
		},
		'file-hosted-public': {
			'template': '<span><% if (value && (value.type||value.url)) { %>' + fileDisplayTemplate + '<% } %><input class="input-file" id="_transloadit_<%= id %>" type="file" name="<%= transloaditname %>" /><input data-transloadit-name="_transloadit_<%= transloaditname %>" type="hidden" id="<%= id %>" name="<%= node.name %>" value=\'<%= escape(JSON.stringify(node.value)) %>\' /></span>',
			'fieldtemplate': true,
			'inputfield': true,
			'getElement': function(el) {
				return $(el).parent().get(0);
			},
			'onBeforeRender': function(data, node/*: FormNode*/) {

				if (!node.ownerTree._transloadit_generic_public_index) {
					node.ownerTree._transloadit_generic_public_index = 1;
				} else {
					node.ownerTree._transloadit_generic_public_index++;
				}

				data.transloaditname = "_transloadit_jsonform_genericupload_public_" + node.ownerTree._transloadit_generic_public_index;

				if (!node.ownerTree._transloadit_generic_elts) node.ownerTree._transloadit_generic_elts = {};
				node.ownerTree._transloadit_generic_elts[data.transloaditname] = node;
			},
			'onChange': function(evt, elt/*: FormNode*/) {
				// The "transloadit" function should be called only once to enable
				// the service when the form is submitted. Has it already been done?
				if (elt.ownerTree._transloadit_bound) {
					return false;
				}
				elt.ownerTree._transloadit_bound = true;

				// Call the "transloadit" function on the form element
				var formElt = $(elt.ownerTree.domRoot);
				formElt.transloadit({
					autoSubmit: false,
					wait: true,
					onSuccess: function(assembly) {
						// Image has been uploaded. Check the "results" property that
						// contains the list of files that Transloadit produced. There
						// should be one image per file input in the form at most.
						// console.log(assembly.results);
						var results = _.values(assembly.results);
						results = _.flatten(results);
						_.each(results, function(result) {
							// Save the assembly result in the right hidden input field
							var id = elt.ownerTree._transloadit_generic_elts[result.field].id;
							var input = formElt.find('#' + util.escapeSelector(id));
							var nonEmptyKeys = _.filter(_.keys(result.meta), function(key) {
								return !!util.isSet(result.meta[key]);
							});
							result.meta = _.pick(result.meta, nonEmptyKeys);
							input.val(JSON.stringify(result));
						});

						// Unbind transloadit from the form
						elt.ownerTree._transloadit_bound = false;
						formElt.unbind('submit.transloadit');

						// Submit the form on next tick
						_.delay(function() {
							console.log('submit form');
							elt.ownerTree.submit();
						}, 10);
					},
					onError: function(assembly) {
						// TODO: report the error to the user
						console.log('assembly error', assembly);
					}
				});
			},
			'onInsert': function(evt, node: FormNode) {
				$(node.el).find('a._jsonform-delete').on('click', function(evt) {
					$(node.el).find('._jsonform-preview').remove();
					$(node.el).find('a._jsonform-delete').remove();
					$(node.el).find('#' + util.escapeSelector(node.id)).val('');
					evt.preventDefault();
					return false;
				});
			},
			'onSubmit': function(evt, elt/*: FormNode*/) {
				if (elt.ownerTree._transloadit_bound) {
					return false;
				}
				return true;
			}

		},
		'file-transloadit': {
			'template': '<span><% if (value && (value.type||value.url)) { %>' + fileDisplayTemplate + '<% } %><input class="input-file" id="_transloadit_<%= id %>" type="file" name="_transloadit_<%= node.name %>" /><input type="hidden" id="<%= id %>" name="<%= node.name %>" value=\'<%= escape(JSON.stringify(node.value)) %>\' /></span>',
			'fieldtemplate': true,
			'inputfield': true,
			'getElement': function(el) {
				return $(el).parent().get(0);
			},
			'onChange': function(evt, elt/*: FormNode*/) {
				// The "transloadit" function should be called only once to enable
				// the service when the form is submitted. Has it already been done?
				if (elt.ownerTree._transloadit_bound) {
					return false;
				}
				elt.ownerTree._transloadit_bound = true;

				// Call the "transloadit" function on the form element
				var formElt = $(elt.ownerTree.domRoot);
				formElt.transloadit({
					autoSubmit: false,
					wait: true,
					onSuccess: function(assembly) {
						// Image has been uploaded. Check the "results" property that
						// contains the list of files that Transloadit produced. Note
						// JSONForm only supports 1-to-1 associations, meaning it
						// expects the "results" property to contain only one image
						// per file input in the form.
						// console.log(assembly.results);
						var results = _.values(assembly.results);
						results = _.flatten(results);
						_.each(results, function(result) {
							// Save the assembly result in the right hidden input field
							var input = formElt.find('input[name="' +
								result.field.replace(/^_transloadit_/, '') +
								'"]');
							var nonEmptyKeys = _.filter(_.keys(result.meta), function(key) {
								return !!util.isSet(result.meta[key]);
							});
							result.meta = _.pick(result.meta, nonEmptyKeys);
							input.val(JSON.stringify(result));
						});

						// Unbind transloadit from the form
						elt.ownerTree._transloadit_bound = false;
						formElt.unbind('submit.transloadit');

						// Submit the form on next tick
						_.delay(function() {
							console.log('submit form');
							elt.ownerTree.submit();
						}, 10);
					},
					onError: function(assembly) {
						// TODO: report the error to the user
						console.log('assembly error', assembly);
					}
				});
			},
			'onInsert': function(evt, node: FormNode) {
				$(node.el).find('a._jsonform-delete').on('click', function(evt) {
					$(node.el).find('._jsonform-preview').remove();
					$(node.el).find('a._jsonform-delete').remove();
					$(node.el).find('#' + util.escapeSelector(node.id)).val('');
					evt.preventDefault();
					return false;
				});
			},
			'onSubmit': function(evt, elt/*: FormNode*/) {
				if (elt.ownerTree._transloadit_bound) {
					return false;
				}
				return true;
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
			'onBeforeRender': function(data, node: FormNode) {
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
			'onBeforeRender': function(data, node: FormNode) {
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
			'childTemplate': function(inner, node: FormNode) {
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
			'onBeforeRender': function(data, node: FormNode) {
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
			'onBeforeRender': function(data, node: FormNode) {
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
		'array': {
			'template': '<div id="<%= id %>"><ul class="_jsonform-array-ul" style="list-style-type:none;"><%= children %></ul>' +
			'<% if (!node.isReadOnly()) { %><span class="_jsonform-array-buttons">' +
			'<a href="#" class="<%= cls.buttonClass %> _jsonform-array-addmore"><i class="<%= cls.iconClassPrefix %>-plus-sign" title="Add new"></i></a> ' +
			'<a href="#" class="<%= cls.buttonClass %> _jsonform-array-deletelast"><i class="<%= cls.iconClassPrefix %>-minus-sign" title="Delete last"></i></a>' +
			'</span><% } %>' +
			'</div>',
			'fieldtemplate': true,
			'array': true,
			'childTemplate': function(inner, node: FormNode) {
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
					$('> ul', $nodeid).bind('sortstop', function(event, ui) {
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
			'onBeforeRender': function(data, node: FormNode) {
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
			'onBeforeRender': function(data, node: FormNode) {
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
							window.location = option.href;
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
}
