(function(w) {

	var log = $.log;

	// HTTP Request
	function HttpRequest(method,path,data,callback) {
		var self = this;
		var xhr = self.xhr = null;
		if (w.XMLHttpRequest) {
			xhr = new XMLHttpRequest();
		} else if (w.ActiveXObject) {
			try {
				xhr = new ActiveXObject('Msxml2.XMLHTTP.6.0');
			} catch (e) {
				xhr = new ActiveXObject('Msxml2.XMLHTTP.3.0');
			}
		}
		log.debug('HTTP',method,path);
		if (typeof callback === 'function') {
			callback = {
				complete: callback
			};
		}
		if (callback) {
			$.map(callback, function(name,value) {
				self.on(name,value);
			});
		}
		xhr.onreadystatechange = function() {
			var state = xhr.readyState;
			self.readyState = state;
			if (state < 1) {
				return;
			} else if (state === 4) {
				if (200 <= xhr.status && xhr.status < 300) {
					log.info('HTTP OK',method,path,xhr);
					self.trigger('complete',xhr.responseText);
				} else {
					log.error('HTTP',xhr.statusText,method,path);
					self.trigger('error', {
						name: xhr.statusText,
						path: path,
						body: xhr.responseText
					});
				}
			} else if (state < 4) {
				var stateType = ['init','loading','loaded','interactive'][state];
				log.debug('HTTP',stateType,method,path);
				self.trigger(stateType,xhr);
			}
		};
		log.debug('HTTP open',method,path);
		xhr.open(method,path);
		if (typeof data === 'string') {
			xhr.send(data);
		} else {
			xhr.setRequestHeader("Content-Type","application/json");
			xhr.send(JSON.stringify(data));
		}
	}
	$.listenize(HttpRequest);

	function query(params) {
		var q = '';
		for (var n in params) {
			q += encodeURI(n)+'='+encodeURI(params[n])+'&';
		}
		return q.slice(0, -1);
	}
	
	/**
 	 * Generic HTTP Client
	 */
	w.http = $.http = {
		get: function() {
			var args = Array.prototype.slice.apply(arguments);
			var path = args[0];
			var callback = args[1];
			if (args.length === 3) {
				path = path + '?' + query(args[1]);
				callback = args[2];
			}
			return new HttpRequest('GET',path,null,callback);
		},
		post: function(path, data,callback) {
			return new HttpRequest('POST',path,data,callback);
		},
		put: function(path, data, callback) {
			return new HttpRequest('PUT',path,data,callback);
		},
		del: function(path, callback) {
			return new HttpRequest('DELETE',path,callback);
		}
	};
})(window);
