# Clouds Horizon Distance

Find if clouds will f/ck your sunrise or sunset

# More professional description

This plugin was created with the idea of helping landscape photographers determine if the clouds present will obstruct the sunlight at sunset or sunrise.

Once the plugin is activated, clicking on a point on the map captures the coordinates of that point. For these coordinates, the elevation and information about the sunrise and sunset positions are retrieved.

At this point, using a bit of trigonometry, the plugin calculates and draws concentric rings on the map that represent the sunset horizons for high, medium, and low clouds at different base altitudes. Essentially, it calculates the distance at which a cloud at a specific altitude crosses the horizon line for an observer at a specific elevation.

By utilizing Windy.com’s high, medium, and low cloud layers, it becomes possible to visually verify if the light will be blocked by the clouds at sunrise or sunset: if a cloud intersects its sunset horizon, the sunlight will be blocked. (actually, high clouds almost never block the light, so it's more an indication for colouring chanches of this specific layer)

A more detailed guide is available on www.francescogola.net/blog.

For the proper functioning of the plugin, the following open-source services were used:

    •   SunCalc: for calculating sunrise and sunset lines.
    •   Open-Meteo: to obtain the elevation of the selected point.

I am not a meteorologist (and probably not even a photographer), so all constructive comments and contributions to improve this plugin are welcome!

If you need further assistance or another translation, feel free to ask!

# CHANGELOG
-   0.9.6
    - Atmospheric refraction is now taken into account: rings are ~8% further out, matching the optical horizon instead of the purely geometric one
    - Horizon dip: from a high viewpoint the sun sets later and further round the curve, and the plugin now knows it
    - Sunrise and sunset now follow the date selected on the Windy timeline, instead of always showing today
    - Sunrise/sunset shown as "n/a" at high latitudes when the sun does not rise or set
    - Live Sun accuracy fixes
    - Geometry extracted into a tested module
-   0.9.5
    - Horizon distance formula accuracy improved
    - Fixed active cloud layer not being read on plugin startup
    - Elevation fetch error is now shown in the UI
    - Minor code optimizations
-   0.9.2
    - Mobile version compatible!!
    - Adaptive rings: now if you select a specific clouds layer, the plugin will show you the rings only for that clouds layer 
    - Code tuned for the new Leaflet-gl Windy.com plugin ecosystem 
-   0.8
    - Sun path: is now possible to track the sun azimuth during the day
    - Live Sun: you can now check where clouds will obstruct the sun during the day and not only at sunrise and sunset
-   0.7
    - Implemented new Earth curvature formula for higher geometric accuracy
    - Full precision coordinates for calculations
    - Elevation caching to reduce API calls
    - Cleaner and more stable rendering
    - Improved label positioning
    - Reduced visual clutter
    - Code structure improvements
    - More robust elevation handling
    - Improved internal precision and consistency
-   0.6
    -   Replaced Elevation system with Open-Meteo as Open-Elevation was unreliable (so plugin was not working)
    -   Completion code rewritten and optimized for greater stability and speed
-   0.5
    -   First public Beta
-   0.4.5
    -   L, M and H rings ranges tuned thatnks to the precious advices of @lionelpeyraud
-   0.4
    -   Added intermediate rings for L and M clouds
-   0.3
    -   Dynamic data box added
-   0.2
    -   Removed visual debug
-   0.1
    -   Initial version of this plugin 

# SUPPORT THE DEVELOPEMENT

You can support the development of this plugin via the Buy me a Coffee platform

<a href="https://www.buymeacoffee.com/francescogola" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

Any contribution is greatly appreciated!
