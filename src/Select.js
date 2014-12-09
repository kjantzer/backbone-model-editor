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

ModelEditors.selectPartnerDeal = ModelEditors.select.extend({
	values: function(){
		return [{label: '-', val: null}].concat(Deals.toSelectID(function(m){ return m.label() }))
	}
})

ModelEditors.selectGender = ModelEditors.select.extend({	
	
	values: [
		{label: '-', val: ''},
		{label: 'Male', val: 'M'},
		{label: 'Female', val: 'F'}
	]
	
})

ModelEditors.selectYesNo = ModelEditors.select.extend({	
	values: [
		{label: '-', val: ''},
		{label: 'Yes', val: '1'},
		{label: 'No', val: '0'}
	]
})

ModelEditors.selectBookEdition = ModelEditors.select.extend({
	values: function(){return lookup.selects.bookBookEdition.asSelect()}
})

ModelEditors.selectBookLanguage = ModelEditors.select.extend({
	values: [
		'English',
		'French',
		'German',
		'Jamaican',
		'Marathi',
		'Spanish',
		'Italian',
		'Arabic',
		'Chinese',
		'Japanese',
		'Russian',
		'Greek',
		'Portuguese',
		'Dutch',
		'Turkish',
		'Polish',
		'Cantonese'
	]
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
	values: ['Adult', 'Young Adult (12-17)', 'Children (10-12)', 'Children (6-9)', 'Children (3-5)']
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
		{label: '-', val: null},
		{label: 'Approval Not Required', val: 1}, 
		{label: '​Approval Not Required for Ordinary Course of Business', val:2}, 
		{label: 'Approval Not Required for Ordinary Course of Business (Sales/Mergers allowed)', val: 3},
		{label: 'Approval Required (Sales/Mergers allowed)', val: 4},
		{label: 'Approval Required', val: 5}
	]
});



ModelEditors.selectProductionPaymentType = ModelEditors.select.extend({
	values: [
		{label: 'Contact (company)', val: 1}, 
		{label: '​Person', val:2},
	]
});

ModelEditors.selectProductionPaymentAssortedCostFee = ModelEditors.select.extend({
	values: [
		{label: 'Manuscript Fees', val: '0'}, 
		{label: '​Studio Costs', val: '​1'},
	]
});

ModelEditors.selectContractRemainderDuration = ModelEditors.select.extend({
	values: [
		{label: '-', val: null},
		{label: '6 months', val: '6 months'}, 
		{label: '​12 months', val:'12 months'},
		{label: '​18 months', val:'18 months'},
		{label: '​Not specified', val:'Not specified'},
		{label: 'Termination', val:'Termination'},

	]
});

ModelEditors.selectContractRemainderFinancialObligation = ModelEditors.select.extend({
	values: [
		{label: '-', val: null}, 
		{label: '10% of all money recieved after cost', val:'10% of all money recieved after cost'},
		{label: '10% of all money recieved', val:'10% of all money recieved'},
		{label: 'Other', val:'Other'},
	]
});

ModelEditors.selectRecordingProducer = ModelEditors.select.extend({
	values: [
		{label:'-', val:null}, 
		{label:'BSA', val:'BSA'}, 
		{label:'RI', val:'RI'}
	]
});



ModelEditors.selectDealTerritoryChoice = ModelEditors.select.extend({
	use: 'lowercase',
	values: [
		'-',
		'Inherit',
		'Assign',
	]
})