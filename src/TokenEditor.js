
var ModelEditorTokenEditor; require(['token-editor'], function(te){ ModelEditorTokenEditor = te; });

ModelEditors.tokentextarea = ModelEditors.Base.extend({
	
	events: {
		// 'click .button.save': 'saveBtnAction',
		// 'click .button.cancel': 'cancelBtnAction',
		// 'click .markdown-preview-btn': 'toggleMarkdownPreview'
	},
	
	keyEvents: {
		'27': 'cancelBtnAction', // esc
	},
	
	initialize: function(opts){
		
		window.meTokenEditor = this;
		
		this.options = _.extend({
			placeholder: 'auto',
			w: 400,
			btns: false,
			updateAfterDelay: false,// update instead of waiting for "blur" event
			
		}, this.options, opts)

		
		this.init(); // init base
		
		if( !ModelEditorTokenEditor ){
			this.$inner.html('<p>Cannot initialize. <b>Token Editor</b> plugin needed.</p>')
			return;
		}
		
		// this.$input = $('<'+this.editorTagName+'></'+this.editorTagName+'>')
		// 	.val( this.val() )
		// 	.attr(this.editorAttributes)
		// 	.appendTo(this.$inner);
			
		this.tokenEditor = new ModelEditorTokenEditor({
			value: this.val(),
			items: this.options.autoComplete
		});
		
		this.$inner.append( this.tokenEditor.el )

		this.origVal = this.val();
			
		// this.setVal();
		this.setWidth();
		// this.setupBtns();
		// this.setupUnsavedVal();
		
		this.render();
		
		this.delegateEvents();
	},
	
	render: function(){
		this.tokenEditor && this.tokenEditor.render();
	},
	
	newVal: function(){
		return this.tokenEditor.toJSON();
	},
	
	setAutoCompleteItems: function(items){
		this.tokenEditor && this.tokenEditor.setAutoCompleteItems(items)
	},
	
	setWidth: function(){
		if(!this.options.w) return;
		this.$inner.width(this.options.w);
	},

});