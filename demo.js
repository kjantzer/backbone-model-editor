

window.SmallDemo = Backbone.View.extend({
	
	el: '#small-demo',
	
	initialize: function(){
		
		this.model = new Backbone.Model({
			name: '',
			email: '',
			gender: null,
			notes: null
		});
		
/*
	THIS IS WHERE THE MAGIC HAPPENS
*/
		this.editor = new ModelEditor({
			model: this.model,
			el: this.el,
			autoSave: false,
			saveToDB: false,
			defaultOpts: {			// set the default options for all editors (these can be overridden at anytime
				w: 100,
				clear: false,
				labelStyle: 'small'
			}
		})
		
		// show the model values everytime there is a change in the editor
		this.editor.editmodel.on('change', this.showOutput, this);
		this.editor.editmodel.on('reset', this.render, this);
		
		this.$output = $('#output');
		
		this.render();
	},
	
	render: function(){
		
		this.$el.html('');

		this.editor.cleanup();
		
/*
	THIS IS WHERE THE MAGIC HAPPENS
	
	editors can be created with one liners
*/
		this.editor.defaultOpts({renderTo:$('<div></div>').appendTo(this.$el)})
		this.editor.insert('input', 'name', {w: 160});
		this.editor.insert('select', 'gender', {values: [{label:'-', val:null}, 'Male', 'Female']});
		this.editor.insert('input', 'email', {w: 276, clear: true, validate: 'email', validateMsg: ''});
		
		this.editor.defaultOpts({renderTo:$('<div></div>').appendTo(this.$el)})
        this.editor.insert('textarea', 'notes', {clear: true, w: 300, h: 75, markdownPreview: true, attachments: false});
		
		this.showOutput();
		this.delegateEvents();
	},
	
	reset: function(){
		this.editor.reset();
		this.showOutput();
		this.render();
	},
	
	showOutput: function(){
		this.$output.html( JSON.stringify(this.editor.editmodel.toJSON()) );
	}
	
})




window.demo = Backbone.View.extend({
	
	className: 'demo',
	
	initialize: function(opts){
		
		this.editors = opts.editors || [];
		
		this.model = new Backbone.Model({});
		
		this.editor = new ModelEditor({
			model: this.model,
			el: this.el,
			autoSave: false,
			saveToDB: false,
			defaultOpts: _.extend({			// set the default options for all editors (these can be overridden at anytime
				w: 400,
				clear: true,
				labelStyle: 'small',
				validateMsg: ''
			}, opts.defaultOpts||{})
		})
		
		// show the model values everytime there is a change in the editor
		this.editor.editmodel.on('change', this.showOutput, this);
		this.editor.editmodel.on('reset', this.render, this);
		
		this.$output = $('<pre class="demo-results"></pre>').appendTo(this.el);
		
		this.render();
	},
	
	render: function(){
		
		this.$el.html('');

		this.editor.cleanup();
		
		_.each(this.editors, function(args){
			
			this.editor.insert.apply(this.editor, args)
			
		}.bind(this))
		
		this.$output.appendTo(this.el);
		
		this.showOutput();
		
		return this;
	},
	
	showOutput: function(){
		this.$output.html( JSON.stringify(this.editor.editmodel.toJSON(), null, '  ') );
	}

});


$(function() {

	// start the new app
	window.smallDemo = new SmallDemo();
	
});