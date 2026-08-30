<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { map } from '@windy/map';
    import store from '@windy/store';
    import SunCalc from 'suncalc';

    import { isMobileOrTablet } from '@windy/rootScope';

    import {
        apparentAltitudeRad,
        blockDistanceKm,
        computeEndPoint,
        horizonDipRad,
        horizonDistanceKm,
    } from './geo';

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

    type SunMode = 'sunPath' | 'liveSun' | null;

    let activeSunMode: SunMode = 'sunPath';

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

    // Live Sun values for the info box
    // null = sole sotto l'orizzonte visibile. Fra -dip e 0 il sole si vede
    // ancora, quindi un valore negativo e' legittimo e va mostrato.
    let liveSunAltitudeDeg: number | null = null;

    let liveLowMinKm: number | null = null;
    let liveLowMaxKm: number | null = null;
    let liveMidMinKm: number | null = null;
    let liveMidMaxKm: number | null = null;
    let liveHighKm: number | null = null;


    // Reactive flags for the markup
    $: sunPathEnabled = activeSunMode === 'sunPath';
    $: liveSunEnabled = activeSunMode === 'liveSun';

    let horizonCircles: any[] = [];
    let labels: any[] = [];
    let sunriseLine: any = null;
    let sunsetLine: any = null;
    let currentSunLine: any = null;

    // Live Sun overlays
    let liveSunLine: any = null;
let liveSunDot: any = null;
let liveSunSegments: any[] = [];


    // Istante mostrato dalla timeline Windy. Alba, tramonto e posizione del sole
    // devono seguire QUESTO, non l'ora reale: il plugin serve a pianificare.
    let currentTsMs: number = Date.now();
    let lastSolarDayKey: number | null = null;

    let clickSeq = 0;

    let lastClickedLat: number | null = null;
    let lastClickedLon: number | null = null;
    let lastDistanceRefKm = 0;

    let pendingSunUpdateTimer: number | null = null;
    let latestPendingTsMs: number | null = null;
    let isTickScheduled = false;
    let lastDrawnTsMs: number | null = null;

    let initialTsRetryTimer: number | null = null;

    const elevationCache = new Map<string, number>();

    let initTimer: number | null = null;
    let initTries = 0;

    let extWrap: HTMLDivElement | null = null;

    let extBtnSunPath: HTMLButtonElement | null = null;
    let extDotSunPath: HTMLSpanElement | null = null;

        let extBtnLiveSun: HTMLButtonElement | null = null;
    let extDotLiveSun: HTMLSpanElement | null = null;

    const Leaf = (globalThis as any).L;

    const makeCircle = (center: any, options: any) => {
        if (Leaf?.Circle) return new Leaf.Circle(center, options);
        return Leaf.circle(center, options);
    };

    const makePolyline = (latlngs: any, options: any) => {
        if (Leaf?.Polyline) return new Leaf.Polyline(latlngs, options);
        return Leaf.polyline(latlngs, options);
    };

    const makeDivIcon = (options: any) => {
        if (Leaf?.DivIcon) return new Leaf.DivIcon(options);
        return Leaf.divIcon(options);
    };

    const makeMarker = (pos: any, options: any) => {
        if (Leaf?.Marker) return new Leaf.Marker(pos, options);
        return Leaf.marker(pos, options);
    };

    // Giorno solare locale, dedotto dalla longitudine. Serve solo a capire se la
    // timeline e' passata a un altro giorno: gli azimut di alba e tramonto
    // cambiano di giorno in giorno e vanno ridisegnati.
    function solarDayKey(tsMs: number, lon: number): number {
        return Math.floor((tsMs + (lon / 15) * 3600000) / 86400000);
    }

    // Alle alte latitudini alba e tramonto possono non esistere affatto.
    function formatSunTime(d: Date): string {
        const ms = d.getTime();
        if (!Number.isFinite(ms)) return 'n/a';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function timelineNow(): Date {
        return new Date(currentTsMs);
    }

    function readTimelineTs(): number {
        const raw = store && (store as any).get ? (store as any).get('timestamp') : null;
        return normalizeTimestampMs(raw) ?? Date.now();
    }

    function toKey(lat: number, lon: number): string {
        return `${lat.toFixed(4)},${lon.toFixed(4)}`;
    }

    async function getElevationMeters(lat: number, lon: number): Promise<number> {
        const key = toKey(lat, lon);
        const cached = elevationCache.get(key);
        if (cached !== undefined) return cached;

        const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Elevation http status ${response.status}`);

        const data = await response.json();
        if (data.elevation === undefined) throw new Error('Elevation missing');

        let value: any = data.elevation;
        if (Array.isArray(value)) value = value[0];
        if (typeof value === 'string') value = parseFloat(value.replace(',', '.'));

        if (typeof value !== 'number' || Number.isNaN(value)) throw new Error('Elevation invalid');

        elevationCache.set(key, value);
        return value;
    }

    function calculateAzimuthDegrees(lat: number, lon: number, time: Date): number {
        const sunPos = SunCalc.getPosition(time, lat, lon);
        return sunPos.azimuth * 180 / Math.PI + 180;
    }

    function clamp01(v: number) {
        return Math.max(0, Math.min(1, v));
    }

    function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t;
    }

    function hexToRgb(hex: string) {
        const h = hex.replace('#', '').trim();
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        const n = parseInt(full, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function rgbToHex(r: number, g: number, b: number) {
        const toHex = (x: number) => x.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function lerpHexColor(aHex: string, bHex: string, t: number) {
        const a = hexToRgb(aHex);
        const b = hexToRgb(bHex);
        const tt = clamp01(t);

        const r = Math.round(lerp(a.r, b.r, tt));
        const g = Math.round(lerp(a.g, b.g, tt));
        const bb = Math.round(lerp(a.b, b.b, tt));

        return rgbToHex(r, g, bb);
    }

    function normalizeTimestampMs(ts: any): number | null {
        if (typeof ts !== 'number' || !Number.isFinite(ts)) return null;
        if (ts > 0 && ts < 1e12) return ts * 1000;
        return ts;
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

    function drawHorizonCircles(
    lat: number,
    lon: number,
    elevMeters: number,
    mainDistancesKm: number[],
    mainLabelTexts: string[]
) {
    clearMapOverlays();

    const circleStyles = [
        { color: 'blue', dashArray: '5, 5', weight: 2 },
        { color: 'blue', dashArray: '5, 5', weight: 2 },
        { color: 'purple', dashArray: '5, 5', weight: 2 },
        { color: 'purple', dashArray: '5, 5', weight: 2 },
        { color: 'red', dashArray: '5, 5', weight: 2 }
    ];

    const labelAzimuthDeg = 0;
    const labelOffsetKm = 2;

    const indicesToDraw = pickCircleIndicesForOverlay(activeOverlayKey);

    const addCircle = (distanceKm: number, styleIndex: number, opacity: number, weight: number, dash: string) => {
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

    const addLabel = (distanceKm: number, text: string, styleIndex: number) => {
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

        anchorMarker.bindTooltip(
            `<span style="color:${circleStyles[styleIndex].color}; font-weight:700;">${text} (${Math.round(distanceKm)}km)</span>`,
            {
                permanent: true,
                direction: 'top',
                offset: [0, 0],
                opacity: 1,
                className: 'chdLabelTooltip'
            }
        );

        anchorMarker.openTooltip();
        labels.push(anchorMarker);
    };

    indicesToDraw.forEach((index) => {
        const distanceKm = mainDistancesKm[index];

        addCircle(distanceKm, index, 1, circleStyles[index].weight, circleStyles[index].dashArray);

        // Draw thin range circles only for the low main ring and the mid main ring
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

    function drawSunriseSunsetLines(
        lat: number,
        lon: number,
        sunTimes: { sunrise: Date; sunset: Date },
        distanceRefKm: number
    ) {
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

    function dynamicCurrentSunColor(lat: number, lon: number, timestampMs: number): string {
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

    function drawOrUpdateCurrentSunLine(lat: number, lon: number, timestampMs: number, distanceRefKm: number) {
    const time = new Date(timestampMs);
    const pos = SunCalc.getPosition(time, lat, lon);

    // Stesso criterio di Live Sun: il sole e' "su" finche' e' sopra l'orizzonte
    // VISIBILE, rifrazione e depressione dell'orizzonte incluse.
    const apparentAlt = apparentAltitudeRad(pos.altitude);

    // Save Sun altitude for UI in all modes
    liveSunAltitudeDeg = +(apparentAlt * 180 / Math.PI).toFixed(1);

    if (!(apparentAlt > -horizonDipRad(elevationMeters))) {
        liveSunAltitudeDeg = null;
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

    function drawOrUpdateLiveSun(lat: number, lon: number, timestampMs: number) {
    if (!isLiveSunEnabled()) return;

    const time = new Date(timestampMs);
    const pos = SunCalc.getPosition(time, lat, lon);

    // SunCalc restituisce l'altitudine geometrica: la rifrazione solleva il sole
    // di circa mezzo grado all'orizzonte, e dalla quota l'orizzonte visibile sta
    // sotto quello astronomico. Senza queste due correzioni Live Sun si spegneva
    // qualche minuto prima del tramonto reale.
    const apparentAlt = apparentAltitudeRad(pos.altitude);
    const sunsetAlt = -horizonDipRad(elevationMeters);

    if (!(apparentAlt > sunsetAlt)) {
        liveSunAltitudeDeg = null;

        liveLowMinKm = null;
        liveLowMaxKm = null;
        liveMidMinKm = null;
        liveMidMaxKm = null;
        liveHighKm = null;

        clearLiveSunOverlays();
        return;
    }

    liveSunAltitudeDeg = +(apparentAlt * 180 / Math.PI).toFixed(1);

    const azimuthDeg = pos.azimuth * 180 / Math.PI + 180;

    const block = (cloudMeters: number) =>
        blockDistanceKm(elevationMeters, cloudMeters, apparentAlt);

    // Come per gli anelli, mostra solo gli strati coerenti col layer nuvole attivo.
    const layers = overlayLayers(activeOverlayKey);

    const lowMinKm = layers.low ? block(LOW_CLOUDS_MIN_METERS) : null;
    const lowMaxKm = layers.low ? block(LOW_CLOUDS_MAX_METERS) : null;
    const midMinKm = layers.mid ? block(MID_CLOUDS_MIN_METERS) : null;
    const midMaxKm = layers.mid ? block(MID_CLOUDS_MAX_METERS) : null;
    const highKm = layers.high ? block(HIGH_CLOUDS_METERS) : null;

    // Save values for the info box
    liveLowMinKm = lowMinKm;
    liveLowMaxKm = lowMaxKm;
    liveMidMinKm = midMinKm;
    liveMidMaxKm = midMaxKm;
    liveHighKm = highKm;

    const valid = [lowMinKm, lowMaxKm, midMinKm, midMaxKm, highKm].filter(
        v => typeof v === 'number'
    ) as number[];

    if (valid.length === 0) {
        clearLiveSunOverlays();
        return;
    }

    const maxKm = Math.max(...valid);
    const lineLenKm = maxKm + EXTRA_DISTANCE_KM;

    const end = computeEndPoint(lat, lon, azimuthDeg, lineLenKm);

    // Sun line
    if (!liveSunLine) {
        liveSunLine = makePolyline([[lat, lon], end], {
            color: 'red',
            weight: 3,
            interactive: false
        }).addTo(map);
    } else {
        liveSunLine.setLatLngs([[lat, lon], end]);
    }

    // Sun dot
    const sunColor = dynamicCurrentSunColor(lat, lon, timestampMs);

    const sunDotIcon = makeDivIcon({
        className: 'chdLiveSunDot',
        html:
            `<div style="
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

    // Clear old segments
    liveSunSegments.forEach(layer => map.removeLayer(layer));
    liveSunSegments = [];

    const addRangeSegment = (
        aKm: number | null,
        bKm: number | null,
        color: string,
        weight: number,
        opacity: number
    ) => {
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

    // Le nuvole alte hanno una quota sola, quindi un trattino invece di una banda.
    if (highKm !== null) {
        addRangeSegment(highKm - 2, highKm + 2, 'rgba(255,90,90,0.95)', 7, 0.95);
    }

    lastDrawnTsMs = timestampMs;
}

    function scheduleSunUpdate(rawTs: any) {
        const mode = activeSunMode;
        if (mode === null) return;
        if (lastClickedLat === null || lastClickedLon === null) return;

        const tsMs = normalizeTimestampMs(rawTs);
        if (tsMs === null) return;

        latestPendingTsMs = tsMs;

        if (isTickScheduled) return;
        isTickScheduled = true;

        pendingSunUpdateTimer = window.setTimeout(() => {
            isTickScheduled = false;
            pendingSunUpdateTimer = null;

            if (activeSunMode !== mode) return;
            if (latestPendingTsMs === null) return;

            if (mode === 'sunPath') {
                drawOrUpdateCurrentSunLine(
                    lastClickedLat as number,
                    lastClickedLon as number,
                    latestPendingTsMs,
                    lastDistanceRefKm
                );
            } else {
                drawOrUpdateLiveSun(lastClickedLat as number, lastClickedLon as number, latestPendingTsMs);
            }

            if (latestPendingTsMs !== null && lastDrawnTsMs !== null && latestPendingTsMs !== lastDrawnTsMs) {
                scheduleSunUpdate(latestPendingTsMs);
            }
        }, SUN_UPDATE_INTERVAL_MS);
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

            const raw = store && (store as any).get ? (store as any).get('timestamp') : null;
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

        extBtnSunPath.style.borderColor = sunOn ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.22)';
        extBtnLiveSun.style.borderColor = liveOn ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.22)';

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

        (updateExternalButtonsUi as any)._bg = {
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

 function setActiveSunMode(nextMode: SunMode) {

    // Evita blocco scheduler tra modalità
    resetSunScheduler();

    if (activeSunMode === nextMode) {
        activeSunMode = null;

        clearCurrentSunLine();
        clearLiveSunOverlays();

        clearMapOverlays();
        redrawBaseAtLastClick();

        updateExternalButtonsUi();
        return;
    }

    activeSunMode = nextMode;

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

        let topDoc: Document = document;
        let topWin: any = window;

        try {
            if (window.top && window.top.document) {
                topDoc = window.top.document;
                topWin = window.top;
            }
        } catch (e) {
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

        const makeButton = (titleText: string) => {
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

        const getPalette = () => (updateExternalButtonsUi as any)._bg || {};

        const hoverOn = (btn: HTMLButtonElement, mode: SunMode) => {
            const p = getPalette();
            btn.style.transform = 'translateY(-1px)';

            if (activeSunMode === mode) {
                if (mode === 'sunPath') btn.style.backgroundColor = p.BG_SUN_ON_HOVER || 'rgba(40, 190, 60, 0.55)';
                else btn.style.backgroundColor = p.BG_LIVE_ON_HOVER || 'rgba(220, 60, 60, 0.44)';
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

            const infoBox = document.getElementById('chdInfoBox') as HTMLElement | null;
            if (!infoBox) return;

            const boxRect = infoBox.getBoundingClientRect();
            const frameEl = window.frameElement as HTMLElement | null;

            const controlsWidth = Math.max(1, (extWrap as any).offsetWidth || 1);
            const controlsHeight = Math.max(1, (extWrap as any).offsetHeight || 1);

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
        } catch (e) {
        }

        const infoBoxEl = document.getElementById('chdInfoBox') as HTMLElement | null;
        let ro: ResizeObserver | null = null;

        if (infoBoxEl && typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => requestPosition());
            try {
                ro.observe(infoBoxEl);
            } catch (e) {
            }
        }

        let mo: MutationObserver | null = null;

        const observeTarget =
            (topDoc.querySelector('#root') as HTMLElement | null) ||
            (topDoc.querySelector('.root') as HTMLElement | null) ||
            (topDoc.body as HTMLElement | null);

        if (observeTarget && typeof MutationObserver !== 'undefined') {
            mo = new MutationObserver(() => requestPosition());
            try {
                mo.observe(observeTarget, { childList: true, subtree: true, attributes: true });
            } catch (e) {
            }
        }

        (createExternalSunControls as any)._cleanup = () => {
            try {
                ro && ro.disconnect();
            } catch (e) {
            }

            try {
                mo && mo.disconnect();
            } catch (e) {
            }

            try {
                topWin.removeEventListener('resize', onResize);
                topWin.removeEventListener('scroll', onScroll);
            } catch (e) {
            }
        };
    }

    function destroyExternalSunControls() {
        try {
            (createExternalSunControls as any)._cleanup && (createExternalSunControls as any)._cleanup();
        } catch (e) {
        }

        try {
            const topDoc = (() => {
                try {
                    return window.top && window.top.document ? window.top.document : null;
                } catch (e) {
                    return null;
                }
            })();

            if (topDoc) {
                const el = topDoc.getElementById('chdSunControlsFloating');
                if (el && el.parentNode) el.parentNode.removeChild(el);
            }
        } catch (e) {
        }

        extWrap = null;

        extBtnSunPath = null;
        extDotSunPath = null;

        extBtnLiveSun = null;
        extDotLiveSun = null;
    }

    async function onMapClick(event: any) {
    const latRaw = event.latlng.lat as number;
    const lonRaw = event.latlng.lng as number;

    // Due click ravvicinati possono risolversi fuori ordine: se la prima richiesta
    // di elevazione e' lenta, arriva dopo la seconda e ridisegna tutto sul punto
    // vecchio. Vince sempre e solo l'ultimo click.
    const seq = ++clickSeq;

    try {
        elevationError = false;

        const elevation = await getElevationMeters(latRaw, lonRaw);
        if (seq !== clickSeq) return;

        elevationMeters = elevation;

        distancesKm = {
            lowMin: horizonDistanceKm(elevationMeters, LOW_CLOUDS_MIN_METERS),
            lowMax: horizonDistanceKm(elevationMeters, LOW_CLOUDS_MAX_METERS),
            midMin: horizonDistanceKm(elevationMeters, MID_CLOUDS_MIN_METERS),
            midMax: horizonDistanceKm(elevationMeters, MID_CLOUDS_MAX_METERS),
            high: horizonDistanceKm(elevationMeters, HIGH_CLOUDS_METERS)
        };

        currentTsMs = readTimelineTs();

        const sunTimes = SunCalc.getTimes(timelineNow(), latRaw, lonRaw);
        lastSolarDayKey = solarDayKey(currentTsMs, lonRaw);

        sunriseTime = formatSunTime(sunTimes.sunrise);
        sunsetTime = formatSunTime(sunTimes.sunset);

        lastClickedLat = latRaw;
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
                [distancesKm.lowMin, distancesKm.lowMax, distancesKm.midMin, distancesKm.midMax, distancesKm.high],
                ['Low Clouds 400m', 'Low Clouds 1200m', 'Mid Clouds 2000m', 'Mid Clouds 4000m', 'High clouds 6000m']
            );

            drawSunriseSunsetLines(latRaw, lonRaw, sunTimes as any, distancesKm.high);

            startInitialTimestampSync();
            return;
        }

        clearMapOverlays();
        clearCurrentSunLine();
        clearLiveSunOverlays();
    } catch (err: any) {
        if (seq !== clickSeq) return;

        console.error('Click processing failed', err);
        elevationError = true;
    }
}

function redrawBaseAtLastClick() {
    if (lastClickedLat === null || lastClickedLon === null) return;

    const lat = lastClickedLat;
    const lon = lastClickedLon;

    const sunTimes = SunCalc.getTimes(timelineNow(), lat, lon);
    lastSolarDayKey = solarDayKey(currentTsMs, lon);

    sunriseTime = formatSunTime(sunTimes.sunrise);
    sunsetTime = formatSunTime(sunTimes.sunset);

    drawHorizonCircles(
        lat,
        lon,
        elevationMeters,
        [distancesKm.lowMin, distancesKm.lowMax, distancesKm.midMin, distancesKm.midMax, distancesKm.high],
        ['Low Clouds 400m', 'Low Clouds 1200m', 'Mid Clouds 2000m', 'Mid Clouds 4000m', 'High clouds 6000m']
    );

    drawSunriseSunsetLines(lat, lon, sunTimes as any, distancesKm.high);
}

// Windy overlay currently selected (clouds, lclouds, mclouds, hclouds, etc)
let activeOverlayKey: string = 'clouds';

// Reactive flags for mobile card 2 visibility
$: showLow = overlayLayers(activeOverlayKey).low;
$: showMid = overlayLayers(activeOverlayKey).mid;
$: showHigh = overlayLayers(activeOverlayKey).high;

// Quali strati di nuvole ha senso mostrare per il layer Windy attivo.
// Legge activeOverlayKey direttamente: le variabili reattive showLow/showMid/
// showHigh si aggiornano solo al ciclo successivo di Svelte, quindi dentro un
// handler sono ancora al valore precedente. Quelle servono solo al markup.
function overlayLayers(overlayKey: string) {
    return {
        low: overlayKey === 'clouds' || overlayKey === 'lclouds',
        mid: overlayKey === 'clouds' || overlayKey === 'mclouds',
        high: overlayKey === 'clouds' || overlayKey === 'hclouds',
    };
}

function pickCircleIndicesForOverlay(overlayKey: string): number[] {
    // Index mapping:
    // 0 lowMin, 1 lowMax, 2 midMin, 3 midMax, 4 high
    if (overlayKey === 'lclouds') return [0, 1];
    if (overlayKey === 'mclouds') return [2, 3];
    if (overlayKey === 'hclouds') return [4];
    return [0, 1, 2, 3, 4];
}

function onOverlayChange(next: any) {
    activeOverlayKey = typeof next === 'string' ? next : 'clouds';

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

    // Se la timeline e' passata a un altro giorno, gli azimut di alba e tramonto
    // non sono piu' quelli disegnati: vanno rifatti. Gli anelli invece dipendono
    // solo dalla quota, quindi non cambiano.
    function syncTimelineDay(tsMs: number) {
        currentTsMs = tsMs;

        if (lastClickedLat === null || lastClickedLon === null) return;

        const dayKey = solarDayKey(tsMs, lastClickedLon);
        if (dayKey === lastSolarDayKey) return;

        lastSolarDayKey = dayKey;

        if (isLiveSunEnabled()) {
            // Live Sun non disegna gli anelli: bastano gli orari nel pannello.
            const sunTimes = SunCalc.getTimes(timelineNow(), lastClickedLat, lastClickedLon);
            sunriseTime = formatSunTime(sunTimes.sunrise);
            sunsetTime = formatSunTime(sunTimes.sunset);
            return;
        }

        redrawBaseAtLastClick();
    }

    function onTimestampChange(ts: any) {
        const tsMs = normalizeTimestampMs(ts);
        if (tsMs !== null) syncTimelineDay(tsMs);

        scheduleSunUpdate(ts);
    }

    function initWhenReady() {
    const hasMap = !!(map && (map as any).on);
    const hasLeaflet = typeof (window as any).L !== 'undefined';
    const hasStore = !!(store && (store as any).on);

    if (hasMap && hasLeaflet) {
        if (!isMobileOrTablet) {
            createExternalSunControls();
        }

        try {
            (map as any).on('click', onMapClick);
        } catch (e) {
        }

        if (hasStore) {
            try {
                (store as any).on('timestamp', onTimestampChange);
                (store as any).on('overlay', onOverlayChange);

                currentTsMs = readTimelineTs();

                const currentOverlay = (store as any).get ? (store as any).get('overlay') : null;
                if (typeof currentOverlay === 'string' && currentOverlay) {
                    activeOverlayKey = currentOverlay;
                }
            } catch (e) {
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

        if (map && (map as any).off) {
            try {
                (map as any).off('click', onMapClick);
            } catch (e) {
            }
        }

        if (store && (store as any).off) {
            try {
                (store as any).off('timestamp', onTimestampChange);
                (store as any).off('overlay', onOverlayChange);
            } catch (e) {
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
</script>

{#if isMobileOrTablet}

    <div id="chdInfoBox" class="mobileBox">
        <div class="mobileScroll">

<!-- Card 2: Clouds Horizon Distance OR Sun Obstruction Zones -->
<section class="mobileCard" class:mobileCardWide={!liveSunEnabled} class:mobileCardNarrow={liveSunEnabled}>

    <div class="mobileTitle">
        {liveSunEnabled ? 'Sun Obstruction Zones' : 'Clouds Horizon Distance'}
    </div>

    {#if liveSunEnabled}

        {#if showLow}
            <div class="mobileLine">
                <span class="k">Low clouds</span>
                <span class="v">
                    {liveLowMinKm !== null && liveLowMaxKm !== null
                        ? `${Math.round(liveLowMinKm)} to ${Math.round(liveLowMaxKm)} km`
                        : 'n/a'}
                </span>
            </div>
        {/if}

        {#if showMid}
            <div class="mobileLine">
                <span class="k">Mid clouds</span>
                <span class="v">
                    {liveMidMinKm !== null && liveMidMaxKm !== null
                        ? `${Math.round(liveMidMinKm)} to ${Math.round(liveMidMaxKm)} km`
                        : 'n/a'}
                </span>
            </div>
        {/if}

        {#if showHigh}
            <div class="mobileLine">
                <span class="k">High clouds</span>
                <span class="v">
                    {liveHighKm !== null ? `${Math.round(liveHighKm)} km` : 'n/a'}
                </span>
            </div>
        {/if}

    {:else}

        {#if showLow || showMid}
            <div class="mobileLineTwoCols">

                {#if showLow}
                    <div class="pairOneLine">
                        <span class="kBadge">L</span>
                        <span class="vOneLine">
                            {distancesKm.lowMin
                                ? `${distancesKm.lowMin.toFixed(0)} to ${distancesKm.lowMax.toFixed(0)} km`
                                : 'Tap map'}
                        </span>
                    </div>
                {/if}

                {#if showMid}
                    <div class="pairOneLine">
                        <span class="kBadge">M</span>
                        <span class="vOneLine">
                            {distancesKm.midMin
                                ? `${distancesKm.midMin.toFixed(0)} to ${distancesKm.midMax.toFixed(0)} km`
                                : 'Tap map'}
                        </span>
                    </div>
                {/if}

            </div>
        {/if}

        {#if showHigh}
            <div class="mobileLineOneCol">
                <span class="kBadge">H</span>
                <span class="vOneLine">
                    {distancesKm.high
                        ? `${distancesKm.high.toFixed(0)} km`
                        : 'Tap map'}
                </span>
            </div>
        {/if}

        {#if !showLow && !showMid && !showHigh}
            <div class="mobileLineOneCol">
                <span class="kBadge">C</span>
                <span class="vOneLine">Tap map</span>
            </div>
        {/if}

    {/if}

</section>

         <!-- Card 1: Altitude -->
<section class="mobileCard mobileCardNarrow">
    <div class="mobileTitle">Altitude</div>

    <div class="mobileLine">
        <span class="k">Your elevation</span>
        {#if elevationError}
            <span class="v elev-error">Unavailable</span>
        {:else}
            <span class="v">{lastClickedLat === null ? '-' : `${Math.round(elevationMeters)} m`}</span>
        {/if}
    </div>

    <div class="mobileLine">
        <span class="k">Sun altitude</span>
        <span class="v">
            {liveSunAltitudeDeg !== null
                ? `${liveSunAltitudeDeg.toFixed(1)}°`
                : 'n/a'}
        </span>
    </div>
</section>

            

            <!-- Card 3: Sunrise and Sunset -->
            <section class="mobileCard mobileCardNarrow">
                <div class="mobileTitle">Sunrise and Sunset</div>

                <div class="mobileLine">
                    <span class="k">Sunrise</span>
                    <span class="v">{sunriseTime || 'n/a'}</span>
                </div>

                <div class="mobileLine">
                    <span class="k">Sunset</span>
                    <span class="v">{sunsetTime || 'n/a'}</span>
                </div>
            </section>

            <!-- Card 4: Buttons -->
<section class="mobileCard mobileCardNarrow">

    <div class="mobileButtonsStack">

        <button
            class:activeBtn={sunPathEnabled}
            on:click={() => setActiveSunMode('sunPath')}
        >
            Sun path
        </button>

        <button
            class:activeBtn={liveSunEnabled}
            on:click={() => setActiveSunMode('liveSun')}
        >
            Live Sun
        </button>

    </div>

</section>

        </div>
    </div>

{:else}


    <!-- DESKTOP: box originale -->
    <div class="infoBox" id="chdInfoBox">
        <fieldset>
            <legend>Altitude</legend>
            {#if elevationError}
                <label>Your Elevation: <span class="elev-error">Unavailable</span></label>
            {:else}
                <label>Your Elevation: {lastClickedLat === null ? 'Click on the map' : `${Math.round(elevationMeters)} m`}</label>
            {/if}

            {#if liveSunEnabled && liveSunAltitudeDeg !== null}
                <label>Sun altitude: {liveSunAltitudeDeg.toFixed(1)}°</label>
            {/if}
        </fieldset>

        {#if liveSunEnabled}
            <fieldset>
                <legend>Sun Obstruction Zones</legend>

                {#if showLow}
                    <label>
                        <b>Low clouds</b>:
                        {liveLowMinKm !== null && liveLowMaxKm !== null
                            ? `${Math.round(liveLowMinKm)}–${Math.round(liveLowMaxKm)} km`
                            : 'n/a'}
                    </label>
                {/if}

                {#if showMid}
                    <label>
                        <b>Mid clouds</b>:
                        {liveMidMinKm !== null && liveMidMaxKm !== null
                            ? `${Math.round(liveMidMinKm)}–${Math.round(liveMidMaxKm)} km`
                            : 'n/a'}
                    </label>
                {/if}

                {#if showHigh}
                    <label>
                        <b>High clouds</b>:
                        {liveHighKm !== null ? `${Math.round(liveHighKm)} km` : 'n/a'}
                    </label>
                {/if}
            </fieldset>
        {:else}
            <fieldset>
                <legend>Clouds Horizon Distance</legend>
                <label><b>L</b> block range: {lastClickedLat === null ? '-' : `between ${distancesKm.lowMin.toFixed(0)} and ${distancesKm.lowMax.toFixed(0)} km`}</label>
                <label><b>M</b> block range: {lastClickedLat === null ? '-' : `between ${distancesKm.midMin.toFixed(0)} and ${distancesKm.midMax.toFixed(0)} km`}</label>
                <label><b>H</b> horizon from: {lastClickedLat === null ? '-' : `${distancesKm.high.toFixed(0)} km`}</label>
            </fieldset>
        {/if}

        <fieldset>
            <legend>Sunrise and Sunset</legend>
            <label><b>Sunrise</b>: {sunriseTime || '-'} | <b>Sunset</b>: {sunsetTime || '-'}</label>
        </fieldset>
    </div>

{/if}

<style>
    fieldset {
    border: none;
    margin-bottom: 10px;
}

legend {
    font-weight: bold;
    margin-bottom: 5px;
    color: white;
}

label {
    display: block;
    margin-bottom: 5px;
    color: white;
}

.chdLabelAnchor {
    background: transparent;
    border: 0;
}

:global(.leaflet-tooltip.chdLabelTooltip),
:global(.chdLabelTooltip) {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    z-index: 200 !important;
    pointer-events: none !important;
}

:global(.leaflet-tooltip.chdLabelTooltip::before),
:global(.leaflet-tooltip.chdLabelTooltip::after),
:global(.chdLabelTooltip::before),
:global(.chdLabelTooltip::after) {
    display: none !important;
}

:global(.chdLabelTooltip .leaflet-tooltip-content) {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    background-color: transparent !important;
    white-space: nowrap !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.35) !important;
}

:global(.leaflet-pane.leaflet-tooltip-pane) {
    z-index: 200 !important;
}

/* Mobile cards UI */
.mobileBox {
    padding: 8px 10px;
}

.mobileScroll {
    display: flex;
    flex-direction: row;
    gap: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
}

.mobileCard {
    flex: 0 0 auto;
    min-width: 240px;
    max-width: 290px;
    padding: 8px 10px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.18);
    scroll-snap-align: start;
}

.mobileCardNarrow {
    min-width: 170px;
    max-width: 240px;
}

.mobileCardWide {
    min-width: 285px;
    max-width: 340px;
}

.mobileTitle {
    color: white;
    font-weight: 800;
    font-size: 13px;
    opacity: 0.95;
    margin-bottom: 8px;
    letter-spacing: 0.2px;
}

.mobileLine {
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin-bottom: 6px;
    color: white;
}

.mobileLine .k {
    opacity: 0.75;
    font-weight: 800;
    font-size: 12px;
    white-space: nowrap;
}

.mobileLine .v {
    font-weight: 800;
    font-size: 13px;
    white-space: nowrap;
}

.elev-error {
    color: #ff6b6b;
    font-weight: 800;
    font-size: 13px;
}

.placeholder-text {
    opacity: 0.5;
    font-style: italic;
}

/* Card 2 compact layout */
.mobileLineTwoCols {
    display: flex;
    gap: 10px;
    margin-bottom: 6px;
}

.pairOneLine {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.mobileLineOneCol {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 6px;
    min-width: 0;
}

.kBadge {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 12px;
    color: white;
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.22);
    line-height: 1;
}

.vOneLine {
    flex: 1 1 auto;
    min-width: 0;
    font-weight: 800;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: white;
}

/* Card 4 buttons */
.mobileButtonsStack {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.mobileButtonsStack button {
    width: 100%;
    padding: 8px 10px;
    min-height: 28px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(0, 0, 0, 0.22);
    color: white;
    font-weight: 700;
    font-size: 13px;
    line-height: 1.1;
}

.mobileButtonsStack button.activeBtn {
    background: rgba(255, 165, 0, 0.55);
    border-color: rgba(255, 255, 255, 0.35);
}
</style>