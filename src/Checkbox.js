/*
	Tribox - checkbox with 3 states: unset, off, on
	
	pass "allowEmptyState:false" to make it a normal 2 state checkbox
	
	set "valType: 'timestamp'" to use current timestamp as "selected" value.
*/

ModelEditors.checkbox = ModelEditors.Base.extend({

	editorTagName: 'span',
	
	editorClassName: 'checkbox',
	
	events: {
		'click span.checkbox' : 'onClick',
		'focus span.checkbox': 'onFocus',
		'blur span.checkbox': 'onBlur'
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
		
		this.$input = $('<'+this.editorTagName+' class="checkbox" tabindex="0"></'+this.editorTagName+'>')
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

	onFocus: function(){
		this._onSpace = this._onSpace || this.onSpace.bind(this);
		document.addEventListener('keypress', this._onSpace)
	},

	onBlur: function(){
		document.removeEventListener('keypress', this._onSpace);
	},

	onClick: function(){
		this.toggle();
	},

	onSpace: function(e){

		// if this input is no longer the active element, the onspace event should not be listened to anymore
		if( document.activeElement !== this.$input[0] )
			return this.onBlur();

		if( e.which == 32 ){ // space bar
			e.preventDefault();
			this.toggle();
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
	
	toggle: function(){
	
		if( this.isDisabled ) return
		
//		if( this.options.validate && this.options.validate(this.state()) !== true )
//			return;
		
		clearTimeout(this.saveTimeout);
		
		// remove current state class
		this.$el.add(this.$input).removeClass( this.state() );
		
		// update value
		this.value = this.nextVal();
		
		// add new state class
		this.$el.add(this.$input).addClass( this.state() );
		
		this.$el.attr('data-val', this.saveVal());
		
		// delay the save function by 500ms to see if the user clicks the input again
		this.saveTimeout = setTimeout(_.bind(this.updateVal,this),300);
		
	}

});


ModelEditors.tribox = ModelEditors.checkbox.extend({
	allowEmptyState: true
})