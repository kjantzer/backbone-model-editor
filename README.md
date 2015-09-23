Backbone Model Editor
============================

>Easily edit your backbone models with inputs, textareas, date pickers, and more.

![](https://img.shields.io/npm/v/backbone-model-editor.svg)

![preview](http://i.imgur.com/9W3Hm1T.png)

Creating a typical app requires various forms with inputs. This plugin makes creating inputs, selects, notes fields and others simple.

Rich text editor available with [Redactor](http://redactorjs.com) plugin

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
    this.editor.insert('input', 'model_key', {validate: 'Number'});

Then when you want to save the changes, call:
    
    this.editor.save();

If you want the model to save automatically whenver an input changes, add "autoSave" option

    this.editor = new ModelEditor({
        model:this.model, 
        el:this.el, 
        autoSave:true
    });
