var http = require('http');
var router = require('router')();
var final = require('finalhandler');

var emptygif = require('empty-gif');

var parseurl = require('parseurl');
var qs = require('qs');

var tsdb = require('timestreamdb');
var level = require('level');

var ago = require('ago');
var floordate = require('floordate');

var db = tsdb(level(process.env.ANALYTICS_DATA || 'data', {valueEncoding: "json"}));

router.get('/:asset/1x1', function (req, res) {
    res.writeHead(200, { 'Content-Type' : 'image/gif'} );
    res.end(emptygif);

    db.put(req.params.asset, { referer: req.headers.referer });
});

router.get('/:asset/:period', (req, res) => {
    var url = parseurl(req);
    var q = qs.parse(url.query);
    var period = req.params.period;

    db.ts(req.params.asset, {from: floordate(ago(1, period), period), to: Date.now()})
    .filter(function (e) {
        for (var i in q) {
            if (e[i] != q[i]) return false;
        }

        return true;
    })
    .count('hours')
    .rename('referer', 'hits')
    .keep('hits')
    .toArray(function (a) {
        res.end(JSON.stringify(a) + "\n");
    })
});

http.createServer(function (req, res) {
    router(req, res, final(req, res));
}).listen(process.env.PORT || 8081);
