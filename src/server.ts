import { Config } from "./types/config.type.js";
import express, { Express } from "express";
import dotenv from "dotenv";
import { ConfigService } from "./services/config.srvs.js";
import { DatabaseService } from "./services/database.srvs.js";
import { RouterService } from "./services/router.srvs.js";
import expressJSDocSwagger from "express-jsdoc-swagger";
import * as url from "url";
import { DatabaseModel } from "./models/dataBase.model.js";
import { RelationshipTypeEnum } from "./enums/relationship.enum.js";
import { RoleEnum } from "./enums/role.enum.js";
import { Family } from "./models/family.model.js";
import { RelatedData } from "./models/data.model.js";
import { Person } from "./models/person.model.js";
import { Relationship } from "./models/relationship.model.js";
import { TaggedPerson } from "./models/taggedPerson.model.js";
import { User } from "./models/user.model.js";
import { H } from "friendly-helper";
import bodyParser from "body-parser";
import rateLimiter from "express-rate-limit";

/**
 * Server
 * @class
 * @property {Express} app - Express app
 * @property {number} port - Port
 * @property {string} __filename - Filename
 * @property {string} __dirname - Directory name
 * @constructor
 * @returns {Server} - Server instance
 * @example
 * const server = new Server();
 */
class Server {
	private app: Express = express();
	private port = 8080;
	private __filename = url.fileURLToPath(import.meta.url);
	private __dirname = url.fileURLToPath(new URL(".", import.meta.url));

	constructor() {
		dotenv.config();
		ConfigService.getInstance();
		DatabaseService.getInstance();

		const limiter = rateLimiter({
			max: 20,
			windowMs: 60 * 1000,
			message: {
				success: false,
				message: "Too many requests, please try again later.",
			},
			statusCode: 429,
			standardHeaders: true,
			legacyHeaders: false,
		});

		RouterService.getInstance().buildUpRoutes(this.app, limiter);

		this.swagger(this.app);
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: false }));
		this.app.use(limiter);
		this.app.use((req, res, next) => {
			res.header("Access-Control-Allow-Origin", "*");
			res.header(
				"Access-Control-Allow-Headers",
				"Origin, X-Requested-With, Content-Type, Accept, Authorization"
			);
			res.header(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, PATCH, DELETE"
			);
			res.header("Access-Control-Allow-Credentials", "true");
			next();
		});

		/**
		 * GET /api/v1
		 * @summary This is the summary of the endpoint
		 * @return {object} 200 - success response
		 */
		this.app.get("/api/v1", (req, res) =>
			res.json({
				success: true,
			})
		);

		this.app.listen(this.port, () => {
			console.log(
				`⚡️[server]: Server is running at http://localhost:${this.port}`
			);
		});
	}

	/**
	 * Tests data for the database
	 * @private
	 * @returns {void}
	 * @example
	 * this.testData();
	 * @memberOf Server
	 * @instance
	 * @method
	 * @name testData
	 */
	private testData(): void {
		const databaseService = DatabaseService.getInstance();

		databaseService.dropCollection("familys");
		databaseService.dropCollection("data");
		databaseService.dropCollection("persons");
		databaseService.dropCollection("relationships");
		databaseService.dropCollection("tags");
		databaseService.dropCollection("users");

		const testData: DatabaseModel = {
			familys: [],
			data: [],
			persons: [],
			relationships: [],
			taggedPersons: [],
			users: [],
		};

		for (let index = 0; index < 10; index++) {
			const family = new Family(
				null,
				H.random.generateLastName(),
				"Test Family Description " + index,
				"Test Family Notes " + index,
				[H.random.generateLastName(), H.random.generateLastName()]
			);
			const data = new RelatedData(
				"Test Data " + index,
				"Test Data Description " + index,
				[H.guid.generate(), H.guid.generate()]
			);
			const person = new Person(
				null,
				[H.random.generateFirstName()],
				[H.random.generateLastName()],
				new Date(),
				null,
				"Test Person Place of Birth " + index,
				null,
				[H.guid.generate(), H.guid.generate()],
				"Test Person Notes ",
				["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
				[H.guid.generate(), H.guid.generate()]
			);
			const relationship = new Relationship(
				null,
				H.guid.generate(),
				H.guid.generate(),
				RelationshipTypeEnum.Related,
				"Test Relationship Notes " + index
			);
			const taggedPerson = new TaggedPerson(
				null,
				H.guid.generate(),
				H.random.generateNumber(1, 10),
				H.random.generateNumber(1, 10),
				H.random.generateDate(new Date(1900, 1, 1), new Date()),
				"Test Tagged Person Notes " + index
			);
			const user = new User(
				null,
				H.random.generateGamerName(),
				H.random.generateEmail(),
				H.random.generatePassword(
					H.random.generateNumber(8, 16),
					[],
					true,
					true
				),
				new Date(),
				new Date(),
				RoleEnum.ADMIN
			);

			testData.familys.push(family);
			testData.data.push(data);
			testData.persons.push(person);
			testData.relationships.push(relationship);
			testData.taggedPersons.push(taggedPerson);
			testData.users.push(user);
		}

		databaseService.listAllCollections().then((collections) => {
			if (!collections.includes("familys")) {
				databaseService.createCollection("familys");
			}

			if (!collections.includes("data")) {
				databaseService.createCollection("data");
			}

			if (!collections.includes("persons")) {
				databaseService.createCollection("persons");
			}

			if (!collections.includes("relationships")) {
				databaseService.createCollection("relationships");
			}

			if (!collections.includes("tags")) {
				databaseService.createCollection("tags");
			}

			if (!collections.includes("users")) {
				databaseService.createCollection("users");
			}
		});

		databaseService.createDocument("familys", testData.familys[0]);
		databaseService.createDocument("familys", testData.familys[1]);
		databaseService.createDocument("data", testData.data[0]);
		databaseService.createDocument("data", testData.data[1]);
		databaseService.createDocument("persons", testData.persons[0]);
		databaseService.createDocument("persons", testData.persons[1]);
		databaseService.createDocument(
			"relationships",
			testData.relationships[0]
		);
		databaseService.createDocument(
			"relationships",
			testData.relationships[1]
		);
		databaseService.createDocument("tags", testData.taggedPersons[0]);
		databaseService.createDocument("tags", testData.taggedPersons[1]);
		databaseService.createDocument("users", testData.users[0]);
		databaseService.createDocument("users", testData.users[1]);
	}

	private swagger(app: Express): object {
		const config = ConfigService.getInstance()._config as Config;
		const swaggerDefinition = {
			openapi: "3.0.0",
			info: {
				title: "Express API for " + config.meta.name,
				version: "1.0.0",
				description:
					"This is a REST API application made with Express.",
				license: {
					name: "Licensed Under " + config.meta.license,
					url: "https://github.com/Family-Chronicles/Family-Chronicles-Server/blob/main/LICENSE",
				},
				contact: {
					name: config.meta.name,
					url: config.meta.homepage,
				},
			},
			servers: [
				{
					url: "http://localhost:8080",
					description: "Development server",
				},
			],
			security: {
				BearerAuth: {
					type: "http",
					scheme: "bearer",
				},
			},
			baseDir: this.__dirname,
			// Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
			filesPattern: "./**/*.js",
			// URL where SwaggerUI will be rendered
			swaggerUIPath: "/docs",
			// Expose OpenAPI UI
			exposeSwaggerUI: true,
			// Expose Open API JSON Docs documentation in `apiDocsPath` path.
			exposeApiDocs: false,
			// Open API JSON Docs endpoint.
			apiDocsPath: "/v3/docs",
			// Set non-required fields as nullable by default
			notRequiredAsNullable: false,
			// You can customize your UI options.
			// you can extend swagger-ui-express config. You can checkout an example of this
			// in the `example/configuration/swaggerOptions.js`
			swaggerUiOptions: {},
			// multiple option in case you want more that one instance
			multiple: true,
		};

		return expressJSDocSwagger(app)(swaggerDefinition);
	}
}

new Server();
