import * as fs from "fs";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const config = JSON.parse(
	fs.readFileSync("./src/config/default.config.json", "utf8")
);

config.meta.name = pkg.name;
config.meta.version = pkg.version;
config.meta.description = pkg.description;
config.meta.homepage_url = pkg.homepage;
config.meta.author = pkg.author;
config.meta.contributors = pkg.contributors;
config.meta.license = pkg.license;
config.meta.repository = pkg.repository.url;
config.meta.homepage = pkg.homepage;
config.meta.bugs = pkg.bugs.url;

fs.writeFileSync(
	"./src/config/default.config.json",
	JSON.stringify(config, null, 2)
);

// ensure that the dist folder exists
if (!fs.existsSync("./dist/config")) {
	fs.mkdirSync("./dist/config");
}

fs.copyFileSync(
	"./src/config/default.config.json",
	"./dist/config/default.config.json"
);
