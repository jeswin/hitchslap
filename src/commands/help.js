import { getLogger } from "../utils/logging";

export default function*(siteConfig) {
    var logger = getLogger(siteConfig);
    logger(`
        hitchslap 0.0.1 -- hitchslap is a blog-aware, static site generator in NodeJS

        Usage:

          hitchslap <subcommand> [options]

        Options:
                -s, --source [DIR]      Source directory (defaults to ./)
                -d, --destination [DIR] Destination directory (defaults to ./_site)
                -h, --help              Show this message
                -v, --version           Print the name and version

        Build and Serve options
                -n, --no-static         Do not create static html files
                --db <DB name>          Mongo database name
                --db-host [DB Host]     MongoDb server (defaults to localhost)
                --db-port [DB Port]     MongoDb port (defaults to 27017)

        Subcommands:
          build, b              Build your site
          new                   Creates a new hitchslap site scaffold in PATH
          help                  Show the help message, optionally for a given subcommand.
          serve, s              Serve your site locally
          make, m               Same as build --no-static
          run, r                Same as serve --no-static
    `);
}
