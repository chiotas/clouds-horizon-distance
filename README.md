# Clouds Horizon Distance

Find if clouds will f/ck your sunrise or sunset

# More professional description

This plugin was created with the idea of helping landscape photographers determine if the clouds present will obstruct the sunlight at sunset or sunrise.

Once the plugin is activated, clicking on a point on the map captures the coordinates of that point. For these coordinates, the elevation and information about the sunrise and sunset positions are retrieved.

At this point, using a bit of trigonometry, the plugin calculates and draws concentric rings on the map that represent the sunset horizons for high, medium, and low clouds at different base altitudes. Essentially, it calculates the distance at which a cloud at a specific altitude crosses the horizon line for an observer at a specific elevation.

By utilizing Windy.com’s high, medium, and low cloud layers, it becomes possible to visually verify if the light will be blocked by the clouds: if a cloud intersects its sunset horizon, the sunlight will be blocked. (actually, high clouds almost never block the light, so it's more an indication for colouring chanches of this specific layer)

A more detailed guide will soon be available on www.francescogola.net/blog.

For the proper functioning of the plugin, the following open-source services were used:

    •   SunCalc: for calculating sunrise and sunset lines.
    •   Open-Elevation: to obtain the elevation of the selected point.

I am not a meteorologist (and probably not even a photographer), so all constructive comments and contributions to improve this plugin are welcome!

If you need further assistance or another translation, feel free to ask!

# CHANGELOG
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
