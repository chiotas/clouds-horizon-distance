<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { map } from '@windy/map';
    import SunCalc from 'suncalc';

    // Costanti
    const OBSERVER_HEIGHT = 1.7;
    const LOW_CLOUDS_MIN = 300;
    const LOW_CLOUDS_MAX = 600;
    const MIDDLE_CLOUDS_MIN = 1500;
    const MIDDLE_CLOUDS_MAX = 2500;
    const HIGH_CLOUDS = 6500;
    const EXTRA_DISTANCE = 10;

    // Variabili per gestire le informazioni del box
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

    async function getElevation(lat: number, lon: number): Promise<number> {
        const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length) {
            return data.results[0].elevation;
        }
        throw new Error('Elevation data not found');
    }

    function calculateHorizonDistance(elevation: number, cloudHeight: number): number {
        const totalHeight = elevation + OBSERVER_HEIGHT + cloudHeight;
        const earthRadiusKm = 6371;
        return Math.sqrt(2 * earthRadiusKm * totalHeight / 1000);
    }

function drawHorizonCircles(lat: number, lon: number, distances: number[], labelsText: string[]) {
    // Rimuovere i cerchi e le etichette esistenti
    horizonCircles.forEach(circle => map.removeLayer(circle));
    horizonCircles = [];
    labels.forEach(label => map.removeLayer(label));
    labels = [];

    const circleStyles = [
        { color: 'blue', dashArray: '5, 5', weight: 2 },
        { color: 'blue', dashArray: '5, 5', weight: 2 },
        { color: 'green', dashArray: '5, 5', weight: 2 },
        { color: 'green', dashArray: '5, 5', weight: 2 },
        { color: 'red', dashArray: '5, 5', weight: 2 },
    ];

    distances.forEach((distance, index) => {
        // Creazione del cerchio principale sulla mappa
        const circle = L.circle([lat, lon], {
            color: circleStyles[index].color,
            dashArray: circleStyles[index].dashArray,
            weight: circleStyles[index].weight,
            fillOpacity: 0,
            radius: distance * 1000
        }).addTo(map);
        horizonCircles.push(circle);

        // Disegna cerchi aggiuntivi tra i range specificati
        if (index === 0 || index === 2) {  // Intervalli 300-600m e 1500-2500m
            const step = (index === 0) ? 100 : 200;  // 100m per il primo intervallo, 200m per il secondo
            const start = (index === 0) ? LOW_CLOUDS_MIN : MIDDLE_CLOUDS_MIN;
            const end = (index === 0) ? LOW_CLOUDS_MAX : MIDDLE_CLOUDS_MAX;

            // Stili per i cerchi aggiuntivi
            const thinDashArray = '4, 6';  // Tratteggio più visibile
            let thinWeight = 1.5;  // Peso leggermente aumentato
            let thinOpacity = 0.5;  // Riduciamo un po' la trasparenza per maggiore visibilità
            
            // Modifiche specifiche per i cerchi verdi (intervallo 1500-2500m)
            if (index === 2) {
                thinWeight = 1.7;  // Maggiore peso per i cerchi verdi
                thinOpacity = 0.7;  // Meno trasparenza per i cerchi verdi
            }

            for (let cloudHeight = start + step; cloudHeight < end; cloudHeight += step) {
                const extraDistance = calculateHorizonDistance(elevation, cloudHeight);
                const extraCircle = L.circle([lat, lon], {
                    color: circleStyles[index].color,
                    dashArray: thinDashArray,
                    weight: thinWeight,
                    fillOpacity: 0,
                    opacity: thinOpacity,
                    radius: extraDistance * 1000
                }).addTo(map);
                horizonCircles.push(extraCircle);

                // Aggiungi l'etichetta per ogni cerchio aggiuntivo direttamente sopra il cerchio
                const extraLabel = L.marker([lat + (extraDistance / 111), lon], {
                    icon: L.divIcon({
                        className: 'label',
                        html: `<div style="color: ${circleStyles[index].color}; font-weight: bold;">${index === 0 ? "+100m" : "+200m"}</div>`,
                        iconSize: [100, 20]
                    })
                }).addTo(map);
                labels.push(extraLabel);
            }
        }

        // Creazione dell'etichetta principale direttamente sopra il cerchio principale
        const label = L.marker([lat + (distance / 111), lon], {
            icon: L.divIcon({
                className: 'label',
                html: `<div style="color: ${circleStyles[index].color}; font-weight: bold;">${labelsText[index]} (${Math.round(distance)}km)</div>`,
                iconSize: [200, 40]
            })
        }).addTo(map);
        labels.push(label);
    });
}
    function drawSunLines(lat: number, lon: number, sunTimes: { sunrise: Date, sunset: Date }, highCloudDistance: number) {
        const lineLength = highCloudDistance + EXTRA_DISTANCE;
        const sunriseAzimuth = calculateAzimuth(lat, lon, sunTimes.sunrise);
        const sunsetAzimuth = calculateAzimuth(lat, lon, sunTimes.sunset);

        const sunriseEndLatLon = computeEndPoint(lat, lon, sunriseAzimuth, lineLength);
        const sunsetEndLatLon = computeEndPoint(lat, lon, sunsetAzimuth, lineLength);

        if (sunriseLine) map.removeLayer(sunriseLine);
        if (sunsetLine) map.removeLayer(sunsetLine);

        sunriseLine = L.polyline([ [lat, lon], sunriseEndLatLon ], { color: 'yellow' }).addTo(map);
        sunsetLine = L.polyline([ [lat, lon], sunsetEndLatLon ], { color: 'orange' }).addTo(map);
    }

    function calculateAzimuth(lat: number, lon: number, time: Date): number {
        const sunPos = SunCalc.getPosition(time, lat, lon);
        return sunPos.azimuth * 180 / Math.PI + 180;
    }

    function computeEndPoint(lat: number, lon: number, azimuth: number, distanceKm: number): [number, number] {
        const radiusEarthKm = 6371;
        const bearing = azimuth * Math.PI / 180;
        const lat1 = lat * Math.PI / 180;
        const lon1 = lon * Math.PI / 180;
        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceKm / radiusEarthKm) +
                    Math.cos(lat1) * Math.sin(distanceKm / radiusEarthKm) * Math.cos(bearing));
        const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(distanceKm / radiusEarthKm) * Math.cos(lat1),
                    Math.cos(distanceKm / radiusEarthKm) - Math.sin(lat1) * Math.sin(lat2));
        return [lat2 * 180 / Math.PI, lon2 * 180 / Math.PI];
    }

    async function onMapClick(event: any) {
        const { lat: clickedLat, lng: clickedLon } = event.latlng;
        lat = parseFloat(clickedLat.toFixed(2));
        lon = parseFloat(clickedLon.toFixed(2));

        try {
            elevation = await getElevation(lat, lon);
            distances = {
                lowCloudsMin: calculateHorizonDistance(elevation, LOW_CLOUDS_MIN),
                lowCloudsMax: calculateHorizonDistance(elevation, LOW_CLOUDS_MAX),
                middleCloudsMin: calculateHorizonDistance(elevation, MIDDLE_CLOUDS_MIN),
                middleCloudsMax: calculateHorizonDistance(elevation, MIDDLE_CLOUDS_MAX),
                highClouds: calculateHorizonDistance(elevation, HIGH_CLOUDS)
            };

            drawHorizonCircles(lat, lon, Object.values(distances), [
                "Low Clouds 300m", 
                "Low Clouds 600m", 
                "Mid Clouds 1500m", 
                "Mid Clouds 2500m", 
                "High Clouds 6500m"
            ]);
            drawSunLines(lat, lon, SunCalc.getTimes(new Date(), lat, lon), distances.highClouds);

        } catch (error) {
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
</script>

<!-- HTML per il box informativo -->
<div class="info-box">
    <fieldset>
        <legend>Altitude</legend>
        <label>Your Elevation: {elevation} m</label>
    </fieldset>
    <fieldset>
        <legend>Horizon Distance (Clouds)</legend>
        <label><b>L</b> block range: between {distances.lowCloudsMin.toFixed(0)} and {distances.lowCloudsMax.toFixed(0)} km</label>
        <label><b>M</b> block range: between {distances.middleCloudsMin.toFixed(0)} and {distances.middleCloudsMax.toFixed(0)} km</label>
        <label><b>H</b> block from {distances.highClouds.toFixed(0)} km</label>
    </fieldset>
</div>

<style>

    fieldset {
        border: none;
        margin-bottom: 10px;
    }

    legend {
        font-weight: bold;
        margin-bottom: 5px;
        color: white; /* Testo bianco per il contrasto su sfondo scuro */
    }

    label {
        display: block;
        margin-bottom: 5px;
        color: white; /* Testo bianco per il contrasto su sfondo scuro */
    }

    .label {
        font-size: 14px;
        font-weight: bold;
        background-color: rgba(255, 255, 255, 0.8); /* Sfondo per migliorare la leggibilità */
        padding: 5px;
        border-radius: 5px;
    }
</style>