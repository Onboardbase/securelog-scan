const { MongoClient } = require("mongodb");
const chalk = require("chalk");
const Table = require("cli-table3");
const figlet = require("figlet");

const analyzeMongoDBConnection = async (connectionString) => {
  try {
    const dbName = extractDatabaseName(connectionString);
    if (!dbName) {
      console.error(
        chalk.red(
          "[x] Error: Could not extract the database name from the connection string."
        )
      );
      process.exit(1);
    }

    const client = new MongoClient(connectionString);
    await client.connect();
    console.log(
      chalk.greenBright(`[i] Connected to MongoDB database: ${dbName}\n`)
    );

    const db = client.db(dbName);

    /**
     * run requests in parallel meaning there's no order to which data will be logged
     */
    await Promise.all([
      displayDatabaseInfo(db),
      displayUserRolesAndPrivileges(client),
      displayCollectionsInfo(db),
      displayServerInfo(client),
    ]);

    client.close();
  } catch (error) {
    console.error(chalk.red("[x] Error: "), error.message);
    process.exit(1);
  }
};

const extractDatabaseName = (connectionString) => {
  const regex = /(?:mongodb(?:\+srv)?:\/\/[^/]+\/|mongodb:\/\/[^/]+\/)([^/?]+)/;
  const match = connectionString.match(regex);
  return match && match[1] ? match[1] : null;
};

const displayDatabaseInfo = async (db) => {
  const stats = await db.stats();
  console.log(chalk.greenBright.bold("[i] Database Information:"));
  console.log(chalk.green("Database Name:"), stats.db);
  console.log(chalk.green("Collections:"), stats.collections);
  console.log(chalk.green("Indexes:"), stats.indexes);
  console.log(chalk.green("Data Size:"), `${formatBytes(stats.dataSize)}`);
  console.log(
    chalk.green("Storage Size:"),
    `${formatBytes(stats.storageSize)}`
  );
  console.log(chalk.green("Index Size:"), `${formatBytes(stats.indexSize)}`);
  console.log(chalk.green("Objects Count:"), stats.objects);
  console.log();
};

const displayCollectionsInfo = async (db) => {
  const collections = await db.listCollections().toArray();

  const table = new Table({
    head: ["Collection Name", "Document Count", "Storage Size"],
    colWidths: [40, 20, 25],
    wordWrap: true,
  });

  for (const collection of collections) {
    const stats = await db.command({ collStats: collection.name });
    table.push([
      chalk.green(collection.name),
      stats.count,
      formatBytes(stats.size),
    ]);
  }

  console.log(chalk.greenBright.bold("[i] Collections Information:"));
  console.log(table.toString());
  console.log();
};

const displayServerInfo = async (client) => {
  const adminDb = client.db().admin();
  const serverInfo = await adminDb.serverStatus();
  console.log(chalk.greenBright.bold("[i] MongoDB Server Information:"));
  console.log(chalk.green("Version:"), serverInfo.version);
  console.log(chalk.green("Uptime (seconds):"), serverInfo.uptime);
  console.log(
    chalk.green("Connections:"),
    JSON.stringify(serverInfo.connections)
  );
  console.log(chalk.green("Host:"), serverInfo.host);
  console.log(chalk.green("Process:"), serverInfo.process);
  console.log();
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Byte";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const displayUserRolesAndPrivileges = async (client) => {
  const adminDb = client.db().admin();

  try {
    const users = await adminDb.command({ usersInfo: 1 });
    const userRoles = users.users.map((user) => ({
      user: user.user,
      roles: user.roles.map((role) => role.role).join(", "),
    }));

    const table = new Table({
      head: ["User", "Roles"],
      colWidths: [30, 50],
      wordWrap: true,
    });

    userRoles.forEach((userRole) => {
      table.push([userRole.user, userRole.roles]);
    });

    console.log(chalk.greenBright.bold("[i] User Roles and Privileges:"));
    console.log(table.toString());
  } catch (error) {
    console.log(
      chalk.red(`Error fetching user roles and privileges: ${error.message}`)
    );
    process.exit(1);
  }
};

const main = () => {
  figlet.text("MongoDB Analyzer", {}, (err, data) => {
    if (!err) console.log(chalk.cyan(data));
  });

  const mongoConnectionString =
    "mongodb+srv://doadmin:uWi5249kB08F7x1D@backend-default-db-d8e61863.mongo.ondigitalocean.com/gifti?tls=true&authSource=admin";
  if (!mongoConnectionString) {
    console.error(
      chalk.red("[x] Error: Please provide a valid MongoDB connection string.")
    );
    process.exit(1);
  }
  analyzeMongoDBConnection(mongoConnectionString);
};

main();
