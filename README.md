BackboneJS: ModelEditor View
============================

Easily edit your backbone models with inputs, textareas, and more. Rich text editor available with [Redactor](http://redactorjs.com) plugin

![preview](http://i.imgur.com/AwTBAXC.png)
***

### Example use

    this.editor = new ModelEditor({
        model:this.model, 
        el:this.el,
        defaultOpts: {	// default opts for each editor element
        	w: 120,
        	placeholder: 'auto' // create place
        	btns: true	// give inputs their own save/cancel buttons
        }
    });
    
    this.editor.insert('input', 'model_key');
    this.editor.insert('input', 'model_key', {w:250});

Then when you want to save the changes, call:
    
    this.editor.save();

If you want the model to save automatically whenver an input changes, add "autoSave" option

    this.editor = new ModelEditor({
        model:this.model, 
        el:this.el, 
        autoSave:true
    });