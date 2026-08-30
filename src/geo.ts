// Geometria di orizzonte e ostruzione solare.
// Funzioni pure, nessuna dipendenza da Leaflet/Windy/DOM: testabili con `npm test`.

export const EARTH_RADIUS_KM = 6371;

export const OBSERVER_HEIGHT_METERS = 1.7;

// Coefficiente di rifrazione atmosferica.
// La luce rasente si incurva verso il basso seguendo la Terra, quindi l'orizzonte
// ottico e' piu' lontano di quello geometrico. Si modella sostituendo il raggio
// terrestre con un raggio efficace k*R e tracciando raggi rettilinei.
// k = 7/6 e' lo standard per atmosfera media (+8% di distanza).
// Valori tipici: 1.0 = nessuna rifrazione (geometrico puro), 7/6 = standard,
// 4/3 o piu' = forte inversione termica (aria calda su mare/suolo freddo, molto
// comune all'alba sulla costa: l'orizzonte si allontana ulteriormente).
export const REFRACTION_K_STANDARD = 7 / 6;

export const effectiveRadiusKm = (k: number = REFRACTION_K_STANDARD) => EARTH_RADIUS_KM * k;

/**
 * Distanza a cui una nuvola alta `cloudMeters` taglia la linea d'orizzonte
 * per un osservatore a quota `elevMeters`. Somma delle due distanze di tangenza.
 */
export function horizonDistanceKm(
    elevMeters: number,
    cloudMeters: number,
    k: number = REFRACTION_K_STANDARD,
): number {
    const re = effectiveRadiusKm(k);
    const hObsKm = (elevMeters + OBSERVER_HEIGHT_METERS) / 1000;
    const hCloudKm = cloudMeters / 1000;

    return (
        Math.sqrt(2 * re * hObsKm + hObsKm * hObsKm) +
        Math.sqrt(2 * re * hCloudKm + hCloudKm * hCloudKm)
    );
}

/**
 * Depressione dell'orizzonte: di quanto l'orizzonte VISIBILE (dove il mare tocca
 * il cielo) sta sotto il piano orizzontale dell'osservatore.
 *
 * A livello del mare e' trascurabile (0.04 gradi), ma da una cima a 2000 m vale
 * 1.33 gradi: e' il motivo per cui in montagna il sole tramonta piu' tardi.
 * Il tramonto avviene quando l'altitudine apparente del sole raggiunge -dip,
 * non 0.
 */
export function horizonDipRad(elevMeters: number, k: number = REFRACTION_K_STANDARD): number {
    const re = effectiveRadiusKm(k);
    const rObs = re + (elevMeters + OBSERVER_HEIGHT_METERS) / 1000;

    if (!(rObs > re)) return 0;

    return Math.acos(re / rObs);
}

/**
 * Altitudine apparente del sole a partire da quella geometrica (Saemundsson 1986).
 * SunCalc.getPosition() restituisce l'altitudine geometrica: all'orizzonte la
 * rifrazione solleva il disco di circa mezzo grado, quindi il sole si vede ancora
 * quando geometricamente e' gia' sotto.
 */
export function apparentAltitudeRad(trueAltitudeRad: number): number {
    const hDeg = (trueAltitudeRad * 180) / Math.PI;

    // Sotto i -2 gradi la formula perde senso e il sole e' comunque invisibile.
    if (hDeg < -2) return trueAltitudeRad;

    const refractionArcmin = 1.02 / Math.tan(((hDeg + 10.3 / (hDeg + 5.11)) * Math.PI) / 180);

    return trueAltitudeRad + ((refractionArcmin / 60) * Math.PI) / 180;
}

/**
 * Distanza al suolo alla quale il raggio che va dall'osservatore al sole
 * attraversa la quota `cloudMeters`. Una nuvola a quella quota e a quella
 * distanza, lungo l'azimut del sole, blocca la luce.
 *
 * `apparentAltRad` e' l'altitudine APPARENTE del sole (vedi apparentAltitudeRad).
 * All'altitudine di tramonto (-dip, vedi horizonDipRad) il risultato coincide
 * con horizonDistanceKm: gli anelli sono il caso limite di questa funzione,
 * non una formula diversa.
 *
 * Il risultato non dipende dall'azimut: la sfera e' simmetrica attorno all'asse
 * osservatore-centro, quindi basta risolvere il triangolo nel piano verticale.
 */
export function blockDistanceKm(
    elevMeters: number,
    cloudMeters: number,
    apparentAltRad: number,
    k: number = REFRACTION_K_STANDARD,
): number | null {
    if (!Number.isFinite(apparentAltRad)) return null;

    // Il sole resta visibile fino all'orizzonte VISIBILE, cioe' fino a -dip.
    // Da una cima quel margine vale piu' di un grado e non e' trascurabile.
    if (apparentAltRad < -horizonDipRad(elevMeters, k)) return null;

    const re = effectiveRadiusKm(k);
    const rObs = re + (elevMeters + OBSERVER_HEIGHT_METERS) / 1000;
    const rCloud = re + cloudMeters / 1000;

    // ponytail: nuvole sotto l'osservatore -> null. Dalla cima di un monte, con
    // il sole quasi all'orizzonte, il raggio scende, sfiora la superficie e
    // risale: una nuvola piu' bassa di te PUO' bloccare la luce (il classico
    // mare di nuvole). Gli anelli lo coprono gia' correttamente; qui servirebbe
    // la seconda radice dell'intersezione. Da fare quando riprendiamo Live Sun.
    if (!(rCloud > rObs)) return null;

    // Raggio rettilineo dall'osservatore, angolo apparentAltRad sull'orizzonte
    // locale. Interseca la sfera di raggio rCloud: |p0 + t*d|^2 = rCloud^2.
    const sinAlt = Math.sin(apparentAltRad);

    const b = 2 * rObs * sinAlt;
    const c = rObs * rObs - rCloud * rCloud; // sempre < 0, quindi una sola radice positiva

    const disc = b * b - 4 * c;
    if (!(disc >= 0)) return null;

    const t = (-b + Math.sqrt(disc)) / 2;
    if (!(t > 0)) return null;

    // Angolo al centro fra osservatore e punto di intersezione
    const up = rObs + t * sinAlt;
    const horiz = t * Math.cos(apparentAltRad);

    const distKm = Math.atan2(horiz, up) * re;

    return Number.isFinite(distKm) ? distKm : null;
}

/**
 * Punto a `distanceKm` da (lat, lon) lungo l'azimut dato.
 * Usa il raggio terrestre REALE: qui si proietta una distanza al suolo su
 * coordinate geografiche vere, la rifrazione non c'entra.
 */
export function computeEndPoint(
    lat: number,
    lon: number,
    azimuthDeg: number,
    distanceKm: number,
): [number, number] {
    const bearing = (azimuthDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lon1 = (lon * Math.PI) / 180;

    const angDist = distanceKm / EARTH_RADIUS_KM;

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(angDist) +
            Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearing),
    );

    const lon2 =
        lon1 +
        Math.atan2(
            Math.sin(bearing) * Math.sin(angDist) * Math.cos(lat1),
            Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2),
        );

    return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
}
