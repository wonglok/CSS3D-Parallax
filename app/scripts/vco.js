/*eslint no-underscore-dangle: 2*/
(function(){
	'use strict';

	//https://github.com/wonglok/WebGLWidget/blob/improvements/app/scripts/vco.js
	//<3
	//vanillla code organizr


	function Nsr(){
		var core = {
			fac: {},
			inst: {},
			//setters
			val: function(name, val){
				core.inst[name] = val;
			},
			set: function(name, factory){
				core.inst[name] = null;
				core.fac[name] = factory;
			},

			//getter
			get: function(name){
			//	return (console.log('di-get: '+name),core.inst[name]) || (core.inst[name] = core.make(name));
				return core.inst[name] || (core.inst[name] = core.make(name));
			},

			//maker
			make: function(name){
				var factory = core.fac[name];
				if (factory){
					console.log('coreMake: ' + name);
					return factory();
				}else{
					throw new Error('Factory Not Found!! ' + name);
				}
			}
		};

		return core;
	}
	window.core = new Nsr();

	console.log(window.core);


}());


