(function(w) {
	
	var pixelRatio = w.devicePixelRatio ? w.devicePixelRatio : 1;
	
	var asset = {};
	
	var methodmap = {
			
			// drawing
			0: 'moveTo',
			1: 'lineTo',
			2: 'bezierCurveTo',
			3: 'quadraticCurveTo',
			4: 'arcTo',
			5: 'arc',
			6: 'rect',
			7: 'fill',
			8: 'stroke',
			
			// path
			10: 'beginPath',
			11: 'closePath',
			
			// rect
			20: 'fillRect',
			21: 'clearRect',
			22: 'strokeRect',
			23: 'clip',
			
			// text
			30: 'fillText',
			31: 'strokeText',
			32: 'measureText',
			
			// gradient
			40: 'addColorStop',
			41: 'createLinearGradient',
			42: 'createRadialGradient',
			43: 'createPattern',
			
			// image manipulation
			50: 'createImageData',
			51: 'getImageData',
			52: 'setImageData',
			53: 'drawImage',
			
			// transforms
			60: 'scale',
			61: 'rotate',
			62: 'translate',
			63: 'transform',
			64: 'setTransform',
			
			// save,restore ... etc
			90: 'save',
			91: 'restore',
			92: 'drawFocusRing',
				
			// ===== properties =====
			
			// stroke
			100: 'strokeStyle',
			101: 'fillStyle',
			
			// global
			110: 'globalAlpha',
			111: 'globalCompositeOperation',
			
			// line style
			120: 'lineWidth',
			121: 'lineCap',
			122: 'lineJoin',
			123: 'miterLimit',
			
			// shadow style
			130: 'shadowColor',
			131: 'shadowOffsetX',
			132: 'shadowOffsetY',
			133: 'shadowBlur',
			
			// text
			140: 'font',
			141: 'textAlign',
			142: 'textBaseline'
	};

	/**
	 * create a canvas
	 */
	function createCanvas(width,height,deviceWidth,deviceHeight) {
		var c = document.createElement('canvas');	
		c.setAttribute('width', width);
		c.setAttribute('height', height);
		c.style.width = deviceWidth + 'px';
		c.style.height = deviceHeight + 'px';
		return c;
	}
	
	/**
	 * create canvas instance
	 */
	function Canvas(data,opts) {
		this.data = (typeof data === 'string') ? asset[data] : data;
		this.opts = opts ? opts : {};
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.draw();
		
		this.__defineGetter__('url', function() {
			return this.canvas.toDataURL();
		});
	};
	
	/**
	 * canvas methods
	 */
	Canvas.prototype = {
			
			constructor: Canvas,
			
			/**
			 * draw the canvas
			 */
			draw: function() {
				if(this.data == null) return;
				var canvas = this.canvas;
				var context = this.context;
				var data = this.data;
				var opts = this.opts;
				var bigger = data.width > data.height ? data.width : data.height;
				var size = 'size' in opts ? opts.size : bigger;//object size (w or h, bigger)
				var boxsize = 'boxsize' in opts ? opts.boxsize : size;//canvas tag size (w or h, bigger)
				if (boxsize == -1 && opts.padding && opts.padding > 0) {
					boxsize = size + opts.padding * 2;
				}
				var scale = size / bigger;
				//scale = 'scale' in opts ? scale * opts.scale : scale * 1;

				// translate value
				var translate = 'translate' in opts ? opts.translate : null;
				// drawing target context
				var target = opts.target;
				// pixel scle ratio
				var pixelScale = scale * pixelRatio;
				// consider device pixel ratio
				var width = this.width = Math.floor(data.width * pixelScale);
				var height = this.height = Math.floor(data.height * pixelScale);
				
				// merge style
				var style = $.merge(data.style, this.opts.style);
				this.style = style ? style : {};
				
				// calculate device size
				var deviceWidth  = this.deviceWidth  = Math.floor(data.width * scale);
				var deviceHeight = this.deviceHeight = Math.floor(data.height * scale);
				var boxW, boxH;
				if('square' in opts && opts.square == 1)
				{
					boxW = boxH = boxsize;
				}
				else
				{
					boxW = Math.floor(data.width * boxsize / bigger);
					boxH = Math.floor(data.height * boxsize / bigger);
				}
				// set device size
				canvas.style.width = (Math.floor(boxW)) + 'px';
				canvas.style.height = (Math.floor(boxH)) + 'px';
				
				var padding = opts.padding ? opts.padding * pixelScale : 0;
							
				// set real width/height of the canvas
				canvas.setAttribute('width', (boxW * pixelRatio) + 'px');
				canvas.setAttribute('height',(boxH * pixelRatio) + 'px');
				
				// centerize to box
				context.translate((boxW * pixelRatio - width)/2, (boxH * pixelRatio - height)/2);
				
				// apply translation
				if (translate)
					context.translate('x' in translate ? translate.x : 0, 'y' in translate ? translate.y : 0);
				
				// apply scale
				if (pixelScale !== 1)
					context.scale(pixelScale, pixelScale);
				
				// apply shadow effect
				if ('shadow' in opts) {
					var shadow = opts.shadow;
					context.shadowColor = shadow.color ? shadow.color : 'rgba(0,0,0,1)';
					context.shadowBlur = 'blur' in shadow ? shadow.blur : 5;
					context.shadowOffsetX = 'x' in shadow ? shadow.x : 0;
					context.shadowOffsetY = 'y' in shadow ? shadow.y : 0;
				}
				
				if (target) {
					// draw each commands
					if (typeof target === 'string')
						this.drawContext(target);
					else
						// draw all contexts
						for (var i = 0; i < target.length; i++) {
							this.drawContext(target[i]);
						}
				} else {
					// draw all targets
					var contexts = data.contexts;
					for (var n in contexts) {
						this.drawContext(n);
					}
				}
				
			},

			/**
			 * draw single context of data
			 * @param name
			 */
			drawContext: function(name) {
				var context = this.context;
				var list = this.data.contexts[name];
				if (list) {
					var length = list.length;
					for (var i = 0; i < length; i+=2) {
						var methodnum = list[i];
						var args = list[i+1];
						var name = methodmap[methodnum];
						if (methodnum < 100) {
							// execute draw method
							var method = context[name];
							if (!method)
								throw new Error('invalid method ' + method);
							method.apply(context,args);
						} else {
							// get style property
							var style = this.style[args];
							if (style) {
								// set property value
								context[name] = style;
							} else {
								// set argument value
								context[name] = args;
							}
						}
					}
				}
			},
			
			/**
			 * attach canvas image to the element background
			 * @param element
			 */
			attach: function(element,css) {
				$(element).css(
						$.merge({
							'background-image': 'url('+this.url+')',
							'background-size': this.deviceWidth + 'px ' + this.deviceHeight + 'px',
							'background-repeat': 'no-repeat',
							'background-position': 'center'
						},css));
			},
			
			/**
			 * get the image element of the canvas
			 * @param attrs
			 */
			img: function(attrs) {
				$.body.append($.tag('span').text(this.url));
				attrs = attrs ? attrs : {};
				attrs.width  = this.width;
				attrs.height = this.height;
				attrs.src = this.url;
				return $.tag('img',attrs);
			},
			
			/**
			 * get the bitmap canvas
			 */
			bitmap: function() {
				var context = this.contex;
				var imageData = context.getImageData(this.width, this.height);
				
				// create new canvas
				
				var newCanvas = $.tag('canvas',{
					width: this.width,
					height: this.height
				});
				
				// get new context
				var newContext = newCanvas.getContext('2d');
				newContext.drawImage(imageData,0,0);
				
				return newcanvas;
			},
			
			/**
			 * get the chikuwa instance of the canvas
			 */
			get: function() {
				return $(this.canvas);
			}
	};
	
	$.extend({
		canvas: function(data,opts,attrs) {
			return this.append($.canvas.create(data,opts,attrs)); 
		}
	});
	
	$.canvas = {
			create: function(data, opts, attrs) {
				var canvas = new Canvas(data,opts);
				var tag = $(canvas.get()).attr(attrs);
				if(opts && 'cls' in opts) {
					tag.cls(opts['cls']);
				}
				tag.canvas = canvas;
				return tag;
			},
			asset: function(newAsset) {
				if (newAsset)
					$.merge(asset, newAsset);
			},
			_methodmap: methodmap//only for canvasconvert.js
	};
	
})(window);