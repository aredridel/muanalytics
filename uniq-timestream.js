var through2 = require('through2');
var floorDate = require("floordate")

module.exports = function uniqTimeStream(seqKey, segment, uniqKey) {
    var seen;
    var windowKey;

    return through2({ objectMode: true }, function (record, _, next) {
        if (!record[seqKey]) return next();
        var floored = floorDate(record[seqKey], segment).getTime();
        if (floored != windowKey) {
            seen = {};
            windowKey = floored;
        }

        if (!seen[record[uniqKey]]) {
            seen[record[uniqKey]] = true;
            this.push(record);
        }

        return next();
    });
};
