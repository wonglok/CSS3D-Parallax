(function(core, $){
	'use strict';

	core.val('val.sys', {
		//slide vh
		slideVh: 0.8,

		winHeight: 0,
		winWidth: 0,
		clientX: 0,
		clientY: 0,
		screenCenterX: 0,
		screenCenterY: 0,
		scrollY: 0,
		currentPageIndex: 0,
		headerHeight: 0

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
			// console.log(lastSys.clientX, sys.clientX, sys.clientX === sys.clientX);
			if (
				lastSys.clientX === sys.clientX
				&& lastSys.scrollY === sys.scrollY
			){
				api.stop();
			}
			// lastSys.clientX = sys.clientX;
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

		var $slideObjectGroups = $('.sog');

		function deriveScrollParallax(sectionIndex){
			var slideScreenGap = ( sys.winHeight - ( sys.winHeight * sys.slideVh ) ) / 2;
			var slideCenterScrollY = sys.scrollY - sys.headerHeight - (sectionIndex * sys.winHeight * sys.slideVh) + slideScreenGap;
			return slideCenterScrollY;
		}

		function renderDesktop(sectionIndex){
			// console.log(sectionIndex);
			$(this).find('.so').each(function(){
				var tx = (sys.screenCenterX / -10),
					ty = (
							deriveScrollParallax(sectionIndex) / 3
							+ sys.screenCenterY / -10
						),
					tz = 0;

				$(this).css( 'transform', 'translate3d(' + tx + 'px,' + ty + 'px,' + tz + 'px)' );
			});
		}

		var loopVisibleObject = function(){
			var sectionIndex = 0;

			$slideObjectGroups.each(function(){
				if (
					sys.currentPageIndex === sectionIndex
					|| sys.currentPageIndex === sectionIndex + 1
					|| sys.currentPageIndex === sectionIndex - 1
				){
					renderDesktop.apply(this, [sectionIndex]);
				}
				sectionIndex++;
			});
		};

		api.render = function(){
			loopVisibleObject();
		};

		return api;
	});

	core.val('fn.throttle', function (fn, delay){
		var allow = true;

		return function(event) {
			if (allow) {
				allow = false;
				setTimeout(function() { allow = true; }, delay);
				fn(event);
			}
		};
	});

	core.set('mod.parallax', function(){
		var api = {};
		var loop = core.get('mod.loop');
		var sys = core.get('val.sys');

		// var throttle = core.get('fn.throttle');
		// var slowLog = throttle(function(){
		// 	console.table([sys]);
		// }, 100);

		//Calculation
		function deriveScreenCenter(){
			sys.screenCenterX = (sys.winWidth / 2) - sys.clientX;
			sys.screenCenterY = (sys.winHeight / 2) - sys.clientY;
		}
		function deriveHeaderHeight(){
			sys.headerHeight = $('.section.header').height();
		}


		function derivePageIndex(){
			var currentPageScrollRatio = (sys.scrollY - sys.headerHeight) / (sys.winHeight * sys.slideVh);
			sys.currentPageIndex = Math.round( currentPageScrollRatio );
		}

		//event handler
		function onResize(){
			sys.winHeight = document.documentElement.clientHeight;
			sys.winWidth = document.documentElement.clientWidth;

			deriveScreenCenter();
		
			loop.start();
		}
		function onMouseMove(event){
			sys.clientX = event.clientX;
			sys.clientY = event.clientY;
			deriveScreenCenter();

			loop.start();
		}
		function onScroll(){
			sys.scrollY = window.scrollY;
			derivePageIndex();

			loop.start();
		}


		api.init = function(){
			onResize();

			deriveHeaderHeight();

			window.addEventListener('resize', onResize);
			window.addEventListener('scroll', onScroll);
			window.addEventListener('mousemove', onMouseMove);

		};

		return api;
	});


}(window.core, window.$));


