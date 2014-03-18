/*
	Model Editor
	
	Easily edit your backbone models with ModelEditor. Supports the following inputs:
	
		• Input
		• Date Input (input with date picker; requires jQuery UI)
		• Textarea
		• RTE (textarea with rich text editor)
		• Checkbox
		• Select
		
	
	Example use:
		this.editor = new ModelEditor({model:this.model, el:this.el}); // inputs are automtically appended to "el"
		this.editor.input('Input title', 'mode_key');
		
	then when you want to save the changes, call:
		this.editor.save();
	
	If you want the model to save automatically whenver an input changes, add "autoSave" option
		this.editor = new ModelEditor({model:this.model, el:this.el, autoSave:true});
	
	
	@author Kevin Jantzer
	@since 2012-11-09
	@url https://github.com/kjantzer/backbonejs-model-editor-view
*/

var ModelEditor = Backbone.View.extend({
	
	initialize: function(opts){
		
		if(!opts || !opts.model){
			console.error('ModelEditor requires a “model” to be given.');
			return;
		}
		
		this.options = _.extend({
			modelType: 'Backbone.Model', 	// use "auto" to make "editmodel" the same type as the given model
			autoSave: false,				// auto save real model when editor model changes?
			saveToDB: !this.model.isNew(),			// SAVE to db, or just SET data
			defaultOpts: {}					// default ops for each editor // see base
		},opts)
		
		// create a clone of the model as "edit model" - this is where we store our pending changes
		this.editmodel = this.createEditModel();
		
		// set default opts
		this.defaultOpts('reset');
		
		// reset the ModelEditor
		this.reset();
		
		this.model.on('change', this.cleanReset, this);
		this.model.on('reset', this.cleanup, this);
		this.model.on('sync', this.onSync, this);
		
		this.editmodel.on('edited', this.rememberChanges, this);
		
		// if btns, set auto save to true since model won't save unless save btn is clicked
		if(this.options.defaultOpts.btns)
			this.options.autoSave = true;
		
		// if auto save is activated, then save the model whenever the temporary "editmodel" changes
		this.autoSave( this.options.autoSave )
		
	},
	
	createEditModel: function(){
		var modelType = this.options.modelType;
		
		if( modelType === 'auto' && this.model.collection )
			modelType = this.model.collection.model;
		else if(_.getObjectByName)
			modelType = _.getObjectByName(modelType);
		else
			modelType = Backbone.Model;
		
		return new modelType(this.model.toJSON());
	},
	
	autoSave: function(doAutoSave){
	
		this.editmodel.off('change', this.save, this);
	
		if( doAutoSave !== false )
			this.editmodel.on('change', this.save, this);
		
	},
	
	rememberChanges: function(key, val, isChanged){
		
		var unsavedChanges = this.model._unsavedChanges || {};
		
		if( isChanged )
			unsavedChanges[key] = val;
		else
			delete unsavedChanges[key];
			
		this.model._unsavedChanges = _.size(unsavedChanges) > 0 ? unsavedChanges : null;
	},
	
	render: function(){
		this.trigger('render');
	},
	
	cleanReset: function(){
		this.reset();
	},
	
	reset: function(resetData){
		this.editmodel.clear({silent:true})
		this.editmodel.set(resetData||this.model.toJSON(), {silent:true});
		this.editmodel.unsavedChanges = this.model._unsavedChanges || {};
	},
	
	cleanup: function(){
		this.editmodel.trigger('reset')
	},
	
	defaultOpts: function(opts){
		if( opts === 'reset' )
			this._defaultOpts = _.extend({},this.options.defaultOpts, {renderTo:this.$el});
		else
			this._defaultOpts = _.extend({},this._defaultOpts||{}, opts || {});
			
		return this;
	},
	
/*
	Data - return queued up edit model data
*/
	data: function(){
		return this.editmodel.toJSON();
	},
	
/*
	Save - saves the real model
*/
	save: function(doSave, opts){
		
		if(this.options.saveToDB || doSave===true)
			this.model.save(this.data(), opts||{});
		else
			this.model.set(this.data(), opts||{});
	},
	
	onSync: function(model){
		this.editmodel.trigger('changed');
	},
	
	insert: function(type, key, opts){
		
		if( !ModelEditors[type] ){
			console.error('ModelEditor: there is no editor called “'+type+'”.', ModelEditors);
			return;
		}
		
		return new ModelEditors[type](_.extend({
			key:key,
			model: this.editmodel,
			renderTo: this.$el
		}, this._defaultOpts, opts));
		
	}
	
});



/*
	Model Editors: Inputs, Textareas, Checkbox, etc
	
	each editor is saved as it's own file. CodeKit app automatically
	compiles them all together along with this file and saves it as
	"ModelEditor-final.js".
	
	Documentation:
	http://incident57.com/codekit/help.php#help-imports
	
	Don't know what CodeKit is? Well you should. It'll make your Web development
	life so much easier. Check it out: http://incident57.com/codekit/
	
	Unfortantley, this is a Mac app only. If you are windows user, get a Mac ;)
	Just kidding. But after you edit a Model Editor file you will need to copy the contents
	and replace the old code in ModelEditor-final.js
	
*/
var ModelEditors = {};
// @codekit-append 'Base.js'
// @codekit-append 'Input.js'
// @codekit-append 'RTE.js'
// @codekit-append 'Checkbox.js'
// @codekit-append 'Select.js'





/* **********************************************
     Begin Base.js
********************************************** */

/*
	Model Editor Base
	
*/
ModelEditors.Base = Backbone.View.extend({

	tagName: 'span',
	
	className: 'model-editor',
	
	editorClassName: '',
	
	isDisabled: false,
	
	append: function(el){
		this.$inner.append(el);
	},
	
	init: function(){
		
		this.options = _.extend({
			disabled: false,
			theme: 'default',
			float: 'left',
			clear: true,
			label: 'auto',
			labelInline: false,
			labelStyle: '',
			key: null,	// key/field to use in the model
			emptyVal: null,
			renderTo: null, // defaults is ModelEditor.el
			pl: null, // proofing light key - accepts "auto" as value, but plPrefix must be defined
			ph: null, // proofing history
			watchChanges: false,
			plPrefix: null,
			plFieldVal:null,
			css: null, // passes to jquery .css(), added at $el level
		},this.options)
		
		if( this.options.renderTo instanceof ModelEditors.Base)
			this.options.renderTo = this.options.renderTo.$inner;
		
		this.$el
			.appendTo( this.options.renderTo )
			.addClass(this.editorClassName)
			.addClass('theme-'+this.options.theme)
			.addClass('key-'+this.options.key)
		
		this.setupLabel();
		
		if(this.options.float && (this.options.float === 'left' || this.options.float === 'right'))
			this.$el.addClass('float-'+this.options.float)
		
		if(this.options.clear)
			this.$el.addClass('clear')
			
		if(this.options.disabled)
			_.defer(this.disable.bind(this));
		
		this.$inner = $('<span class="inner"></span>').appendTo(this.$el);
		
		
		if( this.options.pl ){
		
			var key = this.options.pl;
			
			if( key === 'auto' && this.options.plPrefix )
				key = this.options.plPrefix+'::'+this.options.key;
		
			if( key !== 'auto' ){
				this.plv = ProofingLight(key, {fieldVal:this.plFieldVal.bind(this)});
				this.$inner.append( this.plv.el );
			}
		}
		
		if( this.options.ph ){
			var phv = ProofingHistory(this.options.ph);
			this.$inner.append( phv.el );
		}
		
		if( this.options.css ) {
			this.$el.css(this.options.css); 
		}
		
		this.model.on('all', this.testForCleanup, this);
		this.model.on('changed', this.onChanged, this);
		
	},
	
	plFieldVal: function(){
		return this.options.plFieldVal ? this.options.plFieldVal() : this.val();
	},
	
	testForCleanup: function(){
		if( !this.el.parentElement )
			this.model.off(null, null, this);
	},
	
	onChanged: function(changedAttrs){
	
		var changedVal = this.model.changed[this.options.key];
		
		if( changedVal === undefined || this.options.watchChanges !== true ) return;
		
		// remove this "changed" value (fix for #742)
		delete this.model.changed[this.options.key];
		
		if( !this.options.pl && !this.plv ) return console.warn('!! To watch changes, you need to specifiy a key for proofing the proofing light');
		
		if( this.plv.model.get('status') == 1 || this.plv.model.get('status') == -2 ) // is green/yellow, well its not green anymore then!
			this.plv.reset();
	},
	
	_disable: function(){
		this.$el.addClass('disabled')
		this.isDisabled = true;
		return this;
	},
	
	_enable: function(){
		this.$el.removeClass('disabled')
		this.isDisabled = false;
		return this;
	},
	
	disable: function(){ return this._disable(); },
	enable: function(){ return this._enable(); },
	hide: function(){ this.$el.hide(); },
	show: function(){ this.$el.show(); },
	
	// convenience methods: get value and new value
	_val: function(){ return this.model.get(this.options.key)||null },
	_newVal: function(){ return _.cleanWebkitStyles(this.$input.val()) || this.options.emptyVal; },
	
	// override these to add special rules
	val: function(){ return this._val(); },
	newVal: function(){ return this._newVal(); },
	saveVal: function(){ return this.newVal(); },
	
	valChanged: function(){
		return this.val() !== this.newVal();
	},
	
	// updates the value in the model
	updateVal: function(){
		if( this.isDisabled || !this.valChanged()) return;
		
		this.model.set(this.options.key, this.saveVal());
		
		if( this.options.onSave )
			this.options.onSave(this.options.key, this.saveVal())
	},
	
	setWidth: function(){
		if(!this.options.w) return;
		
		this.$inner.width(this.options.w);
	},
	
	setupLabel: function(){
		
		var label = this.options.label;
		
		// no label
		if( label === false || label === undefined ) return;
		
		if( label === 'auto' ) label = this.keyToText();
		
		// create label EL
		this.$label = $('<label>'+label+'</label>').appendTo(this.$el);
		
		if( this.options.labelStyle )
			this.$el.addClass('label-style-'+this.options.labelStyle);
	
		// set optional inline
		if( this.options.labelInline ){
			this.$el.addClass('inline-label')
			
			// if label is a number, set the width of the label
			if( _.isNumber(this.options.labelInline) )
				this.$label.width(this.options.labelInline);
		}
			
	},
	
	
	/*
		Key to Text - returns the model key as human formatted text
		
		ex: book_id => Book ID
			publish_date => Publish date
	*/
	keyToText: function(){
		
		var text = this.options.key;
		
		text = text.replace(/_|-/g, ' ') // convert underscore and hypen to spaces
		text = text.replace(/ id$/, ' ID') // capitialize ID
		text = text.replace(/isbn/, ' ISBN') // capitialize ISBN
		text = text.replace(/drm/, ' DRM') // capitialize DRM
		text = text.replace(/dmas/, ' DMAS')
		text = text.replace(/^msg$/, 'Message')
		text = _.titleize(text);
		
		return text;
		
	}
	
})



ModelEditors.empty = ModelEditors.Base.extend({
	
	editorClassName: 'empty',
	
	initialize: function(){
		this.init();
		this.setWidth();
		
		if( this.options.view )
			if( this.options.view instanceof Backbone.View )
				this.append( this.options.view.el )
			else
				this.append( this.options.view )
			
		this.render();
	},
	
	render: function(){
		if( this.options.view && this.options.view instanceof Backbone.View )
			this.options.view.render();
	}
	
})

/* **********************************************
     Begin Input.js
********************************************** */

/*
	Input - basic input
	
	also works as base for Textarea, RTE, and cutom inputs such as DateInput
*/

ModelEditors.input = ModelEditors.Base.extend({
	
	editorTagName: 'input',
	
	editorClassName: 'input',
	
	editorAttributes: {
		'type': 'text',
		'class': 'form-control'
	},
	
	events: {
		'focus input': 'onFocus',
		'blur input': 'onBlur',
		'keyup input': 'onKeyUp',
		'click .button.save': 'saveBtnAction',
		'click .button.cancel': 'cancelBtnAction'
	},
	
	keyEvents: {
		'27': 'cancelBtnAction', // esc
		'13': 'saveBtnAction'	 // enter
	},
	
	initialize: function(opts){
		
		this.options = _.extend({
			placeholder: 'auto',
			w: 200,
			h: 'auto',
			btns: false
		}, this.options, opts)
		
		this.init(); // init base
		
		this.$input = $('<'+this.editorTagName+'></'+this.editorTagName+'>')
			.val( this.val() )
			.attr(this.editorAttributes)
			.appendTo(this.$inner);
			
		this.origVal = this.val();
			
		this.setPlaceholder();
		this.setVal();
		this.setWidth();
		this.setHeight();
		this.setupBtns();
		this.setupUnsavedVal();
		
		this.render();
		
		_.defer(this.doAutoResize.bind(this));
		
		this.delegateEvents();
	},
	
	hasUnsavedVal: function(){
		return this.model.unsavedChanges.hasOwnProperty(this.options.key)
	},
	
	unsavedVal: function(){
		return this.model.unsavedChanges[this.options.key]
	},
	
	setupUnsavedVal: function(){
		if( this.hasUnsavedVal() ){
			this.$input.val( this.unsavedVal() );
			this.edit(true);
		}
	},
	
	focus: function(){
		this.$input.focus();
	},
	
	onFocus: function(){
		this.edit();
	},
	
	onBlur: function(){
		
		this.setVal();
		
		if(!this.options.btns){
		
			this.edit(false);
			this.updateVal();
			
		}else{
			if( !this.valChanged() )
				this.edit(false);
				
			this.model.trigger('edited', this.options.key, this.newVal(), this.valChanged())
		}
	},
	
	onKeyUp: function(e){
		
		if( !this.keyEvents ) return;
		
		var fn = this.keyEvents[e.which];
		
		if( fn && this[fn] )
			this[fn].call(this, e);
		
		this.doAutoResize();
		
	},
	
	doAutoResize: function(){
		if((this.options.autoresize || this.options.h === 'auto') && this.autoResize){
			this.autoResize()
			return true;
		}
	},
	
	/*autoResize: function(){
	
		var el = this.$input[0];
	
		el.style.width = '0';
		
		var newW = this.$input.outerWidth() + el.scrollWidth+'px';
        el.style.width = newW;
        this.$inner.width( newW )
        //el.style.overflow = 'hidden';
	},*/
	
	setVal: function(){
		var val = this.val();
		this.$input[0].setAttribute('value', val) // set the value attribute for CSS styling
		
		val ? this.$el.addClass('has-value') : this.$el.removeClass('has-value');
	},
	
	saveBtnAction: function(){
	
		if( this.isDisabled ) return;
	
		this.updateVal();
		this.origVal = this.newVal(); // update orig value to the new val
		this.edit(false);
		this.$input.blur();
	},
	
	cancelBtnAction: function(e){
		this.$input.val( this.origVal );
		this.edit(false);
		this.$input.blur();
		
		if( e )
			e.stopPropagation()
	},
	
	setWidth: function(){
		if(!this.options.w) return;
		
		this.$inner.width(this.options.w);
		this.$input.width(this.options.w);
	},
	
	setHeight: function(){
	
		if(!this.options.h || this.editorTagName !== 'textarea') return;
		
		//this.$inner.height(this.options.h);
		this.$input.height(this.options.h);
	},
	
	setPlaceholder: function(){
		
		var placeholder = this.options.placeholder;
		
		if( !placeholder ) return;
		
		if( placeholder === 'auto' ) placeholder = this.keyToText();
		
		this.$input.attr('placeholder', placeholder);
	},
	
	setupBtns: function(){
		
		if( !this.options.btns ) return;
		
		this.$el.addClass('has-btns');
		
		this.$inner.append('<div class="btns">\
							<a class="button flat hover-green save icon-only icon-ok"></a>\
							<a class="button flat hover-red cancel icon-only icon-cancel"></a>\
						</div>');
	},
	
	edit: function(doEdit){
	
		if( this.isDisabled ) return;
	
		if( doEdit === false)
			this.$el.removeClass('editing');
		else
			this.$el.addClass('editing');
	},
	
	disable: function(){
		this.$input.attr('disabled', true);
		return this._disable();
	},
	
	enable: function(){
		this.$input.attr('disabled', false);
		return this._enable();
	}
	
})


ModelEditors.date = ModelEditors.input.extend({
	
	events: {
		'focus input': 'onFocus',
		'keyup input': 'onKeyUp',
		'click .button.save': 'saveBtnAction',
		'click .button.cancel': 'cancelBtnAction'
	},
	
	editorClassName: 'input date',
	
	val: function(){
		var val = this._val();
		
		if(val && val !== '-')
			val = (new XDate(val)).toString('MM/dd/yyyy');
			
		return val;
	},
	
	saveVal: function(){
		var val = this.newVal();
		
		if(val){
		
			// if the entered value is not in a date format (mm/dd/yyyy), revert back to original
			if( !/^[0-1]*[0-9]\/[0-3]*[0-9]\/[0-9]{4}$/.test(val)){
				val = this.origVal;
				this.$input.val( val );
			}
			
			val = (new XDate(val)).toString('yyyy-MM-dd');
		}
			
		return val || null;
	},
	
	render: function(){
		
		this.$input.datepicker({
			constrainInput: this.options.constrainInput===false?false:true, // default to true
			dateFormat: 'm/d/yy',
			beforeShow: _.bind(function(el, obj){
				this.$el.addClass('datepickerOpen');
			},this),
			onClose: _.bind(function(){
				this.$el.removeClass('datepickerOpen');
				this.onBlur();
			},this)
		});
		
		// stop propagation when clicking on the datepicker (so we can use it inside a "dropdown")
		this.$input.data('datepicker').dpDiv.click(function(e){
			e.stopPropagation();
		})
		
	}
})


ModelEditors.email = ModelEditors.input.extend({
	
	editorClassName: 'input email',
	
	editorAttributes: {
		'type': 'email',
		'class': 'form-control'
	}
})

ModelEditors.password = ModelEditors.input.extend({

	editorClassName: 'input password',
	
	editorAttributes: {
		'type': 'email',
		'class': 'form-control'
	}
})





ModelEditors.textarea = ModelEditors.input.extend({

	editorTagName: 'textarea',
	
	editorClassName: 'textarea',

	editorAttributes: {
		'class': 'form-control'
	},
	
	events: {
		'focus textarea': 'onFocus',
		'blur textarea': 'onBlur',
		'keyup textarea': 'onKeyUp',
		'keydown textarea': 'doAutoResize',
		'click .button.save': 'saveBtnAction',
		'click .button.cancel': 'cancelBtnAction'
	},
	
	keyEvents: {
		'27': 'cancelBtnAction', // esc
	},
	
	// for better results: http://jsfiddle.net/CbqFv/
	autoResize: function(){
	
		var el = this.$input[0];
	
		el.style.height = '0';
        el.style.height = el.scrollHeight+'px';
        el.style.overflow = 'hidden';
	},
	
	render: function(){
		_.defer(_.bind(this.doAutoResize,this))
	}
})


/* **********************************************
     Begin RTE.js
********************************************** */

/*
	RTE
	
	extends Textarea to add a rich text editor.
	
	requires
		• Redactor JS <http://redactorjs.com>
*/

ModelEditors.rte = ModelEditors.textarea.extend({

	editorClassName: 'textarea rte',

	events: {
		'blur .redactor_editor': 'onBlur',
		'focus .redactor_editor': 'onFocus',
		'focus textarea': 'onFocus',
		'keyup .redactor_editor': 'onKeyUp',
		'click .button.save': 'saveBtnAction',
		'click .button.cancel': 'cancelBtnAction'
	},

	render: function(){
	
		this.model.on('reset', this.cleanup, this);
	
		var opts = this.options;
		var plugins = ['fullscreen'];
		var buttons = ['formatting', 'specialCharacters', 'bold', 'italic', 'fullscreen'];
		var allowedTags = ["a", "p", "blockquote", "b", "i", 'strong', 'em', 'h1', 'h2', 'ul', 'ol', 'li'];
		var formattingTags = ['p', 'blockquote'];
		var linebreaks = false;
		
		if( opts.allowBR === true )
			allowedTags.push('br');
		
		switch(opts.toolbar){
			
			case 'nano':
				plugins = false;
				buttons = [ 'bold', 'italic'];
				allowedTags = ["p", "b", "i", 'strong', 'em'];
				break;
			
			case 'micro':
				plugins = false;
				buttons = ['specialCharacters', 'bold', 'italic'];
				allowedTags = ["p", "b", "i", 'strong', 'em'];
				break;
				
			case 'micro-br':
				plugins = false;
				buttons = ['specialCharacters', 'bold', 'italic'];
				allowedTags = ["p", "b", "i", 'strong', 'em', 'br'];
				linebreaks = true;
				break;
			
			case 'regular':
				buttons = ['formatting', 'specialCharacters', 'bold', 'italic', 'unorderedlist', 'orderedlist', 'link', 'alignleft', 'aligncenter'];
				break;
			
			case 'mini':
			default:
				buttons = ['formatting', 'specialCharacters', 'bold', 'italic', 'unorderedlist', 'orderedlist', 'link'];
				break;
			
		}
		
		
		if(User.can('view-html-in-rte'))
			buttons.push('html');
		
		// if not autoresize defined and height is set to "auto", thet assume we want autoresize=true
		if(opts.autoresize === undefined && opts.h === 'auto')
			opts.autoresize = true;
		
		var self = this;
		
		//function insertSpecialCharacter(obj, e, key){
		function insertSpecialCharacter(buttonName, buttonDOM, buttonObj){
			self.redactor.bufferSet();
			self.redactor.insertHtml(buttonName);
			self.redactor.sync();
		}
		
		
		this.$input.redactor({
			plugins: plugins
			, paragraphy: false
			, boldTag: 'b'
			, italicTag: 'i'
			//, tidyHtml: false
			, linebreaks: linebreaks
			, buttons: buttons
			, allowedTags: allowedTags
			, formattingTags: formattingTags
			, autoresize: opts.autoresize===undefined?true:opts.autoresize
			, buttonsCustom: {
	            specialCharacters: {
	                title: "Special Characters",
	                dropdown: {
	                    "“": {title: '“ Quote Left', callback: insertSpecialCharacter},
	                    "”": {title: '” Quote Right', callback: insertSpecialCharacter},
	                    "‘": {title: '‘ Single Quote Left', callback: insertSpecialCharacter},
	                    "’": {title: '’ Single Quote Right', callback: insertSpecialCharacter},
	                    "—": {title: '— Em-Dash', callback: insertSpecialCharacter},
	                    "–": {title: '— En-Dash', callback: insertSpecialCharacter},
	                    "…": {title: '… Ellipsis', callback: insertSpecialCharacter}
	                }
	            }
	        }
		});
		
		this.redactor = this.$input.redactor('getObject');
		
	},
	
	
	saveBtnAction: function(){
		this.updateVal();
		
		this.origVal = this.newVal(); // update orig value to the new val
		this.$input.val( this.origVal ); // update input so we get the "cleaned" version
		//this.$input.setCode(this.origVal)
		this.redactor.set(this.origVal||'')
		
		this.edit(false);
		
		this.$el.find('.redactor_editor').blur();
	},
	
	cancelBtnAction: function(){
		this.$input.val( this.origVal );
		//this.$input.setCode(this.origVal)
		this.redactor.set(this.origVal||'')
		this.edit(false);
		
		this.$el.find('.redactor_editor').blur();
	},
	
	destroyEditor: function(){
		this.$input.destroyEditor();
	},
	
	cleanup: function(){
		this.destroyEditor();
		this.model.off(null, null, this);
	}

});


/* **********************************************
     Begin Checkbox.js
********************************************** */

/*
	Tribox - checkbox with 3 states: unset, off, on
	
	pass "allowEmptyState:false" to make it a normal 2 state checkbox
	
	set "valType: 'timestamp'" to use current timestamp as "selected" value.
*/

ModelEditors.checkbox = ModelEditors.Base.extend({

	editorTagName: 'span',
	
	editorClassName: 'checkbox',
	
	events: {
		'click span.checkbox' : 'onClick'
	},
	
	allowEmptyState: false,
	
	initialize: function(opts){
	
		this.options = _.extend({
			inline: false,
			valType: 'bool', // bool or timestamp
			allowEmptyState: this.allowEmptyState,	// can a user make it the null/empty state
		},opts);
		
		this.init(); // init base
		
		this.value = this.val();
		
		this.$input = $('<'+this.editorTagName+' class="checkbox"></'+this.editorTagName+'>')
			.attr('type', 'checkbox')
			.addClass(this.state())
			.appendTo(this.$inner)
		
		if(this.options.inline)
			this.$el.addClass('inline-checkbox');
		
		this.$el.addClass(this.state());
		
		this.render();
	},
	
	render: function(){	
		return this;
	},
	
	state: function(){
		switch(this.value){
			case '1': return 'on'; break;
			case '0': return 'off'; break;
			
			case '':
			case this.options.emptyValue:
			case 'null':
			default:
				return 'null'; break;
		}
	},
	
	val: function(){ 
		var val = this._val()
		
		if( this.options.valType === 'timestamp' )
			return val && val.length > 1 ? '1' : '0';
		else
			return  val === null ? 'null' : val;
	},
	
	newVal: function(){
		if( this.options.valType === 'timestamp' )
			return this.value == '1' ? _.timestamp() : null;
		else
			return this.value;
	},
	
	nextVal: function(){
		
		var val = this.value, newVal;
		
		if(val === '' || val === 'null' || val === this.options.emptyVal) 
			newVal = '1';
		else if(val === '1')
			newVal = '0';
		else if(this.options.allowEmptyState)
			newVal = this.options.emptyVal;
		else
			newVal = '1';
		
		return newVal;
	},
	
	onClick: function(){
	
		if( this.isDisabled ) return
		
		clearTimeout(this.saveTimeout);
		
		// remove current state class
		this.$el.add(this.$input).removeClass( this.state() );
		
		// update value
		this.value = this.nextVal();
		
		// add new state class
		this.$el.add(this.$input).addClass( this.state() );
		
		
		// delay the save function by 500ms to see if the user clicks the input again
		this.saveTimeout = setTimeout(_.bind(this.updateVal,this),300);
		
	}

});


ModelEditors.tribox = ModelEditors.checkbox.extend({
	allowEmptyState: true
})

/* **********************************************
     Begin Select.js
********************************************** */

/*
	Select 
*/

ModelEditors.select = ModelEditors.Base.extend({
	
	editorClassName: 'select',
	
	editorAttributes: {
		'class': 'form-control'
	},
	
	events: {
		'change select' : 'updateVal'
	},
	
	use: 'value', // index, value, lowercase, uppercase
	
	initialize: function(opts){
	
		
		this.options = _.extend({
			w: 200,
			values: null
		},opts);
		
		if( this.options.values )
			this.values = this.options.values;
		
		this.init(); // init base
		
		this.value = this.val() === null ? 'null' : this.val();
		
		
		this.$input = $('<select></select>')
			.appendTo( this.$inner )
			.attr(this.editorAttributes)
			
		this.addOptions();
		
		this.setWidth();
		
		this.onUpdateVal();
		this.model.on('change:state', this.onUpdateVal, this)
		
		this.render();
	},
	
	addOptions: function(){
		
		if( !this.values ){
			console.error('ModelEditor: you need to add a “values“ attribute');
			return;
		}
		
		var values = _.isFunction( this.values ) ? this.values() : this.values;
		
		_.each(values, _.bind(this.addOption, this));
		
	},
	
	addOption: function(option, indx){
		
		var $option = $('<option></option>');
		
		if( _.isObject(option) ){
			
			$option
				.val(option.val)
				.html(option.label)
			
		}else{
			
			$option
				.val( this.use==='index' ? indx : this.optionVal(option) )
				.html(option)
			
		}
		
		if( this.val() == $option.val() )
			$option.attr('selected', true);
		
		$option.appendTo(this.$input);
		
	},
	
	optionVal: function(val){
		
		if( val === '-')
			return '';
			
		if( this.use === 'lowercase' )
			return val.toLowerCase()
			
		if( this.use === 'uppercase' )
			return val.toUpperCase()
			
		return val;
	},
	
	onUpdateVal: function(){
		this.$input.attr('value', this.val());
	},
	
	setWidth: function(){
		if(!this.options.w) return;
		
		this.$inner.width(this.options.w);
		this.$input.width(this.options.w);
	},
	
	disable: function(){
		this._disable();
		this.$input.attr('disabled', true);
	},
	
	enable: function(){
		this._enable();
		this.$input.attr('disabled', false);
	},
	
	focus: function(){
		this.$input.focus();
	}

});

ModelEditors.selectMonth = ModelEditors.select.extend({
	values: function(){return lookup.selects.monthsOfYear.asSelect()}
})


ModelEditors.selectUser = ModelEditors.select.extend({
	values: function(){
		return Users.map(function(model){
			return {val: model.id, label: model.name()}
		})
	}
})

ModelEditors.selectPartner = ModelEditors.select.extend({
	values: function(){
		return [{label: '-', val: null}].concat(Partners.map(function(model){
			return {val: model.id, label: model.get('name')}
		}))
	}
})

ModelEditors.selectGender = ModelEditors.select.extend({	
	
	values: [
		{label: '-', val: ''},
		{label: 'Male', val: 'M'},
		{label: 'Female', val: 'F'}
	]
	
})

ModelEditors.selectBookEdition = ModelEditors.select.extend({
	values: function(){return lookup.selects.bookBookEdition.asSelect()}
})

ModelEditors.bookState = ModelEditors.select.extend({
	values: [
		'-',
		'On Sale',
		'In Process',
		'Re-request',
		'Re-release',
		'Cancelled'
	]
})

ModelEditors.acquisitionState = ModelEditors.select.extend({
	values: function(){return lookup.selects.dealAcquisitionState.asSelect()}
	
})

ModelEditors.selectProductReleaseType = ModelEditors.select.extend({
	values: function(){
		return ProductReleaseTypes.map(function(model){
			return {val: model.id, label: model.get('name')}
		})
	}
})


ModelEditors.selectBookChannel = ModelEditors.select.extend({
	values: function(){
		return lookup.collections.channels.map(function(model){
			return {val: model.id, label: model.get('name')}
		})
	}
})

ModelEditors.selectBookAllProduct = ModelEditors.select.extend({
	values: function(){
		return lookup.collections.products.map(function(model){
			return {val: model.id, label: model.get('label')}
		})
	}
})

ModelEditors.selectBookArchivedProduct = ModelEditors.select.extend({
	values: function(){
		return _.map(lookup.collections.products.archived(), function(model){ return {val: model.id, label: model.get('label')} });	}
})

ModelEditors.selectBookActiveProduct = ModelEditors.select.extend({
	values: function(){
		return _.map(lookup.collections.products.active(), function(model){ return {val: model.id, label: model.get('label')} }); 
	}
})

ModelEditors.selectTargetAudience = ModelEditors.select.extend({
	values: ['Adult', 'Young Adult (12-17)', 'Children (10-12)', 'Children (6-9)']
})

ModelEditors.selectMovieTieIn = ModelEditors.select.extend({
	values: function(){return lookup.selects.marketingMovieTieIn.asSelect()}
})

ModelEditors.selectContractStatus = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractContractStatus.asSelect()}
})

ModelEditors.selectContractState = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractContractState.asSelect()}
})

ModelEditors.selectContractDealTypeID = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractDealTypeID.asSelect()}
})

ModelEditors.selectPurchasedBy = ModelEditors.select.extend({
	values: function(){
		var users = _.map(_.sortBy(lookup.collections.purchasers.models, function(model){
								return model.get('name'); 
							}), function(model){
						return {label: model.get('name'), val: model.get('user_id')}
					})
		return [{label:'-'}].concat(users)
	}
})


ModelEditors.selectContractCopyBy = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractCopyBy.asSelect()}
})

ModelEditors.selectContractStateJurisdiction = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractStateJurisdiction.asSelect()}
})

ModelEditors.selectContractTerritoryType = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractTerritoryType.asSelect()}
})

ModelEditors.selectContractTerritoryLanguage = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractTerritoryLanguage.asSelect()}
})

ModelEditors.selectContractWhoPreparesContractID = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractWhoPreparesContractID.asSelect()}
})

ModelEditors.selectMastersSourcedFrom = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractMastersSourcedFrom.asSelect()}
})

ModelEditors.selectProducer = ModelEditors.select.extend({
	values: [
		'-',
		'BSA',
		'RI',
		'UK'
	]
})

ModelEditors.selectContractTermBeginsOn = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractTermBeginsOn.asSelect()}
})

ModelEditors.selectContractTermLengthType = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractTermLengthType.asSelect()}
})

ModelEditors.selectContractDealTermType = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractDealTermType.asSelect()}
})

ModelEditors.selectContractRoyaltyPaymentTerm = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractRoyaltyPaymentTerm.asSelect()}
})

ModelEditors.selectContractRoyaltyReportingPeriod = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractRoyaltyReportingPeriod.asSelect()}
})

ModelEditors.selectContractRoyaltyTypeOrProduct = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractRoyaltyTypeOrProduct.asSelect()}
})

ModelEditors.selectContractFeeDueOn = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractFeeDueOn.asSelect()}
})

ModelEditors.selectContractRoyaltyPaymentBasis = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractRoyaltyPaymentBasis.asSelect()}
})

ModelEditors.selectContractFeeType = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractFeeType.asSelect()}
})

ModelEditors.selectContractRoyaltyMarket = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractRoyaltyMarket.asSelect()}
})

ModelEditors.selectContractRoyaltyModifier = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractRoyaltyModifier.asSelect()}
})

ModelEditors.selectPresetDates = ModelEditors.select.extend({
	values: function(){return lookup.selects.presetDates.asSelect()}
})

ModelEditors.contractContactTags = ModelEditors.select.extend({
	values: function(){return lookup.selects.contractContactTags.asSelect()}
})

ModelEditors.selectBookCategory = ModelEditors.select.extend({
	values: function(){return lookup.selects.bookCategory.asSelect()}
})

ModelEditors.selectRoyaltyCalculationSystem = ModelEditors.select.extend({
	values: [
		{label: '-', val: null},
		{label: 'Acumen', val: 'Acumen'},
		{label: 'Magento', val: 'Magento'}
	]
})

ModelEditors.selectImprintPartner = ModelEditors.select.extend({
	values: function(){ return Partners.toSelectImprints() }
})

ModelEditors.selectImageType = ModelEditors.select.extend({
	values: [
		{label: 'JPEG', val: 'jpeg'},
		{label: 'PNG', val: 'png'}
	]
})

ModelEditors.selectImageDownloaderDataType = ModelEditors.select.extend({
	values: [
		{label: 'ISBN', val: 'isbn_13'},
		{label:'Book ID', val: 'book_id'}
	]
})

ModelEditors.selectAutoRenewOptions = ModelEditors.select.extend({
	values: [
		{label: 'No auto renewal', val: 0},
		{label: 'No auto renewal, BSA has first option to renew', val: 3},
		{label: 'Auto renew with term guarantee', val: 1},
		{label: 'Auto renew with no term guarantee', val: 2}
	]
});

ModelEditors.selectAutoRenewIncrement = ModelEditors.select.extend({
	values: [
		{label: '-', val: null},
		{label: '6 months', val: '6 months'},
		{label: '1 year', val: '1 year'},
		{label: '2 years', val: '2 years'}
	]
});

ModelEditors.selectRenewalFirstOptionIncrement = ModelEditors.select.extend({
	values: [
		{label: '-', val: null},
		{label: '30 days', val: '30'},
		{label: '60 days', val: '60'}, 
		{label: '90 days', val: '90'}
	]
});

ModelEditors.selectContractAssignability = ModelEditors.select.extend({
	values: [
		{label: 'Approval Not Required', val: null}, 
		{label: '​Approval Not Required for Ordinary Course of Business', val:1}, 
		{label: 'Approval Not Required for Ordinary Course of Business (Sales/Mergers allowed)', val: 2},
		{label: 'Approval Required (Sales/Mergers allowed)', val: 3},
		{label: 'Approval Required', val: 4}
	]
});