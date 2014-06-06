Backbone.Model.prototype.templateData = function(){
	
	var that = this;
	var data = this.toJSON();
	
	// for each attribute, look for models and collections to convert
	_.each(this.attributes, function(attr, key){
		
		// is this attribute a Model?
		if( attr instanceof Backbone.Model && attr.displayVal )
			data[key] = attr.displayVal();
			
		// is it a collection?
		else if( attr instanceof Backbone.Collection )
			data[key] = attr.templateData();
		
	})
	
	if( this._templateData )
	_.each(this._templateData, function(val, key){
		data[key] = _.isFunction(val) ? val.call(that, val) : (that[val] && _.isFunction(that[val]) ? that[val].call(that) : val);
		
		if( data[key] instanceof Backbone.Model )
			data[key] = data[key].templateData()
	})
	
	return data;
}

Backbone.Collection.prototype.templateData = function(){return this.map(function(m){return m.templateData()})}


Backbone.Collection.prototype.toSelectID = function(labelKey, valKey){
	return this.map(function(m){ return {'label':(labelKey?m.get(labelKey):m.id), 'val':(valKey?m.get(valKey):m.id)} })
}

Backbone.Collection.prototype.saveToCSV = function(downloadName){
	downloadName = downloadName ? downloadName : 'CSV data '+(new Date()).getTime();
	
	if( this.length == 0 )
		return console.log('No data to export');
	
	var data = [_.keys(this.first().templateData())].concat(this.map(function(m){return _.values(m.templateData())}));
	
	data = _.map(data, function(row){
	
		return _.map(row, function(val){
			if( _.isString(val) && val.match(/,|\n|"/) )
				val = '"'+val+'"';
				
			return val;
		})
	})
	
	var csvContent = "data:text/csv;charset=utf-8,";
	data.forEach(function(infoArray, index){
	
	   dataString = infoArray.join(",");
	   csvContent += index < data.length ? dataString+ "\n" : dataString;
	
	}); 
	
	var encodedUri = encodeURI(csvContent);
	var link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", downloadName+".csv");
	
	link.click();
}


// default Render Template method
Backbone.View.prototype.renderTemplate = function(data, template){
	if( !data && this.model && this.model.templateData )
		this.$el.html( _.template(template||this.template, this.model.templateData()) );
	else
		this.$el.html( _.template(template||this.template, data||{}) );
}


// change underscore template system (http://underscorejs.org/#template) 
// to use "mustache" syntax (http://mustache.github.com/)
_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};


// TEMPLATE override to alert us if the template is not found
var _template = _.template;
_.template = function(text){
	if( !text ){
		console.warn('Template not found', arguments);
		return 'Template not found'
	}
			
	return _template.apply(_, arguments)
}


/*
	Custom Underscore.js methods
*/
_.mixin({
	
	// get objects, such as a Backbone view, by name: 'App.Views.SomeView'
	getObjectByName: function(str){
	
		if( !str ) return;
		
		var path = str.split('.');
		var obj = window;
		
		_.each(path, function(key){
			if( obj )
				obj = obj[key];
		})
		
		return obj;
	},
	
	metaKey: function(e){
		e = e || event;
		return e && (e.ctrlKey || e.altKey || e.metaKey);
	},
	
	copyKey: function(e){
		return e && e.which == 67 && _.metaKey(e);
	},
	
	// http://stackoverflow.com/a/1173319/484780
	highlightText: function(el){
		if (document.selection) {
		    var range = document.body.createTextRange();
		    range.moveToElementText(el);
		    range.select();
		} else if (window.getSelection) {
		    var range = document.createRange();
		    range.selectNode(el);
		    window.getSelection().addRange(range);
		}
	},
	
	/*
	Plural - create singlular or plural sentence based on number given (all numbers but 1 return plural sentence)
	
	var str = "Do you want to delete this? There {are|is} [num] book{s} attached."
	
	var num = 2 // or 0, 3, 4, ...
		"Do you want to delete this? There are 2 books attached."
	
	var num = 1
		"Do you want to delete this? There is 1 book attached."
*/
	plural: function(str, num){
	
		var indx = num == 1 ? 1 : 0;
		
		num = _.isNumber(num) ? _.numberFormat(parseFloat(num)) : num;
		
		str = str.replace(/\[num\]/, num);
		
		str = str.replace(/{(.[^}]*)}/g, function(wholematch,firstmatch){
			
			var values = firstmatch.split('|');
			
			return values[indx] || '';
		});
		
		return str;
	},
	
	sortString: function(str){
		// strip single and double quotes and titles starting with "The " and "A "
		return str ? str.replace(/^The |^A |"|“|”|'|‘|’/g, '') : str;
	},
	
	splitAndTrim: function(str){
		return _.map( (str||'').split(','), function(val){ return val.trim() })
	},

/*
	Move - takes array and moves item at index and moves to another index; great for use with jQuery.sortable()
*/
    move: function (array, fromIndex, toIndex) {
	    array.splice(toIndex, 0, array.splice(fromIndex, 1)[0] );
	    return array;
    },
    
    /*
	Relative Date
	
	original work by: 2011 John Resig (ejohn.org)
	
	returns relative date (just now, 5 minutes ago, yesterday, etc)
	or a formatted date if over a week old. optionally pass true for "returnWeeks"
	if you want number of weeks returned (up to one month) instead of a formatted date
*/
    relativeDate: function(time, returnWeeks){
		var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
			diff = (((new Date()).getTime() - date.getTime()) / 1000),
			day_diff = Math.floor(diff / 86400);
				
		if ( isNaN(day_diff) )
			return '';
			
		if( day_diff < 0  )
			return _.relativeDateFuture(time, returnWeeks);
		
		if( (day_diff > 7 && returnWeeks !== true) || day_diff > 31)
			return _.readableDate(time, true);
		
		return day_diff == 0 && (
				diff < 60 && "just now" ||
				diff < 120 && "1 minute ago" ||
				diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
				diff < 7200 && "1 hour ago" ||
				diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
			day_diff == 1 && "yesterday" ||
			day_diff < 7 && day_diff + " days ago" ||
			day_diff < 31 && ( 
				Math.ceil( day_diff / 7 ) == 1 && '1 week ago' ||
				Math.ceil( day_diff / 7 ) + " weeks ago");
	},
	
	// I don't like duplicating code, but this will work for now
	relativeDateFuture: function(time, returnWeeks){
		var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
			diff = ((date.getTime() - (new Date()).getTime()) / 1000),
			day_diff = Math.floor(diff / 86400);
			
		if ( isNaN(day_diff) )
			return '';
			
		if( day_diff < 0  )
			return _.relativeDate(time, returnWeeks);
		
		if( (day_diff > 7 && returnWeeks !== true) || day_diff > 31)
			return _.readableDate(time, true);
		
		return day_diff == 0 && (
				diff < 60 && "now" ||
				diff < 120 && "in 1 minute" ||
				diff < 3600 && "in " + Math.floor( diff / 60 ) + " minutes" ||
				diff < 7200 && "1 hour ago" ||
				diff < 86400 && "in " + Math.floor( diff / 3600 ) + " hours") ||
			day_diff == 1 && "tomorrow" ||
			day_diff < 7 && "in " + day_diff + " days" ||
			day_diff < 31 && ( 
				Math.ceil( day_diff / 7 ) == 1 && 'in 1 week' ||
				"in " + Math.ceil( day_diff / 7 ) + " weeks");
	}

})