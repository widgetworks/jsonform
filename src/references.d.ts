declare var _: any;
declare var exports: any;
declare var require: any;

declare var jQuery: any;
declare var $: any;

// ACE editor
declare var ace: any;

interface Window {
	ace: any;
	Modernizr: any;
	
	jsonform_ace_setup: (callback: Function) => void;
	jsonform_wysihtml5_setup: (callback: Function) => void;
	wysihtml5: any;
}

