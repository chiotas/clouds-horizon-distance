const __pluginConfig =  {
  "name": "windy-plugin-horizon-distance",
  "version": "0.9.6",
  "title": "Clouds Horizon Distance",
  "description": "This plugin displays circles on the Windy map representing the horizon distances for different cloud heights, calculated based on the users clicked position, including the directions of sunrise and sunset. This allows for an approximate estimation of whether sunlight will be blocked by clouds at sunrise or sunset",
  "author": "Francesco Gola",
  "icon": "☀️",
  "desktopUI": "embedded",
  "mobileUI": "small",
  "built": 1788108435175,
  "builtReadable": "2026-08-30T16:47:15.175Z",
  "screenshot": "screenshot.jpg"
};

// transformCode: import { map } from '@windy/map';
const { map } = W.map;

// transformCode: import store from '@windy/store';
const store = W.store;

// transformCode: import { isMobileOrTablet } from '@windy/rootScope';
const { isMobileOrTablet } = W.rootScope;


/** @returns {void} */
function noop() {}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function run_all(fns) {
	fns.forEach(run);
}

/**
 * @param {any} thing
 * @returns {thing is Function}
 */
function is_function(thing) {
	return typeof thing === 'function';
}

/** @returns {boolean} */
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}

/** @returns {boolean} */
function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @returns {void}
 */
function append(target, node) {
	target.appendChild(node);
}

/**
 * @param {Node} target
 * @param {string} style_sheet_id
 * @param {string} styles
 * @returns {void}
 */
function append_styles(target, style_sheet_id, styles) {
	const append_styles_to = get_root_for_style(target);
	if (!append_styles_to.getElementById(style_sheet_id)) {
		const style = element('style');
		style.id = style_sheet_id;
		style.textContent = styles;
		append_stylesheet(append_styles_to, style);
	}
}

/**
 * @param {Node} node
 * @returns {ShadowRoot | Document}
 */
function get_root_for_style(node) {
	if (!node) return document;
	const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
	if (root && /** @type {ShadowRoot} */ (root).host) {
		return /** @type {ShadowRoot} */ (root);
	}
	return node.ownerDocument;
}

/**
 * @param {ShadowRoot | Document} node
 * @param {HTMLStyleElement} style
 * @returns {CSSStyleSheet}
 */
function append_stylesheet(node, style) {
	append(/** @type {Document} */ (node).head || node, style);
	return style.sheet;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @param {Node} [anchor]
 * @returns {void}
 */
function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null);
}

/**
 * @param {Node} node
 * @returns {void}
 */
function detach(node) {
	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} name
 * @returns {HTMLElementTagNameMap[K]}
 */
function element(name) {
	return document.createElement(name);
}

/**
 * @param {string} data
 * @returns {Text}
 */
function text(data) {
	return document.createTextNode(data);
}

/**
 * @returns {Text} */
function space() {
	return text(' ');
}

/**
 * @returns {Text} */
function empty() {
	return text('');
}

/**
 * @param {EventTarget} node
 * @param {string} event
 * @param {EventListenerOrEventListenerObject} handler
 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
 * @returns {() => void}
 */
function listen(node, event, handler, options) {
	node.addEventListener(event, handler, options);
	return () => node.removeEventListener(event, handler, options);
}

/**
 * @param {Element} node
 * @param {string} attribute
 * @param {string} [value]
 * @returns {void}
 */
function attr(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute);
	else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}

/**
 * @param {Element} element
 * @returns {ChildNode[]}
 */
function children(element) {
	return Array.from(element.childNodes);
}

/**
 * @param {Text} text
 * @param {unknown} data
 * @returns {void}
 */
function set_data(text, data) {
	data = '' + data;
	if (text.data === data) return;
	text.data = /** @type {string} */ (data);
}

/**
 * @returns {void} */
function toggle_class(element, name, toggle) {
	// The `!!` is required because an `undefined` flag means flipping the current state.
	element.classList.toggle(name, !!toggle);
}

/**
 * @typedef {Node & {
 * 	claim_order?: number;
 * 	hydrate_init?: true;
 * 	actual_end_child?: NodeEx;
 * 	childNodes: NodeListOf<NodeEx>;
 * }} NodeEx
 */

/** @typedef {ChildNode & NodeEx} ChildNodeEx */

/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

/**
 * @typedef {ChildNodeEx[] & {
 * 	claim_info?: {
 * 		last_index: number;
 * 		total_claimed: number;
 * 	};
 * }} ChildNodeArray
 */

let current_component;

/** @returns {void} */
function set_current_component(component) {
	current_component = component;
}

function get_current_component() {
	if (!current_component) throw new Error('Function called outside component initialization');
	return current_component;
}

/**
 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
 * it can be called from an external module).
 *
 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
 *
 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
 *
 * https://svelte.dev/docs/svelte#onmount
 * @template T
 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
 * @returns {void}
 */
function onMount(fn) {
	get_current_component().$$.on_mount.push(fn);
}

/**
 * Schedules a callback to run immediately before the component is unmounted.
 *
 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
 * only one that runs inside a server-side component.
 *
 * https://svelte.dev/docs/svelte#ondestroy
 * @param {() => any} fn
 * @returns {void}
 */
function onDestroy(fn) {
	get_current_component().$$.on_destroy.push(fn);
}

const dirty_components = [];
const binding_callbacks = [];

let render_callbacks = [];

const flush_callbacks = [];

const resolved_promise = /* @__PURE__ */ Promise.resolve();

let update_scheduled = false;

/** @returns {void} */
function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		resolved_promise.then(flush);
	}
}

/** @returns {void} */
function add_render_callback(fn) {
	render_callbacks.push(fn);
}

// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();

let flushidx = 0; // Do *not* move this inside the flush() function

/** @returns {void} */
function flush() {
	// Do not reenter flush while dirty components are updated, as this can
	// result in an infinite loop. Instead, let the inner flush handle it.
	// Reentrancy is ok afterwards for bindings etc.
	if (flushidx !== 0) {
		return;
	}
	const saved_component = current_component;
	do {
		// first, call beforeUpdate functions
		// and update components
		try {
			while (flushidx < dirty_components.length) {
				const component = dirty_components[flushidx];
				flushidx++;
				set_current_component(component);
				update(component.$$);
			}
		} catch (e) {
			// reset dirty state to not end up in a deadlocked state and then rethrow
			dirty_components.length = 0;
			flushidx = 0;
			throw e;
		}
		set_current_component(null);
		dirty_components.length = 0;
		flushidx = 0;
		while (binding_callbacks.length) binding_callbacks.pop()();
		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		for (let i = 0; i < render_callbacks.length; i += 1) {
			const callback = render_callbacks[i];
			if (!seen_callbacks.has(callback)) {
				// ...so guard against infinite loops
				seen_callbacks.add(callback);
				callback();
			}
		}
		render_callbacks.length = 0;
	} while (dirty_components.length);
	while (flush_callbacks.length) {
		flush_callbacks.pop()();
	}
	update_scheduled = false;
	seen_callbacks.clear();
	set_current_component(saved_component);
}

/** @returns {void} */
function update($$) {
	if ($$.fragment !== null) {
		$$.update();
		run_all($$.before_update);
		const dirty = $$.dirty;
		$$.dirty = [-1];
		$$.fragment && $$.fragment.p($$.ctx, dirty);
		$$.after_update.forEach(add_render_callback);
	}
}

/**
 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
 * @param {Function[]} fns
 * @returns {void}
 */
function flush_render_callbacks(fns) {
	const filtered = [];
	const targets = [];
	render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
	targets.forEach((c) => c());
	render_callbacks = filtered;
}

const outroing = new Set();

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} [local]
 * @returns {void}
 */
function transition_in(block, local) {
	if (block && block.i) {
		outroing.delete(block);
		block.i(local);
	}
}

/** @typedef {1} INTRO */
/** @typedef {0} OUTRO */
/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

/**
 * @typedef {Object} Outro
 * @property {number} r
 * @property {Function[]} c
 * @property {Object} p
 */

/**
 * @typedef {Object} PendingProgram
 * @property {number} start
 * @property {INTRO|OUTRO} b
 * @property {Outro} [group]
 */

/**
 * @typedef {Object} Program
 * @property {number} a
 * @property {INTRO|OUTRO} b
 * @property {1|-1} d
 * @property {number} duration
 * @property {number} start
 * @property {number} end
 * @property {Outro} [group]
 */

/** @returns {void} */
function mount_component(component, target, anchor) {
	const { fragment, after_update } = component.$$;
	fragment && fragment.m(target, anchor);
	// onMount happens before the initial afterUpdate
	add_render_callback(() => {
		const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
		// if the component was destroyed immediately
		// it will update the `$$.on_destroy` reference to `null`.
		// the destructured on_destroy may still reference to the old array
		if (component.$$.on_destroy) {
			component.$$.on_destroy.push(...new_on_destroy);
		} else {
			// Edge case - component was destroyed immediately,
			// most likely as a result of a binding initialising
			run_all(new_on_destroy);
		}
		component.$$.on_mount = [];
	});
	after_update.forEach(add_render_callback);
}

/** @returns {void} */
function destroy_component(component, detaching) {
	const $$ = component.$$;
	if ($$.fragment !== null) {
		flush_render_callbacks($$.after_update);
		run_all($$.on_destroy);
		$$.fragment && $$.fragment.d(detaching);
		// TODO null out other refs, including component.$$ (but need to
		// preserve final state?)
		$$.on_destroy = $$.fragment = null;
		$$.ctx = [];
	}
}

/** @returns {void} */
function make_dirty(component, i) {
	if (component.$$.dirty[0] === -1) {
		dirty_components.push(component);
		schedule_update();
		component.$$.dirty.fill(0);
	}
	component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
}

// TODO: Document the other params
/**
 * @param {SvelteComponent} component
 * @param {import('./public.js').ComponentConstructorOptions} options
 *
 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
 * This will be the `add_css` function from the compiled component.
 *
 * @returns {void}
 */
function init(
	component,
	options,
	instance,
	create_fragment,
	not_equal,
	props,
	append_styles = null,
	dirty = [-1]
) {
	const parent_component = current_component;
	set_current_component(component);
	/** @type {import('./private.js').T$$} */
	const $$ = (component.$$ = {
		fragment: null,
		ctx: [],
		// state
		props,
		update: noop,
		not_equal,
		bound: blank_object(),
		// lifecycle
		on_mount: [],
		on_destroy: [],
		on_disconnect: [],
		before_update: [],
		after_update: [],
		context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
		// everything else
		callbacks: blank_object(),
		dirty,
		skip_bound: false,
		root: options.target || parent_component.$$.root
	});
	append_styles && append_styles($$.root);
	let ready = false;
	$$.ctx = instance
		? instance(component, options.props || {}, (i, ret, ...rest) => {
				const value = rest.length ? rest[0] : ret;
				if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
					if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
					if (ready) make_dirty(component, i);
				}
				return ret;
		  })
		: [];
	$$.update();
	ready = true;
	run_all($$.before_update);
	// `false` as a special case of no DOM component
	$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
	if (options.target) {
		if (options.hydrate) {
			// TODO: what is the correct type here?
			// @ts-expect-error
			const nodes = children(options.target);
			$$.fragment && $$.fragment.l(nodes);
			nodes.forEach(detach);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.c();
		}
		if (options.intro) transition_in(component.$$.fragment);
		mount_component(component, options.target, options.anchor);
		flush();
	}
	set_current_component(parent_component);
}

/**
 * Base class for Svelte components. Used when dev=false.
 *
 * @template {Record<string, any>} [Props=any]
 * @template {Record<string, any>} [Events=any]
 */
class SvelteComponent {
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$ = undefined;
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$set = undefined;

	/** @returns {void} */
	$destroy() {
		destroy_component(this, 1);
		this.$destroy = noop;
	}

	/**
	 * @template {Extract<keyof Events, string>} K
	 * @param {K} type
	 * @param {((e: Events[K]) => void) | null | undefined} callback
	 * @returns {() => void}
	 */
	$on(type, callback) {
		if (!is_function(callback)) {
			return noop;
		}
		const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
		callbacks.push(callback);
		return () => {
			const index = callbacks.indexOf(callback);
			if (index !== -1) callbacks.splice(index, 1);
		};
	}

	/**
	 * @param {Partial<Props>} props
	 * @returns {void}
	 */
	$set(props) {
		if (this.$$set && !is_empty(props)) {
			this.$$.skip_bound = true;
			this.$$set(props);
			this.$$.skip_bound = false;
		}
	}
}

/**
 * @typedef {Object} CustomElementPropDefinition
 * @property {string} [attribute]
 * @property {boolean} [reflect]
 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
 */

// generated during release, do not modify

const PUBLIC_VERSION = '4';

if (typeof window !== 'undefined')
	// @ts-ignore
	(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var suncalc = {exports: {}};

/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/

(function (module, exports$1) {
	(function () {
	// shortcuts for easier to read formulas

	var PI   = Math.PI,
	    sin  = Math.sin,
	    cos  = Math.cos,
	    tan  = Math.tan,
	    asin = Math.asin,
	    atan = Math.atan2,
	    acos = Math.acos,
	    rad  = PI / 180;

	// sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas


	// date/time constants and conversions

	var dayMs = 1000 * 60 * 60 * 24,
	    J1970 = 2440588,
	    J2000 = 2451545;

	function toJulian(date) { return date.valueOf() / dayMs - 0.5 + J1970; }
	function fromJulian(j)  { return new Date((j + 0.5 - J1970) * dayMs); }
	function toDays(date)   { return toJulian(date) - J2000; }


	// general calculations for position

	var e = rad * 23.4397; // obliquity of the Earth

	function rightAscension(l, b) { return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l)); }
	function declination(l, b)    { return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l)); }

	function azimuth(H, phi, dec)  { return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)); }
	function altitude(H, phi, dec) { return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H)); }

	function siderealTime(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }

	function astroRefraction(h) {
	    if (h < 0) // the following formula works for positive altitudes only.
	        h = 0; // if h = -0.08901179 a div/0 would occur.

	    // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
	    // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
	    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
	}

	// general sun calculations

	function solarMeanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }

	function eclipticLongitude(M) {

	    var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
	        P = rad * 102.9372; // perihelion of the Earth

	    return M + C + P + PI;
	}

	function sunCoords(d) {

	    var M = solarMeanAnomaly(d),
	        L = eclipticLongitude(M);

	    return {
	        dec: declination(L, 0),
	        ra: rightAscension(L, 0)
	    };
	}


	var SunCalc = {};


	// calculates sun position for a given date and latitude/longitude

	SunCalc.getPosition = function (date, lat, lng) {

	    var lw  = rad * -lng,
	        phi = rad * lat,
	        d   = toDays(date),

	        c  = sunCoords(d),
	        H  = siderealTime(d, lw) - c.ra;

	    return {
	        azimuth: azimuth(H, phi, c.dec),
	        altitude: altitude(H, phi, c.dec)
	    };
	};


	// sun times configuration (angle, morning name, evening name)

	var times = SunCalc.times = [
	    [-0.833, 'sunrise',       'sunset'      ],
	    [  -0.3, 'sunriseEnd',    'sunsetStart' ],
	    [    -6, 'dawn',          'dusk'        ],
	    [   -12, 'nauticalDawn',  'nauticalDusk'],
	    [   -18, 'nightEnd',      'night'       ],
	    [     6, 'goldenHourEnd', 'goldenHour'  ]
	];

	// adds a custom time to the times config

	SunCalc.addTime = function (angle, riseName, setName) {
	    times.push([angle, riseName, setName]);
	};


	// calculations for sun times

	var J0 = 0.0009;

	function julianCycle(d, lw) { return Math.round(d - J0 - lw / (2 * PI)); }

	function approxTransit(Ht, lw, n) { return J0 + (Ht + lw) / (2 * PI) + n; }
	function solarTransitJ(ds, M, L)  { return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L); }

	function hourAngle(h, phi, d) { return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d))); }
	function observerAngle(height) { return -2.076 * Math.sqrt(height) / 60; }

	// returns set time for the given sun altitude
	function getSetJ(h, lw, phi, dec, n, M, L) {

	    var w = hourAngle(h, phi, dec),
	        a = approxTransit(w, lw, n);
	    return solarTransitJ(a, M, L);
	}


	// calculates sun times for a given date, latitude/longitude, and, optionally,
	// the observer height (in meters) relative to the horizon

	SunCalc.getTimes = function (date, lat, lng, height) {

	    height = height || 0;

	    var lw = rad * -lng,
	        phi = rad * lat,

	        dh = observerAngle(height),

	        d = toDays(date),
	        n = julianCycle(d, lw),
	        ds = approxTransit(0, lw, n),

	        M = solarMeanAnomaly(ds),
	        L = eclipticLongitude(M),
	        dec = declination(L, 0),

	        Jnoon = solarTransitJ(ds, M, L),

	        i, len, time, h0, Jset, Jrise;


	    var result = {
	        solarNoon: fromJulian(Jnoon),
	        nadir: fromJulian(Jnoon - 0.5)
	    };

	    for (i = 0, len = times.length; i < len; i += 1) {
	        time = times[i];
	        h0 = (time[0] + dh) * rad;

	        Jset = getSetJ(h0, lw, phi, dec, n, M, L);
	        Jrise = Jnoon - (Jset - Jnoon);

	        result[time[1]] = fromJulian(Jrise);
	        result[time[2]] = fromJulian(Jset);
	    }

	    return result;
	};


	// moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

	function moonCoords(d) { // geocentric ecliptic coordinates of the moon

	    var L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
	        M = rad * (134.963 + 13.064993 * d), // mean anomaly
	        F = rad * (93.272 + 13.229350 * d),  // mean distance

	        l  = L + rad * 6.289 * sin(M), // longitude
	        b  = rad * 5.128 * sin(F),     // latitude
	        dt = 385001 - 20905 * cos(M);  // distance to the moon in km

	    return {
	        ra: rightAscension(l, b),
	        dec: declination(l, b),
	        dist: dt
	    };
	}

	SunCalc.getMoonPosition = function (date, lat, lng) {

	    var lw  = rad * -lng,
	        phi = rad * lat,
	        d   = toDays(date),

	        c = moonCoords(d),
	        H = siderealTime(d, lw) - c.ra,
	        h = altitude(H, phi, c.dec),
	        // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
	        pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));

	    h = h + astroRefraction(h); // altitude correction for refraction

	    return {
	        azimuth: azimuth(H, phi, c.dec),
	        altitude: h,
	        distance: c.dist,
	        parallacticAngle: pa
	    };
	};


	// calculations for illumination parameters of the moon,
	// based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
	// Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

	SunCalc.getMoonIllumination = function (date) {

	    var d = toDays(date || new Date()),
	        s = sunCoords(d),
	        m = moonCoords(d),

	        sdist = 149598000, // distance from Earth to Sun in km

	        phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
	        inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)),
	        angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
	                cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

	    return {
	        fraction: (1 + cos(inc)) / 2,
	        phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
	        angle: angle
	    };
	};


	function hoursLater(date, h) {
	    return new Date(date.valueOf() + h * dayMs / 24);
	}

	// calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article

	SunCalc.getMoonTimes = function (date, lat, lng, inUTC) {
	    var t = new Date(date);
	    if (inUTC) t.setUTCHours(0, 0, 0, 0);
	    else t.setHours(0, 0, 0, 0);

	    var hc = 0.133 * rad,
	        h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc,
	        h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;

	    // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
	    for (var i = 1; i <= 24; i += 2) {
	        h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
	        h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;

	        a = (h0 + h2) / 2 - h1;
	        b = (h2 - h0) / 2;
	        xe = -b / (2 * a);
	        ye = (a * xe + b) * xe + h1;
	        d = b * b - 4 * a * h1;
	        roots = 0;

	        if (d >= 0) {
	            dx = Math.sqrt(d) / (Math.abs(a) * 2);
	            x1 = xe - dx;
	            x2 = xe + dx;
	            if (Math.abs(x1) <= 1) roots++;
	            if (Math.abs(x2) <= 1) roots++;
	            if (x1 < -1) x1 = x2;
	        }

	        if (roots === 1) {
	            if (h0 < 0) rise = i + x1;
	            else set = i + x1;

	        } else if (roots === 2) {
	            rise = i + (ye < 0 ? x2 : x1);
	            set = i + (ye < 0 ? x1 : x2);
	        }

	        if (rise && set) break;

	        h0 = h2;
	    }

	    var result = {};

	    if (rise) result.rise = hoursLater(t, rise);
	    if (set) result.set = hoursLater(t, set);

	    if (!rise && !set) result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;

	    return result;
	};


	// export as Node module / AMD module / browser variable
	module.exports = SunCalc;

	}()); 
} (suncalc));

var suncalcExports = suncalc.exports;
var SunCalc = /*@__PURE__*/getDefaultExportFromCjs(suncalcExports);

const EARTH_RADIUS_KM = 6371;
const OBSERVER_HEIGHT_METERS = 1.7;
const REFRACTION_K_STANDARD = 7 / 6;
const effectiveRadiusKm = (k = REFRACTION_K_STANDARD)=>EARTH_RADIUS_KM * k;
function horizonDistanceKm(elevMeters, cloudMeters, k = REFRACTION_K_STANDARD) {
    const re = effectiveRadiusKm(k);
    const hObsKm = (elevMeters + OBSERVER_HEIGHT_METERS) / 1000;
    const hCloudKm = cloudMeters / 1000;
    return Math.sqrt(2 * re * hObsKm + hObsKm * hObsKm) + Math.sqrt(2 * re * hCloudKm + hCloudKm * hCloudKm);
}
function horizonDipRad(elevMeters, k = REFRACTION_K_STANDARD) {
    const re = effectiveRadiusKm(k);
    const rObs = re + (elevMeters + OBSERVER_HEIGHT_METERS) / 1000;
    if (!(rObs > re)) return 0;
    return Math.acos(re / rObs);
}
function apparentAltitudeRad(trueAltitudeRad) {
    const hDeg = trueAltitudeRad * 180 / Math.PI;
    if (hDeg < -2) return trueAltitudeRad;
    const refractionArcmin = 1.02 / Math.tan((hDeg + 10.3 / (hDeg + 5.11)) * Math.PI / 180);
    return trueAltitudeRad + refractionArcmin / 60 * Math.PI / 180;
}
function blockDistanceKm(elevMeters, cloudMeters, apparentAltRad, k = REFRACTION_K_STANDARD) {
    if (!Number.isFinite(apparentAltRad)) return null;
    if (apparentAltRad < -horizonDipRad(elevMeters, k)) return null;
    const re = effectiveRadiusKm(k);
    const rObs = re + (elevMeters + OBSERVER_HEIGHT_METERS) / 1000;
    const rCloud = re + cloudMeters / 1000;
    if (!(rCloud > rObs)) return null;
    const sinAlt = Math.sin(apparentAltRad);
    const b = 2 * rObs * sinAlt;
    const c = rObs * rObs - rCloud * rCloud;
    const disc = b * b - 4 * c;
    if (!(disc >= 0)) return null;
    const t = (-b + Math.sqrt(disc)) / 2;
    if (!(t > 0)) return null;
    const up = rObs + t * sinAlt;
    const horiz = t * Math.cos(apparentAltRad);
    const distKm = Math.atan2(horiz, up) * re;
    return Number.isFinite(distKm) ? distKm : null;
}
function computeEndPoint(lat, lon, azimuthDeg, distanceKm) {
    const bearing = azimuthDeg * Math.PI / 180;
    const lat1 = lat * Math.PI / 180;
    const lon1 = lon * Math.PI / 180;
    const angDist = distanceKm / EARTH_RADIUS_KM;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angDist) + Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearing));
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(angDist) * Math.cos(lat1), Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2));
    return [
        lat2 * 180 / Math.PI,
        lon2 * 180 / Math.PI
    ];
}

/* src/plugin.svelte generated by Svelte v4.2.20 */

function add_css(target) {
	append_styles(target, "svelte-tsuhzj", "fieldset.svelte-tsuhzj.svelte-tsuhzj{border:none;margin-bottom:10px}legend.svelte-tsuhzj.svelte-tsuhzj{font-weight:bold;margin-bottom:5px;color:white}label.svelte-tsuhzj.svelte-tsuhzj{display:block;margin-bottom:5px;color:white}.leaflet-tooltip.chdLabelTooltip,.chdLabelTooltip{background:transparent !important;background-color:transparent !important;border:none !important;box-shadow:none !important;padding:0 !important;z-index:200 !important;pointer-events:none !important}.leaflet-tooltip.chdLabelTooltip::before,.leaflet-tooltip.chdLabelTooltip::after,.chdLabelTooltip::before,.chdLabelTooltip::after{display:none !important}.chdLabelTooltip .leaflet-tooltip-content{margin:0 !important;padding:0 !important;background:transparent !important;background-color:transparent !important;white-space:nowrap !important;font-size:16px !important;font-weight:700 !important;line-height:1.2 !important;text-shadow:0 0 3px rgba(0, 0, 0, 0.35) !important}.leaflet-pane.leaflet-tooltip-pane{z-index:200 !important}.mobileBox.svelte-tsuhzj.svelte-tsuhzj{padding:8px 10px}.mobileScroll.svelte-tsuhzj.svelte-tsuhzj{display:flex;flex-direction:row;gap:10px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory}.mobileCard.svelte-tsuhzj.svelte-tsuhzj{flex:0 0 auto;min-width:240px;max-width:290px;padding:8px 10px;border-radius:12px;background:rgba(0, 0, 0, 0.22);border:1px solid rgba(255, 255, 255, 0.18);scroll-snap-align:start}.mobileCardNarrow.svelte-tsuhzj.svelte-tsuhzj{min-width:170px;max-width:240px}.mobileCardWide.svelte-tsuhzj.svelte-tsuhzj{min-width:285px;max-width:340px}.mobileTitle.svelte-tsuhzj.svelte-tsuhzj{color:white;font-weight:800;font-size:13px;opacity:0.95;margin-bottom:8px;letter-spacing:0.2px}.mobileLine.svelte-tsuhzj.svelte-tsuhzj{display:flex;gap:8px;align-items:baseline;margin-bottom:6px;color:white}.mobileLine.svelte-tsuhzj .k.svelte-tsuhzj{opacity:0.75;font-weight:800;font-size:12px;white-space:nowrap}.mobileLine.svelte-tsuhzj .v.svelte-tsuhzj{font-weight:800;font-size:13px;white-space:nowrap}.elev-error.svelte-tsuhzj.svelte-tsuhzj{color:#ff6b6b;font-weight:800;font-size:13px}.mobileLineTwoCols.svelte-tsuhzj.svelte-tsuhzj{display:flex;gap:10px;margin-bottom:6px}.pairOneLine.svelte-tsuhzj.svelte-tsuhzj{flex:1;min-width:0;display:flex;align-items:baseline;gap:6px}.mobileLineOneCol.svelte-tsuhzj.svelte-tsuhzj{display:flex;align-items:baseline;gap:6px;margin-bottom:6px;min-width:0}.kBadge.svelte-tsuhzj.svelte-tsuhzj{flex:0 0 auto;width:18px;height:18px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:white;background:rgba(255, 255, 255, 0.18);border:1px solid rgba(255, 255, 255, 0.22);line-height:1}.vOneLine.svelte-tsuhzj.svelte-tsuhzj{flex:1 1 auto;min-width:0;font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:white}.mobileButtonsStack.svelte-tsuhzj.svelte-tsuhzj{display:flex;flex-direction:column;gap:6px}.mobileButtonsStack.svelte-tsuhzj button.svelte-tsuhzj{width:100%;padding:8px 10px;min-height:28px;border-radius:10px;border:1px solid rgba(255, 255, 255, 0.22);background:rgba(0, 0, 0, 0.22);color:white;font-weight:700;font-size:13px;line-height:1.1}.mobileButtonsStack.svelte-tsuhzj button.activeBtn.svelte-tsuhzj{background:rgba(255, 165, 0, 0.55);border-color:rgba(255, 255, 255, 0.35)}");
}

// (1119:0) {:else}
function create_else_block_2(ctx) {
	let div;
	let fieldset0;
	let legend0;
	let t1;
	let t2;
	let t3;
	let t4;
	let fieldset1;
	let legend1;
	let t6;
	let label;
	let b0;
	let t8;
	let t9_value = (/*sunriseTime*/ ctx[2] || '-') + "";
	let t9;
	let t10;
	let b1;
	let t12;
	let t13_value = (/*sunsetTime*/ ctx[3] || '-') + "";
	let t13;

	function select_block_type_3(ctx, dirty) {
		if (/*elevationError*/ ctx[1]) return create_if_block_16;
		return create_else_block_4;
	}

	let current_block_type = select_block_type_3(ctx);
	let if_block0 = current_block_type(ctx);
	let if_block1 = /*liveSunEnabled*/ ctx[15] && /*liveSunAltitudeDeg*/ ctx[5] !== null && create_if_block_15(ctx);

	function select_block_type_4(ctx, dirty) {
		if (/*liveSunEnabled*/ ctx[15]) return create_if_block_11;
		return create_else_block_3;
	}

	let current_block_type_1 = select_block_type_4(ctx);
	let if_block2 = current_block_type_1(ctx);

	return {
		c() {
			div = element("div");
			fieldset0 = element("fieldset");
			legend0 = element("legend");
			legend0.textContent = "Altitude";
			t1 = space();
			if_block0.c();
			t2 = space();
			if (if_block1) if_block1.c();
			t3 = space();
			if_block2.c();
			t4 = space();
			fieldset1 = element("fieldset");
			legend1 = element("legend");
			legend1.textContent = "Sunrise and Sunset";
			t6 = space();
			label = element("label");
			b0 = element("b");
			b0.textContent = "Sunrise";
			t8 = text(": ");
			t9 = text(t9_value);
			t10 = text(" | ");
			b1 = element("b");
			b1.textContent = "Sunset";
			t12 = text(": ");
			t13 = text(t13_value);
			attr(legend0, "class", "svelte-tsuhzj");
			attr(fieldset0, "class", "svelte-tsuhzj");
			attr(legend1, "class", "svelte-tsuhzj");
			attr(label, "class", "svelte-tsuhzj");
			attr(fieldset1, "class", "svelte-tsuhzj");
			attr(div, "class", "infoBox");
			attr(div, "id", "chdInfoBox");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, fieldset0);
			append(fieldset0, legend0);
			append(fieldset0, t1);
			if_block0.m(fieldset0, null);
			append(fieldset0, t2);
			if (if_block1) if_block1.m(fieldset0, null);
			append(div, t3);
			if_block2.m(div, null);
			append(div, t4);
			append(div, fieldset1);
			append(fieldset1, legend1);
			append(fieldset1, t6);
			append(fieldset1, label);
			append(label, b0);
			append(label, t8);
			append(label, t9);
			append(label, t10);
			append(label, b1);
			append(label, t12);
			append(label, t13);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(fieldset0, t2);
				}
			}

			if (/*liveSunEnabled*/ ctx[15] && /*liveSunAltitudeDeg*/ ctx[5] !== null) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_15(ctx);
					if_block1.c();
					if_block1.m(fieldset0, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (current_block_type_1 === (current_block_type_1 = select_block_type_4(ctx)) && if_block2) {
				if_block2.p(ctx, dirty);
			} else {
				if_block2.d(1);
				if_block2 = current_block_type_1(ctx);

				if (if_block2) {
					if_block2.c();
					if_block2.m(div, t4);
				}
			}

			if (dirty[0] & /*sunriseTime*/ 4 && t9_value !== (t9_value = (/*sunriseTime*/ ctx[2] || '-') + "")) set_data(t9, t9_value);
			if (dirty[0] & /*sunsetTime*/ 8 && t13_value !== (t13_value = (/*sunsetTime*/ ctx[3] || '-') + "")) set_data(t13, t13_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if_block0.d();
			if (if_block1) if_block1.d();
			if_block2.d();
		}
	};
}

// (956:0) {#if isMobileOrTablet}
function create_if_block(ctx) {
	let div9;
	let div8;
	let section0;
	let div0;

	let t0_value = (/*liveSunEnabled*/ ctx[15]
	? 'Sun Obstruction Zones'
	: 'Clouds Horizon Distance') + "";

	let t0;
	let t1;
	let t2;
	let section1;
	let div1;
	let t4;
	let div2;
	let span0;
	let t6;
	let t7;
	let div3;
	let span1;
	let t9;
	let span2;

	let t10_value = (/*liveSunAltitudeDeg*/ ctx[5] !== null
	? `${/*liveSunAltitudeDeg*/ ctx[5].toFixed(1)}°`
	: 'n/a') + "";

	let t10;
	let t11;
	let section2;
	let div4;
	let t13;
	let div5;
	let span3;
	let t15;
	let span4;
	let t16_value = (/*sunriseTime*/ ctx[2] || 'n/a') + "";
	let t16;
	let t17;
	let div6;
	let span5;
	let t19;
	let span6;
	let t20_value = (/*sunsetTime*/ ctx[3] || 'n/a') + "";
	let t20;
	let t21;
	let section3;
	let div7;
	let button0;
	let t23;
	let button1;
	let mounted;
	let dispose;

	function select_block_type_1(ctx, dirty) {
		if (/*liveSunEnabled*/ ctx[15]) return create_if_block_2;
		return create_else_block_1;
	}

	let current_block_type = select_block_type_1(ctx);
	let if_block0 = current_block_type(ctx);

	function select_block_type_2(ctx, dirty) {
		if (/*elevationError*/ ctx[1]) return create_if_block_1;
		return create_else_block;
	}

	let current_block_type_1 = select_block_type_2(ctx);
	let if_block1 = current_block_type_1(ctx);

	return {
		c() {
			div9 = element("div");
			div8 = element("div");
			section0 = element("section");
			div0 = element("div");
			t0 = text(t0_value);
			t1 = space();
			if_block0.c();
			t2 = space();
			section1 = element("section");
			div1 = element("div");
			div1.textContent = "Altitude";
			t4 = space();
			div2 = element("div");
			span0 = element("span");
			span0.textContent = "Your elevation";
			t6 = space();
			if_block1.c();
			t7 = space();
			div3 = element("div");
			span1 = element("span");
			span1.textContent = "Sun altitude";
			t9 = space();
			span2 = element("span");
			t10 = text(t10_value);
			t11 = space();
			section2 = element("section");
			div4 = element("div");
			div4.textContent = "Sunrise and Sunset";
			t13 = space();
			div5 = element("div");
			span3 = element("span");
			span3.textContent = "Sunrise";
			t15 = space();
			span4 = element("span");
			t16 = text(t16_value);
			t17 = space();
			div6 = element("div");
			span5 = element("span");
			span5.textContent = "Sunset";
			t19 = space();
			span6 = element("span");
			t20 = text(t20_value);
			t21 = space();
			section3 = element("section");
			div7 = element("div");
			button0 = element("button");
			button0.textContent = "Sun path";
			t23 = space();
			button1 = element("button");
			button1.textContent = "Live Sun";
			attr(div0, "class", "mobileTitle svelte-tsuhzj");
			attr(section0, "class", "mobileCard svelte-tsuhzj");
			toggle_class(section0, "mobileCardWide", !/*liveSunEnabled*/ ctx[15]);
			toggle_class(section0, "mobileCardNarrow", /*liveSunEnabled*/ ctx[15]);
			attr(div1, "class", "mobileTitle svelte-tsuhzj");
			attr(span0, "class", "k svelte-tsuhzj");
			attr(div2, "class", "mobileLine svelte-tsuhzj");
			attr(span1, "class", "k svelte-tsuhzj");
			attr(span2, "class", "v svelte-tsuhzj");
			attr(div3, "class", "mobileLine svelte-tsuhzj");
			attr(section1, "class", "mobileCard mobileCardNarrow svelte-tsuhzj");
			attr(div4, "class", "mobileTitle svelte-tsuhzj");
			attr(span3, "class", "k svelte-tsuhzj");
			attr(span4, "class", "v svelte-tsuhzj");
			attr(div5, "class", "mobileLine svelte-tsuhzj");
			attr(span5, "class", "k svelte-tsuhzj");
			attr(span6, "class", "v svelte-tsuhzj");
			attr(div6, "class", "mobileLine svelte-tsuhzj");
			attr(section2, "class", "mobileCard mobileCardNarrow svelte-tsuhzj");
			attr(button0, "class", "svelte-tsuhzj");
			toggle_class(button0, "activeBtn", /*sunPathEnabled*/ ctx[16]);
			attr(button1, "class", "svelte-tsuhzj");
			toggle_class(button1, "activeBtn", /*liveSunEnabled*/ ctx[15]);
			attr(div7, "class", "mobileButtonsStack svelte-tsuhzj");
			attr(section3, "class", "mobileCard mobileCardNarrow svelte-tsuhzj");
			attr(div8, "class", "mobileScroll svelte-tsuhzj");
			attr(div9, "id", "chdInfoBox");
			attr(div9, "class", "mobileBox svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, div9, anchor);
			append(div9, div8);
			append(div8, section0);
			append(section0, div0);
			append(div0, t0);
			append(section0, t1);
			if_block0.m(section0, null);
			append(div8, t2);
			append(div8, section1);
			append(section1, div1);
			append(section1, t4);
			append(section1, div2);
			append(div2, span0);
			append(div2, t6);
			if_block1.m(div2, null);
			append(section1, t7);
			append(section1, div3);
			append(div3, span1);
			append(div3, t9);
			append(div3, span2);
			append(span2, t10);
			append(div8, t11);
			append(div8, section2);
			append(section2, div4);
			append(section2, t13);
			append(section2, div5);
			append(div5, span3);
			append(div5, t15);
			append(div5, span4);
			append(span4, t16);
			append(section2, t17);
			append(section2, div6);
			append(div6, span5);
			append(div6, t19);
			append(div6, span6);
			append(span6, t20);
			append(div8, t21);
			append(div8, section3);
			append(section3, div7);
			append(div7, button0);
			append(div7, t23);
			append(div7, button1);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[20]),
					listen(button1, "click", /*click_handler_1*/ ctx[21])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*liveSunEnabled*/ 32768 && t0_value !== (t0_value = (/*liveSunEnabled*/ ctx[15]
			? 'Sun Obstruction Zones'
			: 'Clouds Horizon Distance') + "")) set_data(t0, t0_value);

			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(section0, null);
				}
			}

			if (dirty[0] & /*liveSunEnabled*/ 32768) {
				toggle_class(section0, "mobileCardWide", !/*liveSunEnabled*/ ctx[15]);
			}

			if (dirty[0] & /*liveSunEnabled*/ 32768) {
				toggle_class(section0, "mobileCardNarrow", /*liveSunEnabled*/ ctx[15]);
			}

			if (current_block_type_1 === (current_block_type_1 = select_block_type_2(ctx)) && if_block1) {
				if_block1.p(ctx, dirty);
			} else {
				if_block1.d(1);
				if_block1 = current_block_type_1(ctx);

				if (if_block1) {
					if_block1.c();
					if_block1.m(div2, null);
				}
			}

			if (dirty[0] & /*liveSunAltitudeDeg*/ 32 && t10_value !== (t10_value = (/*liveSunAltitudeDeg*/ ctx[5] !== null
			? `${/*liveSunAltitudeDeg*/ ctx[5].toFixed(1)}°`
			: 'n/a') + "")) set_data(t10, t10_value);

			if (dirty[0] & /*sunriseTime*/ 4 && t16_value !== (t16_value = (/*sunriseTime*/ ctx[2] || 'n/a') + "")) set_data(t16, t16_value);
			if (dirty[0] & /*sunsetTime*/ 8 && t20_value !== (t20_value = (/*sunsetTime*/ ctx[3] || 'n/a') + "")) set_data(t20, t20_value);

			if (dirty[0] & /*sunPathEnabled*/ 65536) {
				toggle_class(button0, "activeBtn", /*sunPathEnabled*/ ctx[16]);
			}

			if (dirty[0] & /*liveSunEnabled*/ 32768) {
				toggle_class(button1, "activeBtn", /*liveSunEnabled*/ ctx[15]);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div9);
			}

			if_block0.d();
			if_block1.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

// (1128:12) {:else}
function create_else_block_4(ctx) {
	let label;
	let t0;

	let t1_value = (/*lastClickedLat*/ ctx[11] === null
	? 'Click on the map'
	: `${Math.round(/*elevationMeters*/ ctx[0])} m`) + "";

	let t1;

	return {
		c() {
			label = element("label");
			t0 = text("Your Elevation: ");
			t1 = text(t1_value);
			attr(label, "class", "svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, t0);
			append(label, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*lastClickedLat, elevationMeters*/ 2049 && t1_value !== (t1_value = (/*lastClickedLat*/ ctx[11] === null
			? 'Click on the map'
			: `${Math.round(/*elevationMeters*/ ctx[0])} m`) + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) {
				detach(label);
			}
		}
	};
}

// (1126:12) {#if elevationError}
function create_if_block_16(ctx) {
	let label;

	return {
		c() {
			label = element("label");
			label.innerHTML = `Your Elevation: <span class="elev-error svelte-tsuhzj">Unavailable</span>`;
			attr(label, "class", "svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, label, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(label);
			}
		}
	};
}

// (1132:12) {#if liveSunEnabled && liveSunAltitudeDeg !== null}
function create_if_block_15(ctx) {
	let label;
	let t0;
	let t1_value = /*liveSunAltitudeDeg*/ ctx[5].toFixed(1) + "";
	let t1;
	let t2;

	return {
		c() {
			label = element("label");
			t0 = text("Sun altitude: ");
			t1 = text(t1_value);
			t2 = text("°");
			attr(label, "class", "svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, t0);
			append(label, t1);
			append(label, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*liveSunAltitudeDeg*/ 32 && t1_value !== (t1_value = /*liveSunAltitudeDeg*/ ctx[5].toFixed(1) + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) {
				detach(label);
			}
		}
	};
}

// (1166:8) {:else}
function create_else_block_3(ctx) {
	let fieldset;
	let legend;
	let t1;
	let label0;
	let b0;
	let t3;

	let t4_value = (/*lastClickedLat*/ ctx[11] === null
	? '-'
	: `between ${/*distancesKm*/ ctx[4].lowMin.toFixed(0)} and ${/*distancesKm*/ ctx[4].lowMax.toFixed(0)} km`) + "";

	let t4;
	let t5;
	let label1;
	let b1;
	let t7;

	let t8_value = (/*lastClickedLat*/ ctx[11] === null
	? '-'
	: `between ${/*distancesKm*/ ctx[4].midMin.toFixed(0)} and ${/*distancesKm*/ ctx[4].midMax.toFixed(0)} km`) + "";

	let t8;
	let t9;
	let label2;
	let b2;
	let t11;

	let t12_value = (/*lastClickedLat*/ ctx[11] === null
	? '-'
	: `${/*distancesKm*/ ctx[4].high.toFixed(0)} km`) + "";

	let t12;

	return {
		c() {
			fieldset = element("fieldset");
			legend = element("legend");
			legend.textContent = "Clouds Horizon Distance";
			t1 = space();
			label0 = element("label");
			b0 = element("b");
			b0.textContent = "L";
			t3 = text(" block range: ");
			t4 = text(t4_value);
			t5 = space();
			label1 = element("label");
			b1 = element("b");
			b1.textContent = "M";
			t7 = text(" block range: ");
			t8 = text(t8_value);
			t9 = space();
			label2 = element("label");
			b2 = element("b");
			b2.textContent = "H";
			t11 = text(" horizon from: ");
			t12 = text(t12_value);
			attr(legend, "class", "svelte-tsuhzj");
			attr(label0, "class", "svelte-tsuhzj");
			attr(label1, "class", "svelte-tsuhzj");
			attr(label2, "class", "svelte-tsuhzj");
			attr(fieldset, "class", "svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, fieldset, anchor);
			append(fieldset, legend);
			append(fieldset, t1);
			append(fieldset, label0);
			append(label0, b0);
			append(label0, t3);
			append(label0, t4);
			append(fieldset, t5);
			append(fieldset, label1);
			append(label1, b1);
			append(label1, t7);
			append(label1, t8);
			append(fieldset, t9);
			append(fieldset, label2);
			append(label2, b2);
			append(label2, t11);
			append(label2, t12);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*lastClickedLat, distancesKm*/ 2064 && t4_value !== (t4_value = (/*lastClickedLat*/ ctx[11] === null
			? '-'
			: `between ${/*distancesKm*/ ctx[4].lowMin.toFixed(0)} and ${/*distancesKm*/ ctx[4].lowMax.toFixed(0)} km`) + "")) set_data(t4, t4_value);

			if (dirty[0] & /*lastClickedLat, distancesKm*/ 2064 && t8_value !== (t8_value = (/*lastClickedLat*/ ctx[11] === null
			? '-'
			: `between ${/*distancesKm*/ ctx[4].midMin.toFixed(0)} and ${/*distancesKm*/ ctx[4].midMax.toFixed(0)} km`) + "")) set_data(t8, t8_value);

			if (dirty[0] & /*lastClickedLat, distancesKm*/ 2064 && t12_value !== (t12_value = (/*lastClickedLat*/ ctx[11] === null
			? '-'
			: `${/*distancesKm*/ ctx[4].high.toFixed(0)} km`) + "")) set_data(t12, t12_value);
		},
		d(detaching) {
			if (detaching) {
				detach(fieldset);
			}
		}
	};
}

// (1137:8) {#if liveSunEnabled}
function create_if_block_11(ctx) {
	let fieldset;
	let legend;
	let t1;
	let t2;
	let t3;
	let if_block0 = /*showLow*/ ctx[14] && create_if_block_14(ctx);
	let if_block1 = /*showMid*/ ctx[13] && create_if_block_13(ctx);
	let if_block2 = /*showHigh*/ ctx[12] && create_if_block_12(ctx);

	return {
		c() {
			fieldset = element("fieldset");
			legend = element("legend");
			legend.textContent = "Sun Obstruction Zones";
			t1 = space();
			if (if_block0) if_block0.c();
			t2 = space();
			if (if_block1) if_block1.c();
			t3 = space();
			if (if_block2) if_block2.c();
			attr(legend, "class", "svelte-tsuhzj");
			attr(fieldset, "class", "svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, fieldset, anchor);
			append(fieldset, legend);
			append(fieldset, t1);
			if (if_block0) if_block0.m(fieldset, null);
			append(fieldset, t2);
			if (if_block1) if_block1.m(fieldset, null);
			append(fieldset, t3);
			if (if_block2) if_block2.m(fieldset, null);
		},
		p(ctx, dirty) {
			if (/*showLow*/ ctx[14]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_14(ctx);
					if_block0.c();
					if_block0.m(fieldset, t2);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*showMid*/ ctx[13]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_13(ctx);
					if_block1.c();
					if_block1.m(fieldset, t3);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*showHigh*/ ctx[12]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_12(ctx);
					if_block2.c();
					if_block2.m(fieldset, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(fieldset);
			}

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
		}
	};
}

// (1141:16) {#if showLow}
function create_if_block_14(ctx) {
	let label;
	let b;
	let t1;

	let t2_value = (/*liveLowMinKm*/ ctx[6] !== null && /*liveLowMaxKm*/ ctx[7] !== null
	? `${Math.round(/*liveLowMinKm*/ ctx[6])}–${Math.round(/*liveLowMaxKm*/ ctx[7])} km`
	: 'n/a') + "";

	let t2;

	return {
		c() {
			label = element("label");
			b = element("b");
			b.textContent = "Low clouds";
			t1 = text(":\n                        ");
			t2 = text(t2_value);
			attr(label, "class", "svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, b);
			append(label, t1);
			append(label, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*liveLowMinKm, liveLowMaxKm*/ 192 && t2_value !== (t2_value = (/*liveLowMinKm*/ ctx[6] !== null && /*liveLowMaxKm*/ ctx[7] !== null
			? `${Math.round(/*liveLowMinKm*/ ctx[6])}–${Math.round(/*liveLowMaxKm*/ ctx[7])} km`
			: 'n/a') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(label);
			}
		}
	};
}

// (1150:16) {#if showMid}
function create_if_block_13(ctx) {
	let label;
	let b;
	let t1;

	let t2_value = (/*liveMidMinKm*/ ctx[8] !== null && /*liveMidMaxKm*/ ctx[9] !== null
	? `${Math.round(/*liveMidMinKm*/ ctx[8])}–${Math.round(/*liveMidMaxKm*/ ctx[9])} km`
	: 'n/a') + "";

	let t2;

	return {
		c() {
			label = element("label");
			b = element("b");
			b.textContent = "Mid clouds";
			t1 = text(":\n                        ");
			t2 = text(t2_value);
			attr(label, "class", "svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, b);
			append(label, t1);
			append(label, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*liveMidMinKm, liveMidMaxKm*/ 768 && t2_value !== (t2_value = (/*liveMidMinKm*/ ctx[8] !== null && /*liveMidMaxKm*/ ctx[9] !== null
			? `${Math.round(/*liveMidMinKm*/ ctx[8])}–${Math.round(/*liveMidMaxKm*/ ctx[9])} km`
			: 'n/a') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(label);
			}
		}
	};
}

// (1159:16) {#if showHigh}
function create_if_block_12(ctx) {
	let label;
	let b;
	let t1;

	let t2_value = (/*liveHighKm*/ ctx[10] !== null
	? `${Math.round(/*liveHighKm*/ ctx[10])} km`
	: 'n/a') + "";

	let t2;

	return {
		c() {
			label = element("label");
			b = element("b");
			b.textContent = "High clouds";
			t1 = text(":\n                        ");
			t2 = text(t2_value);
			attr(label, "class", "svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, b);
			append(label, t1);
			append(label, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*liveHighKm*/ 1024 && t2_value !== (t2_value = (/*liveHighKm*/ ctx[10] !== null
			? `${Math.round(/*liveHighKm*/ ctx[10])} km`
			: 'n/a') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(label);
			}
		}
	};
}

// (1001:4) {:else}
function create_else_block_1(ctx) {
	let t0;
	let t1;
	let if_block2_anchor;
	let if_block0 = (/*showLow*/ ctx[14] || /*showMid*/ ctx[13]) && create_if_block_8(ctx);
	let if_block1 = /*showHigh*/ ctx[12] && create_if_block_7(ctx);
	let if_block2 = !/*showLow*/ ctx[14] && !/*showMid*/ ctx[13] && !/*showHigh*/ ctx[12] && create_if_block_6();

	return {
		c() {
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			if_block2_anchor = empty();
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t0, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, t1, anchor);
			if (if_block2) if_block2.m(target, anchor);
			insert(target, if_block2_anchor, anchor);
		},
		p(ctx, dirty) {
			if (/*showLow*/ ctx[14] || /*showMid*/ ctx[13]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_8(ctx);
					if_block0.c();
					if_block0.m(t0.parentNode, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*showHigh*/ ctx[12]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_7(ctx);
					if_block1.c();
					if_block1.m(t1.parentNode, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (!/*showLow*/ ctx[14] && !/*showMid*/ ctx[13] && !/*showHigh*/ ctx[12]) {
				if (if_block2) ; else {
					if_block2 = create_if_block_6();
					if_block2.c();
					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(t0);
				detach(t1);
				detach(if_block2_anchor);
			}

			if (if_block0) if_block0.d(detaching);
			if (if_block1) if_block1.d(detaching);
			if (if_block2) if_block2.d(detaching);
		}
	};
}

// (968:4) {#if liveSunEnabled}
function create_if_block_2(ctx) {
	let t0;
	let t1;
	let if_block2_anchor;
	let if_block0 = /*showLow*/ ctx[14] && create_if_block_5(ctx);
	let if_block1 = /*showMid*/ ctx[13] && create_if_block_4(ctx);
	let if_block2 = /*showHigh*/ ctx[12] && create_if_block_3(ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			if_block2_anchor = empty();
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t0, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, t1, anchor);
			if (if_block2) if_block2.m(target, anchor);
			insert(target, if_block2_anchor, anchor);
		},
		p(ctx, dirty) {
			if (/*showLow*/ ctx[14]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_5(ctx);
					if_block0.c();
					if_block0.m(t0.parentNode, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*showMid*/ ctx[13]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_4(ctx);
					if_block1.c();
					if_block1.m(t1.parentNode, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*showHigh*/ ctx[12]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_3(ctx);
					if_block2.c();
					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(t0);
				detach(t1);
				detach(if_block2_anchor);
			}

			if (if_block0) if_block0.d(detaching);
			if (if_block1) if_block1.d(detaching);
			if (if_block2) if_block2.d(detaching);
		}
	};
}

// (1003:8) {#if showLow || showMid}
function create_if_block_8(ctx) {
	let div;
	let t;
	let if_block0 = /*showLow*/ ctx[14] && create_if_block_10(ctx);
	let if_block1 = /*showMid*/ ctx[13] && create_if_block_9(ctx);

	return {
		c() {
			div = element("div");
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			attr(div, "class", "mobileLineTwoCols svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block0) if_block0.m(div, null);
			append(div, t);
			if (if_block1) if_block1.m(div, null);
		},
		p(ctx, dirty) {
			if (/*showLow*/ ctx[14]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_10(ctx);
					if_block0.c();
					if_block0.m(div, t);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*showMid*/ ctx[13]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_9(ctx);
					if_block1.c();
					if_block1.m(div, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
		}
	};
}

// (1006:16) {#if showLow}
function create_if_block_10(ctx) {
	let div;
	let span0;
	let t1;
	let span1;

	let t2_value = (/*distancesKm*/ ctx[4].lowMin
	? `${/*distancesKm*/ ctx[4].lowMin.toFixed(0)} to ${/*distancesKm*/ ctx[4].lowMax.toFixed(0)} km`
	: 'Tap map') + "";

	let t2;

	return {
		c() {
			div = element("div");
			span0 = element("span");
			span0.textContent = "L";
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			attr(span0, "class", "kBadge svelte-tsuhzj");
			attr(span1, "class", "vOneLine svelte-tsuhzj");
			attr(div, "class", "pairOneLine svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(div, t1);
			append(div, span1);
			append(span1, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*distancesKm*/ 16 && t2_value !== (t2_value = (/*distancesKm*/ ctx[4].lowMin
			? `${/*distancesKm*/ ctx[4].lowMin.toFixed(0)} to ${/*distancesKm*/ ctx[4].lowMax.toFixed(0)} km`
			: 'Tap map') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (1017:16) {#if showMid}
function create_if_block_9(ctx) {
	let div;
	let span0;
	let t1;
	let span1;

	let t2_value = (/*distancesKm*/ ctx[4].midMin
	? `${/*distancesKm*/ ctx[4].midMin.toFixed(0)} to ${/*distancesKm*/ ctx[4].midMax.toFixed(0)} km`
	: 'Tap map') + "";

	let t2;

	return {
		c() {
			div = element("div");
			span0 = element("span");
			span0.textContent = "M";
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			attr(span0, "class", "kBadge svelte-tsuhzj");
			attr(span1, "class", "vOneLine svelte-tsuhzj");
			attr(div, "class", "pairOneLine svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(div, t1);
			append(div, span1);
			append(span1, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*distancesKm*/ 16 && t2_value !== (t2_value = (/*distancesKm*/ ctx[4].midMin
			? `${/*distancesKm*/ ctx[4].midMin.toFixed(0)} to ${/*distancesKm*/ ctx[4].midMax.toFixed(0)} km`
			: 'Tap map') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (1031:8) {#if showHigh}
function create_if_block_7(ctx) {
	let div;
	let span0;
	let t1;
	let span1;

	let t2_value = (/*distancesKm*/ ctx[4].high
	? `${/*distancesKm*/ ctx[4].high.toFixed(0)} km`
	: 'Tap map') + "";

	let t2;

	return {
		c() {
			div = element("div");
			span0 = element("span");
			span0.textContent = "H";
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			attr(span0, "class", "kBadge svelte-tsuhzj");
			attr(span1, "class", "vOneLine svelte-tsuhzj");
			attr(div, "class", "mobileLineOneCol svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(div, t1);
			append(div, span1);
			append(span1, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*distancesKm*/ 16 && t2_value !== (t2_value = (/*distancesKm*/ ctx[4].high
			? `${/*distancesKm*/ ctx[4].high.toFixed(0)} km`
			: 'Tap map') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (1042:8) {#if !showLow && !showMid && !showHigh}
function create_if_block_6(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			div.innerHTML = `<span class="kBadge svelte-tsuhzj">C</span> <span class="vOneLine svelte-tsuhzj">Tap map</span>`;
			attr(div, "class", "mobileLineOneCol svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (970:8) {#if showLow}
function create_if_block_5(ctx) {
	let div;
	let span0;
	let t1;
	let span1;

	let t2_value = (/*liveLowMinKm*/ ctx[6] !== null && /*liveLowMaxKm*/ ctx[7] !== null
	? `${Math.round(/*liveLowMinKm*/ ctx[6])} to ${Math.round(/*liveLowMaxKm*/ ctx[7])} km`
	: 'n/a') + "";

	let t2;

	return {
		c() {
			div = element("div");
			span0 = element("span");
			span0.textContent = "Low clouds";
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			attr(span0, "class", "k svelte-tsuhzj");
			attr(span1, "class", "v svelte-tsuhzj");
			attr(div, "class", "mobileLine svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(div, t1);
			append(div, span1);
			append(span1, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*liveLowMinKm, liveLowMaxKm*/ 192 && t2_value !== (t2_value = (/*liveLowMinKm*/ ctx[6] !== null && /*liveLowMaxKm*/ ctx[7] !== null
			? `${Math.round(/*liveLowMinKm*/ ctx[6])} to ${Math.round(/*liveLowMaxKm*/ ctx[7])} km`
			: 'n/a') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (981:8) {#if showMid}
function create_if_block_4(ctx) {
	let div;
	let span0;
	let t1;
	let span1;

	let t2_value = (/*liveMidMinKm*/ ctx[8] !== null && /*liveMidMaxKm*/ ctx[9] !== null
	? `${Math.round(/*liveMidMinKm*/ ctx[8])} to ${Math.round(/*liveMidMaxKm*/ ctx[9])} km`
	: 'n/a') + "";

	let t2;

	return {
		c() {
			div = element("div");
			span0 = element("span");
			span0.textContent = "Mid clouds";
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			attr(span0, "class", "k svelte-tsuhzj");
			attr(span1, "class", "v svelte-tsuhzj");
			attr(div, "class", "mobileLine svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(div, t1);
			append(div, span1);
			append(span1, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*liveMidMinKm, liveMidMaxKm*/ 768 && t2_value !== (t2_value = (/*liveMidMinKm*/ ctx[8] !== null && /*liveMidMaxKm*/ ctx[9] !== null
			? `${Math.round(/*liveMidMinKm*/ ctx[8])} to ${Math.round(/*liveMidMaxKm*/ ctx[9])} km`
			: 'n/a') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (992:8) {#if showHigh}
function create_if_block_3(ctx) {
	let div;
	let span0;
	let t1;
	let span1;

	let t2_value = (/*liveHighKm*/ ctx[10] !== null
	? `${Math.round(/*liveHighKm*/ ctx[10])} km`
	: 'n/a') + "";

	let t2;

	return {
		c() {
			div = element("div");
			span0 = element("span");
			span0.textContent = "High clouds";
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			attr(span0, "class", "k svelte-tsuhzj");
			attr(span1, "class", "v svelte-tsuhzj");
			attr(div, "class", "mobileLine svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(div, t1);
			append(div, span1);
			append(span1, t2);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*liveHighKm*/ 1024 && t2_value !== (t2_value = (/*liveHighKm*/ ctx[10] !== null
			? `${Math.round(/*liveHighKm*/ ctx[10])} km`
			: 'n/a') + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (1061:8) {:else}
function create_else_block(ctx) {
	let span;

	let t_value = (/*lastClickedLat*/ ctx[11] === null
	? '-'
	: `${Math.round(/*elevationMeters*/ ctx[0])} m`) + "";

	let t;

	return {
		c() {
			span = element("span");
			t = text(t_value);
			attr(span, "class", "v svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*lastClickedLat, elevationMeters*/ 2049 && t_value !== (t_value = (/*lastClickedLat*/ ctx[11] === null
			? '-'
			: `${Math.round(/*elevationMeters*/ ctx[0])} m`) + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

// (1059:8) {#if elevationError}
function create_if_block_1(ctx) {
	let span;

	return {
		c() {
			span = element("span");
			span.textContent = "Unavailable";
			attr(span, "class", "v elev-error svelte-tsuhzj");
		},
		m(target, anchor) {
			insert(target, span, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

function create_fragment(ctx) {
	let if_block_anchor;

	function select_block_type(ctx, dirty) {
		if (isMobileOrTablet) return create_if_block;
		return create_else_block_2;
	}

	let current_block_type = select_block_type();
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if_block.p(ctx, dirty);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if_block.d(detaching);
		}
	};
}

const LOW_CLOUDS_MIN_METERS = 400;
const LOW_CLOUDS_MAX_METERS = 1200;
const MID_CLOUDS_MIN_METERS = 2000;
const MID_CLOUDS_MAX_METERS = 4000;
const HIGH_CLOUDS_METERS = 6000;
const EXTRA_DISTANCE_KM = 10;
const CURRENT_SUN_LINE_WEIGHT = 2;
const CURRENT_SUN_COLOR_SUNRISE = '#ffff00';
const CURRENT_SUN_COLOR_SUNSET = '#ffa500';
const CURRENT_SUN_COLOR_GAMMA = 1.35;
const SUN_UPDATE_INTERVAL_MS = 100;
const INITIAL_TS_RETRY_INTERVAL_MS = 50;
const INITIAL_TS_RETRY_MAX_ATTEMPTS = 12;

function solarDayKey(tsMs, lon) {
	return Math.floor((tsMs + lon / 15 * 3600000) / 86400000);
}

function formatSunTime(d) {
	const ms = d.getTime();
	if (!Number.isFinite(ms)) return 'n/a';
	return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toKey(lat, lon) {
	return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

function clamp01(v) {
	return Math.max(0, Math.min(1, v));
}

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function hexToRgb(hex) {
	const h = hex.replace('#', '').trim();

	const full = h.length === 3
	? h.split('').map(c => c + c).join('')
	: h;

	const n = parseInt(full, 16);

	return {
		r: n >> 16 & 255,
		g: n >> 8 & 255,
		b: n & 255
	};
}

function rgbToHex(r, g, b) {
	const toHex = x => x.toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpHexColor(aHex, bHex, t) {
	const a = hexToRgb(aHex);
	const b = hexToRgb(bHex);
	const tt = clamp01(t);
	const r = Math.round(lerp(a.r, b.r, tt));
	const g = Math.round(lerp(a.g, b.g, tt));
	const bb = Math.round(lerp(a.b, b.b, tt));
	return rgbToHex(r, g, bb);
}

function normalizeTimestampMs(ts) {
	if (typeof ts !== 'number' || !Number.isFinite(ts)) return null;
	if (ts > 0 && ts < 1e12) return ts * 1000;
	return ts;
}

function overlayLayers(overlayKey) {
	return {
		low: overlayKey === 'clouds' || overlayKey === 'lclouds',
		mid: overlayKey === 'clouds' || overlayKey === 'mclouds',
		high: overlayKey === 'clouds' || overlayKey === 'hclouds'
	};
}

function pickCircleIndicesForOverlay(overlayKey) {
	if (overlayKey === 'lclouds') return [0, 1];
	if (overlayKey === 'mclouds') return [2, 3];
	if (overlayKey === 'hclouds') return [4];
	return [0, 1, 2, 3, 4];
}

function instance($$self, $$props, $$invalidate) {
	let sunPathEnabled;
	let liveSunEnabled;
	let showLow;
	let showMid;
	let showHigh;
	let activeSunMode = 'sunPath';
	const isSunPathEnabled = () => activeSunMode === 'sunPath';
	const isLiveSunEnabled = () => activeSunMode === 'liveSun';
	let elevationMeters = 0;
	let elevationError = false;
	let sunriseTime = '';
	let sunsetTime = '';

	let distancesKm = {
		lowMin: 0,
		lowMax: 0,
		midMin: 0,
		midMax: 0,
		high: 0
	};

	let liveSunAltitudeDeg = null;
	let liveLowMinKm = null;
	let liveLowMaxKm = null;
	let liveMidMinKm = null;
	let liveMidMaxKm = null;
	let liveHighKm = null;
	let horizonCircles = [];
	let labels = [];
	let sunriseLine = null;
	let sunsetLine = null;
	let currentSunLine = null;
	let liveSunLine = null;
	let liveSunDot = null;
	let liveSunSegments = [];
	let currentTsMs = Date.now();
	let lastSolarDayKey = null;
	let clickSeq = 0;
	let lastClickedLat = null;
	let lastClickedLon = null;
	let lastDistanceRefKm = 0;
	let pendingSunUpdateTimer = null;
	let latestPendingTsMs = null;
	let isTickScheduled = false;
	let lastDrawnTsMs = null;
	let initialTsRetryTimer = null;
	const elevationCache = new Map();
	let initTimer = null;
	let initTries = 0;
	let extWrap = null;
	let extBtnSunPath = null;
	let extDotSunPath = null;
	let extBtnLiveSun = null;
	let extDotLiveSun = null;
	const Leaf = globalThis.L;

	const makeCircle = (center, options) => {
		if (Leaf?.Circle) return new Leaf.Circle(center, options);
		return Leaf.circle(center, options);
	};

	const makePolyline = (latlngs, options) => {
		if (Leaf?.Polyline) return new Leaf.Polyline(latlngs, options);
		return Leaf.polyline(latlngs, options);
	};

	const makeDivIcon = options => {
		if (Leaf?.DivIcon) return new Leaf.DivIcon(options);
		return Leaf.divIcon(options);
	};

	const makeMarker = (pos, options) => {
		if (Leaf?.Marker) return new Leaf.Marker(pos, options);
		return Leaf.marker(pos, options);
	};

	function timelineNow() {
		return new Date(currentTsMs);
	}

	function readTimelineTs() {
		const raw = store && store.get ? store.get('timestamp') : null;
		return normalizeTimestampMs(raw) ?? Date.now();
	}

	async function getElevationMeters(lat, lon) {
		const key = toKey(lat, lon);
		const cached = elevationCache.get(key);
		if (cached !== undefined) return cached;
		const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
		const response = await fetch(url);
		if (!response.ok) throw new Error(`Elevation http status ${response.status}`);
		const data = await response.json();
		if (data.elevation === undefined) throw new Error('Elevation missing');
		let value = data.elevation;
		if (Array.isArray(value)) value = value[0];
		if (typeof value === 'string') value = parseFloat(value.replace(',', '.'));
		if (typeof value !== 'number' || Number.isNaN(value)) throw new Error('Elevation invalid');
		elevationCache.set(key, value);
		return value;
	}

	function calculateAzimuthDegrees(lat, lon, time) {
		const sunPos = SunCalc.getPosition(time, lat, lon);
		return sunPos.azimuth * 180 / Math.PI + 180;
	}

	function clearCurrentSunLine() {
		if (currentSunLine) {
			map.removeLayer(currentSunLine);
			currentSunLine = null;
		}
	}

	function clearLiveSunOverlays() {
		if (liveSunLine) {
			map.removeLayer(liveSunLine);
			liveSunLine = null;
		}

		if (liveSunDot) {
			map.removeLayer(liveSunDot);
			liveSunDot = null;
		}

		liveSunSegments.forEach(layer => map.removeLayer(layer));
		liveSunSegments = [];
	}

	function clearMapOverlays() {
		horizonCircles.forEach(layer => map.removeLayer(layer));
		labels.forEach(layer => map.removeLayer(layer));
		horizonCircles = [];
		labels = [];
		if (sunriseLine) map.removeLayer(sunriseLine);
		if (sunsetLine) map.removeLayer(sunsetLine);
		sunriseLine = null;
		sunsetLine = null;
		clearCurrentSunLine();
	}

	function drawHorizonCircles(lat, lon, elevMeters, mainDistancesKm, mainLabelTexts) {
		clearMapOverlays();

		const circleStyles = [
			{
				color: 'blue',
				dashArray: '5, 5',
				weight: 2
			},
			{
				color: 'blue',
				dashArray: '5, 5',
				weight: 2
			},
			{
				color: 'purple',
				dashArray: '5, 5',
				weight: 2
			},
			{
				color: 'purple',
				dashArray: '5, 5',
				weight: 2
			},
			{
				color: 'red',
				dashArray: '5, 5',
				weight: 2
			}
		];

		const labelAzimuthDeg = 0;
		const labelOffsetKm = 2;
		const indicesToDraw = pickCircleIndicesForOverlay(activeOverlayKey);

		const addCircle = (distanceKm, styleIndex, opacity, weight, dash) => {
			const circle = makeCircle([lat, lon], {
				color: circleStyles[styleIndex].color,
				dashArray: dash,
				weight,
				fillOpacity: 0,
				opacity,
				radius: distanceKm * 1000,
				interactive: false
			}).addTo(map);

			horizonCircles.push(circle);
		};

		const addLabel = (distanceKm, text, styleIndex) => {
			const labelDistanceKm = distanceKm + labelOffsetKm;
			const labelPos = computeEndPoint(lat, lon, labelAzimuthDeg, labelDistanceKm);

			const anchorMarker = makeMarker(labelPos, {
				interactive: false,
				icon: makeDivIcon({
					className: 'chdLabelAnchor',
					html: '',
					iconSize: [0, 0]
				})
			}).addTo(map);

			anchorMarker.bindTooltip(`<span style="color:${circleStyles[styleIndex].color}; font-weight:700;">${text} (${Math.round(distanceKm)}km)</span>`, {
				permanent: true,
				direction: 'top',
				offset: [0, 0],
				opacity: 1,
				className: 'chdLabelTooltip'
			});

			anchorMarker.openTooltip();
			labels.push(anchorMarker);
		};

		indicesToDraw.forEach(index => {
			const distanceKm = mainDistancesKm[index];
			addCircle(distanceKm, index, 1, circleStyles[index].weight, circleStyles[index].dashArray);
			const drawRange = index === 0 || index === 2;

			if (drawRange) {
				const isLow = index === 0;
				const step = isLow ? 200 : 400;
				const start = isLow ? LOW_CLOUDS_MIN_METERS : MID_CLOUDS_MIN_METERS;
				const end = isLow ? LOW_CLOUDS_MAX_METERS : MID_CLOUDS_MAX_METERS;
				const thinDash = '4, 6';
				const thinWeight = isLow ? 1.4 : 1.6;
				const thinOpacity = isLow ? 0.5 : 0.7;

				for (let cloudMeters = start + step; cloudMeters < end; cloudMeters += step) {
					const extraDistanceKm = horizonDistanceKm(elevMeters, cloudMeters);
					addCircle(extraDistanceKm, index, thinOpacity, thinWeight, thinDash);
				}
			}

			addLabel(distanceKm, mainLabelTexts[index], index);
		});
	}

	function drawSunriseSunsetLines(lat, lon, sunTimes, distanceRefKm) {
		const lineLengthKm = distanceRefKm + EXTRA_DISTANCE_KM;
		const sunriseAz = calculateAzimuthDegrees(lat, lon, sunTimes.sunrise);
		const sunsetAz = calculateAzimuthDegrees(lat, lon, sunTimes.sunset);
		const sunriseEnd = computeEndPoint(lat, lon, sunriseAz, lineLengthKm);
		const sunsetEnd = computeEndPoint(lat, lon, sunsetAz, lineLengthKm);
		if (sunriseLine) map.removeLayer(sunriseLine);
		if (sunsetLine) map.removeLayer(sunsetLine);
		sunriseLine = makePolyline([[lat, lon], sunriseEnd], { color: 'yellow', interactive: false }).addTo(map);
		sunsetLine = makePolyline([[lat, lon], sunsetEnd], { color: 'orange', interactive: false }).addTo(map);
	}

	function dynamicCurrentSunColor(lat, lon, timestampMs) {
		const time = new Date(timestampMs);
		const times = SunCalc.getTimes(time, lat, lon);
		const sunriseMs = times.sunrise.getTime();
		const sunsetMs = times.sunset.getTime();
		const denom = sunsetMs - sunriseMs;
		if (!(denom > 0)) return lerpHexColor(CURRENT_SUN_COLOR_SUNRISE, CURRENT_SUN_COLOR_SUNSET, 0.5);
		let t = (timestampMs - sunriseMs) / denom;
		t = clamp01(t);
		t = Math.pow(t, CURRENT_SUN_COLOR_GAMMA);
		return lerpHexColor(CURRENT_SUN_COLOR_SUNRISE, CURRENT_SUN_COLOR_SUNSET, t);
	}

	function drawOrUpdateCurrentSunLine(lat, lon, timestampMs, distanceRefKm) {
		const time = new Date(timestampMs);
		const pos = SunCalc.getPosition(time, lat, lon);
		const apparentAlt = apparentAltitudeRad(pos.altitude);
		$$invalidate(5, liveSunAltitudeDeg = +(apparentAlt * 180 / Math.PI).toFixed(1));

		if (!(apparentAlt > -horizonDipRad(elevationMeters))) {
			$$invalidate(5, liveSunAltitudeDeg = null);
			clearCurrentSunLine();
			return;
		}

		const azimuthDeg = pos.azimuth * 180 / Math.PI + 180;
		const lineLengthKm = distanceRefKm + EXTRA_DISTANCE_KM;
		const end = computeEndPoint(lat, lon, azimuthDeg, lineLengthKm);
		const color = dynamicCurrentSunColor(lat, lon, timestampMs);

		if (!currentSunLine) {
			currentSunLine = makePolyline([[lat, lon], end], {
				color,
				weight: CURRENT_SUN_LINE_WEIGHT,
				interactive: false
			}).addTo(map);

			lastDrawnTsMs = timestampMs;
			return;
		}

		currentSunLine.setLatLngs([[lat, lon], end]);
		currentSunLine.setStyle({ color });
		lastDrawnTsMs = timestampMs;
	}

	function drawOrUpdateLiveSun(lat, lon, timestampMs) {
		if (!isLiveSunEnabled()) return;
		const time = new Date(timestampMs);
		const pos = SunCalc.getPosition(time, lat, lon);
		const apparentAlt = apparentAltitudeRad(pos.altitude);
		const sunsetAlt = -horizonDipRad(elevationMeters);

		if (!(apparentAlt > sunsetAlt)) {
			$$invalidate(5, liveSunAltitudeDeg = null);
			$$invalidate(6, liveLowMinKm = null);
			$$invalidate(7, liveLowMaxKm = null);
			$$invalidate(8, liveMidMinKm = null);
			$$invalidate(9, liveMidMaxKm = null);
			$$invalidate(10, liveHighKm = null);
			clearLiveSunOverlays();
			return;
		}

		$$invalidate(5, liveSunAltitudeDeg = +(apparentAlt * 180 / Math.PI).toFixed(1));
		const azimuthDeg = pos.azimuth * 180 / Math.PI + 180;
		const block = cloudMeters => blockDistanceKm(elevationMeters, cloudMeters, apparentAlt);
		const layers = overlayLayers(activeOverlayKey);
		const lowMinKm = layers.low ? block(LOW_CLOUDS_MIN_METERS) : null;
		const lowMaxKm = layers.low ? block(LOW_CLOUDS_MAX_METERS) : null;
		const midMinKm = layers.mid ? block(MID_CLOUDS_MIN_METERS) : null;
		const midMaxKm = layers.mid ? block(MID_CLOUDS_MAX_METERS) : null;
		const highKm = layers.high ? block(HIGH_CLOUDS_METERS) : null;
		$$invalidate(6, liveLowMinKm = lowMinKm);
		$$invalidate(7, liveLowMaxKm = lowMaxKm);
		$$invalidate(8, liveMidMinKm = midMinKm);
		$$invalidate(9, liveMidMaxKm = midMaxKm);
		$$invalidate(10, liveHighKm = highKm);
		const valid = [lowMinKm, lowMaxKm, midMinKm, midMaxKm, highKm].filter(v => typeof v === 'number');

		if (valid.length === 0) {
			clearLiveSunOverlays();
			return;
		}

		const maxKm = Math.max(...valid);
		const lineLenKm = maxKm + EXTRA_DISTANCE_KM;
		const end = computeEndPoint(lat, lon, azimuthDeg, lineLenKm);

		if (!liveSunLine) {
			liveSunLine = makePolyline([[lat, lon], end], {
				color: 'red',
				weight: 3,
				interactive: false
			}).addTo(map);
		} else {
			liveSunLine.setLatLngs([[lat, lon], end]);
		}

		const sunColor = dynamicCurrentSunColor(lat, lon, timestampMs);

		const sunDotIcon = makeDivIcon({
			className: 'chdLiveSunDot',
			html: `<div style="
                width:14px;
                height:14px;
                border-radius:999px;
                background:${sunColor};
                box-shadow:
                    0 0 8px ${sunColor},
                    0 0 0 2px rgba(0,0,0,0.25);
            "></div>`,
			iconSize: [14, 14],
			iconAnchor: [7, 7]
		});

		if (!liveSunDot) {
			liveSunDot = makeMarker(end, { icon: sunDotIcon, interactive: false }).addTo(map);
		} else {
			liveSunDot.setLatLng(end);
		}

		liveSunSegments.forEach(layer => map.removeLayer(layer));
		liveSunSegments = [];

		const addRangeSegment = (aKm, bKm, color, weight, opacity) => {
			if (aKm === null || bKm === null) return;
			if (!Number.isFinite(aKm) || !Number.isFinite(bKm)) return;
			const startKm = Math.min(aKm, bKm);
			const endKm = Math.max(aKm, bKm);
			if (!(endKm > startKm)) return;
			const p1 = computeEndPoint(lat, lon, azimuthDeg, startKm);
			const p2 = computeEndPoint(lat, lon, azimuthDeg, endKm);

			const seg = makePolyline([p1, p2], {
				color,
				weight,
				opacity,
				interactive: false
			}).addTo(map);

			liveSunSegments.push(seg);
		};

		addRangeSegment(lowMinKm, lowMaxKm, 'rgba(90,160,255,0.95)', 7, 0.95);
		addRangeSegment(midMinKm, midMaxKm, 'rgba(200,120,255,0.95)', 7, 0.95);

		if (highKm !== null) {
			addRangeSegment(highKm - 2, highKm + 2, 'rgba(255,90,90,0.95)', 7, 0.95);
		}

		lastDrawnTsMs = timestampMs;
	}

	function scheduleSunUpdate(rawTs) {
		const mode = activeSunMode;
		if (mode === null) return;
		if (lastClickedLat === null || lastClickedLon === null) return;
		const tsMs = normalizeTimestampMs(rawTs);
		if (tsMs === null) return;
		latestPendingTsMs = tsMs;
		if (isTickScheduled) return;
		isTickScheduled = true;

		pendingSunUpdateTimer = window.setTimeout(
			() => {
				isTickScheduled = false;
				pendingSunUpdateTimer = null;
				if (activeSunMode !== mode) return;
				if (latestPendingTsMs === null) return;

				if (mode === 'sunPath') {
					drawOrUpdateCurrentSunLine(lastClickedLat, lastClickedLon, latestPendingTsMs, lastDistanceRefKm);
				} else {
					drawOrUpdateLiveSun(lastClickedLat, lastClickedLon, latestPendingTsMs);
				}

				if (latestPendingTsMs !== null && lastDrawnTsMs !== null && latestPendingTsMs !== lastDrawnTsMs) {
					scheduleSunUpdate(latestPendingTsMs);
				}
			},
			SUN_UPDATE_INTERVAL_MS
		);
	}

	function startInitialTimestampSync() {
		if (!isSunPathEnabled()) return;

		if (initialTsRetryTimer !== null) {
			window.clearTimeout(initialTsRetryTimer);
			initialTsRetryTimer = null;
		}

		let attempts = 0;

		const tryRead = () => {
			if (!isSunPathEnabled()) return;
			if (lastClickedLat === null || lastClickedLon === null) return;
			const raw = store && store.get ? store.get('timestamp') : null;
			const tsMs = normalizeTimestampMs(raw);

			if (tsMs !== null) {
				syncTimelineDay(tsMs);
				scheduleSunUpdate(tsMs);
				return;
			}

			attempts += 1;

			if (attempts >= INITIAL_TS_RETRY_MAX_ATTEMPTS) {
				scheduleSunUpdate(Date.now());
				return;
			}

			initialTsRetryTimer = window.setTimeout(tryRead, INITIAL_TS_RETRY_INTERVAL_MS);
		};

		tryRead();
	}

	function updateExternalButtonsUi() {
		if (!extWrap || !extBtnSunPath || !extDotSunPath || !extBtnLiveSun || !extDotLiveSun) return;
		const BG_OFF = 'rgba(0, 0, 0, 0.22)';
		const BG_OFF_HOVER = 'rgba(0, 0, 0, 0.30)';
		const BG_SUN_ON = 'rgba(40, 190, 60, 0.42)';
		const BG_SUN_ON_HOVER = 'rgba(40, 190, 60, 0.55)';
		const BG_LIVE_ON = 'rgba(220, 60, 60, 0.32)';
		const BG_LIVE_ON_HOVER = 'rgba(220, 60, 60, 0.44)';
		const sunOn = isSunPathEnabled();
		const liveOn = isLiveSunEnabled();
		extBtnSunPath.setAttribute('aria-pressed', sunOn ? 'true' : 'false');
		extBtnLiveSun.setAttribute('aria-pressed', liveOn ? 'true' : 'false');
		extWrap.style.opacity = '1';

		extBtnSunPath.style.borderColor = sunOn
		? 'rgba(255,255,255,0.34)'
		: 'rgba(255,255,255,0.22)';

		extBtnLiveSun.style.borderColor = liveOn
		? 'rgba(255,255,255,0.34)'
		: 'rgba(255,255,255,0.22)';

		extBtnSunPath.style.backgroundColor = sunOn ? BG_SUN_ON : BG_OFF;
		extBtnLiveSun.style.backgroundColor = liveOn ? BG_LIVE_ON : BG_OFF;

		extDotSunPath.style.background = sunOn
		? 'linear-gradient(135deg, #ffff00, #ffa500)'
		: 'rgba(255,255,255,0.00)';

		extDotLiveSun.style.background = liveOn
		? 'linear-gradient(135deg, #ffff00, #ffa500)'
		: 'rgba(255,255,255,0.00)';

		extDotSunPath.style.border = sunOn ? '0' : '2px solid rgba(255,255,255,0.55)';
		extDotLiveSun.style.border = liveOn ? '0' : '2px solid rgba(255,255,255,0.55)';

		updateExternalButtonsUi._bg = {
			BG_OFF,
			BG_OFF_HOVER,
			BG_SUN_ON,
			BG_SUN_ON_HOVER,
			BG_LIVE_ON,
			BG_LIVE_ON_HOVER
		};
	}

	function resetSunScheduler() {
		if (pendingSunUpdateTimer !== null) {
			window.clearTimeout(pendingSunUpdateTimer);
			pendingSunUpdateTimer = null;
		}

		isTickScheduled = false;
		latestPendingTsMs = null;
		lastDrawnTsMs = null;
	}

	function setActiveSunMode(nextMode) {
		resetSunScheduler();

		if (activeSunMode === nextMode) {
			$$invalidate(18, activeSunMode = null);
			clearCurrentSunLine();
			clearLiveSunOverlays();
			clearMapOverlays();
			redrawBaseAtLastClick();
			updateExternalButtonsUi();
			return;
		}

		$$invalidate(18, activeSunMode = nextMode);
		clearCurrentSunLine();
		clearLiveSunOverlays();

		if (isLiveSunEnabled()) {
			clearMapOverlays();

			if (lastClickedLat !== null && lastClickedLon !== null) {
				syncTimelineDay(readTimelineTs());
				scheduleSunUpdate(currentTsMs);
			}

			updateExternalButtonsUi();
			return;
		}

		if (isSunPathEnabled()) {
			clearMapOverlays();

			if (lastClickedLat !== null && lastClickedLon !== null) {
				redrawBaseAtLastClick();
				startInitialTimestampSync();
			}

			updateExternalButtonsUi();
			return;
		}

		updateExternalButtonsUi();
	}

	function createExternalSunControls() {
		if (extWrap) return;
		let topDoc = document;
		let topWin = window;

		try {
			if (window.top && window.top.document) {
				topDoc = window.top.document;
				topWin = window.top;
			}
		} catch(e) {
			topDoc = document;
			topWin = window;
		}

		const wrap = topDoc.createElement('div');
		wrap.id = 'chdSunControlsFloating';
		wrap.style.position = 'fixed';
		wrap.style.zIndex = '2147483647';
		wrap.style.pointerEvents = 'auto';
		wrap.style.display = 'inline-flex';
		wrap.style.gap = '10px';
		wrap.style.alignItems = 'center';

		const makeButton = titleText => {
			const btn = topDoc.createElement('button');
			btn.type = 'button';
			btn.title = titleText;
			btn.style.display = 'inline-flex';
			btn.style.alignItems = 'center';
			btn.style.gap = '10px';
			btn.style.padding = '10px 14px';
			btn.style.borderRadius = '12px';
			btn.style.borderStyle = 'solid';
			btn.style.borderWidth = '1px';
			btn.style.backgroundColor = 'rgba(0,0,0,0.22)';
			btn.style.color = 'white';
			btn.style.cursor = 'pointer';
			btn.style.userSelect = 'none';
			btn.style.outline = 'none';
			btn.style.fontSize = '13px';
			btn.style.fontWeight = '700';
			btn.style.letterSpacing = '0.2px';
			btn.style.lineHeight = '1';
			btn.style.boxShadow = '0 10px 24px rgba(0,0,0,0.18)';
			btn.style.backdropFilter = 'blur(6px)';
			btn.style.transition = 'background 120ms ease, border-color 120ms ease, transform 120ms ease, opacity 120ms ease';
			const dot = topDoc.createElement('span');
			dot.style.width = '10px';
			dot.style.height = '10px';
			dot.style.borderRadius = '999px';
			dot.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.22)';
			const txt = topDoc.createElement('span');
			txt.textContent = titleText;
			txt.style.whiteSpace = 'nowrap';
			btn.appendChild(dot);
			btn.appendChild(txt);
			return { btn, dot };
		};

		const sun = makeButton('Sun path');
		const live = makeButton('Live Sun');
		wrap.appendChild(sun.btn);
		wrap.appendChild(live.btn);
		const body = topDoc.body || topDoc.documentElement;
		body.appendChild(wrap);
		extWrap = wrap;
		extBtnSunPath = sun.btn;
		extDotSunPath = sun.dot;
		extBtnLiveSun = live.btn;
		extDotLiveSun = live.dot;
		const getPalette = () => updateExternalButtonsUi._bg || {};

		const hoverOn = (btn, mode) => {
			const p = getPalette();
			btn.style.transform = 'translateY(-1px)';

			if (activeSunMode === mode) {
				if (mode === 'sunPath') btn.style.backgroundColor = p.BG_SUN_ON_HOVER || 'rgba(40, 190, 60, 0.55)'; else btn.style.backgroundColor = p.BG_LIVE_ON_HOVER || 'rgba(220, 60, 60, 0.44)';
			} else {
				btn.style.backgroundColor = p.BG_OFF_HOVER || 'rgba(0, 0, 0, 0.30)';
			}
		};

		const hoverOff = () => {
			updateExternalButtonsUi();
		};

		sun.btn.addEventListener('mouseenter', () => hoverOn(sun.btn, 'sunPath'));
		sun.btn.addEventListener('mouseleave', () => hoverOff());
		live.btn.addEventListener('mouseenter', () => hoverOn(live.btn, 'liveSun'));
		live.btn.addEventListener('mouseleave', () => hoverOff());
		sun.btn.addEventListener('click', () => setActiveSunMode('sunPath'));
		live.btn.addEventListener('click', () => setActiveSunMode('liveSun'));
		updateExternalButtonsUi();

		const positionControls = () => {
			if (!extWrap) return;
			const infoBox = document.getElementById('chdInfoBox');
			if (!infoBox) return;
			const boxRect = infoBox.getBoundingClientRect();
			const frameEl = window.frameElement;
			const controlsWidth = Math.max(1, extWrap.offsetWidth || 1);
			const controlsHeight = Math.max(1, extWrap.offsetHeight || 1);
			const marginAbove = 18;
			const marginBelow = 10;
			const targetLeft = boxRect.left + (boxRect.width - controlsWidth) / 2;
			let targetTop = boxRect.top - controlsHeight - marginAbove;

			if (targetTop < 8) {
				targetTop = boxRect.bottom + marginBelow;
			}

			let left = targetLeft;
			let top = targetTop;

			if (frameEl) {
				const frameRect = frameEl.getBoundingClientRect();
				left = frameRect.left + targetLeft;
				top = frameRect.top + targetTop;
			}

			extWrap.style.right = 'auto';
			extWrap.style.bottom = 'auto';
			extWrap.style.left = `${Math.max(8, Math.round(left))}px`;
			extWrap.style.top = `${Math.max(8, Math.round(top))}px`;
		};

		positionControls();
		let rafScheduled = false;

		const requestPosition = () => {
			if (rafScheduled) return;
			rafScheduled = true;

			requestAnimationFrame(() => {
				rafScheduled = false;
				positionControls();
			});
		};

		const onResize = () => requestPosition();
		const onScroll = () => requestPosition();

		try {
			topWin.addEventListener('resize', onResize, { passive: true });
			topWin.addEventListener('scroll', onScroll, { passive: true });
		} catch(e) {
			
		}

		const infoBoxEl = document.getElementById('chdInfoBox');
		let ro = null;

		if (infoBoxEl && typeof ResizeObserver !== 'undefined') {
			ro = new ResizeObserver(() => requestPosition());

			try {
				ro.observe(infoBoxEl);
			} catch(e) {
				
			}
		}

		let mo = null;
		const observeTarget = topDoc.querySelector('#root') || topDoc.querySelector('.root') || topDoc.body;

		if (observeTarget && typeof MutationObserver !== 'undefined') {
			mo = new MutationObserver(() => requestPosition());

			try {
				mo.observe(observeTarget, {
					childList: true,
					subtree: true,
					attributes: true
				});
			} catch(e) {
				
			}
		}

		createExternalSunControls._cleanup = () => {
			try {
				ro && ro.disconnect();
			} catch(e) {
				
			}

			try {
				mo && mo.disconnect();
			} catch(e) {
				
			}

			try {
				topWin.removeEventListener('resize', onResize);
				topWin.removeEventListener('scroll', onScroll);
			} catch(e) {
				
			}
		};
	}

	function destroyExternalSunControls() {
		try {
			createExternalSunControls._cleanup && createExternalSunControls._cleanup();
		} catch(e) {
			
		}

		try {
			const topDoc = (() => {
				try {
					return window.top && window.top.document
					? window.top.document
					: null;
				} catch(e) {
					return null;
				}
			})();

			if (topDoc) {
				const el = topDoc.getElementById('chdSunControlsFloating');
				if (el && el.parentNode) el.parentNode.removeChild(el);
			}
		} catch(e) {
			
		}

		extWrap = null;
		extBtnSunPath = null;
		extDotSunPath = null;
		extBtnLiveSun = null;
		extDotLiveSun = null;
	}

	async function onMapClick(event) {
		const latRaw = event.latlng.lat;
		const lonRaw = event.latlng.lng;
		const seq = ++clickSeq;

		try {
			$$invalidate(1, elevationError = false);
			const elevation = await getElevationMeters(latRaw, lonRaw);
			if (seq !== clickSeq) return;
			$$invalidate(0, elevationMeters = elevation);

			$$invalidate(4, distancesKm = {
				lowMin: horizonDistanceKm(elevationMeters, LOW_CLOUDS_MIN_METERS),
				lowMax: horizonDistanceKm(elevationMeters, LOW_CLOUDS_MAX_METERS),
				midMin: horizonDistanceKm(elevationMeters, MID_CLOUDS_MIN_METERS),
				midMax: horizonDistanceKm(elevationMeters, MID_CLOUDS_MAX_METERS),
				high: horizonDistanceKm(elevationMeters, HIGH_CLOUDS_METERS)
			});

			currentTsMs = readTimelineTs();
			const sunTimes = SunCalc.getTimes(timelineNow(), latRaw, lonRaw);
			lastSolarDayKey = solarDayKey(currentTsMs, lonRaw);
			$$invalidate(2, sunriseTime = formatSunTime(sunTimes.sunrise));
			$$invalidate(3, sunsetTime = formatSunTime(sunTimes.sunset));
			$$invalidate(11, lastClickedLat = latRaw);
			lastClickedLon = lonRaw;
			lastDistanceRefKm = distancesKm.high;

			if (isLiveSunEnabled()) {
				clearMapOverlays();
				clearCurrentSunLine();
				scheduleSunUpdate(currentTsMs);
				return;
			}

			if (isSunPathEnabled()) {
				clearLiveSunOverlays();

				drawHorizonCircles(
					latRaw,
					lonRaw,
					elevationMeters,
					[
						distancesKm.lowMin,
						distancesKm.lowMax,
						distancesKm.midMin,
						distancesKm.midMax,
						distancesKm.high
					],
					[
						'Low Clouds 400m',
						'Low Clouds 1200m',
						'Mid Clouds 2000m',
						'Mid Clouds 4000m',
						'High clouds 6000m'
					]
				);

				drawSunriseSunsetLines(latRaw, lonRaw, sunTimes, distancesKm.high);
				startInitialTimestampSync();
				return;
			}

			clearMapOverlays();
			clearCurrentSunLine();
			clearLiveSunOverlays();
		} catch(err) {
			if (seq !== clickSeq) return;
			console.error('Click processing failed', err);
			$$invalidate(1, elevationError = true);
		}
	}

	function redrawBaseAtLastClick() {
		if (lastClickedLat === null || lastClickedLon === null) return;
		const lat = lastClickedLat;
		const lon = lastClickedLon;
		const sunTimes = SunCalc.getTimes(timelineNow(), lat, lon);
		lastSolarDayKey = solarDayKey(currentTsMs, lon);
		$$invalidate(2, sunriseTime = formatSunTime(sunTimes.sunrise));
		$$invalidate(3, sunsetTime = formatSunTime(sunTimes.sunset));

		drawHorizonCircles(
			lat,
			lon,
			elevationMeters,
			[
				distancesKm.lowMin,
				distancesKm.lowMax,
				distancesKm.midMin,
				distancesKm.midMax,
				distancesKm.high
			],
			[
				'Low Clouds 400m',
				'Low Clouds 1200m',
				'Mid Clouds 2000m',
				'Mid Clouds 4000m',
				'High clouds 6000m'
			]
		);

		drawSunriseSunsetLines(lat, lon, sunTimes, distancesKm.high);
	}

	let activeOverlayKey = 'clouds';

	function onOverlayChange(next) {
		$$invalidate(19, activeOverlayKey = typeof next === 'string' ? next : 'clouds');
		if (lastClickedLat === null || lastClickedLon === null) return;

		if (isLiveSunEnabled()) {
			clearLiveSunOverlays();
			drawOrUpdateLiveSun(lastClickedLat, lastClickedLon, currentTsMs);
			return;
		}

		clearMapOverlays();
		clearCurrentSunLine();
		clearLiveSunOverlays();
		redrawBaseAtLastClick();

		if (isSunPathEnabled()) {
			startInitialTimestampSync();
		}
	}

	function syncTimelineDay(tsMs) {
		currentTsMs = tsMs;
		if (lastClickedLat === null || lastClickedLon === null) return;
		const dayKey = solarDayKey(tsMs, lastClickedLon);
		if (dayKey === lastSolarDayKey) return;
		lastSolarDayKey = dayKey;

		if (isLiveSunEnabled()) {
			const sunTimes = SunCalc.getTimes(timelineNow(), lastClickedLat, lastClickedLon);
			$$invalidate(2, sunriseTime = formatSunTime(sunTimes.sunrise));
			$$invalidate(3, sunsetTime = formatSunTime(sunTimes.sunset));
			return;
		}

		redrawBaseAtLastClick();
	}

	function onTimestampChange(ts) {
		const tsMs = normalizeTimestampMs(ts);
		if (tsMs !== null) syncTimelineDay(tsMs);
		scheduleSunUpdate(ts);
	}

	function initWhenReady() {
		const hasMap = !!(map && map.on);
		const hasLeaflet = typeof window.L !== 'undefined';
		const hasStore = !!(store && store.on);

		if (hasMap && hasLeaflet) {
			if (!isMobileOrTablet) {
				createExternalSunControls();
			}

			try {
				map.on('click', onMapClick);
			} catch(e) {
				
			}

			if (hasStore) {
				try {
					store.on('timestamp', onTimestampChange);
					store.on('overlay', onOverlayChange);
					currentTsMs = readTimelineTs();
					const currentOverlay = store.get ? store.get('overlay') : null;

					if (typeof currentOverlay === 'string' && currentOverlay) {
						$$invalidate(19, activeOverlayKey = currentOverlay);
					}
				} catch(e) {
					
				}
			}

			return;
		}

		initTries += 1;
		if (initTries > 40) return;
		initTimer = window.setTimeout(initWhenReady, 50);
	}

	onMount(() => {
		initWhenReady();
	});

	onDestroy(() => {
		if (initTimer !== null) {
			window.clearTimeout(initTimer);
			initTimer = null;
		}

		if (map && map.off) {
			try {
				map.off('click', onMapClick);
			} catch(e) {
				
			}
		}

		if (store && store.off) {
			try {
				store.off('timestamp', onTimestampChange);
				store.off('overlay', onOverlayChange);
			} catch(e) {
				
			}
		}

		if (pendingSunUpdateTimer !== null) {
			window.clearTimeout(pendingSunUpdateTimer);
			pendingSunUpdateTimer = null;
		}

		if (initialTsRetryTimer !== null) {
			window.clearTimeout(initialTsRetryTimer);
			initialTsRetryTimer = null;
		}

		isTickScheduled = false;
		latestPendingTsMs = null;
		lastDrawnTsMs = null;
		destroyExternalSunControls();
		clearLiveSunOverlays();
		clearMapOverlays();
	});

	const click_handler = () => setActiveSunMode('sunPath');
	const click_handler_1 = () => setActiveSunMode('liveSun');

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*activeSunMode*/ 262144) {
			$$invalidate(16, sunPathEnabled = activeSunMode === 'sunPath');
		}

		if ($$self.$$.dirty[0] & /*activeSunMode*/ 262144) {
			$$invalidate(15, liveSunEnabled = activeSunMode === 'liveSun');
		}

		if ($$self.$$.dirty[0] & /*activeOverlayKey*/ 524288) {
			$$invalidate(14, showLow = overlayLayers(activeOverlayKey).low);
		}

		if ($$self.$$.dirty[0] & /*activeOverlayKey*/ 524288) {
			$$invalidate(13, showMid = overlayLayers(activeOverlayKey).mid);
		}

		if ($$self.$$.dirty[0] & /*activeOverlayKey*/ 524288) {
			$$invalidate(12, showHigh = overlayLayers(activeOverlayKey).high);
		}
	};

	return [
		elevationMeters,
		elevationError,
		sunriseTime,
		sunsetTime,
		distancesKm,
		liveSunAltitudeDeg,
		liveLowMinKm,
		liveLowMaxKm,
		liveMidMinKm,
		liveMidMaxKm,
		liveHighKm,
		lastClickedLat,
		showHigh,
		showMid,
		showLow,
		liveSunEnabled,
		sunPathEnabled,
		setActiveSunMode,
		activeSunMode,
		activeOverlayKey,
		click_handler,
		click_handler_1
	];
}

class Plugin extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {}, add_css, [-1, -1, -1]);
	}
}


// transformCode: Export statement was modified
export { __pluginConfig, Plugin as default };
//# sourceMappingURL=plugin.js.map
