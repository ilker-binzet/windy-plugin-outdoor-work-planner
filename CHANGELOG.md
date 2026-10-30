# Changelog

## 0.2.0

- Separate the planner into Plan, Limits and Results tabs with more space between controls.
- Fix scrolling in Windy's native desktop and mobile plugin containers. Keep the header and tabs outside the scrolling content.
- Add a compact map panel with an explicit return to the planner and a close action back to Windy.
- Integrate Windy's native city search, GPS, map-center selection and map/picker coordinates. Preserve selected coordinates when place-name lookup fails.
- Bound stalled GPS/forecast requests, reject approximate location fallbacks, discard stale location results and reuse recent forecasts.
- Keep the planner open while native search opens its selection, then dismiss the native selection panel and retain the chosen location.
- Add visible pressed, focus, selected and loading states, larger controls, keyboard tab navigation and reduced-motion support.
- Preserve saved profiles, author credits and light, dark and system appearance.
- Expand regression coverage to clipped mobile hosts, denied location permission, manual entry and actual Windy window-manager interactions with both bundles.

## 0.1.0

Initial public release with editable work profiles, continuous weather windows, local working hours and light, dark and system appearance.
