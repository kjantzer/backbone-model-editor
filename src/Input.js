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
		'keydown input': 'onKeyDown',
		'keypress input': 'onKeyPress',
		'click .button.save': 'saveBtnAction',
		'click .button.cancel': 'cancelBtnAction',
		'click .markdown-preview-btn': 'toggleMarkdownPreview'
	},
	
	keyEvents: {
		'27': 'cancelBtnAction', // esc
		'13': 'saveBtnAction'	 // enter
	},
	
	initialize: function(opts){
		
		this.options = _.extend({
			placeholder: 'auto',
			prefix: null, 			// prefix to input (ex: `$`)
			suffix: null, 			// suffix to input (ex: `%`)
			w: 200,
			h: 'auto',
			btns: false,
			mention: false,			// preset string or mention plugin data
			updateAfterDelay: false,// update instead of waiting for "blur" event
			markdownPreview: false,
			attachments: false,		// bool/{};  allow for drag-and-drop attachment upload (requires https://gist.github.com/kjantzer/6b97badbafd7042c730b)
			
			// optional validate param
			validate: false, // string preset or regex (see `_validatePatterns` in Base.js)
			validateMsg: '<u>[val]</u> is not valid.' // [val] will be replaced with inputed value; set to `false` for no msg
			
		}, this.options, opts)


		// if user did not define if attachment is allowed, auto activate it if markdown preview is on
		if( opts.attachments == undefined && this.options.markdownPreview && this.editorTagName == 'textarea' )
			this.options.attachments = {};

		
		this.init(); // init base
		
		this.$input = $('<'+this.editorTagName+'></'+this.editorTagName+'>')
			.val( this.val() )
			.attr(this.editorAttributes)
			.appendTo(this.$inner);

		this.origVal = this.val();
			
		this.setPlaceholder();
		this.setupPrefix();
		this.setupSuffix();
		this.setupMarkdownPreview();
		this.setVal();
		this.setWidth();
		this.setHeight();
		this.setupBtns();
		this.setupMention();
		this.setupUnsavedVal();
		this.setupAttachmentUpload()
		
		this.render();
		
		_.defer(this.doAutoResize.bind(this));
		
		this.delegateEvents();
	},
	
	hasUnsavedVal: function(){
		return false;
		//return this.model.unsavedChanges.hasOwnProperty(this.options.key)
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
				
			// using saveVal rather than newVal to fix #1062
			//this.model.trigger('edited', this.options.key, this.saveVal(), this.valChanged())
		}
	},
	
	onKeyUp: function(e){

		this.updateAfterDelay()

		if( !this.keyEvents ) return;
		
		var fn = this.keyEvents[e.which];
		
		if( fn && this[fn] )
			this[fn].call(this, e);
		
		this.doAutoResize();
		
	},

	onKeyDown: function(e){
		if( e.which == 8 ) // delete key
			this.updateAfterDelay()
	},

	onKeyPress: function(e){
		this.updateAfterDelay()
	},

	updateAfterDelay: function(){

		if( !this.options.updateAfterDelay ) return;

		clearTimeout(this.__updateAfterDelayTimeout)

		this.__updateAfterDelayTimeout = setTimeout(this.onBlur.bind(this), this.options.updateAfterDelay)
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
	
	_validateSaveVal: function(val){
		
		// no validate options or empty val, so everything is valid
		if( !this.options.validate || !val )
			return true;
		
		var pattern = this.options.validate;
		
		// lookup validate pattern presets
		if( typeof pattern == 'string' && this._validatePatterns[pattern])
			pattern = this._validatePatterns[pattern];
		
		// convert pattern to regex
		if( !(pattern instanceof RegExp) )
			pattern = new RegExp(pattern)
		
		// validate the save value
		if( !pattern.test(val) ){
			
			// didn't pass, so reset back to orig value
			this.$input.val( this.origVal );
			
			// create message to alert user
			var msg = typeof this.options.validateMsg == 'string' ? this.options.validateMsg.replace('[val]', val) : false;
			
			// if msg to display, display it.
			// we delay by 40ms, because 'enter' keyboard in Modal closes the alert.
			if( msg )
				setTimeout(function(){ Modal.alert(msg, ''); }, 40)
			
			return false;
		}
		
		return true;
	},
	
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
		this.onBlur();
	},
	
	cancelBtnAction: function(e){
		this.$input.val( this.origVal );
		this.edit(false);
		this.onBlur();
		
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
		this.$preview && this.$preview.height(this.options.h);
	},
	
	setPlaceholder: function(){
		
		var placeholder = this.options.placeholder;
		
		if( !placeholder ) return;
		
		if( placeholder === 'auto' ) placeholder = this.keyToText();
		
		this.$input.attr('placeholder', placeholder);
	},

	setupPrefix: function(){

		if( !this.options.prefix || this.editorTagName != 'input' ) return;

		this.$inner.addClass('has-prefix');
		this.$inner.prepend('<span class="prefix">'+this.options.prefix+'</span>');

	},

	setupSuffix: function(){

		if( !this.options.suffix || this.editorTagName != 'input' ) return;

		this.$inner.addClass('has-suffix');
		this.$inner.append('<span class="suffix">'+this.options.suffix+'</span>');

	},
	
	setupBtns: function(){
		
		if( !this.options.btns ) return;
		
		this.$el.addClass('has-btns');
		
		this.$inner.append('<div class="btns">\
							<a class="button flat hover-green save icon-only icon-ok"></a>\
							<a class="button flat hover-red cancel icon-only icon-cancel"></a>\
						</div>');
	},

	setupMention: function(){

		if( !this.options.mention ) return;

		if( !$.fn.mention ){
			console.warn("ModelEditor: `mention` option cannot be used as the `mention` plugin was not found.\nhttps://github.com/jakiestfu/Mention.js")
			return;
		}

		if( !$.fn.typeahead ){
			console.warn("ModelEditor: `mention` option cannot be used as the `typeahead` plugin was not found.\nhttps://github.com/jakiestfu/Mention.js/blob/master/bootstrap-typeahead.js")
			return;
		}

		this.$input.mention(this.options.mention)
	},

	setupMarkdownPreview: function(){

		if( !this.options.markdownPreview || this.editorTagName != 'textarea' ) return;
		
		if( typeof marked == 'undefined' ){
			console.warn('ModelEditor: `markdownPreview` option cannot be used as the `marked` library was not found.')
			return;
		}

		this.$preview = $('<div class="markdown-preview standard-text"></div>')
			.appendTo(this.$inner);

		this.$inner.prepend('<a class="markdown-preview-btn" title="Toggle markdown preview"></a>')
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
		this.subview('attachments') && this.subview('attachments').disable();
		return this._disable();
	},
	
	enable: function(){
		this.$input.attr('disabled', false);
		this.subview('attachments') && this.subview('attachments').enable();
		return this._enable();
	},

	toggleMarkdownPreview: function(e){

		var val = this.newVal() || 'Nothing to preview';

		this.$preview.html( marked(val) ); 
		
		e.currentTarget.classList.toggle('active');
	},

	setupAttachmentUpload: function(){

		// not sure I want this...
		if( this.editorTagName != 'textarea' ) return;

		if( !this.options.attachments ) return;

		var settings = _.extend(
			this.options.attachments,	// instance settings
			{
				el: this.el,
				dropEl: this.$input[0]
			})

		this.subview('attachments', new Attachment(settings))
		this.listenTo(this.subview('attachments'), 'upload:success', this.attachmentUploadSuccess)
	},

	attachmentUploadSuccess: function(resp, file, xhttp){

		//var link = resp.data.link;

		//var str = '!['+file.name+']('+link+')';
		var str = resp.data.markdown;

		var val = this.$input.val(),
			caratPos = this.$input[0].selectionStart;

		// add new lines if needed
		if( val && val.match(/.\n$/))
			val += "\n"
		else if( val && !val.match(/\n\n$/))
			val += "\n\n"
			
		// put the attachment where the user's carat is
		var textBefore = val.substring(0, caratPos),
			textAfter = val.substring(caratPos),
			val = textBefore + (textBefore?"\n\n":'') + str + textAfter;

		this.$input.val( val );
		
		// put the carat back in the same position (well, after the new attachment insert)
		this.$input[0].selectionStart = this.$input[0].selectionEnd = val.length - textAfter.length

		this.updateAfterDelay();
	}
	
})





ModelEditors.date = ModelEditors.input.extend({
	
	events: {
		'focus input': 'onFocus',
		'keyup input': 'onKeyUp',
		'click .button.save': 'saveBtnAction',
		'click .button.cancel': 'cancelBtnAction',
	},
	
	editorClassName: 'input date',
	
	val: function(){
		var val = this._val();
		
		if(val && val !== '-')
			val = (new XDate(val)).toString('MM/dd/yyyy');
			
		return val;
	},
	
	newVal: function(){
		var val = this._newVal();
		
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
		var el = this.$input.data('datepicker').dpDiv[0];
		el.removeEventListener('click', this.stopPropagation);
		el.addEventListener('click', this.stopPropagation, false);
		
	},

	stopPropagation: function(e){
		e.stopPropagation();
		e.cancelBubble = true; // setting this will make dropdown close cancel
		return false;
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
		'keydown textarea': 'onKeyDown',
		'keypress textarea': 'onKeyPress',
		'click .button.save': 'saveBtnAction',
		'click .button.cancel': 'cancelBtnAction',
		'click .markdown-preview-btn': 'toggleMarkdownPreview'
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

	onKeyDown: function(e){
		if( e.which == 8 ) // delete key
			this.updateAfterDelay()

		this.doAutoResize();
	},
	
	render: function(){
		_.defer(_.bind(this.doAutoResize,this))
	}
})
