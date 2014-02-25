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