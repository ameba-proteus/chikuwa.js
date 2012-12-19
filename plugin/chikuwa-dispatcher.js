/**
 * chikwua-dispatcher-plugin
 * Copyright (c) 2011 CyberAgent, Inc.
 * License: MIT (http://www.opensource.org/licenses/mit-license)
 * GitHub: https://github.com/suguru/chikuwa.js
 */
/**
 * chikuwa-dispatcher
 * @use namespace: $.Dispatcher
 */
(function(w) {

/**
 * chikuwa-router
 */
var routes = {};
var actionmap = {};
var log = $.log;

function RouteParameters(controller, action, params, queries) {
	this.controller = controller;
	this.action = action;
	this.params = params || {};
	this.queries = queries || {};
}
RouteParameters.prototype = {
	param: function(name) {
		return this.params[name];
	},
	query: function(name) {
		return this.queries[name];
	}
};

function Dispatcher() {
}
Dispatcher.prototype = {

	route: function(controller, name, action) {
		this.routes(controller, {
			name: name,
			action: action
		});
	},

	/**
	 * register router handlers
	 */
	routes :function(controller, actions) {

		var exist = routes[controller];
		if (!exist) {
			exist = routes[controller] = [];
		}

		$.map(actions, function(path, action) {

			// convert to object
			if ($.isFunction(action)) {
				action = { action: action, name: action.name };
			}

			// set original path
			action.path = path;

			path = path.replace(/^\//,'');
			// convert name to parameters
			var names = [];
			var m;
			var pattern = path.replace(/:(\w+)/g, function(match) {
				names.push(match.substr(1));
				return "([^\/]+)";
			}).replace("\/\(\[\^\/\]\+\)\?", "/?([^\/]+)?");

			// get regex pattern
			action.pattern = new RegExp('^'+pattern+'$');
			// add parameter names
			action.names = names;

			// add to exist
			exist.push(action);

			// map name to actionmap
			if (action.name) {
				actionmap[controller+'/'+action.name] = action;
			}
		});
		log.info('registered controllers', controller);
	},

	/**
	 * execute action by hash
	 */
	execute: function(hash) {

		log.info('execute dispatcher for',hash);

		// get hash
		hash = hash || window.location.hash;

		// parse query string
		var querymatch = hash.match(/\?(.+)$/);
		var query = this.query(hash);

		// remove first slash and query string
		hash = hash.replace(/^[\/#+]/,'').replace(/\?.*$/,'').replace(/\/$/,'');

		log.info('dispatching',hash);

		// get controller name
		var controller = hash.match(/^[^\/]+/)[0];
		// get action array from controller
		var actions = routes[controller];
		if (!actions) {
			throw new Error('no controller ' + controller);
		}
		hash = hash.substr(controller.length+1);

		// find action
		for (var i = 0; i < actions.length; i++) {
			var action = actions[i];
			// check action pattern
			var m = action.pattern.exec(hash) || action.pattern.exec(hash+'/');
			if (m) {
				// get action parameters
				var params = {};
				for (var j = 1; j < m.length; j++) {
					params[action.names[j-1]] = m[j];
				}
				// invoke action
				action.action.call(
					action,
					new RouteParameters(controller,action,params,query)
				);
			}
		};
		this.forward = false;
	},

	/**
	 * state dispatch
	 */
	createHash: function(controller, action, params, query) {
		action = action || 'top';
		params = params || {};
		query = query || {};
		var action = actionmap[controller+'/'+action];
		if (action) {
			var path = action.path;
			// replace variables
			for (var name in params) {
				path = path.replace(':'+name, params[name]);
			}
			// remove unused variable
			path = path
			.replace(/\/:\w+\?/,'')
			.replace(/[\?\/]$/,'')
			.replace(/\?\//,'')
			// create query string
			var qs = $.isEmptyObject(query) ? '' : '?' + $.createQuery(query);
			return '#'+controller+path+qs;
		} else {
			throw new Error('no action for '+controller+'/'+action);
		}
	},

	// get controller name from hash
	controllerName: function(hash) {
		if (hash.charAt(0) === '#') {
			hash = hash.substr(1);
		}
		var m = hash.match(/^[^\/\?]+/);
		return m ? m[0] : null;
	},
	
	// get query from hash
	query: function(hash) {
		var querymatch = hash.match(/\?(.+)$/);
		var query = (querymatch) ? $.parseQuery(querymatch[1]) : {};
		return query;
	},

	// check controller
	hasController: function(name) {
		return (routes[name]) && true;
	},

	// set forward flag to true
	markForward: function() {
		this.forward = true;
	},
	
	// create router object
	createRouter: function(controller) {
		return {
			on: function(path, name, action) {
				var obj = {};
				obj[path] = {
					name: name,
					action: action
				};
				$.routes(controller, obj);
				return this;
			}
		};
	}
	
};

$.dispatcher = new Dispatcher();
$.routes = $.dispatcher.routes;

})(window);

