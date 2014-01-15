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