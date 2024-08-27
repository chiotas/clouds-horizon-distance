import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-horizon-distance',
    version: '0.4.0',  
    title: 'Clouds Horizon Distance',
    description: 'This plugin displays circles on the Windy map representing the horizon distances for different cloud heights, calculated based on the users clicked position, including the directions of sunrise and sunset. This allows for an approximate estimation of whether sunlight will be blocked by clouds at sunrise or sunset',
    author: 'Francesco Gola',
    icon: '☀️',  
    desktopUI: 'embedded',
    mobileUI: 'fullscreen',
};

export default config;