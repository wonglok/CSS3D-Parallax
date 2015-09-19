(function(core){
	'use strict';

	core.set('mod.main', function(){
		var api = {};
		var parallax = core.get('mod.parallax');

		api.init = function(){
			console.log('main init');
			parallax.init();
		};

		return api;
	});

	core.get('mod.main').init();


}(window.core));


