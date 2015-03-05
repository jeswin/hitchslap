import React from "react";
import path from "path";
import frontMatter from "front-matter";
import markdown from "node-markdown";
import fsutils from "../../../../utils/fs";
import pretty from "pretty";
import { print, getLogger } from "../../../../utils/logging";

var md = markdown.Markdown;

export default function*(page, sourcePath, layout, makePath, siteConfig) {
    var logger = getLogger(siteConfig);
    var taskConfig = siteConfig.jekyll;

    try {
        var layoutsourcePath, params, component;

        //Source path and layout are the same only when generating plain JSX templates (without frontmatter)
        if (sourcePath !== layout) {
            layoutsourcePath = path.resolve(siteConfig.destination, `${taskConfig.dir_layouts}/${page.layout || layout}`);
            params = { page: page, content: page.content, site: siteConfig };
        } else {
            page = {};
            layoutsourcePath = path.resolve(siteConfig.destination, layout);
            params = { page: page, content: "", site: siteConfig };
        }
        component = React.createFactory(require(layoutsourcePath))(params);
        var reactHtml = React.renderToString(component);
        var html = `<!DOCTYPE html>` + siteConfig.beautify ? pretty(reactHtml) : reactHtml;

        var outputPath = path.resolve(
            siteConfig.destination,
            makePath(sourcePath, page)
        );

        var outputDir = path.dirname(outputPath);
        if (!yield* fsutils.exists(outputDir)) {
            yield* fsutils.mkdirp(outputDir);
        }

        logger(`Generating ${sourcePath} -> ${outputPath}`);

        yield* fsutils.writeFile(outputPath, html);

        return { page };
    } catch(err) {
        print(`Cannot process ${sourcePath} with template ${layout}.`);
        throw err;
    }
}
