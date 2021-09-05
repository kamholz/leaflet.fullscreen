(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['leaflet'], factory);
	} else if (typeof modules === 'object' && module.exports) {
		// define a Common JS module that relies on 'leaflet'
		module.exports = factory(require('leaflet'), require('screenfull'));
	} else {
		// Assume Leaflet is loaded into global object L already
		factory(L, screenfull);
	}
}(this, function (L, screenfull) {
	'use strict';

	L.Control.FullScreen = L.Control.extend({
		options: {
			position: 'topleft',
			title: 'Full Screen',
			titleCancel: 'Exit Full Screen',
			forceSeparateButton: false,
			forcePseudoFullscreen: false,
			fullscreenElement: false
		},
		
		onAdd: function (map) {
			var className = 'leaflet-control-zoom-fullscreen', container, content = '';
			
			if (map.zoomControl && !this.options.forceSeparateButton) {
				container = map.zoomControl._container;
			} else {
				container = L.DomUtil.create('div', 'leaflet-bar');
			}
			
			if (this.options.content) {
				content = this.options.content;
			} else {
				className += ' fullscreen-icon';
			}

			this._createButton(this.options.title, className, content, container, this.toggleFullScreen, this);
			this._map.fullscreenControl = this;

			this._map.on('enterFullscreen exitFullscreen', this._toggleTitle, this);

			return container;
		},
		
		onRemove: function (map) {
			L.DomEvent
				.off(this.link, 'click', L.DomEvent.stopPropagation)
				.off(this.link, 'click', L.DomEvent.preventDefault)
				.off(this.link, 'click', this.toggleFullScreen, this);
			
			L.DomEvent
				.off(this._container, screenfull.raw.fullscreenchange, L.DomEvent.stopPropagation)
				.off(this._container, screenfull.raw.fullscreenchange, L.DomEvent.preventDefault)
				.off(this._container, screenfull.raw.fullscreenchange, this._handleFullscreenChange, this);
			
			L.DomEvent
				.off(document, screenfull.raw.fullscreenchange, L.DomEvent.stopPropagation)
				.off(document, screenfull.raw.fullscreenchange, L.DomEvent.preventDefault)
				.off(document, screenfull.raw.fullscreenchange, this._handleFullscreenChange, this);
		},
		
		_createButton: function (title, className, content, container, fn, context) {
			this.link = L.DomUtil.create('a', className, container);
			this.link.href = '#';
			this.link.title = title;
			this.link.innerHTML = content;

			this.link.setAttribute('role', 'button');
			this.link.setAttribute('aria-label', title);

			L.DomEvent
				.on(this.link, 'click', L.DomEvent.stopPropagation)
				.on(this.link, 'click', L.DomEvent.preventDefault)
				.on(this.link, 'click', fn, context);
			
			L.DomEvent
				.on(container, screenfull.raw.fullscreenchange, L.DomEvent.stopPropagation)
				.on(container, screenfull.raw.fullscreenchange, L.DomEvent.preventDefault)
				.on(container, screenfull.raw.fullscreenchange, this._handleFullscreenChange, context);
			
			L.DomEvent
				.on(document, screenfull.raw.fullscreenchange, L.DomEvent.stopPropagation)
				.on(document, screenfull.raw.fullscreenchange, L.DomEvent.preventDefault)
				.on(document, screenfull.raw.fullscreenchange, this._handleFullscreenChange, context);

			return this.link;
		},
		
		toggleFullScreen: function () {
			var map = this._map;
			map._exitFired = false;
			if (map._isFullscreen) {
				if (screenfull.isEnabled && !this.options.forcePseudoFullscreen) {
					screenfull.exit();
				} else {
					L.DomUtil.removeClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen');
					map.invalidateSize();
				}
				map.fire('exitFullscreen');
				map._exitFired = true;
				map._isFullscreen = false;
			}
			else {
				if (screenfull.isEnabled && !this.options.forcePseudoFullscreen) {
					screenfull.request(this.options.fullscreenElement ? this.options.fullscreenElement : map._container);
				} else {
					L.DomUtil.addClass(this.options.fullscreenElement ? this.options.fullscreenElement : map._container, 'leaflet-pseudo-fullscreen');
					map.invalidateSize();
				}
				map.fire('enterFullscreen');
				map._isFullscreen = true;
			}
		},
		
		_toggleTitle: function () {
			this.link.title = this._map._isFullscreen ? this.options.title : this.options.titleCancel;
		},
		
		_handleFullscreenChange: function () {
			var map = this._map;
			map.invalidateSize();
			if (!screenfull.isFullscreen && !map._exitFired) {
				map.fire('exitFullscreen');
				map._exitFired = true;
				map._isFullscreen = false;
			}
		}
	});

	L.Map.include({
		toggleFullscreen: function () {
			this.fullscreenControl.toggleFullScreen();
		}
	});

	L.Map.addInitHook(function () {
		if (this.options.fullscreenControl) {
			this.addControl(L.control.fullscreen(this.options.fullscreenControlOptions));
		}
	});

	L.control.fullscreen = function (options) {
		return new L.Control.FullScreen(options);
	};

  return L;
}));
