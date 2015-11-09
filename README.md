µ-analytics
===========

A simple analytics collection server to give some basic access stats for a blog
or other content site, and report back a recent use bar graph.

Use
-----

`PORT=8081 npm start`

To track events, add at the foot of your HTML:

```html
<script>window.muanalytics = []; window.muanalytics.push(window.location); </script>
<script async defer src='http://analytics.example.org/exampleasset/tracker.js'></script>
```

Or to use a 1x1 tracking pixel, add

```html
<img src='http://analytics.example.org/exampleasset/1x1'>
```

Where `analytics.example.org` is the hostname (and port) of your analytics
server, and `exampleasset` is a unique ID to identify your site.

Viewing analytics
-----------------

Almost completely unimplemented, but a simple bar chart exists:

```html
<img src='http://analytics.example.org/exampleasset/days/3/dark'>
```

Shows an SVG of the last three days, dark (suitable for display on a light background).
