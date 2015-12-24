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

	defaultOpts: {
		w: 200,
		values: null
	},
	
	use: 'value', // index, value, lowercase, uppercase
	
	initialize: function(opts){
	
		this.options = _.extend({}, this.defaultOpts, opts);
		
		if( this.options.values )
			this.values = this.options.values;
		
		this.init(); // init base
		
		this.value = this.val() === null ? 'null' : this.val();
		
		this.$input = this.createInput();
			
		this.addOptions();
		
		this.setWidth();
		this.setHeight();
		
		this.onUpdateVal();
		this.listenTo(this.model, 'change:state', this.onUpdateVal);
		
		this.render();
	},

	createInput: function(){
		return $('<select></select>')
			.appendTo( this.$inner )
			.attr(this.editorAttributes)
	},
	
	updateValues: function(vals){
		this.values = vals;
		this.$input.html('');
		this.addOptions();
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

	setHeight: function(){},
	
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


/*
	Multi Select
*/
ModelEditors.multiselect = ModelEditors.select.extend({

	editorClassName: 'multiselect',

	editorAttributes: {
		'class': 'multiselect'
	},

	events: {
		'click li' : 'onOptionSelect',
		'mouseleave' : 'onMouseLeave',
		'a.select-all': 'selectAll',
		'a.select-none': 'deselectAll'
	},

	defaultOpts: {
		w: 200,
		values: null,
		valueType: 'csv', // or array
		saveDelay: 2000,
		infoBar: true,
		dynamicHeight: true
	},

	createInput: function(){

		var $wrap = $('<div class="multiselect wrap"></div>')
			.appendTo( this.$inner );

		if( this.options.infoBar === true ){
			$wrap.append('<div class="bar">\
							<span class="info"></span>\
							<a class="select-none">None</a>\
							<a class="select-all">All</a>\
						</div>')

			this.$('.bar a.select-all').click(this.onSelectAll.bind(this));
			this.$('.bar a.select-none').click(this.onDeselectAll.bind(this));
		}

		var $ul = $('<ul></ul>')
			.appendTo( $wrap )
			.attr(this.editorAttributes)

		return $ul;
	},

	newVal: function(){
		return this.selectedVals;
	},

	setInfoLabel: function(){
		var msg = this.selectedVals.length +' Selected';

		this.$('.bar .info').html(msg);
	},

	addOptions: function(){
		
		if( !this.values ){
			console.error('ModelEditor: you need to add a “values“ attribute');
			return;
		}

		this.selectedVals = [];
		
		var values = _.isFunction( this.values ) ? this.values() : this.values;
		
		_.each(values, _.bind(this.addOption, this));
		
		this.setInfoLabel();
	},

	addOption: function(option, indx){
		
		var $option = $('<li></li>');
		
		if( _.isObject(option) ){
			
			if( option.val === '-' || option.val === '' || option.val === '0')
				return;

			$option
				.attr('data-val', option.val)
				.html(option.label)
			
		}else{
			
			$option
				.attr('data-val', this.use==='index' ? indx : this.optionVal(option) )
				.html(option)
		}

		if( _.contains(this.val(), $option.attr('data-val')) ){
			$option.addClass('selected');

			this.selectedVals = this.selectedVals || [];
			this.selectedVals.push($option.attr('data-val'))
		}
		
		$option.appendTo(this.$input);
	},

	onOptionSelect: function(e){
		
		clearTimeout(this.saveTimeout);
		this.saveTimeout = null;

		var el = e.currentTarget;
		var val = el.dataset.val;
		var selectedIndx = _.indexOf(this.selectedVals, val)

		// ALREADY SELECTED
		if( selectedIndx > -1 ){

			// holding ctrl OR this is only one selected
			// if( this.selectedVals.length == 1){
			// 	this.deselect(val)
			if( _.metaKey() && this.selectedVals.length > 1 ){
				this.deselectAll();
				this.select(val)
			}else
				this.deselect(val)

		// NOT SELECTED
		}else{

			/*if( e.shiftKey ){

			}else*/ if( !_.metaKey() ){

				this.select(val)

			}else{
				this.deselectAll();
				this.select(val)
			}
		}

		this.setInfoLabel();

		this.saveTimeout = setTimeout(this.doSave.bind(this), this.options.saveDelay);

	},

	onSelectAll: function(){
		this.selectAll();
		this.setInfoLabel();
		this.saveTimeout = setTimeout(this.doSave.bind(this), this.options.saveDelay);
	},

	onDeselectAll: function(){
		this.deselectAll();
		this.setInfoLabel();
		this.saveTimeout = setTimeout(this.doSave.bind(this), this.options.saveDelay);
	},

	onMouseLeave: function(){
		if( this.saveTimeout )
			this.doSave();
	},

	doSave: function(){
		clearTimeout(this.saveTimeout);
		this.saveTimeout = null;
		this.updateVal();
		this.setInfoLabel();
	},

	select: function(val){
		this._select( null, this.$input.find('[data-val="'+val+'"]')[0] )
	},

	deselect: function(val){
		this._deselect( null, this.$input.find('[data-val="'+val+'"]')[0] )
	},

	selectAll: function(){
		this.$input.find('li').each(this._select.bind(this))
	},

	deselectAll: function(){
		this.$input.find('li').each(this._deselect.bind(this))
	},

	/*forRange: function(first, second, callback){
		var start = first < second ? first : second;
		var last = first > second ? first : second;

		this.$input.find('li').each(function(indx, el){
			console.log(el);
		})
	},*/

	_select: function(indx, el){
		el.classList.add('selected')
		if(_.indexOf(this.selectedVals, el.dataset.val) == -1 ) this.selectedVals.push(el.dataset.val);
	},

	_deselect: function(indx, el){	
		el.classList.remove('selected')
		this.selectedVals.splice( _.indexOf(this.selectedVals, el.dataset.val), 1);
	},

	setWidth: function(){
		if(!this.options.w) return;
		
		this.$inner.width(this.options.w);
		//this.$input.width(this.options.w);
	},

	setHeight: function(){
		if( this.options.h )

		this.$input.css(this.options.dynamicHeight?'maxHeight':'height', this.options.h);
	}

}) // multiselect


