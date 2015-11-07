var tsdb = require('timestreamdb');
var level = require('level');

var db = tsdb(level('data', {valueEncoding: "json"}));

var http = require('http');

var router = require('router')();
var final = require('finalhandler');

var emptygif = require('empty-gif');

router.get('/', (req, res) => {
    db.ts("req")
    .count()
    .toArray(function (a) {
        res.end(JSON.stringify(a));
    })
});

router.get('/1x1', function (req, res) {
    res.writeHead(200, { 'Content-Type' : 'image/gif'} );
    db.put('req', { referer: req.headers.referer });
    res.end(emptygif);
});

http.createServer(function (req, res) {
    router(req, res, final(req, res));
}).listen(process.env.PORT || 8081);
