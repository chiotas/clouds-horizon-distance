<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { map } from '@windy/map';
    import SunCalc from 'suncalc';

    // Constants
    const OBSERVER_HEIGHT = 1.7;
    const LOW_CLOUDS_MIN = 400;
    const LOW_CLOUDS_MAX = 1200;
    const MIDDLE_CLOUDS_MIN = 2000;
    const MIDDLE_CLOUDS_MAX = 4000;
    const HIGH_CLOUDS = 6000;
    const EXTRA_DISTANCE = 10;

    // Variables to manage the information box
    let lat = 0;
    let lon = 0;
    let elevation = 0;
    let sunriseTime = '';  // Variable for sunrise time
    let sunsetTime = '';   // Variable for sunset time
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
        // Remove existing circles and labels
        horizonCircles.forEach(circle => map.removeLayer(circle));
        horizonCircles = [];
        labels.forEach(label => map.removeLayer(label));
        labels = [];

        const circleStyles = [
            { color: 'blue', dashArray: '5, 5', weight: 2 },
            { color: 'blue', dashArray: '5, 5', weight: 2 },
            { color: 'purple', dashArray: '5, 5', weight: 2 },
            { color: 'purple', dashArray: '5, 5', weight: 2 },
            { color: 'red', dashArray: '5, 5', weight: 2 },
        ];

        distances.forEach((distance, index) => {
            // Create the main circle on the map
            const circle = L.circle([lat, lon], {
                color: circleStyles[index].color,
                dashArray: circleStyles[index].dashArray,
                weight: circleStyles[index].weight,
                fillOpacity: 0,
                radius: distance * 1000
            }).addTo(map);
            horizonCircles.push(circle);

            // Draw additional circles between the specified ranges
            if (index === 0 || index === 2) {  // Intervals 400-1200m and 2000-4000m
                const step = (index === 0) ? 200 : 400;  // 200m for the first interval, 400m for the second
                const start = (index === 0) ? LOW_CLOUDS_MIN : MIDDLE_CLOUDS_MIN;
                const end = (index === 0) ? LOW_CLOUDS_MAX : MIDDLE_CLOUDS_MAX;

                // Styles for additional circles
                const thinDashArray = '4, 6';  // More visible dash
                let thinWeight = 1.5;  // Slightly increased weight
                let thinOpacity = 0.5;  // Reduce opacity a bit for better visibility
                
                // Specific modifications for green circles (interval 2000-4000m)
                if (index === 2) {
                    thinWeight = 1.7;  // Higher weight for green circles
                    thinOpacity = 0.7;  // Less transparency for green circles
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

                    // Add a label for each additional circle directly above the circle
                    const extraLabel = L.marker([lat + (extraDistance / 111) + 0.02, lon], { // Add 0.002 or another value to move the label higher
                        icon: L.divIcon({
                            className: 'label',
                            html: `<div style="color: ${circleStyles[index].color}; font-weight: bold;">${index === 0 ? "+200m" : "+400m"}</div>`,
                            iconSize: [100, 20]
                        })
                    }).addTo(map);
                    labels.push(extraLabel);
                }
            }

            // Create the main label directly above the main circle
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

        sunriseLine = L.polyline([[lat, lon], sunriseEndLatLon], { color: 'yellow' }).addTo(map);
        sunsetLine = L.polyline([[lat, lon], sunsetEndLatLon], { color: 'orange' }).addTo(map);
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

                        // Calculate sunrise and sunset times using SunCalc
            const sunTimes = SunCalc.getTimes(new Date(), lat, lon);
            sunriseTime = sunTimes.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            sunsetTime = sunTimes.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Draw the horizon circles and sun lines
            drawHorizonCircles(lat, lon, Object.values(distances), [
                "Low Clouds 400m", 
                "Low Clouds 1200m", 
                "Mid Clouds 2000m", 
                "Mid Clouds 4000m", 
                "High Clouds 6000m"
            ]);
            drawSunLines(lat, lon, sunTimes, distances.highClouds);

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

<!-- HTML for the information box -->
<div class="info-box">
    <fieldset>
        <legend>Altitude</legend>
        <label>Your Elevation: {elevation} m</label>
    </fieldset>
    <fieldset>
        <legend>Horizon Distance (Clouds)</legend>
        <label><b>L</b> block range: between {distances.lowCloudsMin.toFixed(0)} and {distances.lowCloudsMax.toFixed(0)} km</label>
        <label><b>M</b> block range: between {distances.middleCloudsMin.toFixed(0)} and {distances.middleCloudsMax.toFixed(0)} km</label>
        <label><b>H</b> horizon from {distances.highClouds.toFixed(0)} km</label>
    </fieldset>
    <!-- New fields for displaying sunrise and sunset times -->
   <fieldset>
    <legend>Sunrise and Sunset</legend>
    <label><b>Sunrise</b>: {sunriseTime} | <b>Sunset</b>: {sunsetTime}</label>
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
        color: white; /* White text for contrast on dark background */
    }

    label {
        display: block;
        margin-bottom: 5px;
        color: white; /* White text for contrast on dark background */
    }

    .label {
        font-size: 14px;
        font-weight: bold;
        background-color: rgba(255, 255, 255, 0.8); /* Background to improve readability */
        padding: 5px;
        border-radius: 5px;
    }
</style>