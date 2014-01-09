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
		
		this.render();
		
		_.defer(this.doAutoResize.bind(this));
		
		this.delegateEvents();
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
