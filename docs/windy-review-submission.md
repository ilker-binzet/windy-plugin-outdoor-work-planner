# Windy plugin review request

Prepared for the [finished Windy plugins community thread](https://community.windy.com/topic/31066/list-of-finished-windy-plugins-v42). This text has not been posted automatically.

---

Hello Windy team,

I would like to submit **Outdoor Work Planner v0.1.0** for review and inclusion in the public plugin list.

**Author:** Ilker Binzet

**Installation URL:**
https://windy-plugins.com/3164654/windy-plugin-outdoor-work-planner/0.1.0/plugin.min.js

**Open-source repository (ISC):**
https://github.com/ilker-binzet/windy-plugin-outdoor-work-planner

**Release:**
https://github.com/ilker-binzet/windy-plugin-outdoor-work-planner/releases/tag/v0.1.0

Outdoor Work Planner finds continuous forecast windows matching user-defined limits for outdoor work. It includes editable profiles for exterior painting, roofing, concrete work, general outdoor work and custom tasks.

Users can set wind, gust, precipitation, temperature and humidity limits, local working hours and required duration. The interface explains exceeded limits and missing weather data. Light, dark and system themes are supported, with preferences stored locally.

The plugin uses the documented Windy point-forecast API with three-hour intervals, preserves data gaps, and labels humidity calculated from temperature and dew point as an estimate. Matching results describe the user's selected weather limits; profile values are editable starting points.

It is built with Svelte and TypeScript, uses the official plugin template, and has been tested against the public Windy runtime. The uploaded plugin has `private: false`.

Thank you for reviewing it.

Ilker Binzet
