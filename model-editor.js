var ModelEditor = Backbone.View.extend({
    initialize: function(a) {
        return a && a.model ? (this.options = _.extend({
            modelType: "Backbone.Model",
            autoSave: !1,
            saveToDB: !this.model.isNew(),
            patchSave: !1,
            defaultOpts: {}
        }, a), this.editmodel = this.createEditModel(), this.reset(), this.defaultOpts("reset"), 
        this.setModel(this.model), this.editmodel.on("edited", this.rememberChanges, this), 
        this.options.defaultOpts.btns && (this.options.autoSave = !0), void this.autoSave(this.options.autoSave)) : void console.error("ModelEditor requires a “model” to be given.");
    },
    setModel: function(a) {
        this.stopListening(this.model), this.model = a, this.listenTo(this.model, "change", this.cleanReset), 
        this.listenTo(this.model, "reset", this.cleanup), this.listenTo(this.model, "sync", this.onSync), 
        this.reset();
    },
    createEditModel: function() {
        var a = this.options.modelType;
        return new (a = "auto" === a && this.model.collection ? this.model.collection.model : _.getObjectByName ? _.getObjectByName(a) : Backbone.Model)(this.model.toJSON());
    },
    autoSave: function(a) {
        this.editmodel.off("change", this.save, this), a !== !1 && this.editmodel.on("change", this.save, this);
    },
    setEditorAttr: function(a, b) {
        this.editmodel.set(a, b), this.rememberChanges(a, b, !0);
    },
    rememberChanges: function(a, b, c) {
        var d = this.model._unsavedChanges || {};
        c ? d[a] = b : this.options.autoSave && delete d[a], this.model._unsavedChanges = _.size(d) > 0 ? d : null;
    },
    hasUnsavedChanges: function() {
        return _.size(this.data()) > 0;
    },
    render: function() {
        return this.trigger("render"), this;
    },
    cleanReset: function() {
        return this.reset(), this;
    },
    reset: function(a) {
        return this.editmodel.clear({
            silent: !0
        }), this.editmodel.set(a || this.model.toJSON(), {
            silent: !0
        }), this.editmodel.unsavedChanges = this.model._unsavedChanges || {}, this.editmodel._currentAttributes = _.clone(this.editmodel.attributes), 
        this;
    },
    cleanup: function() {
        return Backbone.View.prototype.cleanup.apply(this, arguments), this.clearSubviews(), 
        this;
    },
    defaultOpts: function(a) {
        return this._defaultOpts = "reset" === a ? _.extend({}, this.options.defaultOpts, {
            renderTo: this.$el
        }) : _.extend({}, this._defaultOpts || {}, a || {}), this;
    },
    data: function() {
        return this.options.patchSave ? this.model.changedAttributes(this.model._unsavedChanges) : this.editmodel.toJSON();
    },
    save: function(a, b) {
        var c = this.save.bind(this, a, b);
        b = b || {};
        var d = b.error;
        b.error = function(a, b) {
            d && d(), this._onError.call(this, a, b, c);
        }.bind(this), this.options.patchSave && (b.patch = !0), this.options.saveToDB || a === !0 ? (this.model.save(this.data(), b), 
        this.model._unsavedChanges = null) : this.model.set(this.data(), b), this.options.onSave && this.options.onSave(this.model);
    },
    _onError: function(a, b, c) {
        b.retry = {
            title: "Retry Save?",
            fn: c
        };
    },
    onSync: function() {
        this.editmodel.trigger("changed");
    },
    insert: function(a, b, c) {
        if (!ModelEditors[a]) return void console.error("ModelEditor: there is no editor called “" + a + "”. Available editors:", ModelEditors);
        var d = new ModelEditors[a](_.extend({
            key: b,
            model: this.editmodel,
            renderTo: this.$el
        }, this._defaultOpts, c));
        return this.subview(b) && console.warn("Editor for “" + b + "” already exists."), 
        this.subview(b, d), d;
    }
}), ModelEditors = {};

ModelEditors.Base = Backbone.View.extend({
    tagName: "span",
    className: "model-editor",
    editorClassName: "",
    isDisabled: !1,
    append: function(a) {
        this.$inner.append(a);
    },
    html: function(a) {
        this.$inner.html(a);
    },
    init: function() {
        if (this.options = _.extend({
            disabled: !1,
            theme: "default",
            "float": "left",
            clear: !0,
            label: "auto",
            helpText: null,
            labelInline: !1,
            labelStyle: "",
            labelIcon: !1,
            key: null,
            valueType: "string",
            emptyVal: null,
            renderTo: null,
            selectOnClick: !1,
            pl: null,
            ph: null,
            watchChanges: !1,
            plPrefix: null,
            plFieldVal: null,
            css: null
        }, this.options), this.options.renderTo instanceof ModelEditors.Base && (this.options.renderTo = this.options.renderTo.$inner), 
        this.$el.appendTo(this.options.renderTo).addClass(this.editorClassName).addClass("theme-" + this.options.theme).addClass("key-" + this.options.key).attr("data-val", this.val()), 
        this.setupLabel(), !this.options["float"] || "left" !== this.options["float"] && "right" !== this.options["float"] || this.$el.addClass("float-" + this.options["float"]), 
        this.options.clear && this.$el.addClass("clear"), this.options.disabled && _.defer(this.disable.bind(this)), 
        this.$inner = $('<span class="inner"></span>').appendTo(this.$el), this.options.pl || this.options.ph) {
            var a = this.options.pl || this.options.ph;
            "auto" === a && this.options.plPrefix && (a = this.options.plPrefix + "::" + this.options.key);
            var b = require("core/proofing-lights/views/proofing-light");
            this.subview("plv") || this.subview("plv", new b({
                key: a,
                fieldVal: this.plFieldVal.bind(this),
                history: this.options.ph ? !0 : !1
            })), this.$inner.append(this.subview("plv").el);
        }
        this.options.css && this.$el.css(this.options.css), this.listenTo(this.model, "changed", this.onChanged);
    },
    plFieldVal: function() {
        return this.options.plFieldVal ? this.options.plFieldVal() : this.val();
    },
    testForCleanup: function() {
        this.el.parentElement || this.cleanup();
    },
    cleanup: function() {
        Backbone.View.prototype.cleanup.apply(this, arguments), this.stopListening();
    },
    onChanged: function() {
        var a = this.model.changed[this.options.key];
        if (void 0 !== a && this.options.watchChanges === !0) return delete this.model.changed[this.options.key], 
        this.options.pl || this.subview("plv") ? void ((1 == this.subview("plv").model.get("status") || -2 == this.subview("plv").model.get("status")) && this.subview("plv").reset()) : console.warn("!! To watch changes (" + this.options.key + "), you need to specifiy a key for proofing the proofing light");
    },
    _disable: function() {
        return this.$el.addClass("disabled"), this.isDisabled = !0, this;
    },
    _enable: function() {
        return this.$el.removeClass("disabled"), this.isDisabled = !1, this;
    },
    disable: function() {
        return this._disable();
    },
    enable: function() {
        return this._enable();
    },
    hide: function() {
        this.$el.hide();
    },
    show: function() {
        this.$el.show();
    },
    parseVal: function(a) {
        switch (this.options.valueType) {
          case "string":
            return a;

          case "array":
            return a || [];

          case "csv":
            return _.splitAndTrim(a);
        }
    },
    parseSaveVal: function(a) {
        switch (this.options.valueType) {
          case "string":
            return this.cleanSaveVal(a);

          case "array":
            return a;

          case "csv":
            return (a || []).join(",");
        }
    },
    cleanSaveVal: function(a) {
        return a = _.cleanWebkitStyles(a), a = _.smartQuotes(a);
    },
    _val: function() {
        return this.parseVal(this.model.get(this.options.key) || null);
    },
    _newVal: function() {
        return this.$input.val() || this.options.emptyVal;
    },
    val: function() {
        return this._val();
    },
    newVal: function() {
        return this._newVal();
    },
    saveVal: function() {
        return this.parseSaveVal(this.newVal());
    },
    valChanged: function() {
        var a = this.val(), b = this.newVal();
        return "csv" == this.options.valueType || "array" == this.options.valueType ? _.difference(a, b).length > 0 || a.length != b.length : a !== b;
    },
    _validatePatterns: {
        date: "^[0-1]*[0-9]/[0-3]*[0-9]/[0-9]{4}$",
        integer: "^[0-9]*$",
        number: "^[0-9]+.?[0-9]*$",
        decimal: "^[0-9]+.?[0-9]*$",
        "float": "^[0-9]+.?[0-9]*$",
        "double": "^[0-9]+.?[0-9]*$",
        email: "^(.+@.+..+)?$",
        year: "^$|^[1-2]{1}[0-9]{3}$"
    },
    _validateSaveVal: function() {
        return !0;
    },
    updateVal: function() {
        var a = this.saveVal();
        this._validateSaveVal(a) && (this.model.trigger("edited", this.options.key, a, this.valChanged()), 
        !this.isDisabled && this.valChanged() && (this.model.set(this.options.key, a), this.options.onSave && this.options.onSave(this.options.key, a), 
        this.$el.attr("data-val", a), this.editorTagName && "textarea" == this.editorTagName && this.$input.val(a)));
    },
    setWidth: function() {
        this.options.w && this.$inner.width(this.options.w);
    },
    setupLabel: function() {
        var a = this.options.label;
        a !== !1 && void 0 !== a && ("auto" === a && (a = this.keyToText()), this.$label = $('<label><div><span class="model-editor-label-inner">' + a + "</span></div></label>").appendTo(this.$el), 
        this.options.labelDivider && this.$label.find("> div:first-child").addClass("divider dark"), 
        this.options.helpText && this.$label.append('<p class="help-text">' + this.options.helpText + "</p>"), 
        this.options.labelStyle && this.$el.addClass("label-style-" + this.options.labelStyle), 
        this.options.labelIcon && this.$label.find("> div:first-child").addClass("icon-" + this.options.labelIcon), 
        this.options.labelInline && (this.$el.addClass("inline-label"), _.isNumber(this.options.labelInline) && this.$label.width(this.options.labelInline)));
    },
    setLabel: function(a) {
        this.$label.find(".model-editor-label-inner").html(a);
    },
    keyToText: function() {
        var a = this.options.key;
        return a = a.replace(/_|-/g, " "), a = a.replace(/ id$/, " ID"), a = a.replace(/isbn/, " ISBN"), 
        a = a.replace(/drm/, " DRM"), a = a.replace(/dmas/, " DMAS"), a = a.replace(/^msg$/, "Message"), 
        a = _.titleize(a);
    }
}), ModelEditors.empty = ModelEditors.Base.extend({
    editorClassName: "empty",
    initialize: function() {
        this.init(), this.setWidth(), this.options.view && this.append(this.options.view instanceof Backbone.View ? this.options.view.el : this.options.view), 
        this.render();
    },
    render: function() {
        this.options.view && this.options.view instanceof Backbone.View && this.options.view.render(), 
        this.options.selectOnClick && this.$inner.on("click", this.selectOnClick.bind(this));
    },
    selectOnClick: function() {
        var a = this.$inner[0];
        if (document.selection) {
            var b = document.body.createTextRange();
            b.moveToElementText(a), b.select();
        } else if (window.getSelection) {
            var b = document.createRange();
            b.selectNode(a), window.getSelection().addRange(b);
        }
    }
}), ModelEditors.input = ModelEditors.Base.extend({
    editorTagName: "input",
    editorClassName: "input",
    editorAttributes: {
        type: "text",
        "class": "form-control"
    },
    events: {
        "focus input": "onFocus",
        "blur input": "onBlur",
        "keyup input": "onKeyUp",
        "keydown input": "onKeyDown",
        "keypress input": "onKeyPress",
        "click .btn.save": "saveBtnAction",
        "click .btn.cancel": "cancelBtnAction",
        "click .markdown-preview-btn": "toggleMarkdownPreview"
    },
    keyEvents: {
        "27": "cancelBtnAction",
        "13": "saveBtnAction"
    },
    initialize: function(a) {
        this.options = _.extend({
            placeholder: "auto",
            prefix: null,
            suffix: null,
            w: 200,
            h: "auto",
            btns: !1,
            mention: !1,
            updateAfterDelay: !1,
            markdownPreview: !1,
            attachments: !1,
            validate: !1,
            validateMsg: "<u>[val]</u> is not valid."
        }, this.options, a), void 0 == a.attachments && this.options.markdownPreview && "textarea" == this.editorTagName && (this.options.attachments = {}), 
        this.init(), this.$input = $("<" + this.editorTagName + "></" + this.editorTagName + ">").val(this.val()).attr(this.editorAttributes).appendTo(this.$inner), 
        this.origVal = this.val(), this.setPlaceholder(), this.setupPrefix(), this.setupSuffix(), 
        this.setupMarkdownPreview(), this.setVal(), this.setWidth(), this.setHeight(), this.setupBtns(), 
        this.setupMention(), this.setupUnsavedVal(), this.setupAttachmentUpload(), this.render(), 
        _.defer(this.doAutoResize.bind(this)), this.delegateEvents();
    },
    hasUnsavedVal: function() {
        return !1;
    },
    unsavedVal: function() {
        return this.model.unsavedChanges[this.options.key];
    },
    setupUnsavedVal: function() {
        this.hasUnsavedVal() && (this.$input.val(this.unsavedVal()), this.edit(!0));
    },
    focus: function() {
        this.$input.focus();
    },
    onFocus: function() {
        this.edit();
    },
    onBlur: function() {
        this.setVal(), this.options.btns ? this.valChanged() || this.edit(!1) : (this.edit(!1), 
        this.updateVal());
    },
    onKeyUp: function(a) {
        if (this.updateAfterDelay(), this.keyEvents) {
            var b = this.keyEvents[a.which];
            b && this[b] && this[b].call(this, a), this.doAutoResize();
        }
    },
    onKeyDown: function(a) {
        8 == a.which && this.updateAfterDelay();
    },
    onKeyPress: function() {
        this.updateAfterDelay();
    },
    updateAfterDelay: function() {
        this.options.updateAfterDelay && (clearTimeout(this.__updateAfterDelayTimeout), 
        this.__updateAfterDelayTimeout = setTimeout(this.onBlur.bind(this), this.options.updateAfterDelay));
    },
    doAutoResize: function() {
        return (this.options.autoresize || "auto" === this.options.h) && this.autoResize ? (this.autoResize(), 
        !0) : void 0;
    },
    _validateSaveVal: function(a) {
        if (!this.options.validate || !a) return !0;
        var b = this.options.validate;
        if ("string" == typeof b && this._validatePatterns[b] && (b = this._validatePatterns[b]), 
        b instanceof RegExp || (b = new RegExp(b)), !b.test(a)) {
            this.$input.val(this.origVal);
            var c = "string" == typeof this.options.validateMsg ? this.options.validateMsg.replace("[val]", a) : !1;
            return c && setTimeout(function() {
                window.Modal ? Modal.alert(c, "") : alert(c);
            }, 40), !1;
        }
        return !0;
    },
    setVal: function() {
        var a = this.val();
        this.$input[0].setAttribute("value", a), a ? this.$el.addClass("has-value") : this.$el.removeClass("has-value");
    },
    saveBtnAction: function() {
        this.isDisabled || (this.updateVal(), this.origVal = this.newVal(), this.edit(!1), 
        this.onBlur());
    },
    cancelBtnAction: function(a) {
        this.$input.val(this.origVal), this.edit(!1), this.onBlur(), a && a.stopPropagation();
    },
    setWidth: function() {
        this.options.w && (this.$inner.width(this.options.w), this.$input.width(this.options.w));
    },
    setHeight: function() {
        this.options.h && "textarea" === this.editorTagName && (this.$input.height(this.options.h), 
        this.$preview && this.$preview.height(this.options.h));
    },
    setPlaceholder: function() {
        var a = this.options.placeholder;
        a && ("auto" === a && (a = this.keyToText()), this.$input.attr("placeholder", a));
    },
    setupPrefix: function() {
        this.options.prefix && "input" == this.editorTagName && (this.$inner.addClass("has-prefix"), 
        this.$inner.prepend('<span class="prefix">' + this.options.prefix + "</span>"));
    },
    setupSuffix: function() {
        this.options.suffix && "input" == this.editorTagName && (this.$inner.addClass("has-suffix"), 
        this.$inner.append('<span class="suffix">' + this.options.suffix + "</span>"));
    },
    setupBtns: function() {
        this.options.btns && (this.$el.addClass("has-btns"), this.$inner.append('<div class="btns">\r\n							<a class="btn flat hover-green save icon-only icon-ok"></a>\r\n							<a class="btn flat hover-red cancel icon-only icon-cancel"></a>\r\n						</div>'));
    },
    setupMention: function() {
        return this.options.mention ? $.fn.mention ? $.fn.typeahead ? void this.$input.mention(this.options.mention) : void console.warn("ModelEditor: `mention` option cannot be used as the `typeahead` plugin was not found.\nhttps://github.com/jakiestfu/Mention.js/blob/master/bootstrap-typeahead.js") : void console.warn("ModelEditor: `mention` option cannot be used as the `mention` plugin was not found.\nhttps://github.com/jakiestfu/Mention.js") : void 0;
    },
    setupMarkdownPreview: function() {
        if (this.options.markdownPreview && "textarea" == this.editorTagName) {
            if ("undefined" == typeof marked) return void console.warn("ModelEditor: `markdownPreview` option cannot be used as the `marked` library was not found.");
            this.$preview = $('<div class="markdown-preview standard-text"></div>').appendTo(this.$inner), 
            this.$inner.prepend('<a class="markdown-preview-btn" title="Toggle markdown preview"></a>');
        }
    },
    edit: function(a) {
        this.isDisabled || (a === !1 ? this.$el.removeClass("editing") : this.$el.addClass("editing"));
    },
    disable: function() {
        return this.$input.attr("disabled", !0), this.subview("attachments") && this.subview("attachments").disable(), 
        this._disable();
    },
    enable: function() {
        return this.$input.attr("disabled", !1), this.subview("attachments") && this.subview("attachments").enable(), 
        this._enable();
    },
    toggleMarkdownPreview: function(a) {
        var b = this.newVal() || "Nothing to preview";
        this.$preview.html(marked(b)), a.currentTarget.classList.toggle("active");
    },
    setupAttachmentUpload: function() {
        if ("textarea" == this.editorTagName && this.options.attachments) {
            var a = _.extend(this.options.attachments, {
                el: this.el,
                dropEl: this.$input[0]
            });
            this.subview("attachments", new Attachment(a)), this.listenTo(this.subview("attachments"), "upload:success", this.attachmentUploadSuccess);
        }
    },
    attachmentUploadSuccess: function(a) {
        var b = a.data.markdown, c = this.$input.val(), d = this.$input[0].selectionStart;
        c && c.match(/.\n$/) ? c += "\n" : c && !c.match(/\n\n$/) && (c += "\n\n");
        var e = c.substring(0, d), f = c.substring(d), c = e + (e ? "\n\n" : "") + b + f;
        this.$input.val(c), this.$input[0].selectionStart = this.$input[0].selectionEnd = c.length - f.length, 
        this.updateAfterDelay();
    }
}), ModelEditors.date = ModelEditors.input.extend({
    events: {
        "focus input": "onFocus",
        "keyup input": "onKeyUp",
        "click .btn.save": "saveBtnAction",
        "click .btn.cancel": "cancelBtnAction"
    },
    editorClassName: "input date",
    val: function() {
        var a = this._val();
        return a && "-" !== a && (a = new XDate(a).toString("MM/dd/yyyy")), a;
    },
    newVal: function() {
        var a = this._newVal();
        return a && "-" !== a && (a = new XDate(a).toString("MM/dd/yyyy")), a;
    },
    saveVal: function() {
        var a = this.newVal();
        return a && (/^[0-1]*[0-9]\/[0-3]*[0-9]\/[0-9]{4}$/.test(a) || (a = this.origVal, 
        this.$input.val(a)), a = new XDate(a).toString("yyyy-MM-dd")), a || null;
    },
    render: function() {
        if ($.fn.datepicker) {
            this.$input.datepicker({
                constrainInput: this.options.constrainInput === !1 ? !1 : !0,
                dateFormat: "m/d/yy",
                beforeShow: _.bind(function() {
                    this.$el.addClass("datepickerOpen");
                }, this),
                onClose: _.bind(function() {
                    this.$el.removeClass("datepickerOpen"), this.onBlur();
                }, this)
            });
            var a = this.$input.data("datepicker").dpDiv[0];
            a.removeEventListener("click", this.stopPropagation), a.addEventListener("click", this.stopPropagation, !1);
        } else this.$input[0].setAttribute("type", "date");
    },
    stopPropagation: function(a) {
        return a.stopPropagation(), a.cancelBubble = !0, !1;
    }
}), ModelEditors.email = ModelEditors.input.extend({
    editorClassName: "input email",
    editorAttributes: {
        type: "email",
        "class": "form-control"
    }
}), ModelEditors.password = ModelEditors.input.extend({
    editorClassName: "input password",
    editorAttributes: {
        type: "password",
        "class": "form-control"
    }
}), ModelEditors.textarea = ModelEditors.input.extend({
    editorTagName: "textarea",
    editorClassName: "textarea",
    editorAttributes: {
        "class": "form-control"
    },
    events: {
        "focus textarea": "onFocus",
        "blur textarea": "onBlur",
        "keyup textarea": "onKeyUp",
        "keydown textarea": "onKeyDown",
        "keypress textarea": "onKeyPress",
        "click .btn.save": "saveBtnAction",
        "click .btn.cancel": "cancelBtnAction",
        "click .markdown-preview-btn": "toggleMarkdownPreview"
    },
    keyEvents: {
        "27": "cancelBtnAction"
    },
    autoResize: function() {
        var a = this.$input[0];
        a.style.height = "0", a.style.height = a.scrollHeight + "px", a.style.overflow = "hidden";
    },
    onKeyDown: function(a) {
        8 == a.which && this.updateAfterDelay(), this.doAutoResize();
    },
    render: function() {
        _.defer(_.bind(this.doAutoResize, this));
    }
}), ModelEditors.rte = ModelEditors.textarea.extend({
    editorClassName: "textarea rte",
    events: {
        "blur .redactor_editor": "onBlur",
        "focus .redactor_editor": "onFocus",
        "focus .redactor_box > textarea": "onFocus",
        "keyup .redactor_editor": "onKeyUp",
        "click .btn.save": "saveBtnAction",
        "click .btn.cancel": "cancelBtnAction"
    },
    render: function() {
        function a(a) {
            h.redactor.bufferSet(), h.redactor.insertHtml(a), h.redactor.sync();
        }
        var b = this.options, c = [ "fullscreen" ], d = [ "formatting", "specialCharacters", "bold", "italic", "underline", "fullscreen" ], e = [ "a", "p", "blockquote", "b", "i", "strong", "em", "u", "h1", "h2", "ul", "ol", "li" ], f = [ "p", "blockquote" ], g = !1;
        switch (b.allowBR === !0 && e.push("br"), b.toolbar) {
          case "nano":
            c = !1, d = [ "bold", "italic", "underline" ], e = [ "p", "b", "i", "strong", "em", "u" ];
            break;

          case "micro":
            c = !1, d = [ "specialCharacters", "bold", "italic", "underline" ], e = [ "p", "b", "i", "strong", "em", "u" ];
            break;

          case "micro-br":
            c = !1, d = [ "specialCharacters", "bold", "italic", "underline" ], e = [ "p", "b", "i", "strong", "em", "u", "br" ], 
            g = !0;
            break;

          case "regular":
            d = [ "formatting", "specialCharacters", "bold", "italic", "underline", "unorderedlist", "orderedlist", "link", "alignleft", "aligncenter" ];
            break;

          case "mini":
          default:
            d = [ "formatting", "specialCharacters", "bold", "italic", "underline", "unorderedlist", "orderedlist", "link" ];
        }
        User.can("view-html-in-rte") && d.push("html"), void 0 === b.autoresize && "auto" === b.h && (b.autoresize = !0);
        var h = this;
        this.$input.redactor({
            plugins: c,
            paragraphy: !1,
            boldTag: "b",
            italicTag: "i",
            linebreaks: g,
            tabKey: !1,
            cleanSpaces: !0,
            buttons: d,
            allowedTags: e,
            formattingTags: f,
            autoresize: void 0 === b.autoresize ? !0 : b.autoresize,
            buttonsCustom: {
                specialCharacters: {
                    title: "Special Characters",
                    dropdown: {
                        "“": {
                            title: "“ Quote Left",
                            callback: a
                        },
                        "”": {
                            title: "” Quote Right",
                            callback: a
                        },
                        "‘": {
                            title: "‘ Single Quote Left",
                            callback: a
                        },
                        "’": {
                            title: "’ Single Quote Right",
                            callback: a
                        },
                        "—": {
                            title: "— Em-Dash",
                            callback: a
                        },
                        "–": {
                            title: "— En-Dash",
                            callback: a
                        },
                        "…": {
                            title: "… Ellipsis",
                            callback: a
                        }
                    }
                }
            },
            pasteBeforeCallback: this.onPaste.bind(this)
        }), this.redactor = this.$input.redactor("getObject");
    },
    onPaste: function(a) {
        return _.smartQuotes(a);
    },
    saveBtnAction: function() {
        this.updateVal(), this.origVal = this.newVal(), this.$input.val(this.origVal), this.redactor.set(this.origVal || ""), 
        this.edit(!1), this.$el.find(".redactor_editor").blur();
    },
    cancelBtnAction: function() {
        this.$input.val(this.origVal), this.redactor.set(this.origVal || ""), this.edit(!1), 
        this.$el.find(".redactor_editor").blur();
    },
    destroyEditor: function() {
        this.$input && this.$input.destroyEditor && this.$input.destroyEditor();
    },
    cleanup: function() {
        this.destroyEditor(), this.cleanupSubviews(), this.stopListening();
    }
}), ModelEditors.checkbox = ModelEditors.Base.extend({
    editorTagName: "span",
    editorClassName: "checkbox",
    events: {
        "click span.checkbox": "onClick",
        "focus span.checkbox": "onFocus",
        "blur span.checkbox": "onBlur"
    },
    allowEmptyState: !1,
    initialize: function(a) {
        this.options = _.extend({
            inline: !1,
            valType: "bool",
            allowEmptyState: this.allowEmptyState
        }, a), this.init(), this.value = this.val(), this.$input = $("<" + this.editorTagName + ' class="checkbox" tabindex="0"></' + this.editorTagName + ">").attr("type", "checkbox").addClass(this.state()).appendTo(this.$inner), 
        this.options.inline && this.$el.addClass("inline-checkbox"), this.$el.addClass(this.state()), 
        this.render();
    },
    render: function() {
        return this;
    },
    state: function() {
        switch (this.value) {
          case "1":
            return "on";

          case "0":
            return "off";

          case "":
          case this.options.emptyValue:
          case "null":
          default:
            return "null";
        }
    },
    onFocus: function() {
        this._onSpace = this._onSpace || this.onSpace.bind(this), document.addEventListener("keypress", this._onSpace);
    },
    onBlur: function() {
        document.removeEventListener("keypress", this._onSpace);
    },
    onClick: function() {
        this.toggle();
    },
    onSpace: function(a) {
        return document.activeElement !== this.$input[0] ? this.onBlur() : void (32 == a.which && (a.preventDefault(), 
        this.toggle()));
    },
    val: function() {
        var a = this._val();
        return "timestamp" === this.options.valType ? a && a.length > 1 ? "1" : "0" : null === a ? "null" : a;
    },
    newVal: function() {
        return "timestamp" === this.options.valType ? "1" == this.value ? _.timestamp() : null : this.value;
    },
    nextVal: function() {
        var a, b = this.value;
        return a = "" === b || "null" === b || b === this.options.emptyVal ? "1" : "1" === b ? "0" : this.options.allowEmptyState ? this.options.emptyVal : "1";
    },
    toggle: function() {
        this.isDisabled || (clearTimeout(this.saveTimeout), this.$el.add(this.$input).removeClass(this.state()), 
        this.value = this.nextVal(), this.$el.add(this.$input).addClass(this.state()), this.$el.attr("data-val", this.saveVal()), 
        this.saveTimeout = setTimeout(_.bind(this.updateVal, this), 300));
    }
}), ModelEditors.tribox = ModelEditors.checkbox.extend({
    allowEmptyState: !0
}), ModelEditors.select = ModelEditors.Base.extend({
    editorClassName: "select",
    editorAttributes: {
        "class": "form-control"
    },
    events: {
        "change select": "updateVal"
    },
    defaultOpts: {
        w: 200,
        values: null
    },
    use: "value",
    initialize: function(a) {
        this.options = _.extend({}, this.defaultOpts, a), this.options.values && (this.values = this.options.values), 
        this.init(), this.value = null === this.val() ? "null" : this.val(), this.$input = this.createInput(), 
        this.addOptions(), this.setWidth(), this.setHeight(), this.onUpdateVal(), this.listenTo(this.model, "change:state", this.onUpdateVal), 
        this.render();
    },
    createInput: function() {
        return $("<select></select>").appendTo(this.$inner).attr(this.editorAttributes);
    },
    updateValues: function(a) {
        this.values = a, this.$input.html(""), this.addOptions();
    },
    addOptions: function() {
        if (!this.values) return void console.error("ModelEditor: you need to add a “values“ attribute");
        var a = _.isFunction(this.values) ? this.values() : this.values;
        _.each(a, _.bind(this.addOption, this));
    },
    addOption: function(a, b) {
        var c = $("<option></option>");
        _.isObject(a) ? c.val(a.val).html(a.label) : c.val("index" === this.use ? b : this.optionVal(a)).html(a), 
        this.val() == c.val() && c.attr("selected", !0), c.appendTo(this.$input);
    },
    optionVal: function(a) {
        return "-" === a ? "" : "lowercase" === this.use ? a.toLowerCase() : "uppercase" === this.use ? a.toUpperCase() : a;
    },
    onUpdateVal: function() {
        this.$input.attr("value", this.val());
    },
    setWidth: function() {
        this.options.w && (this.$inner.width(this.options.w), this.$input.width(this.options.w));
    },
    setHeight: function() {},
    disable: function() {
        this._disable(), this.$input.attr("disabled", !0);
    },
    enable: function() {
        this._enable(), this.$input.attr("disabled", !1);
    },
    focus: function() {
        this.$input.focus();
    }
}), ModelEditors.multiselect = ModelEditors.select.extend({
    editorClassName: "multiselect",
    editorAttributes: {
        "class": "multiselect"
    },
    events: {
        "click li": "onOptionSelect",
        mouseleave: "onMouseLeave",
        "a.select-all": "selectAll",
        "a.select-none": "deselectAll"
    },
    defaultOpts: {
        w: 200,
        values: null,
        valueType: "csv",
        saveDelay: 2e3,
        infoBar: !0,
        dynamicHeight: !0
    },
    createInput: function() {
        var a = $('<div class="multiselect wrap"></div>').appendTo(this.$inner);
        this.options.infoBar === !0 && (a.append('<div class="bar">\r\n							<span class="info"></span>\r\n							<a class="select-none">None</a>\r\n							<a class="select-all">All</a>\r\n						</div>'), 
        this.$(".bar a.select-all").click(this.onSelectAll.bind(this)), this.$(".bar a.select-none").click(this.onDeselectAll.bind(this)));
        var b = $("<ul></ul>").appendTo(a).attr(this.editorAttributes);
        return b;
    },
    newVal: function() {
        return this.selectedVals;
    },
    setInfoLabel: function() {
        var a = this.selectedVals.length + " Selected";
        this.$(".bar .info").html(a);
    },
    addOptions: function() {
        if (!this.values) return void console.error("ModelEditor: you need to add a “values“ attribute");
        this.selectedVals = [];
        var a = _.isFunction(this.values) ? this.values() : this.values;
        _.each(a, _.bind(this.addOption, this)), this.setInfoLabel();
    },
    addOption: function(a, b) {
        var c = $("<li></li>");
        if (_.isObject(a)) {
            if ("-" === a.val || "" === a.val || "0" === a.val) return;
            c.attr("data-val", a.val).html(a.label);
        } else c.attr("data-val", "index" === this.use ? b : this.optionVal(a)).html(a);
        _.contains(this.val(), c.attr("data-val")) && (c.addClass("selected"), this.selectedVals = this.selectedVals || [], 
        this.selectedVals.push(c.attr("data-val"))), c.appendTo(this.$input);
    },
    onOptionSelect: function(a) {
        clearTimeout(this.saveTimeout), this.saveTimeout = null;
        var b = a.currentTarget, c = b.dataset.val, d = _.indexOf(this.selectedVals, c);
        d > -1 ? _.metaKey() && this.selectedVals.length > 1 ? (this.deselectAll(), this.select(c)) : this.deselect(c) : _.metaKey() ? (this.deselectAll(), 
        this.select(c)) : this.select(c), this.setInfoLabel(), this.saveTimeout = setTimeout(this.doSave.bind(this), this.options.saveDelay);
    },
    onSelectAll: function() {
        this.selectAll(), this.setInfoLabel(), this.saveTimeout = setTimeout(this.doSave.bind(this), this.options.saveDelay);
    },
    onDeselectAll: function() {
        this.deselectAll(), this.setInfoLabel(), this.saveTimeout = setTimeout(this.doSave.bind(this), this.options.saveDelay);
    },
    onMouseLeave: function() {
        this.saveTimeout && this.doSave();
    },
    doSave: function() {
        clearTimeout(this.saveTimeout), this.saveTimeout = null, this.updateVal(), this.setInfoLabel();
    },
    select: function(a) {
        this._select(null, this.$input.find('[data-val="' + a + '"]')[0]);
    },
    deselect: function(a) {
        this._deselect(null, this.$input.find('[data-val="' + a + '"]')[0]);
    },
    selectAll: function() {
        this.$input.find("li").each(this._select.bind(this));
    },
    deselectAll: function() {
        this.$input.find("li").each(this._deselect.bind(this));
    },
    _select: function(a, b) {
        b.classList.add("selected"), -1 == _.indexOf(this.selectedVals, b.dataset.val) && this.selectedVals.push(b.dataset.val);
    },
    _deselect: function(a, b) {
        b.classList.remove("selected"), this.selectedVals.splice(_.indexOf(this.selectedVals, b.dataset.val), 1);
    },
    setWidth: function() {
        this.options.w && this.$inner.width(this.options.w);
    },
    setHeight: function() {
        this.options.h && this.$input.css(this.options.dynamicHeight ? "maxHeight" : "height", this.options.h);
    }
}), ModelEditors.selectMonth = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.monthsOfYear.asSelect();
    }
}), ModelEditors.selectUser = ModelEditors.select.extend({
    values: function() {
        return Users.map(function(a) {
            return {
                val: a.id,
                label: a.name()
            };
        });
    }
}), ModelEditors.selectPartner = ModelEditors.select.extend({
    values: function() {
        return [ {
            label: "-",
            val: null
        } ].concat(Partners.map(function(a) {
            return {
                val: a.id,
                label: a.get("name")
            };
        }));
    }
}), ModelEditors.selectPartnerDeal = ModelEditors.select.extend({
    values: function() {
        return [ {
            label: "-",
            val: null
        } ].concat(Deals.toSelectID(function(a) {
            return a.label();
        }));
    }
}), ModelEditors.selectGender = ModelEditors.select.extend({
    values: [ {
        label: "-",
        val: ""
    }, {
        label: "Male",
        val: "M"
    }, {
        label: "Female",
        val: "F"
    } ]
}), ModelEditors.selectYesNo = ModelEditors.select.extend({
    values: [ {
        label: "-",
        val: ""
    }, {
        label: "Yes",
        val: "1"
    }, {
        label: "No",
        val: "0"
    } ]
}), ModelEditors.selectBookEdition = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.bookBookEdition.asSelect();
    }
}), ModelEditors.selectBookLanguage = ModelEditors.select.extend({
    values: [ "Arabic", "Cantonese", "Chinese", "Danish", "Dutch", "English", "French", "German", "Greek", "Hungarian", "Italian", "Jamaican", "Japanese", "Mandarin", "Marathi", "Polish", "Portuguese", "Russian", "Spanish", "Turkish" ]
}), ModelEditors.bookState = ModelEditors.select.extend({
    values: [ "-", "On Sale", "In Process", "Re-request", "Re-release", "Cancelled" ]
}), ModelEditors.acquisitionState = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.dealAcquisitionState.asSelect();
    }
}), ModelEditors.selectProductReleaseType = ModelEditors.select.extend({
    values: function() {
        return ProductReleaseTypes.map(function(a) {
            return {
                val: a.id,
                label: a.get("name")
            };
        });
    }
}), ModelEditors.selectBookChannel = ModelEditors.select.extend({
    values: function() {
        return lookup.collections.channels.map(function(a) {
            return {
                val: a.id,
                label: a.get("name")
            };
        });
    }
}), ModelEditors.selectBookAllProduct = ModelEditors.select.extend({
    values: function() {
        return lookup.collections.products.map(function(a) {
            return {
                val: a.id,
                label: a.get("label")
            };
        });
    }
}), ModelEditors.selectBookArchivedProduct = ModelEditors.select.extend({
    values: function() {
        return _.map(lookup.collections.products.archived(), function(a) {
            return {
                val: a.id,
                label: a.get("label")
            };
        });
    }
}), ModelEditors.selectBookActiveProduct = ModelEditors.select.extend({
    values: function() {
        return _.map(lookup.collections.products.active(), function(a) {
            return {
                val: a.id,
                label: a.get("label")
            };
        });
    }
}), ModelEditors.selectTargetAudience = ModelEditors.select.extend({
    values: [ "Adult", "New Adult (18-25)", "Young Adult (12-17)", "Children (8-12)", "Children (4-7)", "Children (0-3)" ]
}), ModelEditors.selectMovieTieIn = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.marketingMovieTieIn.asSelect();
    }
}), ModelEditors.selectContractState = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractContractState.asSelect();
    }
}), ModelEditors.selectContractDealTypeID = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractDealTypeID.asSelect();
    }
}), ModelEditors.selectPurchasedBy = ModelEditors.select.extend({
    values: function() {
        var a = _.map(_.sortBy(lookup.collections.purchasers.models, function(a) {
            return a.get("name");
        }), function(a) {
            return {
                label: a.get("name"),
                val: a.get("user_id")
            };
        });
        return [ {
            label: "-"
        } ].concat(a);
    }
}), ModelEditors.selectContractCopyBy = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractCopyBy.asSelect();
    }
}), ModelEditors.selectContractStateJurisdiction = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractStateJurisdiction.asSelect();
    }
}), ModelEditors.selectContractTerritoryType = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractTerritoryType.asSelect();
    }
}), ModelEditors.selectContractTerritoryLanguage = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractTerritoryLanguage.asSelect();
    }
}), ModelEditors.selectContractWhoPreparesContractID = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractWhoPreparesContractID.asSelect();
    }
}), ModelEditors.selectMastersSourcedFrom = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractMastersSourcedFrom.asSelect();
    }
}), ModelEditors.selectProducer = ModelEditors.select.extend({
    values: [ "-", "BSA", "RI", "UK" ]
}), ModelEditors.selectContractTermBeginsOn = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractTermBeginsOn.asSelect();
    }
}), ModelEditors.selectContractTermLengthType = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractTermLengthType.asSelect();
    }
}), ModelEditors.selectProductionDeadlineFrom = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractProductionDeadlineFrom.asSelect();
    }
}), ModelEditors.selectContractRoyaltyPaymentTerm = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractRoyaltyPaymentTerm.asSelect();
    }
}), ModelEditors.selectContractRoyaltyReportingPeriod = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractRoyaltyReportingPeriod.asSelect();
    }
}), ModelEditors.selectContractRoyaltyTypeOrProduct = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractRoyaltyTypeOrProduct.asSelect();
    }
}), ModelEditors.selectContractFeeDueOn = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractFeeDueOn.asSelect();
    }
}), ModelEditors.selectContractRoyaltyPaymentBasis = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractRoyaltyPaymentBasis.asSelect();
    }
}), ModelEditors.selectContractFeeType = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractFeeType.asSelect();
    }
}), ModelEditors.selectContractRoyaltyMarket = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractRoyaltyMarket.asSelect();
    }
}), ModelEditors.selectContractRoyaltyModifier = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractRoyaltyModifier.asSelect();
    }
}), ModelEditors.selectPresetDates = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.presetDates.asSelect();
    }
}), ModelEditors.contractContactTags = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.contractContactTags.asSelect();
    }
}), ModelEditors.selectBookCategory = ModelEditors.select.extend({
    values: function() {
        return lookup.selects.bookCategory.asSelect();
    }
}), ModelEditors.selectRoyaltyCalculationSystem = ModelEditors.select.extend({
    values: [ {
        label: "-",
        val: null
    }, {
        label: "Acumen",
        val: "Acumen"
    }, {
        label: "Magento",
        val: "Magento"
    } ]
}), ModelEditors.selectImprintPartner = ModelEditors.select.extend({
    values: function() {
        return Partners.toSelectImprints();
    }
}), ModelEditors.selectAutoRenewOptions = ModelEditors.select.extend({
    values: [ {
        label: "No auto renewal",
        val: 0
    }, {
        label: "No auto renewal, BSA has first option to renew",
        val: 3
    }, {
        label: "Auto renew with term guarantee",
        val: 1
    }, {
        label: "Auto renew with no term guarantee",
        val: 2
    } ]
}), ModelEditors.selectAutoRenewIncrement = ModelEditors.select.extend({
    values: [ {
        label: "-",
        val: null
    }, {
        label: "6 months",
        val: "6 months"
    }, {
        label: "1 year",
        val: "1 year"
    }, {
        label: "2 years",
        val: "2 years"
    } ]
}), ModelEditors.selectRenewalFirstOptionIncrement = ModelEditors.select.extend({
    values: [ {
        label: "-",
        val: null
    }, {
        label: "30 days",
        val: "30"
    }, {
        label: "60 days",
        val: "60"
    }, {
        label: "90 days",
        val: "90"
    } ]
}), ModelEditors.selectContractAssignability = ModelEditors.select.extend({
    values: [ {
        label: "-",
        val: null
    }, {
        label: "Approval Not Required",
        val: 1
    }, {
        label: "​Approval Not Required for Ordinary Course of Business",
        val: 2
    }, {
        label: "Approval Not Required for Ordinary Course of Business (Sales/Mergers allowed)",
        val: 3
    }, {
        label: "Approval Required (Sales/Mergers allowed)",
        val: 4
    }, {
        label: "Approval Required",
        val: 5
    } ]
}), ModelEditors.selectProductionPaymentType = ModelEditors.select.extend({
    values: [ {
        label: "Contact (company)",
        val: 1
    }, {
        label: "​Person",
        val: 2
    } ]
}), ModelEditors.selectProductionPaymentAssortedCostFee = ModelEditors.select.extend({
    values: [ {
        label: "Manuscript Fees",
        val: "0"
    }, {
        label: "​Studio Costs",
        val: "​1"
    } ]
}), ModelEditors.selectContractRemainderDuration = ModelEditors.select.extend({
    values: [ {
        label: "-",
        val: null
    }, {
        label: "6 months",
        val: "6 months"
    }, {
        label: "​12 months",
        val: "12 months"
    }, {
        label: "​18 months",
        val: "18 months"
    }, {
        label: "​Not specified",
        val: "Not specified"
    }, {
        label: "Termination",
        val: "Termination"
    } ]
}), ModelEditors.selectContractRemainderFinancialObligation = ModelEditors.select.extend({
    values: [ {
        label: "-",
        val: null
    }, {
        label: "10% of all money received after cost",
        val: "10% of all money received after cost"
    }, {
        label: "10% of all money received",
        val: "10% of all money received"
    }, {
        label: "Other",
        val: "Other"
    } ]
}), ModelEditors.selectRecordingProducer = ModelEditors.select.extend({
    values: [ {
        label: "-",
        val: null
    }, {
        label: "BSA",
        val: "BSA"
    }, {
        label: "RI",
        val: "RI"
    } ]
}), ModelEditors.selectDealTerritoryChoice = ModelEditors.select.extend({
    use: "lowercase",
    values: [ "-", "Inherit", "Assign" ]
});
//# sourceMappingURL=model-editor.js.map