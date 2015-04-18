import {transform} from "babel";
import optimist from "optimist";
import path from "path";
import fsutils from "../../../utils/fs";
import { print, getLogger } from "../../../utils/logging";

let argv = optimist.argv;

/*
    options: {
        destination: string,
        extensions: [string],
        excludedDirectories: [string],
        excludedPatterns: [regex or string],
        blacklist: [string],
        taskName: string,
        quite: bool
    }
*/

let babel = function(options) {
    //defaults
    options.extensions = options.extensions || ["js"];
    options.excludedDirectories = options.excludedDirectories || [options.destination];
    options.excludedPatterns = (options.excludedPatterns || [])
        .map(p => typeof p === "string" ? new RegExp(p) : p);
    options.blacklist = options.blacklist || [];

    let logger = getLogger(options.quiet, options.taskName || "babel");

    let fn = function() {
        let extensions = options.extensions.map(e => `*.${e}`);

        let excluded = options.excludedDirectories
            .map(dir => `!${dir}/`)
            .concat(options.excludedPatterns);

        let transpiledFiles = [];

        //We compile client, dev build separately because they may have different blacklists.
        //For example, on iojs we want to blacklist regenerator. But on the client, we don't.
        this.watch(extensions.concat(excluded), function*(filePath, ev, match) {
            transpiledFiles.push(filePath);

            //Make the output dir, if it doesn't exist
            let outputPath = fsutils.changeExtension(
                path.join(options.destination, filePath),
                [ { to:"js", from: options.extensions }]
            );
            yield* fsutils.ensureDirExists(outputPath);
            let contents = yield* fsutils.readFile(filePath);

            let result = transform(contents, { blacklist: options.blacklist });
            yield* fsutils.writeFile(outputPath, result.code);

            if (argv["verbose-transpile"])
                logger(`${filePath} -> ${outputPath}`);
        }, "babel_em_all");

        this.onComplete(function*() {
            logger(`rewrote ${transpiledFiles.length} files`);
        });
    };

    return { build: true, fn: fn };
};

export default babel;