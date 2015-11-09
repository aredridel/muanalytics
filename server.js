var http = require('http');
var router = require('router')();
var final = require('finalhandler');

var emptygif = require('empty-gif');

var parseurl = require('parseurl');
var requesturl = require('request-url');
var qs = require('qs');
var url = require('url');

var tsdb = require('timestreamdb');
var level = require('level');

var ago = require('ago');
var floordate = require('floordate');

var timestream = require('timestream');

var db = tsdb(level(process.env.ANALYTICS_DATA || 'data', {valueEncoding: "json"}));

var h = require('virtual-hyperscript-svg');
var vdstringify = require('virtual-dom-stringify');

router.get('/:asset/1x1', function (req, res) {
    res.writeHead(200, { 'Content-Type' : 'image/gif'} );
    res.end(emptygif);

    db.put(req.params.asset, { referer: req.headers.referer });
});

router.get('/:asset/track/:key', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/javascript' });
    res.end('');

    db.put(req.params.asset, { referer: req.headers.referer, key: req.params.key });
});

router.get('/:asset/tracker.js', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/javascript' });
    res.end(
        `
        (function setupMu(global) {
            var pending = global.muanalytics;

            global.muanalytics = {
                push: function(key) {
                    var scr = document.createElement('script');
                    scr.src = ${JSON.stringify(url.resolve(requesturl(req), '.'))} + 'track/' + key;
                    scr.onload = function () {
                        scr.parentElement.removeChild(scr);
                    };
                    document.documentElement.appendChild(scr);
                }
            };

            if (pending) pending.forEach(global.muanalytics.push);
        })(this);
        `
    );
});

router.get('/:asset/:period/:n/:color', (req, res) => {
    var url = parseurl(req);
    var q = qs.parse(url.query);
    var period = req.params.period;

    var start = floordate(ago(req.params.n, period), period).valueOf();
    var until = Date.now();
    db.ts(req.params.asset, {start, until})
    .filter(function (e) {
        for (var i in q) {
            if (e[i] != q[i]) return false;
        }

        return true;
    })
    .count('hours')
    .rename('referer', 'hits')
    .keep('hits')
    .union(timestream.gen({start, until, interval: 3600000, key: 'hits', increment: 0}))
    .toArray(function (a) {

        var max = Math.max(a.reduce(function (acc, e) { return Math.max(acc, e.hits) }, 0), 25);

        res.writeHead(200, { "Content-Type": "image/svg+xml" });
        var svg = h('svg', { width: a.length * 3, height: 26 }, [
            h('defs', [
                h('style', [ `rect { fill: ${req.params.color == 'light' ? 'white' : 'black'} }` ])
            ])
        ].concat(a.map(function (e, i) {
            var height = Math.ceil(25 * (e.hits / max));
            return h('rect', { x: i * 3, y: 25 - height, width: 2, height: height + 1 })
        })));

        res.end(vdstringify(svg));
    })
});

http.createServer(function (req, res) {
    router(req, res, final(req, res));
}).listen(process.env.PORT || 8081);
