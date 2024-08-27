const __pluginConfig =  {
  "name": "windy-plugin-horizon-distance",
  "version": "0.3.0",
  "title": "Clouds Horizon Distance",
  "description": "This plugin displays circles on the Windy map representing the horizon distances for different cloud heights, calculated based on the users clicked position, including the directions of sunrise and sunset. This allows for an approximate estimation of whether sunlight will be blocked by clouds at sunrise or sunset",
  "author": "Francesco Gola",
  "icon": "☀️",
  "desktopUI": "rhpane",
  "mobileUI": "fullscreen",
  "built": 1724740369134,
  "builtReadable": "2024-08-27T06:32:49.134Z",
  "screenshot": "screenshot.jpg"
};

// transformCode: import { map } from '@windy/map';
const { map } = W.map;


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

(function (module, exports) {
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

/* src/plugin.svelte generated by Svelte v4.2.19 */

function add_css(target) {
	append_styles(target, "svelte-r7w4yx", ".info-box.svelte-r7w4yx{position:fixed;bottom:60px;left:20px;background-color:var(--color-transparent);color:white;padding:10px;border-radius:5px;box-shadow:0 2px 10px rgba(0, 0, 0, 0.1);max-width:250px;font-family:Arial, sans-serif}fieldset.svelte-r7w4yx{border:none;margin-bottom:10px}legend.svelte-r7w4yx{font-weight:bold;margin-bottom:5px;color:white}label.svelte-r7w4yx{display:block;margin-bottom:5px;color:white}");
}

function create_fragment(ctx) {
	let div;
	let fieldset0;
	let legend0;
	let t1;
	let label0;
	let t2;
	let t3;
	let t4;
	let label1;
	let t5;
	let t6;
	let t7;
	let fieldset1;
	let legend1;
	let t9;
	let label2;
	let t10;
	let t11;
	let t12;
	let t13;
	let fieldset2;
	let legend2;
	let t15;
	let label3;
	let t16;
	let t17_value = /*distances*/ ctx[3].lowCloudsMin.toFixed(2) + "";
	let t17;
	let t18;
	let t19;
	let label4;
	let t20;
	let t21_value = /*distances*/ ctx[3].lowCloudsMax.toFixed(2) + "";
	let t21;
	let t22;
	let t23;
	let label5;
	let t24;
	let t25_value = /*distances*/ ctx[3].middleCloudsMin.toFixed(2) + "";
	let t25;
	let t26;
	let t27;
	let label6;
	let t28;
	let t29_value = /*distances*/ ctx[3].middleCloudsMax.toFixed(2) + "";
	let t29;
	let t30;
	let t31;
	let label7;
	let t32;
	let t33_value = /*distances*/ ctx[3].highClouds.toFixed(2) + "";
	let t33;
	let t34;

	return {
		c() {
			div = element("div");
			fieldset0 = element("fieldset");
			legend0 = element("legend");
			legend0.textContent = "Coordinates";
			t1 = space();
			label0 = element("label");
			t2 = text("Latitude: ");
			t3 = text(/*lat*/ ctx[0]);
			t4 = space();
			label1 = element("label");
			t5 = text("Longitude: ");
			t6 = text(/*lon*/ ctx[1]);
			t7 = space();
			fieldset1 = element("fieldset");
			legend1 = element("legend");
			legend1.textContent = "Altitude";
			t9 = space();
			label2 = element("label");
			t10 = text("Elevation: ");
			t11 = text(/*elevation*/ ctx[2]);
			t12 = text(" m");
			t13 = space();
			fieldset2 = element("fieldset");
			legend2 = element("legend");
			legend2.textContent = "Horizon Distance (Clouds)";
			t15 = space();
			label3 = element("label");
			t16 = text("Low Clouds 300m: ");
			t17 = text(t17_value);
			t18 = text(" km");
			t19 = space();
			label4 = element("label");
			t20 = text("Low Clouds 600m: ");
			t21 = text(t21_value);
			t22 = text(" km");
			t23 = space();
			label5 = element("label");
			t24 = text("Middle Clouds 1500m: ");
			t25 = text(t25_value);
			t26 = text(" km");
			t27 = space();
			label6 = element("label");
			t28 = text("Middle Clouds 2500m: ");
			t29 = text(t29_value);
			t30 = text(" km");
			t31 = space();
			label7 = element("label");
			t32 = text("High Clouds 6500m: ");
			t33 = text(t33_value);
			t34 = text(" km");
			attr(legend0, "class", "svelte-r7w4yx");
			attr(label0, "class", "svelte-r7w4yx");
			attr(label1, "class", "svelte-r7w4yx");
			attr(fieldset0, "class", "svelte-r7w4yx");
			attr(legend1, "class", "svelte-r7w4yx");
			attr(label2, "class", "svelte-r7w4yx");
			attr(fieldset1, "class", "svelte-r7w4yx");
			attr(legend2, "class", "svelte-r7w4yx");
			attr(label3, "class", "svelte-r7w4yx");
			attr(label4, "class", "svelte-r7w4yx");
			attr(label5, "class", "svelte-r7w4yx");
			attr(label6, "class", "svelte-r7w4yx");
			attr(label7, "class", "svelte-r7w4yx");
			attr(fieldset2, "class", "svelte-r7w4yx");
			attr(div, "class", "info-box svelte-r7w4yx");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, fieldset0);
			append(fieldset0, legend0);
			append(fieldset0, t1);
			append(fieldset0, label0);
			append(label0, t2);
			append(label0, t3);
			append(fieldset0, t4);
			append(fieldset0, label1);
			append(label1, t5);
			append(label1, t6);
			append(div, t7);
			append(div, fieldset1);
			append(fieldset1, legend1);
			append(fieldset1, t9);
			append(fieldset1, label2);
			append(label2, t10);
			append(label2, t11);
			append(label2, t12);
			append(div, t13);
			append(div, fieldset2);
			append(fieldset2, legend2);
			append(fieldset2, t15);
			append(fieldset2, label3);
			append(label3, t16);
			append(label3, t17);
			append(label3, t18);
			append(fieldset2, t19);
			append(fieldset2, label4);
			append(label4, t20);
			append(label4, t21);
			append(label4, t22);
			append(fieldset2, t23);
			append(fieldset2, label5);
			append(label5, t24);
			append(label5, t25);
			append(label5, t26);
			append(fieldset2, t27);
			append(fieldset2, label6);
			append(label6, t28);
			append(label6, t29);
			append(label6, t30);
			append(fieldset2, t31);
			append(fieldset2, label7);
			append(label7, t32);
			append(label7, t33);
			append(label7, t34);
		},
		p(ctx, [dirty]) {
			if (dirty & /*lat*/ 1) set_data(t3, /*lat*/ ctx[0]);
			if (dirty & /*lon*/ 2) set_data(t6, /*lon*/ ctx[1]);
			if (dirty & /*elevation*/ 4) set_data(t11, /*elevation*/ ctx[2]);
			if (dirty & /*distances*/ 8 && t17_value !== (t17_value = /*distances*/ ctx[3].lowCloudsMin.toFixed(2) + "")) set_data(t17, t17_value);
			if (dirty & /*distances*/ 8 && t21_value !== (t21_value = /*distances*/ ctx[3].lowCloudsMax.toFixed(2) + "")) set_data(t21, t21_value);
			if (dirty & /*distances*/ 8 && t25_value !== (t25_value = /*distances*/ ctx[3].middleCloudsMin.toFixed(2) + "")) set_data(t25, t25_value);
			if (dirty & /*distances*/ 8 && t29_value !== (t29_value = /*distances*/ ctx[3].middleCloudsMax.toFixed(2) + "")) set_data(t29, t29_value);
			if (dirty & /*distances*/ 8 && t33_value !== (t33_value = /*distances*/ ctx[3].highClouds.toFixed(2) + "")) set_data(t33, t33_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

const OBSERVER_HEIGHT = 1.7;
const LOW_CLOUDS_MIN = 300;
const LOW_CLOUDS_MAX = 600;
const MIDDLE_CLOUDS_MIN = 1500;
const MIDDLE_CLOUDS_MAX = 2500;
const HIGH_CLOUDS = 6500;
const EXTRA_DISTANCE = 10;

async function getElevation(lat, lon) {
	const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
	const response = await fetch(url);
	const data = await response.json();

	if (data.results && data.results.length) {
		return data.results[0].elevation;
	}

	throw new Error('Elevation data not found');
}

function calculateHorizonDistance(elevation, cloudHeight) {
	const totalHeight = elevation + OBSERVER_HEIGHT + cloudHeight;
	const earthRadiusKm = 6371;
	return Math.sqrt(2 * earthRadiusKm * totalHeight / 1000);
}

function computeEndPoint(lat, lon, azimuth, distanceKm) {
	const radiusEarthKm = 6371;
	const bearing = azimuth * Math.PI / 180;
	const lat1 = lat * Math.PI / 180;
	const lon1 = lon * Math.PI / 180;
	const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceKm / radiusEarthKm) + Math.cos(lat1) * Math.sin(distanceKm / radiusEarthKm) * Math.cos(bearing));
	const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(distanceKm / radiusEarthKm) * Math.cos(lat1), Math.cos(distanceKm / radiusEarthKm) - Math.sin(lat1) * Math.sin(lat2));
	return [lat2 * 180 / Math.PI, lon2 * 180 / Math.PI];
}

function instance($$self, $$props, $$invalidate) {
	let lat = 0;
	let lon = 0;
	let elevation = 0;

	let distances = {
		lowCloudsMin: 0,
		lowCloudsMax: 0,
		middleCloudsMin: 0,
		middleCloudsMax: 0,
		highClouds: 0
	};

	let horizonCircles = [];
	let labels = [];
	let sunriseLine = null;
	let sunsetLine = null;

	function drawHorizonCircles(lat, lon, distances, labelsText) {
		horizonCircles.forEach(circle => map.removeLayer(circle));
		horizonCircles = [];
		labels.forEach(label => map.removeLayer(label));
		labels = [];

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
				color: 'green',
				dashArray: '5, 5',
				weight: 2
			},
			{
				color: 'green',
				dashArray: '5, 5',
				weight: 2
			},
			{
				color: 'red',
				dashArray: '5, 5',
				weight: 2
			}
		];

		distances.forEach((distance, index) => {
			const circle = L.circle([lat, lon], {
				color: circleStyles[index].color,
				dashArray: circleStyles[index].dashArray,
				weight: circleStyles[index].weight,
				fillOpacity: 0,
				radius: distance * 1000
			}).addTo(map);

			horizonCircles.push(circle);
			const labelLatLon = L.latLng(lat + distance / 111, lon);

			const label = L.marker(labelLatLon, {
				icon: L.divIcon({
					className: 'label',
					html: `<div style="color: ${circleStyles[index].color}; font-weight: bold;">${labelsText[index]} (${Math.round(distance)}km)</div>`,
					iconSize: [200, 40]
				})
			}).addTo(map);

			labels.push(label);
		});
	}

	function drawSunLines(lat, lon, sunTimes, highCloudDistance) {
		const lineLength = highCloudDistance + EXTRA_DISTANCE;
		const sunriseAzimuth = calculateAzimuth(lat, lon, sunTimes.sunrise);
		const sunsetAzimuth = calculateAzimuth(lat, lon, sunTimes.sunset);
		const sunriseEndLatLon = computeEndPoint(lat, lon, sunriseAzimuth, lineLength);
		const sunsetEndLatLon = computeEndPoint(lat, lon, sunsetAzimuth, lineLength);
		if (sunriseLine) map.removeLayer(sunriseLine);
		if (sunsetLine) map.removeLayer(sunsetLine);
		sunriseLine = L.polyline([[lat, lon], sunriseEndLatLon], { color: 'yellow' }).addTo(map);
		sunsetLine = L.polyline([[lat, lon], sunsetEndLatLon], { color: 'orange' }).addTo(map);
	}

	function calculateAzimuth(lat, lon, time) {
		const sunPos = SunCalc.getPosition(time, lat, lon);
		return sunPos.azimuth * 180 / Math.PI + 180;
	}

	async function onMapClick(event) {
		const { lat: clickedLat, lng: clickedLon } = event.latlng;
		$$invalidate(0, lat = parseFloat(clickedLat.toFixed(2)));
		$$invalidate(1, lon = parseFloat(clickedLon.toFixed(2)));

		try {
			$$invalidate(2, elevation = await getElevation(lat, lon));

			$$invalidate(3, distances = {
				lowCloudsMin: calculateHorizonDistance(elevation, LOW_CLOUDS_MIN),
				lowCloudsMax: calculateHorizonDistance(elevation, LOW_CLOUDS_MAX),
				middleCloudsMin: calculateHorizonDistance(elevation, MIDDLE_CLOUDS_MIN),
				middleCloudsMax: calculateHorizonDistance(elevation, MIDDLE_CLOUDS_MAX),
				highClouds: calculateHorizonDistance(elevation, HIGH_CLOUDS)
			});

			drawHorizonCircles(lat, lon, Object.values(distances), [
				"Low Clouds 300m",
				"Low Clouds 600m",
				"Mid Clouds 1500m",
				"Mid Clouds 2500m",
				"High Clouds 6500m"
			]);

			drawSunLines(lat, lon, SunCalc.getTimes(new Date(), lat, lon), distances.highClouds);
		} catch(error) {
			console.error(`Failed to process click: ${error.message}`);
		}
	}

	onMount(() => {
		if (map && map.on) {
			map.on('click', onMapClick);
		}
	});

	onDestroy(() => {
		if (map && map.off) {
			map.off('click', onMapClick);
		}

		horizonCircles.forEach(circle => map.removeLayer(circle));
		labels.forEach(label => map.removeLayer(label));
		if (sunriseLine) map.removeLayer(sunriseLine);
		if (sunsetLine) map.removeLayer(sunsetLine);
	});

	return [lat, lon, elevation, distances];
}

class Plugin extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {}, add_css);
	}
}


// transformCode: Export statement was modified
export { __pluginConfig, Plugin as default };
//# sourceMappingURL=plugin.js.map
