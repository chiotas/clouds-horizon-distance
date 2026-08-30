// Esegui con: npm test
import assert from 'node:assert/strict';

import {
    EARTH_RADIUS_KM,
    OBSERVER_HEIGHT_METERS,
    REFRACTION_K_STANDARD,
    apparentAltitudeRad,
    blockDistanceKm,
    computeEndPoint,
    horizonDipRad,
    horizonDistanceKm,
} from './geo.ts';

const deg = (d: number) => (d * Math.PI) / 180;
const close = (a: number, b: number, tol: number, msg: string) =>
    assert.ok(Math.abs(a - b) < tol, `${msg}: ${a} vs ${b} (tolleranza ${tol})`);

// --- distanza d'orizzonte -------------------------------------------------

// Senza rifrazione, valori geometrici noti (osservatore a livello del mare).
close(horizonDistanceKm(0, 1200, 1), 128.3, 0.5, 'orizzonte geometrico nuvole basse');
close(horizonDistanceKm(0, 6000, 1), 281.2, 0.5, 'orizzonte geometrico nuvole alte');

// La rifrazione scala tutto di sqrt(k), cioe' +8% con k = 7/6.
for (const cloud of [400, 1200, 2000, 4000, 6000]) {
    const ratio = horizonDistanceKm(0, cloud) / horizonDistanceKm(0, cloud, 1);
    close(ratio, Math.sqrt(REFRACTION_K_STANDARD), 1e-4, `rapporto rifrazione a ${cloud}m`);
}

// Piu' in alto sei, piu' lontano vedi.
assert.ok(
    horizonDistanceKm(2000, 1200) > horizonDistanceKm(0, 1200),
    'da quota maggiore l orizzonte e piu lontano',
);

// L'altezza dell'osservatore (1.7 m) non e' ignorata.
assert.ok(horizonDistanceKm(0, 1200) > horizonDistanceKm(-OBSERVER_HEIGHT_METERS, 1200));

// --- rifrazione sull'altitudine solare ------------------------------------

// All'orizzonte la rifrazione solleva il sole di circa mezzo grado.
close((apparentAltitudeRad(0) * 180) / Math.PI, 0.483, 0.02, 'rifrazione a 0 gradi');

// In alto nel cielo l'effetto e' trascurabile.
close((apparentAltitudeRad(deg(45)) * 180) / Math.PI, 45.017, 0.01, 'rifrazione a 45 gradi');

// Il sole geometricamente sotto l'orizzonte e' ancora visibile.
assert.ok(apparentAltitudeRad(deg(-0.4)) > 0, 'sole a -0.4 gradi geometrici e ancora visibile');

// Monotona: non deve mai invertire l'ordine delle altitudini.
let prev = -Infinity;
for (let d = -1; d <= 90; d += 0.5) {
    const a = apparentAltitudeRad(deg(d));
    assert.ok(a > prev, `altitudine apparente monotona a ${d} gradi`);
    prev = a;
}

// --- depressione dell'orizzonte -------------------------------------------

// A livello del mare e' trascurabile, in quota no.
close((horizonDipRad(0) * 180) / Math.PI, 0.039, 0.005, 'dip a livello del mare');
close((horizonDipRad(2000) * 180) / Math.PI, 1.33, 0.02, 'dip da 2000 m');
close((horizonDipRad(4000) * 180) / Math.PI, 1.88, 0.02, 'dip da 4000 m');

// Cresce con la quota e non e' mai negativa.
assert.ok(horizonDipRad(3000) > horizonDipRad(1000), 'dip cresce con la quota');
assert.ok(horizonDipRad(0) > 0 && horizonDipRad(-5) >= 0, 'dip mai negativo');

// --- distanza di ostruzione ----------------------------------------------

// PROPRIETA' CHIAVE: al tramonto vero (sole all'orizzonte VISIBILE, cioe' a
// -dip) la distanza di blocco coincide col raggio dell'anello. Gli anelli sono
// il caso limite di questa funzione. Se questa asserzione salta, le due meta'
// del plugin stanno raccontando due geometrie diverse.
for (const cloud of [400, 1200, 2000, 4000, 6000]) {
    for (const elev of [0, 500, 2000].filter(e => e < cloud)) {
        const sunset = -horizonDipRad(elev);
        const block = blockDistanceKm(elev, cloud, sunset);
        assert.ok(block !== null, `blocco definito al tramonto (${elev}m, ${cloud}m)`);
        close(block, horizonDistanceKm(elev, cloud), 0.5, `blocco == anello (${elev}m, ${cloud}m)`);
    }
}

// Sotto l'orizzonte visibile il sole e' tramontato: niente ostruzione.
assert.equal(blockDistanceKm(2000, 4000, -horizonDipRad(2000) - 1e-3), null, 'sotto il dip -> null');
assert.ok(blockDistanceKm(2000, 4000, -horizonDipRad(2000) + 1e-3) !== null, 'sopra il dip -> definito');

// Piu' il sole e' alto, piu' vicino deve essere la nuvola che lo blocca.
let last = Infinity;
for (const d of [-0.03, 0, 0.5, 1, 2, 5, 10, 20, 45, 89]) {
    const v = blockDistanceKm(0, 1200, deg(d));
    assert.ok(v !== null && v < last, `distanza di blocco decrescente a ${d} gradi`);
    last = v;
}

// Casi degeneri: niente sole sotto l'orizzonte, niente nuvole sotto l'osservatore.
assert.equal(blockDistanceKm(0, 1200, deg(-1)), null, 'sole sotto orizzonte -> null');
// Limite noto: nuvole sotto l'osservatore non sono gestite (vedi ponytail in geo.ts).
assert.equal(blockDistanceKm(2000, 1200, deg(10)), null, 'nuvola sotto osservatore -> null');
assert.equal(blockDistanceKm(2000, 1200, -horizonDipRad(2000) / 2), null, 'idem vicino al tramonto');
assert.equal(blockDistanceKm(0, 1200, NaN), null, 'NaN -> null');

// --- la semplificazione e' equivalente all'algebra ECEF originale ----------
// Il codice pre-0.9.6 risolveva l'intersezione in coordinate ECEF (90 righe).
// Il risultato non dipende dall'azimut ne' dalla posizione: qui lo dimostriamo.
function blockDistanceEcefReference(
    lat: number,
    lon: number,
    elevMeters: number,
    cloudMeters: number,
    sunAzimuthDeg: number,
    altRad: number,
    radiusKm: number,
): number | null {
    if (!(altRad > 0)) return null;

    const rObs = radiusKm + (elevMeters + OBSERVER_HEIGHT_METERS) / 1000;
    const rCloud = radiusKm + cloudMeters / 1000;
    if (!(rCloud > rObs)) return null;

    const latR = deg(lat);
    const lonR = deg(lon);
    const sinLat = Math.sin(latR);
    const cosLat = Math.cos(latR);
    const sinLon = Math.sin(lonR);
    const cosLon = Math.cos(lonR);

    const up = { x: cosLat * cosLon, y: cosLat * sinLon, z: sinLat };
    const east = { x: -sinLon, y: cosLon, z: 0 };
    const north = { x: -sinLat * cosLon, y: -sinLat * sinLon, z: cosLat };

    const azR = deg(sunAzimuthDeg);
    const e = Math.sin(azR) * Math.cos(altRad);
    const n = Math.cos(azR) * Math.cos(altRad);
    const u = Math.sin(altRad);

    const d = {
        x: e * east.x + n * north.x + u * up.x,
        y: e * east.y + n * north.y + u * up.y,
        z: e * east.z + n * north.z + u * up.z,
    };
    const dLen = Math.hypot(d.x, d.y, d.z);

    const p0 = { x: rObs * up.x, y: rObs * up.y, z: rObs * up.z };
    const b = (2 * (p0.x * d.x + p0.y * d.y + p0.z * d.z)) / dLen;
    const c = rObs * rObs - rCloud * rCloud;

    const t = (-b + Math.sqrt(b * b - 4 * c)) / 2;

    const p1 = { x: p0.x + (t * d.x) / dLen, y: p0.y + (t * d.y) / dLen, z: p0.z + (t * d.z) / dLen };
    const cosAng = (p0.x * p1.x + p0.y * p1.y + p0.z * p1.z) / (rObs * Math.hypot(p1.x, p1.y, p1.z));

    return Math.acos(Math.max(-1, Math.min(1, cosAng))) * radiusKm;
}

const re = EARTH_RADIUS_KM * REFRACTION_K_STANDARD;
for (const [lat, lon] of [[0, 0], [45, 12], [-33, 151], [68, 14], [89, -179]]) {
    for (const az of [0, 90, 187, 271, 359]) {
        for (const d of [0.5, 3, 17, 60]) {
            const mine = blockDistanceKm(120, 2000, deg(d));
            const ref = blockDistanceEcefReference(lat, lon, 120, 2000, az, deg(d), re);
            close(mine, ref, 1e-6, `ECEF vs piano a lat ${lat} az ${az} alt ${d}`);
        }
    }
}

// --- proiezione geografica -----------------------------------------------

// 1 grado di latitudine = 111.19 km sul raggio reale (non quello efficace).
const [northLat, northLon] = computeEndPoint(45, 12, 0, 111.195);
close(northLat, 46, 0.01, 'un grado a nord');
close(northLon, 12, 1e-9, 'longitudine invariata andando a nord');

// Andata e ritorno lungo un meridiano: i meridiani sono geodetiche, quindi
// nord poi sud riporta esattamente al punto di partenza.
const [nLat, nLon] = computeEndPoint(45, 12, 0, 300);
const [rLat, rLon] = computeEndPoint(nLat, nLon, 180, 300);
close(rLat, 45, 1e-9, 'meridiano andata e ritorno: latitudine');
close(rLon, 12, 1e-9, 'meridiano andata e ritorno: longitudine');

// A qualunque azimut, il punto prodotto dista esattamente quanto richiesto
// (verificato con haversine, indipendente da computeEndPoint).
const haversineKm = (aLat: number, aLon: number, bLat: number, bLon: number) => {
    const dLat = deg(bLat - aLat);
    const dLon = deg(bLon - aLon);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg(aLat)) * Math.cos(deg(bLat)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

for (const [lat, lon] of [[0, 0], [45, 12], [-33, 151], [68, 14]]) {
    for (const az of [0, 47, 90, 180, 233, 315]) {
        for (const dist of [10, 130, 304]) {
            const [pLat, pLon] = computeEndPoint(lat, lon, az, dist);
            close(haversineKm(lat, lon, pLat, pLon), dist, 1e-6, `distanza a lat ${lat} az ${az}`);
        }
    }
}

console.log('geo.ts: tutti i test passati');
