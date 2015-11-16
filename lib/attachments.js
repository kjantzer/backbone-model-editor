/*
	Attachments.js 0.5.0

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
		theme: '', // overlay
		showSpinner: true,
		
		apiURL: '/api/attachment',
		accept: true, // preset string, function, or `true` for all file types
		acceptErrorTitle: '[num] Invalid Attachment{s}',
		acceptErrorMsg: 'Wrong file type. Allowed files: <u>[accepted]</u>',
		confirm: null, // function(files, done){ done(); },

		formData: null, // {} or function returning {}
		headers: null, // optionally set headers for AJAX

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
		},
		'txt': function(file){
			return file.type.match(/text.*/) ? true : false
		}
	},

	initialize: function(opts){

		this.options = _.extend({}, this.defaultOpts, opts||{});

		this.$el.addClass('attachment-upload-allowed');

		if( this.options.theme )
			this.$el.addClass('attachment-theme-'+this.options.theme);

		var dropEl = this.options.dropEl || this.el;

		this.el.setAttribute('data-attachment-description', this._acceptStr(this.options.description))
		//dropEl.setAttribute('data-attachment-description', this.options.description)

		dropEl.addEventListener('dragover', this.onDragOver.bind(this), false);
		dropEl.addEventListener('dragleave', this.onDragLeave.bind(this), false);
		dropEl.addEventListener('drop', this.onDrop.bind(this), false);
	},

	_acceptStr: function(str){
		if( !str ) return '';
		var accept = this.options.accept;
		accept = typeof accept === 'string' ? accept : '';
		return str.replace('[accepted]', accept);
	},

	onDragOver: function(e){

		e.preventDefault();

		if( !this.isDisabled )
			this.$el.addClass('drag-over')
	},

	onDragLeave: function(e){

		e && e.preventDefault();

		// keeps the constant toggling of dragover/leave in child el
		if( e && this.el != e.target && this.el.contains( e.target ) ) 
			return;

		this.$el.removeClass('drag-over')
	},

	onDrop: function(e){
		
		e && e.preventDefault();

		this.onDragLeave();

		if( this.isDisabled ) return;

		var dt    = e.dataTransfer;
		var files = dt.files;

		// if all files dropped are acceptable
		if( this._acceptableFiles(files) === true )
			this._confirm(files, this._uploadFiles.bind(this, files))
		
		return false;
	},

	_confirm: function(files, done){

		// use given confirm logic to continue
		if( this.options.confirm )
			this.options.confirm.call(this, files, done)

		// else, just continue uploading with no confirmation
		else
			done();
	},

	_acceptFile: function(file){

		if( this.options.accept === true )
			return true;

		if( typeof this.options.accept === 'function' )
			return this.options.accept(file)

		if( this._acceptPresets[this.options.accept] )
			return this._acceptPresets[this.options.accept].call(this, file);

		if( typeof this.options.accept == 'string' )
			return file.type.match(new RegExp(this.options.accept)) ? true : false
	},

	_acceptableFiles: function(files){

		var invalid = [];

		if( this.options.accept === true )
			return true;

		for (var i=0; i<files.length; i++) {

			if( this._acceptFile( files[i] ) != true )
				invalid.push(files[i])
		}

		if( invalid.length > 0 )
			return Modal.alert( _.plural(this.options.acceptErrorTitle, invalid.length), this._acceptStr(this.options.acceptErrorMsg));

		return true;
	},

	_uploadFiles: function(files){
		
		for (var i=0; i<files.length; i++) {

			var file = files[i];

			this.upload(file);
		}
	},

	upload: function(file){

		var xhttp    = new XMLHttpRequest(),
			self     = this,
			fd       = new FormData();

		this.options.showSpinner && Modal.spinner();

		fd.append('files', file);
		fd.append('src', this.options.src);

		// append extra form data if given
		if( this.options.formData ){
			var formData = _.isFunction(this.options.formData) ? this.options.formData() : this.options.formData;

			_.each(formData, function(val, key){ fd.append(key, val); })
		}

		// was posting to Imgur requested?
		if( this.options.useImgur && file.type.match(/image.*/) ){
			xhttp.open('POST', this.options.imgurURL);
			xhttp.setRequestHeader('Authorization', 'Client-ID '+this.options.imgurClientID);
		}else{
			xhttp.open('POST', this.options.apiURL);
			
			if( this.options.headers )
				_.each(this.options.headers, function(val, key){
					xhttp.setRequestHeader(key, val);
				})
		}
		
		xhttp.onreadystatechange = function () {

			// SUCCESS
			if (xhttp.status === 200 && xhttp.readyState === 4) {
				var resp = JSON.parse(xhttp.responseText);

				if( resp.length == 1 )
					resp = resp[0];

				self.uploadSuccess(file, resp, xhttp);

			// FAILED
			}else if( xhttp.readyState === 4 ){
				self.uploadFailed(file, resp, xhttp);
			}
		};

		xhttp.send(fd);
	},

	uploadSuccess: function(file, resp, xhttp){
		this.options.showSpinner && Modal.spinner(false);
		this.trigger('upload:success', resp, file, xhttp)
	},

	uploadFailed: function(file, resp, xhttp){
		this.options.showSpinner && Modal.spinner(false);
		Modal.alert('Upload Unsuccessful');
		this.trigger('upload:fail', resp, file, xhttp)
	},

	readFile: function(file, callback){

		var reader = new FileReader();

		reader.onload = function(e) {
			
			var text = reader.result;

			if( file.type == "text/csv" )
				text = this.csv_to_array(text);
			else
				text = this.csv_to_array(text, "\t");
			
			callback && callback(text);

		}.bind(this)

		reader.readAsText(file);
	},


	// ref: http://stackoverflow.com/a/1293163/2343
    // This will parse a delimited string into an array of
    // arrays. The default delimiter is the comma, but this
    // can be overriden in the second argument.
    csv_to_array: function( strData, strDelimiter ){
        
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
            );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;

        strData = strData.trim();

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
                ){

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push( [] );

            }

            var strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];

            }


            // Now that we have our value string, let's add
            // it to the data array.
            arrData[ arrData.length - 1 ].push( strMatchedValue );
        }

        // Return the parsed data.
        return( arrData );
    }

})