/*
	RTE
	
	extends Textarea to add a rich text editor.
	
	requires
		• Redactor JS <http://redactorjs.com>
*/

ModelEditors.rte = ModelEditors.textarea.extend({

	editorClassName: 'textarea rte',

	events: {
		'blur .redactor_editor': 'onBlur',
		'focus .redactor_editor': 'onFocus',
		'focus textarea': 'onFocus',
		'keyup .redactor_editor': 'onKeyUp',
		'click .button.save': 'saveBtnAction',
		'click .button.cancel': 'cancelBtnAction'
	},

	render: function(){
	
		this.model.on('reset', this.cleanup, this);
	
		var opts = this.options;
		var plugins = ['fullscreen'];
		var buttons = ['formatting', 'specialCharacters', 'bold', 'italic', 'fullscreen'];
		var allowedTags = ["a", "p", "blockquote", "b", "i", 'strong', 'em', 'h1', 'h2', 'ul', 'ol', 'li'];
		var formattingTags = ['p', 'blockquote'];
		
		if( opts.allowBR === true )
			allowedTags.push('br');
		
		switch(opts.toolbar){
			
			case 'nano':
				plugins = false;
				buttons = [ 'bold', 'italic'];
				allowedTags = ["p", "b", "i", 'strong', 'em'];
				break;
			
			case 'micro':
				plugins = false;
				buttons = ['specialCharacters', 'bold', 'italic'];
				allowedTags = ["p", "b", "i", 'strong', 'em'];
				break;
			
			case 'regular':
				buttons = ['formatting', 'specialCharacters', 'bold', 'italic', 'unorderedlist', 'orderedlist', 'link', 'alignleft', 'aligncenter'];
				break;
			
			case 'mini':
			default:
				buttons = ['formatting', 'specialCharacters', 'bold', 'italic', 'unorderedlist', 'orderedlist', 'link'];
				break;
			
		}
		
		
		if(User.can('view-html-in-rte'))
			buttons.push('html');
		
		// if not autoresize defined and height is set to "auto", thet assume we want autoresize=true
		if(opts.autoresize === undefined && opts.h === 'auto')
			opts.autoresize = true;
		
		function insertSpecialCharacter(obj, e, key){
			obj.setBuffer();
			obj.insertHtml(key);
			obj.syncCode();
		}
		
		
		this.$input.redactor({
			plugins: plugins
			, buttons: buttons
			, allowedTags: allowedTags
			, formattingTags: formattingTags
			, autoresize: opts.autoresize===undefined?true:opts.autoresize
			, buttonsCustom: {
	            specialCharacters: {
	                title: "Special Characters",
	                dropdown: {
	                    "“": {title: '“ Quote Left', callback: insertSpecialCharacter},
	                    "”": {title: '” Quote Right', callback: insertSpecialCharacter},
	                    "‘": {title: '‘ Single Quote Left', callback: insertSpecialCharacter},
	                    "’": {title: '’ Single Quote Right', callback: insertSpecialCharacter},
	                    "—": {title: '— Em-Dash', callback: insertSpecialCharacter},
	                    "–": {title: '— En-Dash', callback: insertSpecialCharacter},
	                    "…": {title: '… Ellipsis', callback: insertSpecialCharacter}
	                }
	            }
	        }
			, keyupCallback: function(obj, evt){
			
				//if(opts.autoresize)
					//$elem.height(obj.$editor.outerHeight(true)-22);
				
			}
			, callback: function(obj){
				
				/*
				setTimeout(function(){ // we use an empty timeout cause for some reason it fixes a bug where the text moves up on focus
					obj.$editor.focus();
					
					if(opts.autoresize){
						$elem.height(obj.$editor.outerHeight(true)-22);
						obj.$frame.height(obj.$editor.outerHeight(true)-18);
					}
					
				});
				*/
				
			}
		});
		
	},
	
	
	saveBtnAction: function(){
		this.updateVal();
		
		this.origVal = this.newVal(); // update orig value to the new val
		this.$input.val( this.origVal ); // update input so we get the "cleaned" version
		this.$input.setCode(this.origVal)
		
		this.edit(false);
		
		this.$el.find('.redactor_editor').blur();
	},
	
	cancelBtnAction: function(){
		this.$input.val( this.origVal );
		this.$input.setCode(this.origVal)
		this.edit(false);
		
		this.$el.find('.redactor_editor').blur();
	},
	
	destroyEditor: function(){
		this.$input.destroyEditor();
	},
	
	cleanup: function(){
		this.destroyEditor();
		this.model.off(null, null, this);
	}

});
