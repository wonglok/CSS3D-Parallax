(function(core, $, Modernizr){
	'use strict';

	core.val('val.sys', {
		//slide vh

		winHeight: 0,
		winWidth: 0,

		clientX: 0,
		clientY: 0,
		screenCenterX: 0,
		screenCenterY: 0,

		scrollY: 0,
		currentPageIndex: 0,

		sections: [],
		slideSectionClass: '.slide-section',

		orX: 0,
		orY: 0

	});
	core.val('val.lastSys', {
		clientX: 0
	});

	core.val('fn.extend', function extend( a, b ) {
		for( var key in b ) {
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	});


	core.set('mod.loop', function(){
		var api = {};

		var renderer = core.get('mod.renderer');
		var isInLoop = false;
		var rIndex;

		//check start stop
		var extend = core.get('fn.extend');
		var sys = core.get('val.sys');
		var lastSys = core.get('val.lastSys');

		function checkStop(){
			if (
				// lastSys.clientX === sys.clientX
				// &&
				lastSys.scrollY === sys.scrollY
			){
				api.stop();
			}
			extend(lastSys, sys);
		}

		function loop(){
			rIndex = window.requestAnimationFrame(loop);
			if (renderer.render !== undefined && typeof renderer.render === 'function'){
				checkStop();
				renderer.render();
			}
		}

		function stopLoop(){
			isInLoop = false;
			// console.log('loop:stop');
			window.cancelAnimationFrame(rIndex);
		}

		function startLoop(){
			if (!isInLoop){
				isInLoop = true;
				// console.log('loop:start');
				loop();
			}
		}

		api.stop = stopLoop;
		api.start = startLoop;

		return api;
	});

	core.set('mod.renderer', function(){
		var api = {};
		var sys = core.get('val.sys');


		function getSlideOffset(secIndex){
			return sys.sections[secIndex].offset;
		}

		function getSlideHeight(secIndex){
			return sys.sections[secIndex].height;
		}

		function deriveScrollParallax(secIndex){
			var slideScreenGap = Math.abs( sys.winHeight - getSlideHeight(secIndex) ) / 2;
			var slideCenterScrollY = sys.scrollY - getSlideOffset(secIndex) + slideScreenGap;
			return slideCenterScrollY;
		}

		function renderDesktop(section, secIndex){
			section.items.forEach(function(movObj){
				var tx = (
					sys.screenCenterX / -10
					* movObj.factor / 3
				),
				ty = (
						(
							deriveScrollParallax(secIndex) / 4
							+ sys.screenCenterY / -10
						)
						* movObj.factor / 10
					),
				tz = 0;

				$(movObj.el).css( 'transform', 'translate3d(' + tx + 'px,' + ty + 'px,' + tz + 'px)' );
			});
		}

		function renderMobile(section, secIndex){
			section.items.forEach(function(movObj){
				var tx = (
					// 0
					// sys.screenCenterX / -10
					// * movObj.factor / 4
					sys.orX
				),
				ty = (
						sys.orY
						+ deriveScrollParallax(secIndex) / 4
						* movObj.factor / 10
					),
				tz = 0;

				$(movObj.el).css( 'transform', 'translate3d(' + tx + 'px,' + ty + 'px,' + tz + 'px)' );
			});
		}

		function adaptRender(section, secIndex){
			if(!Modernizr.touch){
				renderDesktop(section, secIndex);
			}else{
				renderMobile(section, secIndex);
			}
		}

		function loopThroughEachSlide(section, secIndex){
				if (
					sys.currentPageIndex === secIndex
					|| sys.currentPageIndex === secIndex + 1
					|| sys.currentPageIndex === secIndex - 1
				){
					adaptRender(section, secIndex);
				}
		}

		function render(){
			sys.sections.forEach(loopThroughEachSlide);
		}

		api.render = render;

		return api;
	});

	core.val('fn.throttle', function (fn, delay){
		var allow = true;

		return function(evt) {
			if (allow) {
				allow = false;
				setTimeout(function() { allow = true; }, delay);
				fn(evt);
			}
		};
	});

	core.set('mod.parallax', function(){
		var api = {};
		var loop = core.get('mod.loop');
		var sys = core.get('val.sys');
		var mobileScroll = core.get('mod.mobileScroll');
		var deviceOrient = core.get('mod.deviceOrient');

		function getSlideInfo(){
			sys.sections = [];

			$(sys.slideSectionClass).each(function (){
				var slideItems = [];

				$(this).find('.so').each(function(){
					slideItems.push({
						el: $(this)[0],
						scroll: $(this).attr('scroll'),
						mouse: $(this).attr('mouse'),
						factor: $(this).attr('factor')
					});
				});

				sys.sections.push({
					isSlide: true,
					height: $(this).height(),
					offset: $(this).offset().top,
					items: slideItems
				});

			});

			// console.table(sys.sections);
		}

		//Calculation
		function deriveScreenCenter(){
			sys.screenCenterX = (sys.winWidth / 2) - sys.clientX;
			sys.screenCenterY = (sys.winHeight / 2) - sys.clientY;
		}

		function deriveCurrentPage(){
			var sections = sys.sections;
			sys.currentPageIndex = 0;

			for (var secIndex = sections.length - 1; secIndex >= 0; secIndex--) {
				if (sys.scrollY >= sections[secIndex].offset){
					sys.currentPageIndex = secIndex;
					break;
				}
			}
			// console.log(sys.currentPageIndex);
		}

		//evt handler
		function onResize(){
			sys.winHeight = document.documentElement.clientHeight;
			sys.winWidth = document.documentElement.clientWidth;

			deriveScreenCenter();

			loop.start();
		}

		function onMouseMove(evt){
			sys.clientX = evt.clientX;
			sys.clientY = evt.clientY;
			deriveScreenCenter();

			loop.start();
		}
		function onScroll(){
			sys.scrollY = window.scrollY;
			deriveCurrentPage();

			loop.start();
		}


		api.init = function(){
			getSlideInfo();
			onResize();

			window.addEventListener('resize', onResize);
			window.addEventListener('scroll', onScroll);

			if (!Modernizr.touch){
				window.addEventListener('mousemove', onMouseMove);
			}else{
				mobileScroll.init();
				deviceOrient.init();
			}


		};

		return api;
	});


	core.set('mod.mobileScroll', function(){
		var api = {};
		var sys = core.get('val.sys');

		var lastCX,
			lastCY;

		function onTouchStart(evt){
			lastCX = evt.touches[0].clientX;
			lastCY = evt.touches[0].clientY;
		}

		function onTouchMove(evt){
			evt.preventDefault();

			var nowX = evt.touches[0].clientX,
				nowY = evt.touches[0].clientY;

			var sX = lastCX - nowX,
				sY = lastCY - nowY;

			var newX = sX + window.scrollX;
			var newY = sY + window.scrollY;

			window.scrollTo(newX, newY);

			sys.scrollX = newX;
			sys.scrollY = newY;

			lastCX = nowX;
			lastCY = nowY;
		}

		function init(){
			document.addEventListener('touchstart', onTouchStart);
			document.addEventListener('touchmove', onTouchMove);
		}

		api.init = init;


		return api;
	});

	//https://developer.mozilla.org/en-US/docs/Web/API/Detecting_device_orientation#Browser_compatibility
	core.set('mod.deviceOrient', function(){
		var api = {};
		var sys = core.get('val.sys');
		var loop = core.get('mod.loop');

		function handleOrient(event) {
			var x = event.beta;  // In degree in the range [-180,180]
			var y = event.gamma; // In degree in the range [-90,90]

			// Because we don't want to have the device upside down
			// We constrain the x value to the range [-90,90]
			if (x > 90) {
				x = 90;
			}
			if (x < -90) {
				x = -90;
			}

			sys.orX = y;
			sys.orY = x - 45; //defailt tilt of hand hold

			// console.log(y,x);
			loop.start();

		}
		function init(){
			var iOS = /iPad|iPhone|iPod/.test(navigator.platform);
			if (iOS){
				window.addEventListener('deviceorientation', handleOrient);
			}
		}

		api.init = init;

		return api;
	});


}(window.core, window.$, window.Modernizr));


