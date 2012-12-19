/**
 * chikwua-view
 * Copyright (c) 2011 CyberAgent, Inc.
 * License: MIT (http://www.opensource.org/licenses/mit-license)
 * GitHub: https://github.com/suguru/chikuwa.js
 */
(function(w) {

	// arguments slice shortcut
	var slice = Array.prototype.slice;

	var log = $.log;

	// view class asset
	var viewClasses = {};

	// view id counter
	var vid = 0;

	var resizes = {};
	var scrolls = {};
	var orientations = {};

	$.win
	.on('resize', function() {
		var viewport = $.viewport();
		$.map(resizes, function(name,value) {
			//setTimeout: for android to get viewport's height
			setTimeout(function() {
				value.resize(viewport);
			}, 0);
		});
	})
	.on('orientationchange', function() {
		$.map(orientations, function(name,value) {
			value.orientationchange();
		});
	})
	.on('scroll', function() {
		var viewport = $.viewport();
		$.map(scrolls, function(name,value) {
			value.resize(viewport);
		});
	});

	/**
	 * View class
	 */
	function View(opts) {
	}
	View.prototype = {
		constructor: View,
		/**
		 * hidden initializer for View parent class
		 */
		__init: function(opts) {
			var self = this;
			self.id = ++vid;
			self.active = false;
			self.init(opts);
			self.content = self.render(opts);
			self.content.__view = self;
			self.content
			.on('added', function() {
				log.debug('view added',self.__name);
				if ('resize' in self) {
					resizes[self.id] = self;
				}
				if ('scroll' in self) {
					scrolls[self.id] = self;
				}
				if ('orientationchange' in self) {
					orientations[self.id] = self;
				}
				self.active = true;
				self.trigger('added');
			})
			.on('removed', function() {
				log.debug('view removed',self.__name);
				delete resizes[self.id];
				delete scrolls[self.id];
				delete orientations[self.id];
				self.active = false;
				self.trigger('removed');
			});
			self.centering = this.centering;
			self.fullfill = this.fullfill;
		},
		/**
		 * initialize (called in constructor function)
		 */
		init: function() {
		},
		/**
		 * clean the view content
		 */
		remove: function() {
			this.content.remove();
			return this;
		},
		/**
		 * get rendered html
		 */
		render: function(opts) {
			return tag('div');
		},
		/**
		 * show this content
		 */
		show: function(container, opts) {
			opts = opts || {};
			container = container ? container : this.parent;
			if (container) {
				if (typeof container === 'string') {
					container = $(container);
				}
				if (container instanceof View) {
					if(opts.replaceTarget) {
						container.content.replace(this.content, opts.replaceTarget);
					} else if(opts.prepend) {
						container.content.prepend(this.content);
					} else {
						container.content.append(this.content);
					}
				} else {
					if(opts.replaceTarget) {
						container.replace(this.content, opts.replaceTarget);
					} else if (opts.prepend) {
						container.prepend(this.content);
					} else {
						container.append(this.content);
					}
				}
			}
			return this;
		},
		/**
		 * hide this content
		 */
		hide: function() {
			this.parent = this.content.parent();
			this.content.remove();
			return this;
		},
		/**
		 * add view to this
		 */
		add: function(view) {
			if ($.isArray(view)) {
				var fm = $(document.createDocumentFragment());
				view.forEach(function(v) {
					fm.append(v.content);
				});
				this.content.append(fm);
			} else {
				view.show(this);
			}
			return this;
		},
		/**
		 * add view to this
		 */
		addFirst: function(view) {
			if($.isArray(view)) {
				var fm = $(document.createDocumentFragment());
				view.forEach(function(v) {
					fm.append(v.content);
				});
				this.content.prepend(fm);
			} else {
				view.show(this, {prepend:true});
			}
			return this;
		},

		/**
		 * add view to this
		 */
		addInstead: function(view, target) {

			if ($.isArray(view)) {
				var fm = $(document.createDocumentFragment());
				view.forEach(function(v) {
					fm.append(v.content);
				});
				this.content.replace(fm, target);
			} else {
				view.show(this, {replaceTarget: target});
			}
			return this;
		},

		/**
		 * find the html(chikuwa-object) from the view
		 */
		find: function(selector) {
			return this.content.find(selector);
		},

		/**
		 * get bound rectangle
		 */
		bound: function() {
			return this.content.bound();
		},

		// Centring function
		centering : function centering(viewport) {
			var content = this.content;
			var bound = content.bound();
			content.css({
				top: Math.floor(((viewport.window.height - bound.height) / 2) + viewport.window.offset.y),
				left: Math.floor(((viewport.window.width - bound.width) / 2) + viewport.window.offset.x)
			});
		},

		// Fullfill the view
		fullfill : function fullfill(viewport) {
			var content = this.content;
			content.css({
				top: Math.floor(viewport.window.offset.y),
				left: Math.floor(viewport.window.offset.x),
				width: viewport.window.width,
				height: viewport.window.height
			});
		}
	};
	$.listenize(View);

	var popup = {
		current: null,
		show: function(view) {
			if (this.current) {
				this.hide(this.current);	
			}
			this.current = view;
			root.main.append(this.current);
		},
		hide: function() {
			if(this.current) this.current.remove();
		}
	};

	var page = {
		
		current: null,
		_overlay: false,
		
		isOverlay: false,

		resolvers: {
			top: function(wh) {
				return { x:0, y:-wh.height };
			},
			bottom: function(wh) {
				return { x:0, y:wh.height };
			},
			left: function(wh) {
				return { x:-wh.width, y: 0 };
			},
			right: function(wh) {
				return { x:wh.width, y: 0 };
			}
		},

		reverse: {
			top: 'bottom',
			bottom: 'top',
			left: 'right',
			right: 'left'
		},

		push: function(view,opts) {
			var target = (page.isOverlay) ? root.overlay : root.main;

			opts = opts || {};
			
			if (page._overlay) {
				page._overlay = false;

				if (opts.back) {
					if (page.current) {
						page.current.remove();
					}
					page.current = view;
					view.placeIn(target);
					return;
				}
			}

			var from = opts.from || 'right';
			var current = page.current;
			var duration = (opts.duration === 0 || opts.duration) ? opts.duration : 0.5;
			var viewport = $.viewport();
			var headerHeight = root.header.height();
			
			var coordinate = page.resolvers[from](viewport.window);
			// reverse if back specified
			if (opts.back) {
				coordinate.x = -coordinate.x;
				coordinate.y = -coordinate.y;
			}

			var container = tag('div').css({position:'absolute',width:'100%'});
			var pageout = tag('div').css({position:'absolute',width:'100%'});
			var pagein  = tag('div').css({position:'absolute',width:'100%'});

			// page-out/in
			if (current) {
				var scrollTop = document.body.scrollTop;
				if (scrollTop !== 0 && current && current.content) {
					if (scrollTop < headerHeight) { headerHeight = headerHeight - scrollTop; }
					var marginTop = ($.os.fixed) ? scrollTop : scrollTop-headerHeight;
					marginTop = (-1 * marginTop).toString() + 'px';
					current.content.css({'margin-top': marginTop});
//					current.content.find('i').css({'background-image':'none'});
//					current.content.find('img').css({'display':'none'});
				}
				pageout.append(current.content);
//				pageout.visible(false);
			}
			if (view) {
				pagein.append(view.content);
				page.current = view;
			}
			
			// set first position
			pagein.position({x:coordinate.x,y:coordinate.y});
			container
				.append(pageout)
				.append(pagein);
			
			// add page container to the root
//			root.main.empty();
			target.append(container);
			
			var viewInfo = $.viewport();
			var winHeight = viewInfo.window.height;
			var pageHeight = ($.os.fixed) ? winHeight - headerHeight : winHeight;
			pageout.css({overflow:'hidden', height:pageHeight});
			
			var exec = function() {
				if (view) {
					target.append(view.content);
				}
				pagein.remove();
				pageout.remove();
				container.remove();
				page.isAnimation = false;
				if (opts.callback) {
					opts.callback();
				}
			};
			
			page.isAnimation = true;
			setTimeout(function() {
				// reset scroll position
				window.scrollTo(0, 0);
				
				if (duration === 0) {
					exec();
					return;
				}
				
				trans = container.translate();
				container
				.translate(-coordinate.x, -coordinate.y)
				.transition({
					duration:  duration
				}, exec);
			}, 0);
		},


		overlay: function(view,type,opts) {
			opts = opts || {};
			//page._overlay = true;
			var current = page.current;
			var split = type.split(/\-/);
			var direction = split[0];
			var out = split[1] === 'out';
			var duration = opts.duration ||  0.5;
			var viewport = $.viewport();
			var coordinate = page.resolvers[direction](viewport.window);
			
			page.isOverlay = (out) ? false : true;

			var maintop = root.header.bound().height;
			
			var container = null;
			if (view) {
				container = view._container || tag('div').css({position:'absolute',width:'100%','z-index':100});
				view._container = container;
				view.placeIn(container);
			} else {
				container = tag('div').css({position:'absolute',width:'100%','z-index':100/*, 'background-color':'#f00'*/})
			}

			if (out) {
				root.main.css({display:'block'});
				coordinate.x = -coordinate.x;
				coordinate.y = -coordinate.y + maintop;
			} else {
				root.overlay.empty();
				container.position({x:coordinate.x,y:coordinate.y+maintop});
			}

			root.overlay.prepend(container);

			setTimeout(function() {
				container
				.translate(-coordinate.x, -coordinate.y)
				.transition({
					duration: duration
				}, function() {
					if (out) {
						container.remove();
					} else {
						root.main.css({display:'none'});
					}
					if (opts.callback) {
						opts.callback();
					}
				});
			}, 0);
		}
	};

	/**
	 * define view class
	 */
	function defineViewClass(name,opts) {
		log.info('define view class',name,opts);
		var extend = opts.extend ? viewClasses[opts.extend] : View;
		var temp = function() {}
		temp.prototype = extend.prototype;
		var view = function(args) {
			this.__name = name;
			this.__init(args);
		};
		view.prototype = new temp();
		view.prototype.superview = extend.prototype;
		view.prototype.superview.constructor = extend;
		view.prototype.constructor = view;
		$.merge(view.prototype, opts);
		return view;
	}

	/**
	 * define multiple view classes
	 */
	function views(opts) {
		$.map(opts, function(name, value) {
			viewClasses[name] = defineViewClass(name,value);
		});	
	}

	// binding functions
	$.views = views;
	w.view = $.view = function(name,opts) {
		log.debug('create view',name,opts);
		return new viewClasses[name](opts);
	};
	w.page = $.page = page;
	w.popup = $.popup = popup;

})(window);
