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

	html: function(el){
		this.$inner.html(el);
	},
	
	init: function(){
		
		this.options = _.extend({
			disabled: false,
			theme: 'default',
			float: 'left',
			clear: true,
			label: 'auto',
			labelInline: false,
			labelStyle: '',	// large, medium, medium-large
			labelIcon: false,
			key: null,	// key/field to use in the model
			valueType: 'string', // string, array, csv, json
			emptyVal: null,
			renderTo: null, // defaults is ModelEditor.el
			selectOnClick: false, // only works for "empty" editor
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
			.attr('data-val', this.val());
		
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
				this.subview('plv', ProofingLight(key, {fieldVal:this.plFieldVal.bind(this)}) );
				this.$inner.append( this.subview('plv').el );
			}
		}
		
		if( this.options.ph ){
			this.subview('phv', ProofingHistory(this.options.ph) );
			this.$inner.append( this.subview('phv').el );
		}
		
		if( this.options.css ) {
			this.$el.css(this.options.css); 
		}
		
		//this.model.on('all', this.testForCleanup, this);
		//this.model.on('changed', this.onChanged, this);
		this.listenTo(this.model, 'changed', this.onChanged);
		
	},
	
	plFieldVal: function(){
		return this.options.plFieldVal ? this.options.plFieldVal() : this.val();
	},
	
	testForCleanup: function(){
		if( !this.el.parentElement )
			this.cleanup();
	},

	cleanup: function(){
		Backbone.View.prototype.cleanup.apply(this, arguments);
		this.stopListening()
	},
	
	onChanged: function(changedAttrs){
		var changedVal = this.model.changed[this.options.key];
		
		if( changedVal === undefined || this.options.watchChanges !== true ) return;
		
		// remove this "changed" value (fix for #742)
		delete this.model.changed[this.options.key];
		
		if( !this.options.pl && !this.subview('plv') ) return console.warn('!! To watch changes ('+this.options.key+'), you need to specifiy a key for proofing the proofing light');
		
		if( this.subview('plv').model.get('status') == 1 || this.subview('plv').model.get('status') == -2 ) // is green/yellow, well its not green anymore then!
			this.subview('plv').reset();
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
	
	parseVal: function(val){
		switch(this.options.valueType){
			case 'string': return val; 
			case 'array': return val||[];
			case 'csv': return _.splitAndTrim(val);
		}
	},

	parseSaveVal: function(val){
		switch(this.options.valueType){
			case 'string': return this.cleanSaveVal(val); 
			case 'array': return val; 
			case 'csv': return (val||[]).join(',');
		}
	},

	cleanSaveVal: function(val){
		val = _.cleanWebkitStyles(val);
		val = _.smartQuotes(val);
		return val;
	},

	// convenience methods: get value and new value
	_val: function(){ return this.parseVal(this.model.get(this.options.key)||null); },
	_newVal: function(){ return this.$input.val() || this.options.emptyVal; },
	
	// override these to add special rules
	val: function(){ return this._val(); },
	newVal: function(){ return this._newVal(); },
	saveVal: function(){ return this.parseSaveVal(this.newVal()); },
	
	valChanged: function(){
		var val = this.val();
		var newVal = this.newVal();

		if( this.options.valueType == 'csv' || this.options.valueType == 'array' )
			return _.difference(val, newVal).length > 0 || val.length != newVal.length
		else
			return val !== newVal;
	},
	
	// updates the value in the model
	updateVal: function(){

		// using saveVal rather than newVal to fix #1062
		this.model.trigger('edited', this.options.key, this.saveVal(), this.valChanged())

		if( this.isDisabled || !this.valChanged()) return;
		
		this.model.set(this.options.key, this.saveVal());
		
		if( this.options.onSave )
			this.options.onSave(this.options.key, this.saveVal())

		this.$el.attr('data-val', this.saveVal());

		if( this.editorTagName && this.editorTagName == 'textarea' )
			this.$input.val(this.saveVal())
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
		this.$label = $('<label><div><span>'+label+'</span></div></label>').appendTo(this.$el);

		if( this.options.labelDivider )
			this.$label.find('> div:first-child').addClass('divider dark');

		if( this.options.helpText )
			this.$label.append('<p class="help-text">'+this.options.helpText+'</p>')
		
		if( this.options.labelStyle )
			this.$el.addClass('label-style-'+this.options.labelStyle);

		if( this.options.labelIcon )
			this.$label.find('> div:first-child').addClass('icon-'+this.options.labelIcon);
	
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

		if( this.options.selectOnClick )
			this.$inner.on('click', this.selectOnClick.bind(this))
	},

	// http://stackoverflow.com/a/1173319/484780
	selectOnClick: function(){
		
		var el = this.$inner[0];

		if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(el);
            range.select();
        } else if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(el);
            window.getSelection().addRange(range);
        }

	},
	
})