/*
    No ES6 allowed.
    This file is used by the build bootstrap.
*/

var fs = require("fs");
var generatorify = require("nodefunc-generatorify");
var extfs = require('extfs');
var _mkdirp = require("mkdirp");
var wrench = require("wrench");
var rimraf = require("rimraf");
var path = require("path");

var exists = generatorify(function(what, cb) {
    fs.exists(what, function(exists) {
        cb(null, exists);
    });
});

var empty = generatorify(function(path, cb) {
    extfs.isEmpty(path, function(result) {
        cb(null, result);
    });
});

var readFile = function*() {
    var fn = generatorify(fs.readFile);
    return (yield* fn.apply(null, arguments)).toString();
};

var copyFile = function(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
};

/*
    Changes the extension to toExtension
    If fromExtensions[array] is not empty, filePath is changed only if extension is in fromExtensions
*/
var changeExtension = function(filePath, extensions) {
    var dir = path.dirname(filePath);
    var fileExtension = path.extname(filePath);
    var filename = path.basename(filePath, fileExtension);
    for (var i = 0; i < extensions.length; i++) {
        var extension = extensions[i];
        if (extension.from && extension.from.length) {
            if (extension.from.indexOf(fileExtension.split(".")[1]) !== -1)
                return path.join(dir, `${filename}.${extension.to}`);
        } else {
            return path.join(dir, `${filename}.${extension.to}`);
        }
    }
    return filePath;
};

module.exports = {
    readFile: readFile,
    writeFile: generatorify(fs.writeFile),
    copyFile: generatorify(copyFile),
    mkdirp: generatorify(_mkdirp),
    copyRecursive: generatorify(wrench.copyDirRecursive),
    exists: exists,
    empty: empty,
    changeExtension: changeExtension,
    remove: generatorify(rimraf),
    readdir: generatorify(fs.readdir)
};
