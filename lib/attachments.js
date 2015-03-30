/*
	Attachments.js 0.2.0

	@author Kevin Jantzer, Blackstone Audio
	@since 2015-02-30

	https://gist.github.com/kjantzer/6b97badbafd7042c730b

	Inspired from:
	https://gist.github.com/pinceladasdaweb/9807321
	http://www.htmlgoodies.com/html5/javascript/drag-files-into-the-browser-from-the-desktop-HTML5.html

	The script uses [Backbone Modal](https://github.com/kjantzer/backbonejs-modal-view) to display spinners and alerts

	Use:  
	```javascript
	var attachment = new Attachment({el: yourElement})
	
	attachment.on('upload:success', function(resp, file, xhttp){
		console.log(resp);
	}})

	// failed handler
	attachment.on('upload:fail', function(resp, file, xhttp){})
	```

	Methods:
	```javascript
	attachment.disable();
	attachment.enable();
	```
*/

var Attachment = Backbone.View.extend({

	disable: function(){ this.isDisabled = true; },
	enable: function(){ this.isDisabled = false; },

	defaultOpts: {

		dropEl: null, // defaults to `this.el`
		src: null,
		description: 'Drag and drop to attach [accepted] files',
		
		apiURL: '/api/attachment',
		accept: true, // preset string, function, or `true` for all file types
		acceptErrorMsg: 'Wrong file type. Allowed files: <u>[accepted]</u>',

		useImgur: false, // if true, photos will be uploaded to imgur rather than defined API
		imgurURL: 'https://api.imgur.com/3/image',
		imgurClientID: 'eae3f1705c4b525' //Get yout Client ID here: http://api.imgur.com/
	},

	_acceptPresets: {
		'image': function(file){
			return file.type.match(/image.*/) ? true : false
		},
		'excel': function(file){
			return file.type.match(/excel.*/) ? true : false
		},
		'pdf': function(file){
			return file.type.match(/pdf.*/) ? true : false
		}
	},

	initialize: function(opts){

		this.options = _.extend(this.defaultOpts, opts||{});

		this.$el.addClass('attachment-upload-allowed');

		var dropEl = this.options.dropEl || this.el;

		this.el.setAttribute('data-attachment-description', this._acceptStr(this.options.description))
		//dropEl.setAttribute('data-attachment-description', this.options.description)

		dropEl.addEventListener('dragover', this.onDragOver.bind(this), false);
		dropEl.addEventListener('dragleave', this.onDragLeave.bind(this), false);
		dropEl.addEventListener('drop', this.onDrop.bind(this), false);
	},

	_acceptStr: function(str){
		var accept = this.options.accept;
		accept = typeof accept === 'string' ? accept : '';
		return str.replace('[accepted]', accept);
	},

	onDragOver: function(){
		if( !this.isDisabled )
			this.$el.addClass('drag-over')
	},

	onDragLeave: function(){
		this.$el.removeClass('drag-over')
	},

	onDrop: function(e){

		this.onDragLeave();

		if( this.isDisabled ) return;

		e.preventDefault(); // stops the browser from redirecting off to the image.

		var dt    = e.dataTransfer;
		var files = dt.files;
		
		for (var i=0; i<files.length; i++) {

			var file = files[i];
			var reader = new FileReader();

			window.reader = reader;

			this.upload(file);
		}
		
		return false;
	},

	_acceptUpload: function(file){

		if( this.options.accept === true )
			return true;

		if( typeof this.options.accept === 'function' )
			return this.options.accept(file)

		if( this._acceptPresets[this.options.accept] )
			return this._acceptPresets[this.options.accept].call(this, file);

		if( typeof this.options.accept == 'string' )
			return file.type.match(new RegExp(this.options.accept)) ? true : false
	},

	upload: function(file){

		if( this._acceptUpload(file) != true )
			return Modal.alert('Invalid Attachment', this._acceptStr(this.options.acceptErrorMsg));

		var xhttp    = new XMLHttpRequest(),
			self     = this,
			fd       = new FormData();

		Modal.spinner();

		fd.append('files', file);
		fd.append('src', this.options.src);

		if( this.options.useImgur && file.type.match(/image.*/) ){
			xhttp.open('POST', this.options.imgurURL);
			xhttp.setRequestHeader('Authorization', 'Client-ID '+this.options.imgurClientID);
		}else{
			xhttp.open('POST', this.options.apiURL);
		}
		
		xhttp.onreadystatechange = function () {

			if (xhttp.status === 200 && xhttp.readyState === 4) {
				var resp = JSON.parse(xhttp.responseText);

				if( resp.length == 1 )
					resp = resp[0];

				self.uploadSuccess(file, resp, xhttp);

			}else if( xhttp.readyState === 4 ){
				this.uploadFailed(file, resp, xhttp);
			}
		};
		xhttp.send(fd);
	},

	uploadSuccess: function(file, resp, xhttp){
		Modal.spinner(false);
		this.trigger('upload:success', resp, file, xhttp)
	},

	uploadFailed: function(file, resp, xhttp){
		Modal.spinner(false);
		Modal.alert('Upload Unsuccessful');
		this.trigger('upload:fail', resp, file, xhttp)
	}

})