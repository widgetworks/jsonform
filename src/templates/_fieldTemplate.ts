// Twitter bootstrap-friendly HTML boilerplate for standard inputs
function fieldTemplate(inner: string) {
	
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


export default fieldTemplate;
