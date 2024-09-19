const { MongoClient } = require("mongodb");
const chalk = require("chalk");
const Table = require("cli-table3");
const { formatBytes } = require("../../util");

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

    // Run analysis functions in sequence
    await getCurrentUser(client);
    await displayUserRolesAndPrivileges(client);
    await displayDatabaseInfo(db);
    await displayCollectionsInfo(db);
    await displayIndexesInfo(db);

    client.close();
  } catch (error) {
    console.error(chalk.red("[x] Error: "), error.message);
    process.exit(1);
  }
};

// Extract the database name from the connection string
const extractDatabaseName = (connectionString) => {
  const regex = /(?:mongodb(?:\+srv)?:\/\/[^/]+\/|mongodb:\/\/[^/]+\/)([^/?]+)/;
  const match = connectionString.match(regex);
  return match && match[1] ? match[1] : null;
};

// Get the current MongoDB user
const getCurrentUser = async (client) => {
  const adminDb = client.db().admin();
  try {
    const result = await adminDb.command({ connectionStatus: 1 });
    const currentUser = result.authInfo.authenticatedUsers[0];
    console.log(chalk.greenBright.bold("[i] Current User:"));
    console.log(chalk.green("User:"), currentUser.user);
    console.log(chalk.green("DB:"), currentUser.db);
    console.log();
  } catch (error) {
    console.error(chalk.red("[x] Error fetching current user:"), error.message);
  }
};

// Display database information
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

// Display information about collections (tables)
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

// Display information about indexes (similar to accessible routines in SQL)
const displayIndexesInfo = async (db) => {
  const collections = await db.listCollections().toArray();

  console.log(chalk.greenBright.bold("[i] Indexes Information:"));

  for (const collection of collections) {
    const indexes = await db.collection(collection.name).indexes();
    console.log(chalk.green(`Collection: ${collection.name}`));
    indexes.forEach((index) => {
      console.log(
        chalk.green("Index Name:"),
        index.name,
        chalk.green("Keys:"),
        JSON.stringify(index.key),
        chalk.green("Unique:"),
        index.unique || false
      );
    });
    console.log();
  }
};

// Display user roles and privileges (similar to grants in SQL)
const displayUserRolesAndPrivileges = async (client) => {
  const adminDb = client.db().admin();

  try {
    const users = await adminDb.command({ usersInfo: 1 });
    const userRoles = users.users.map((user) => ({
      user: user.user,
      roles: user.roles.map((role) => `${role.role}@${role.db}`).join(", "),
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

const mongodbAnalyzer = (mongoConnectionString) => {
  if (!mongoConnectionString) {
    console.error(
      chalk.red("[x] Error: Please provide a valid MongoDB connection string.")
    );
    process.exit(1);
  }
  analyzeMongoDBConnection(mongoConnectionString);
};

module.exports = { mongodbAnalyzer };
