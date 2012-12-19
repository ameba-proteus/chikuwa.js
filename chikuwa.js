/**
 * chikuwa.js
 * Copyright (c) 2011 CyberAgent, Inc.
 * License: MIT (http://www.opensource.org/licenses/mit-license)
 * GitHub: https://github.com/suguru/chikuwa.js
 */
(function(w) {
	var doc = w.document,
	root = w.document.documentElement,
	cssnum = {'column-count':1,columns:1,'font-weight': 1,'line-height':1,opacity:1,'z-index':1,zoom:1},
	slice = Array.prototype.slice;
	
	// is string
	function isString(o) { return typeof o === 'string' || o instanceof String; }
	// is function
	function isFunction(o) { return typeof o === 'function' || o instanceof Function; }
	// is number
	function isNumber(o) { return typeof o === 'number' || o instanceof Number; }
	// is chikuwa object
	function isChikuwa(o) { return o instanceof chikuwa; }
	// is object
	function isObject(o) { return o instanceof Object; }
	// is array
	function isArray(o) { return o instanceof Array; }
	// is undefined or null
	function isNull(o) { return o === undefined || o === null; }
	// is empty object
	function isEmptyObject(o) { for(var b in o){return false;}return true; }
	// convert undefined/null to empty string
	function nullToEmpty(o) { return isNull(o) ? '' : o; }
	// trim string
	// function trim(str) { return str.replace(/^\s+|\s+$/g,''); }
	// convert camel case
	function camelcase(str) { return str.replace(/-([a-z])/g, function(c) {return c.toUpperCase().replace('-','');}); }
	// revert camel case
	function dashed(str) { return str.replace(/([A-Z])/g,function(c) {return '-'+c.toLowerCase();}); }
	// add px string to css property if required
	function addpx(name,value) { return (isNumber(value) && isNull(cssnum[name])) ? value + 'px' : value; }
	// convert array to map names
	function arrayToMap(array) {
		var o = {};
		for (var i = 0; i < array.length; i++) {
			o[array[i]] = 1;
		}
		return o;
	}
	// trim string
	function trim(string) {
		return string ? string.replace(/^\s+|\s+$/g,'') : '';
	}
	// escape html
	function escapeHtml(string) {
		return tag('span').text(string).inner();
	}
	// cross browser css applicants
	function xbcss(css,name,value) {
		if (!value) return;
		['-webkit-'+name,'-moz-'+name,'-ms-'+name,'-o-'+name,name].forEach(function(n) {
			css[n] = value;
		});
	}
	var _cid = 0;
	function cid(element) {
		return element._cid || (element._cid = ++_cid);
	}
	// create an event object
	function createEvent(type,target,source) {
		try {
			var evt = new Event(type);
			evt.target = target;
			return evt;
		} catch (e) {
			var currentTarget = (target instanceof chikuwa) ? target.get(0) : null;
			return {
				type: type,
				target: target,
				currentTarget: currentTarget,
				custom: true,
				source: source,
				stopPropagation: function() {
					if (source) {
						source.stopPropagation();
					}
				},
				preventDefault: function() {
					if (source) {
						source.preventDefault();
					}
				}
			};
		}
	}
	
	/**
	 * main constructor of chikuwa object
	 * @param s selector
	 * @param p parent
	 * 
	 * chikuwa class
	 * property
	 *	s: selector
	 *  p: parent
	 *  c: context
	 */
	function chikuwa(selector,parent) {
		if (isString(selector)) {
			this.c = parent.querySelectorAll(selector);
		} else if (isArray(selector)) {
			this.c = selector;
		} else {
			this.c = [selector];
		}
	}
	
	/**
	 * shortcut function for creating chikwua object
	 * @param s selector
	 */
	function $(selector) {
		if (isNull(selector))
			return null;
		if (selector instanceof chikuwa)
			return selector;
		else
			return new chikuwa(selector,doc);
	}

	// event shortcuts
	var eventShortcut = {
		// added to DOM tree
		'added' : 'DOMNodeInsertedIntoDocument',
		// removed from DOM Tree
		'removed': 'DOMNodeRemovedFromDocument',
		// added to DOM node
		'addedToNode' : 'DOMNodeInserted',
		// removed from DOM node
		'removedFromNode' : 'DOMNodeRemoved'
	};
	
	function eventName(name) {
		if (name in eventShortcut) {
			return eventShortcut[name];
		} else {
			return name;
		}
	}

	/**
	 * Prototyping of chikuwa object
	 */
	chikuwa.prototype = {
			constructor: chikuwa,
			/**
			 * get length of contexts.
			 * @returns
			 */
			length: function() {
				return this.c.length;
			},
			/**
			 * check existence by index.
			 * @param i index
			 * @returns {Boolean}
			 */
			exist: function(i) {
				var c = this.c;
				return i >= 0 && i < c.length && (isArray(c) ? !isNull(c[i]) : !isNull(c.item(i)));
			},
			/**
			 * get element by index.
			 * @param i index
			 * @returns {Element}
			 */
			get: function(i) {
				if (isArray(this.c))
					return this.c[i];
				else
					return this.c.item(i);
			},
			/**
			 * iterate all object in contexts
			 * @param cb callback function (element)
			 * @returns {chikuwa}
			 */
			each: function(cb) {
				var a = this.c instanceof Array;
				for (var i = 0; i < this.c.length; i++) {
					if (a)
						cb.call(this.c[i]);
					else
						cb.call(this.c.item(i));
				}
				return this;
			},
			/**
			 * find from children
			 * @param s selector
			 */
			find: function(s) {
				var r = [];
				this.each(function() {
					var l = this.querySelectorAll(s);
					var length = l.length;
					for (var i = 0; i < length; i++) {
						r.push(l.item(i));
					}
				});
				return $(r);
			},
			/**
			 * get offset values of the first element.
			 * default coordinates contain scrollLeft/scrollTop.
			 * @param o options (scroll=do not contain scrollLeft/scrollTop)
			 * @return 
			 */
			bound: function(o) {
				var b = this.get(0).getBoundingClientRect();
				// check scroll coordinate
				var sx = (o && o.screen) ? 0 : doc.body.scrollLeft;
				var sy = (o && o.screen) ? 0 : doc.body.scrollTop;
				return {
					left: Math.floor(b.left + sx),
					right: Math.floor(b.right + sx),
					top: Math.floor(b.top + sy),
					bottom: Math.floor(b.bottom + sy),
					width: Math.floor(b.width),
					height: Math.floor(b.height)
				};
			},
			/**
			 * get/set width of elements.
			 * @param w width
			 * @returns width
			 */
			width: function(w) {
				if (w === undefined) {
					return this.bound().width;
				} else {
					if (typeof w === 'number') {
						w = w + 'px';
					}
					return this.css({width:w});
				}
			},
			/**
			 * get/set height of elements.
			 * @param h height
			 * @returns height
			 */
			height: function(h) {
				if (h === undefined) {
					return this.bound().height;
				} else {
					if (typeof h === 'number') {
						h = h + 'px';
					}
					return this.css({height:h});
				}
			},
			/**
			 * get/set position of elements
			 */
			position: function(pos) {
				if (pos) {
					this.css({
						left: pos.x,
						top: pos.y
					});
				} else {
					var bounds = this.bound();
					return {
						x: bounds.left,
						y: bounds.top
					};
				}
				return this;
			},
			/**
			 * get/set css values of the first/all elements
			 * @param name
			 * @returns
			 */
			css: function(name) {
				var css;
				if (isString(name)) {
					return this.get(0).style[camelcase(name)] || getComputedStyle(this.get(0), '').getPropertyValue(name);
				} else if (arguments.length === 0) {
					css = {};
					this.get(0).style.cssText.split(';').forEach(function(cssline) {
						var match = cssline.match(/\s*(.+)\s*:\s*(.+)\s*/);
						if (match)
							css[match[1]] = match[2];
					});
					return css;
				} else {
					css='';
					var reset = name.reset;
					delete name.reset;
					for (var n in name) {
						var d = dashed(n);
						css += (d + ':' + addpx(n,name[n]) + ';');
					}
					this.each(function() {
						if (reset)
							this.style.cssText = css;
						else
							this.style.cssText += css;
					});
					return this;
				}
			},
			/**
			 * check css property existence of the first element.
			 * @param name
			 * @returns
			 */
			hasClass: function(name) {
				if (!this.exist(0)) return undefined;
				var has = false;
				this.each(function() {
					var className = this.className;
					// check clas existence
					has = (' ' + nullToEmpty(className) + ' ').indexOf(' ' + name + ' ') >= 0;
					return has;
				});
				return has;
			},
			/**
			 * apply class changes of the map
			 */
			cls: function(values) {
				if (isNull(values)) {
					var o = {};
					this.each(function() {
						$.merge(o, arrayToMap(this.className.split(/\s+/g)));
					});
					return o;
				}
				var add = [], remove = [], i = 0;
				if (isString(values)) {
					add = [values];
				} else if (isArray(values)) {
					add = arrayToMap(values);
				} else {
					$.map(values, function(name,value) {
						if (value === 1)
							add.push(name);
						else
							remove.push(name);
					});
				}
				// add classes
				this.each(function() {
					var classmap = arrayToMap(this.className.split(/\s+/g));
					// add classes
					for (i = 0; i < add.length; i++) {
						var name = add[i];
						if (name)
							classmap[name] = 1;
					}
					// remove classes
					for (i = 0; i < remove.length; i++) {
						delete classmap[remove[i]];
					}
					var cl = '';
					$.map(classmap, function(name) {
						if (cl.length === 0)
							cl += name;
						else
							cl += ' ' + name;
					});
					this.className = cl;
				});
				return this;
			},
			/**
			 * bind event listener to the elements
			 * @param name name
			 * @param cb callback
			 * @param uc useCapture
			 * @returns {chikuwa}
			 */
			on:	function(name,callback,useCapture) {
				name = eventName(name);
				this.each(function() {
					function ccb(e) {
						var target = e.currentTarget;
						var ret = callback.call(target,e);
						return ret;
					}
					ccb._cb = callback;
					ccb._uc = useCapture;
					this.addEventListener(name,ccb,useCapture);
					var handlers = this._handlers || (this._handlers = {});
					var handler = handlers[name] || (handlers[name] = []);
					if (handler.indexOf(ccb) < 0) {
						handler.push(ccb);
					} else {
						alert(callback);
					}
						
				});
				return this;
			},
			/**
			 * trigger event of the elements.
			 * @param name
			 */
			trigger: function(name,e) {
				name = eventName(name);
				var self = this;
				var evt = createEvent(name,self,e);
				this.each(function() {
					if (evt.custom) {
						var h = this._handlers;
						if (h && name in h) {
							var list = h[name];
							list.forEach(function(cb) {
								return cb.call(self,evt);
							});
						}
					} else {
						this.dispatchEvent(evt);
					}
				});
			},
			/**
			 * add event listener which invoke once.
			 * @param name event type
			 * @param cb callback
			 * @param uc (optional) useCapture flag
			 * @returns {chikuwa}
			 */
			once: function(name,cb,uc) {
				name = eventName(name);
				this.each(function() {
					var self = this;
					self.addEventListener(name,function(e) {
						self.removeEventListener(name,arguments.callee,uc);
						return cb.call(self,e);
					},uc);
				});
				return this;
			},
			/**
			 * remove event listener of elements.
			 * @param name event type
			 * @param cb (optional) callback
			 * @returns {chikuwa}
			 */
			off : function(name,cb) {
				name = eventName(name);
				this.each(function() {
					var h = this._handlers;
					if (h && name in h) {
						var i;
						var a = h[name];
						if (cb) {
							for (i = 0; i<a.length; i++)
								if (a[i]._cb === cb) {
									this.removeEventListener(name,a[i],a[i]._uc);
									a.splice(i,1);
									if (a.length === 0)
										delete h[name];
									break;
								}
						} else {
							for (i=0; i<a.length; i++)
								this.removeEventListener(name,a[i],a[i]._uc);
							delete h[name];
						}
					}
				});
				return this;
			},
			/**
			 * get/set text of the elements.
			 * @param text text to set
			 * @returns
			 */
			text: function(text) {
				var alen = arguments.length;
				if (alen === 0) {
					var t = '';
					this.each(function() {
						t += this.textContent;
					});
					return t;
				} else {
					if (alen > 1)
						text = $.format.apply($,arguments);
					text = text || '';
					return this.each(function() { this.textContent = text; });
				}
			},

			/**
			 * get or set value
			 */
			value: function(v) {
				var f = this.get(0);
				if(v !== null && v !== undefined) {
					//setter
					if(f) f.value = v;
					return this;
				} else {
					//getter
					if(f) return f.value || '';
					return '';
				}
			},
			
			/**
			 * checked or not
			 */
			checked: function(){
				var f = this.get(0);
				return f.checked || false;
			},

			/**
			 * get the parent node.
			 */
			parent: function() {
				var f = this.get(0);
				if (f) {
					return $(f.parentNode);
				} else {
					return null;
				}
			},
			/**
			 * append element to the first one.
			 * @param e
			 * @returns {chikuwa}
			 */
			append: function(e) {
				if (isNull(e)) return this;
				var a = $(e);
				var f = this.get(0);
				if (f)
					a.each(function() {
						f.appendChild(this);
					});
				return this;
			},
			/**
			 * prepend element to the first one.
			 * @param e
			 */
			prepend: function(e) {
				if (isNull(e)) return this;
				var a = $(e);
				var f = this.get(0);
				if (f)
					a.each(function() {
						if (f.childNodes.length > 0 && f.firstChild)
							f.insertBefore(this,f.firstChild);
						else
							f.appendChild(this);
					});
				return this;
			},

			replace: function(e, t) {
				if (isNull(e)) return this;
				var a = $(e);
				var f = this.get(0);
				var r = t.get(0);
				if (f)
					a.each(function() {
						if (f.childNodes.length > 0 && r && r.parentNode == f)
							f.insertBefore(this,r);
						else
							f.appendChild(this);
						f.removeChild(r);
					});
				return this;
			},

			/**
			 * remove elements from the content.
			 * @returns {chikuwa}
			 */
			remove: function() {
				this.each(function() {
					if (this.parentNode)
						this.parentNode.removeChild(this);
				});
				return this;
			},
			/**
			 * set empty string
			 */
			empty: function() {
				return this.inner('');
			},
			/**
			 * get the html of this tag
			 */
			html: function() {
				var args = slice.apply(arguments)
				if (args.length === 0) {
					var html = '';
					this.each(function() {
						if (this.outerHTML)
							html += this.outerHTML;
					});
					return html;
				} else {
					return this.each(function() {
						this.outerHTML = args[0];
					});
				}
			},
			inner: function() {
				var args = slice.apply(arguments);
				if (args.length === 0) {
					var html = '';
					this.each(function() {
						if (this.innerHTML)
							html += this.innerHTML;
					});
					return html;
				} else {
					return this.each(function() {
						this.innerHTML = args[0];
					});
				}
			},
			/**
			 * generate tagged content.
			 * @param name tag name
			 * @param opts (optional) attribute map
			 * @returns
			 */
			tag: function(name,opts) {
				var t = $.tag(name,opts);
				t._p = this;
				return t;
			},
			/**
			 * end generation and append to the parent.
			 * @returns
			 */
			gat: function() {
				var p = this._p;
				delete this._p;
				return p.append(this);
			},
			/**
			 * append textnode
			 * @returns
			 */
			appendText: function(text) {
				var alen = arguments.length;
				if (alen > 1){
					text = $.format.apply($,arguments);
				}
				text = text || '';
				this.append(doc.createTextNode(text));
				return this;
			},
			/**
			 * execute function in method chain
			 * @param cb
			 */
			exec: function(cb) {
				cb.call(this);
				return this;
			},
			/**
			 * get/set attribute to elements.
			 * @param name
			 * @param value
			 * @returns
			 */
			attr: function(name,value) {
				var self = this;
				var f;
				if (name === undefined && value === undefined) {
					if (arguments.length === 1)
						return this;
					f = self.get(0);
					var o = {};
					if (f && f.attributes) {
						var length = f.attributes.length;
						for (var i = 0; i < length; i++) {
							var attr = f.attributes[i];
							o[attr.name] = attr.value;
						}
					}
					return o;
				} else if (value === undefined && isObject(name)) {
					for (var n in name)
						self.attr(n,name[n]);
				} else if (isString(name) && value === undefined) {
					f = self.get(0);
					if (f.hasAttribute(name)) {
						return f.getAttribute(name);
					} else {
						return undefined;
					}
				} else {
					this.each(function() {
						if (isNull(value)) {
							this.removeAttribute(name);
						} else {
							if (name === 'cls') {
								self.cls(value);
							} else {
								this.setAttribute(name,value);
							}
						}
					});
				}
				return this;
			},
			/**
			 * set data attributes to the element
			 */
			data: function(name,value) {
				var self = this;
				var n;
				if (arguments.length === 0) {
					var attrs = this.attr();
					var obj = {};
					for (n in attrs) {
						if (n.indexOf('data-') === 0)
							obj[n.substring(5)] = attrs[n];
					}
					return obj;
				} else if (arguments.length === 1) {
					if (isString(name)) {
						return this.attr('data-'+name);
					} else {
						var attr = {};
						for (n in name) {
							attr['data-'+n] = name[n];
						}
						this.attr(attr);
					}
				} else {
					this.attr('data-'+name,value);
				}
				return this;
			},
			/**
			 * tap event support touches
			 */
			tap: function(cb) {
				var self = this;
				if (cb) {
					self.on('tap', function(e) {
						return cb.call(this,e);
					});
					// bind click if not support touch event
					if ($.os.touch) {
						var target = null;
						self
						// start detecting touches
						.on('touchstart', function(e) {
							target = $(this);
							target.__tap = {};
							var finger = e.changedTouches[0];
							target.__tap.x = finger.clientX;
							target.__tap.y = finger.pageY + doc.body.scrollTop;
						})
						
						.on('touchmove', function(e) {
							var finger = e.changedTouches[0];
							target.__tap.toX = finger.clientX;
							target.__tap.toY = finger.pageY + doc.body.scrollTop;
							
							var __tap = target.__tap;
							if (!(Math.abs((__tap.toX || __tap.x) - __tap.x) <= 10 &&
									Math.abs((__tap.toY || __tap.y) - __tap.y) <= 10)) {
								// trigger tapout
								target.trigger('tapout',e);
								return false;
							}
						})

						.on('touchend', function(e) {
							e.preventDefault();
							e.stopPropagation();
							// get the rectangle bounds of the element
							var bounds = target.bound();
//							var bounds = self.bound({screen:1});
							// get the finger
							var finger = e.changedTouches[0];
							// calculate touch point of the element
							var x = finger.clientX - bounds.left;
							var y = finger.pageY - bounds.top;
							var __tap = target.__tap;
							if (x >= 0 &&
									Math.abs((__tap.toX || __tap.x) - __tap.x) <= 5 &&
									Math.abs((__tap.toY || __tap.y) - __tap.y) <= 5 &&
									x <= bounds.width &&
									y >= 0 &&
									y <= bounds.height &&
									!target.attr('disabled')
							) {
								// trigger tap
								target.trigger('tap',e);
							}
							delete target.__tap;
							target = null;
						});
					} else {
						self.click(function(e) {
							$(this).trigger('tap',e);
						});
					}
				} else {
					self.trigger('tap');
				}
				return self;
			},
			
			/**
			 * over event support touches
			 */
			over: function(cb) {
				var self = this;
				self.on('over',function(e) {
					var target = this;
					target.__over=true;
					cb.call(target,e);
				});
				function triggerOver(e) {
					$(this).trigger('over',e);
				}
				if ($.os.touch)
					if (cb)
						self
						.on('touchstart', triggerOver);
					else
						triggerOver();
				else
					self.mouseover(triggerOver);
				return self;
			},
			
			/**
			 * tapout event support touches
			 */
			tapout: function(cb) {
				var self = this;
				self.on('tapout',function(e) {
					var target = this;
//					target.__tapout=true;
					cb.call(target,e);
				});
				return self;
			},
			
			/**
			 * out event support touches
			 */
			out: function(cb) {
				var self = this;
				self.on('out',function(e) {
					var target = this;
					if (target.__over) {
						delete target.__over;
						cb.call(target,e);
					}
				});
				function triggerOut(e) {
					$(this).trigger('out',e);
				}
				if ($.os.touch)
					if (cb)
						self
						.on('touchend', triggerOut);
					else
						triggerOut();
				else
					self.mouseout(triggerOut);
				return self;
			},
			
			/**
			 * transform
			 */
			transform: function(transform, options) {
				var css = {};
				var opts = options || {};
				xbcss(css,'transform', transform || 'none');
				xbcss(css,'transform-origin', opts.origin);
				return this.css(css);
			},
			
			/**
			 * transition
			 */
			transition: function(options, callback) {
				var that = this;
				var opts = options || {};
				var duration = 'duration' in opts ? opts.duration : 0.5;
				
				var css = {};
				if (!options.no3d) {
					xbcss(css,'transform-style', 'preserve-3d');
				}
				xbcss(css,'transition', 'all ' + duration + 's ' + (opts.ease || ''));
				that.css(css);
				
				if (typeof options === 'function') callback = options;
				var handler = function() {
					if (callback) {
						callback.apply(that);
					}
				};
				if (handler)
					if ($.os.webkit)
						that.once('webkitTransitionEnd',handler);
					else
						setTimeout(handler,duration*1000);
				return this;
			},
			
			/**
			 * rotate transform
			 */
			rotate: function(deg,options,callback) {
				return this.transform('rotate('+deg+'deg)',options,callback);
			},
			
			/**
			 * translate transform
			 */
			translate: function(x,y,options,callback) {
				return this.transform('translate('+x+'px,'+y+'px)',options,callback);
			},
			/**
			 * scale transform
			 */
			scale: function(scale,options,callback) {
				return this.transform('scale('+scale+','+scale+')',options,callback);
			},
			/**
			 * visibility
			 */
			visible: function(visible) {
				return this.css({visibility:visible ? 'visible':'hidden'});
			},
			/**
			 * disable all events
			 */
			disable: function() {
				var self = this;
				function prevent(e) {
					e.stopPropagation();
					e.preventDefault();
				}
				['touchstart','touchend','touchmove','mouseover','mouseout','mousedown','mouseup','click']
				.forEach(function(n) {
					self.on(n, prevent);
				});
				return self;
			}
	};
	
	// register shorthand for bind/trigger
	['click','blur','change','error','focus',
	 'keydown','keyup','keypress','keyup',
	 'load','unload',
	 'mousedown','mouseup','mousemove','mouseout','mouseover',
	 'resize','scroll','select','submit',
	 'touchstart','touchmove','touchend']
	.forEach(function(name) {
		chikuwa.prototype[name] = function(cb) {
			if (cb)
				this.on(name, cb);
			else
				this.trigger(name);
			return this;
		 };
	});
		
	// window
	$.win = $(w);
	// document
	$.doc = $(doc);
	// root element
	$.root = $(root);

	// browser detection
	var ua = navigator.userAgent;
	$.os = {
		ua: ua,
		touch: 'ontouchstart' in document.documentElement,
		ios: /ip(hone|od|ad)/i.test(ua),
		iphone: /iphone/i.test(ua),
		ipad: /ipad/i.test(ua),
		android: /android/i.test(ua),
		mobile: /android.+mobile|ip(hone|od|ad)/i.test(ua),
		webkit: /webkit/i.test(ua)
	};

	/**
	 * register content ready listener.
	 * (DOMContentLoaded)
	 */
	$.ready = function(cb) {
		var readyState = doc.readyState;
		if (readyState === 'complete' || readyState === 'loaded') cb();
		$.doc.once('DOMContentLoaded', function() {
			$.body = $(doc.body);
			cb.call($.doc);
		});
	};
	
	var _loads = {};
	var _loaded = {};
	
	/**
	 * load image files
	 * @param url ...
	 * @param callback
	 */
	$.image = function() {
		var images = [];
		var args = slice.apply(arguments);
		var cb = args.pop();
		var cnt = args.length;
		if (cnt === 0) cb();
		args.forEach(function(url) {
			var img = new Image();
			_loads[url] = img;
			['load','error'].forEach(function(n) {
				img.addEventListener(n, function() {
					delete _loads[url];
					if (--cnt === 0) cb(n, images);
				});
			});
			img.src = url;
			images.push(img);
		});
	};
	
	/**
	 * load script/css files
	 * @param url ...
	 * @param callback
	 */
	$.load = function() {
		var args = slice.apply(arguments);
		var cb = args.pop();
		var cnt = args.length;
		
		var tryCount = 0;
		
		var cbw = function() {
			cb.apply(this,arguments);
		};

		function checkCssLoaded(url) {
			var styleSheets = document.styleSheets;
			for (var i = 0; i < styleSheets.length; i++) {
				var styleSheet = styleSheets[i];
				if (styleSheet.ownerNode.getAttribute('href') === url) {
					log.info('loaded stylesheet',url);
					// add to loaded css to the url
					_loaded[url] = 1;
					if (--cnt === 0 && cb) {
						cbw();
					}
					return;
				}
			}
			if (++tryCount > 200) {
				// mark as failed if it elapses 10 sec
				if (--cnt === 0 && cb) {
					cbw();
				}
				return;
			}
			// waiting more
			setTimeout(function() {
				checkCssLoaded(url);
			}, 50);
		}
		
		args.forEach(function(url) {
			// callback immediately if already loaded
			if (_loaded[url]) {
				if (--cnt === 0 && cb)
					cbw('load');
				return;
			}

			var script = null;
			var isJS = url.indexOf('.js') >= 0;
			var isCSS = url.indexOf('.css') >= 0;

			if (isJS) {
				// create a javascript tag
				script = tag('script', {type:'text/javascript',src:url, async:"async"});
				// bind load/error handler
				['load','error'].forEach(function(n) {
					script.on(n, function() {
						script.off('load').off('error').remove();
						if (n === 'load') {
							// add to loaded script to the url
							_loaded[url] = 1;
							log.info('loaded script',url);
						}
						if (--cnt === 0 && cb)
							cbw(n);
					});
				});
			} else if (isCSS) {
				// create a css tag
				script = $.tag('link', {rel:'stylesheet',type:'text/css',href:url});
				tryCount = 0;
				// set polling for check
				setTimeout(function() {
					checkCssLoaded(url);
				},10);
			}

			// add script tag to the head element
			$('head').append(script);
		});
	};

	/**
	 * check loaded resource
	 */
	$.loaded = function() {
		var args = slice.apply(arguments);
		for (var i = 0; i < args.length; i++) {
			if (!_loaded[args[i]])
				return false;
		}
		return true;
	};
	/**
	 * Generate tagged content
	 * @param name tag name
	 * @param attrs attribute map
	 */
	$.tag = function(name,attrs) {
		attrs = attrs || {};
		
		// check id/class expression in name
		var idx1 = name.indexOf('#');
		var idx2 = name.indexOf('.');
		
		if (idx1 > 0) {
			if (idx2 > 0) {
				attrs.id = name.substring(idx1+1,idx2);
			} else {
				attrs.id = name.substring(idx1+1);
			}
		}
		if (idx2 > 0) {
			var cls = name.substring(idx2+1).split('.');
			for (var i = 0; i < cls.length; i++) {
				var c = cls[i];
				if (attrs.cls)
					attrs.cls += ' '+c;
				else
					attrs.cls = c;
			}
		}
		name = (idx1 > 0) ? name.substring(0,idx1) :
		       (idx2 > 0) ? name.substring(0,idx2) : name;
		
		var element = doc.createElement(name);
		var chikuwa = $(element).attr(attrs);

		return chikuwa;
	};

	/**
	 * create fragment node
	 */
	$.fragment = function() {
		return $(document.createDocumentFragment());
	};
	
	/**
	 * Extending class
	 * @param targetclass Target class function
	 * @param superclass Super class function
	 * @param extents extending properties
	 */
	$.extend = function(extend) {
		$.map(extend, function(name,handler) {
			chikuwa.prototype[name] = handler;
		});
	};
	
	/**
	 * Map object properties
	 * @param target
	 * @param callback
	 */
	$.map = function(target,callback) {
		if (!target)
			return;
		for (var name in target)
			if (target.hasOwnProperty(name))
				callback.call(target,name,target[name]);
	};
	
	/**
	 * merge object properties
	 * @param source
	 * @param overwrite
	 */
	$.merge = function(source,overwrite) {
		if (!overwrite)
			return source;
		if (!source)
			return overwrite;
		$.map(overwrite, function(name,value) {
			if (value !== undefined)
				source[name] = value;
		});
		return source;
	};
	
	/**
	 * filter array by the function
	 * @param array
	 * @param detection
	 */
	$.filter = function(array,detecthandle) {
		var newarray = [];
		var length = array.length;
		for (var i = 0; i < length; i++) {
			var obj = array[i];
			if (detecthandle(obj))
				newarray.push(obj);
		}
		return newarray;
	};
	
	/**
	 * get the viewport information
	 * @return viewport
	 */
	$.viewport = function() {
		return {
			window: {
				width: w.innerWidth,
				height: w.innerHeight,
				offset: {
					x: w.pageXOffset,
					y: w.pageYOffset
				}
			},
			screen: {
				width: screen.width,
				height: screen.height
			},
			zoom: screen.width / w.innerWidth
		};
	};
	
	/**
	 * get/set cookie data
	 * set
	 * $.cookie('name', 'value', 10);
	 * get
	 * var value = $.cookie('name');
	 */
	$.cookie = function(name,value,days) {
		var pair;
		if (arguments.length === 1) {
			// parse and get cookie value
			var pairs = document.cookie.split(';');
			for (var i = 0; i < pairs.length; i++) {
				pair = pairs[i];
				var eidx = pair.indexOf('=');
				var pairName = trim(pair.substring(0, eidx));
				if (name === pairName)
					return trim(pair.substring(eidx+1));
			}
			return undefined;
		} else {
			pair = name + '=' + escape(value ? value : '');
			var expireDate = null;
			if (days) {
				// set expire date
				expireDate = new Date();
				expireDate.setDate(expireDate.getDate() + days);
			} else if (!value) {
				// remove if value is negative
				expireDate = new Date(0);
			}
			if (expireDate)
				pair += "; expires=" + expireDate.toUTCString();
			document.cookie = pair;
		}
	};
	
	/**
	 * get/set value to the local storage.
	 * value will be saved as JSON string.
	 */
	$.storage = function(name,object) {
		if (arguments.length === 1) {
			var string = localStorage.getItem(name);
			return string ? JSON.parse(string) : null;
		} else {
			// remove before set for resolving storage bugs
			localStorage.removeItem(name);
			if (!isNull(object)) {
				localStorage.setItem(name,JSON.stringify(object));
			}
			return this;
		}
	};

	/**
	 * get/set value to the session storage.
	 * value will be save as JSON string.
	 */
	$.session = function(name,object) {
		if (arguments.length === 1) {
			var string = sessionStorage.getItem(name);
			return string ? JSON.parse(string) : null;
		} else {
			// remove before set for resolving storage bugs
			sessionStorage.removeItem(name);
			if (!isNull(object)) {
				sessionStorage.setItem(name,JSON.stringify(object));
			}
			return this;
		}
	}
	
	/**
	 * format message patterns
	 * $.format("{1} likes {2}", 'John', 'Anna');
	 * $.format("{a} likes {b}", {a:'John', b:'Anna'});
	 */
	$.format = function() {
		var args = arguments;
		if (!args[0]) {
			return null;
		}

		if(isObject(args[1])){
			return args[0].replace(/(.*?)\{(.+?)\}([^\{]*)/g, function() {
				return arguments[1] + (args[1][arguments[2]] || "") + arguments[3];
			});
		} else {
			return args[0].replace(/\{(\d+)\}/g, function() {
				return args[arguments[1]];
			});
		}
	};
	
	/**
	 * Make prototype as event dispatcher.
	 */
	$.listenize = function(target) {
		target.prototype.on = function(name,callback) {
			log.info('listening',target.name,name);	
			if (isObject(name)) {
				for (var n in name) {
					this.on(n,name[n]);
				}
			} else {
				if (!this._events) {
					this._events = {};
				}
				var array = this._events[name];
				if (array) {
					array.push(callback);
				} else {
					this._events[name] = [callback];
				}
			}
			return this;
		};
		
		target.prototype.off = function(name,callback) {
			log.info('listening off',target.name,name);
			var self = this;
			if (arguments.length === 1) {
				delete this._events[name];
			} else {
				if (typeof handler === 'function') {
					var list = this._events[name];
					if (list) {
						var index = list.indexOf(callback);
						if (index >= 0) {
							list.splice(index,1);
							if (list.length === 0) {
								delete this._events[name];
							}
						}
					}
				} else {
					var args = slice.apply(arguments);
					args.forEach(function(name) {
						self.off(name);
					});
				}
			}
			return this;
		};

		target.prototype.trigger = function() {
			if (!this._events) {
				return;
			}
			var args = slice.apply(arguments);
			var name = args.shift();
			log.debug('triggering',target.name,name,args);
			var array = this._events[name];
			if (array) {
				for (var i = 0; i < array.length; i++) {
					var ret = array[i].apply(this,args);
					if (ret === false || ret === 1) {
						return false;
					}
				}
			}
			return true;
		};
	};

	/**
	 * simple timer
	 */
	function Timer(interval,loop,delay) {
		this.count = 0;
		this.loop = loop || 0;
		this.interval = interval || 0;
		this.delay = delay || 0;
		this.timerId = 0;
	}
	Timer.prototype = {
		lastTap: null,
		paused: false,
		executedTime: 0,
		pastFromPrev: 0,
		start: function() {
			var self = this;
			self.paused = false;
			self.end = false;
			if (self.delay > 0) {
				self.timerId = setTimeout(function() {
					self.next();
				}, self.delay);
			} else {
				self.next();
			}
			return self;
		},
		next: function() {
			var self = this;
			if (self.end) {
				// return if timer has been finished
				return;
			}
			if(self.paused) {
				return;
			}

			self.count++;
			self.executedTime = new Date().getTime();
			self.trigger('timer');
			if (self.loop > 0 && --self.loop === 0) {
				// finish when loop is over
				return;
			}
			
			self.timerId = setTimeout(function() {
				self.next();
			},self.interval);
		},
		pause: function() {
			this.paused = true;
			this.pastFromPrev = new Date().getTime() - this.executedTime;
			clearTimeout(this.timerId);
		},
		resume: function() {
			var self = this;
			this.paused = false;
			this.timerId = setTimeout(function() {
				self.next();
			},self.interval - self.pastFromPrev);
		},
		stop: function() {
			var self = this;
			self.end = true;
			clearTimeout(self.timerId);
			return self;
		}
	}
	$.listenize(Timer);

	$.timer = function(interval,loop,delay) {
		return new Timer(interval,loop,delay);
	},

	/**
	 * get current timestamp in milliseconds
	 */
	$.now = function() {
		return new Date().getTime();
	},

	/**
	 * make simple class (simple prototype)
	 */
	$.makeclass = function(opts) {
		function definition() {
			if (this.init)
				this.init.apply(this, arguments);
		}
		opts.constructor = definition;
		definition.prototype = opts;
		return definition;
	};

	/**
	 * query parser
	 */
	$.parseQuery = function(query) {
		if(query === null) return false;
		query = query || location.search;
		if (!query) {
			var href = location.href;
			var idx = href.indexOf('?');
			query = href.substring(idx+1);
		}
		if (query.charAt(0) === '?') {
			query = query.substring(1);
		}
		var obj = {};
		var parts = query.split('&');
		for (var i = 0; i < parts.length; i++) {
			var str = parts[i];
			var idx = str.indexOf('=');
			var kv = [str.substring(0, idx), str.substring(idx+1)];
//			var kv = parts[i].split('=');
			if (kv.length === 2) {
				obj[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
			}
		}
		return obj;
	};
	
	$.createQuery = function(params) {
		var q = '';
		for (var n in params) {
			q += encodeURIComponent(n)+'='+encodeURIComponent(params[n])+'&';
		}
		return q.slice(0, -1);
	};


	/**
	 * hide address bar
	 */
	function hideAddressBar() {
		setTimeout(function(){
			window.scrollTo(0,1);
		},0);
		w.addEventListener('orientationchange', hideAddressBar);
	};
	$.hideAddressBar = hideAddressBar;
	
	w.$ = $;

	// utility funtions
	$.isString = isString;
	$.isChikuwa = isChikuwa;
	$.isObject = isObject;
	$.isEmptyObject = isEmptyObject;
	$.isFunction = isFunction;
	$.isNumber = isNumber;
	$.isArray = isArray;
	$.escapeHtml = escapeHtml;

	// line extraction from stack trace
	var lineregex = new RegExp("\/([^\/]+?:[0-9]+):");

	// print log
	function printlog(type,args) {
		var stack = new Error().stack;
		if (stack) {
			var lines = stack.split(/\n/);
			var line = lines[3];
			if (line) {
				var linematch = lineregex.exec(line);
				if (linematch) {
					var match = linematch[1];
					args.push('('+match+')');
				}
			}
		}
		args.unshift('['+type+']');
		if ($.os.ios || $.os.android) {
			console.log(args.join(' '));
		} else {
			console.log.apply(console, args);
		}
	}
	// print leveled logs
	var log = {
		debug: function() {
			printlog('DEBUG',slice.apply(arguments));
		},
		info: function() {
			printlog('INFO',slice.apply(arguments));
		},
		warn: function() {
			printlog('WARN',slice.apply(arguments));
		},
		error: function() {
			printlog('ERROR',slice.apply(arguments));
		},
		fatal: function() {
			printlog('FATAL',slice.apply(arguments));
		}
	};
	$.log = log;

	function none() {}

	$.setLogLevel = function(type) {
		switch (type) {
			case 'FATAL':
				log.error = none;
			case 'ERROR':
				log.warn = none;
			case 'WARN':
				log.info = none;
			case 'INFO':
				log.debug = none;
			default:
				break;
		}		
	};

})(window);
