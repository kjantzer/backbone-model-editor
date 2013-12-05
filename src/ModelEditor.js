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
	
	render: function(){
		this.trigger('render');
	},
	
	cleanReset: function(){
		this.reset();
	},
	
	reset: function(resetData){
		this.editmodel.clear({silent:true})
		this.editmodel.set(resetData||this.model.toJSON(), {silent:true});
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



