import tools from "crankshaft-tools";
import optimist from "optimist";
import path from "path";
import fsutils from "../utils/fs";
import { print, getLogger } from "../utils/logging";

var argv = optimist.argv;

/*
    Search paths are:
        a) Current node_modules directory
        b) ~/.fora/templates/node_modules
*/
var resolveTemplatePath = function*(name) {
    var templateName = /^fora-template-/.test(name) ? name : `fora-template-${name}`;

    //Current node_modules_dir
    var node_modules_templatePath = path.resolve(GLOBAL.__libdir, "../node_modules", name);
    var node_modules_prefixedTemplatePath = path.resolve(GLOBAL.__libdir, "../node_modules", `fora-template-${name}`);

    var HOME_DIR = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    var HOME_templatePath = path.resolve(`${HOME_DIR}/.fora/templates/node_modules`, name);
    var HOME_prefixedTemplatePath = path.resolve(`${HOME_DIR}/.fora/templates/node_modules`, `fora-template-${name}`);

    var paths = [
        node_modules_templatePath,
        node_modules_prefixedTemplatePath,
        HOME_templatePath,
        HOME_prefixedTemplatePath
    ];

    for (let templatePath of paths) {
        if (yield* fsutils.exists(templatePath)) {
            return templatePath;
        }
    }

    throw new Error(`Template "${name}" or "fora-template-${name}" was not found.`);
};


/*
    Copy files from the template directory to the destination directory.
*/
var copyTemplateFiles = function*() {
    var logger = getLogger(argv.quiet || false);

    var dest = argv.destination || argv.d || !(/^--/.test(process.argv[3])) ? process.argv[3] : "";
    if (!dest) {
        print("Error:  You must specify a path. eg: hitchslap new <dir> [options..].");
        return;
    }

    //Make sure the directory is empty or the force flag is on
    if (!argv.force && !argv.recreate && !(yield* fsutils.empty(dest))) {
        print(`Conflict: ${path.resolve(dest)} is not empty.`);
    } else {

        if (argv.recreate) {
            if (yield* fsutils.exists(dest)) {
                print(`Deleting ${dest}`);
                yield* fsutils.remove(dest);
            }
        }

        //Copy template
        var exec = tools.process.exec();
        var template = argv.template || argv.t || "blog";
        var templatePath = yield* resolveTemplatePath(template);
        logger(`Copying ${templatePath} -> ${dest}`);
        yield* fsutils.copyRecursive(templatePath, dest, { forceDelete: true });

        //Install npm dependencies.
        var curdir = yield* exec(`pwd`);
        process.chdir(dest);
        var npmMessages = yield* exec(`npm install`);
        print(npmMessages);
        process.chdir(curdir);

        print(`New ${template} site installed in ${path.resolve(dest)}.`);
    }
};

export default copyTemplateFiles;
