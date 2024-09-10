const { MongoClient } = require("mongodb");
const chalk = require("chalk");
const Table = require("cli-table3");

// MongoDB connection URI and database name
const MONGO_URI =
  "mongodb+srv://doadmin:uWi5249kB08F7x1D@backend-default-db-d8e61863.mongo.ondigitalocean.com/gifti?tls=true&authSource=admin"; // Update with your MongoDB URI
const DATABASE_NAME = "gifti";

const analyzeMongoDB = async () => {
  try {
    const client = await MongoClient.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db(DATABASE_NAME);

    const [dbInfo, collections, indexes] = await Promise.all([
      getDatabaseInfo(db),
      getCollections(db),
      getIndexes(db),
    ]);

    displayDatabaseInfo(dbInfo);
    displayCollections(collections);
    displayIndexes(indexes);

    client.close();
  } catch (error) {
    console.error(chalk.red("[x] Error: "), error.message);
  }
};

const getDatabaseInfo = async (db) => {
  const stats = await db.command({ dbStats: 1 });
  return stats;
};

const getCollections = async (db) => {
  const collections = await db.listCollections().toArray();
  return collections;
};

const getIndexes = async (db) => {
  const collections = await db.listCollections().toArray();
  const indexes = await Promise.all(
    collections.map(async (collection) => {
      const coll = db.collection(collection.name);
      const indexList = await coll.indexes();
      return { collection: collection.name, indexes: indexList };
    })
  );
  return indexes;
};

const displayDatabaseInfo = (stats) => {
  console.log(chalk.green("[i] Database Information\n"));
  console.log(chalk.green("Database Name:"), stats.db);
  console.log(chalk.green("Collections:"), stats.collections);
  console.log(chalk.green("Objects:"), stats.objects);
  console.log(chalk.green("Data Size:"), stats.dataSize);
  console.log(chalk.green("Storage Size:"), stats.storageSize);
  console.log(chalk.green("Index Size:"), stats.indexSize);
  console.log(chalk.green("Total Size:"), stats.totalSize, "\n");
};

const displayCollections = (collections) => {
  console.log(chalk.green("[i] Collections\n"));
  const table = new Table({
    head: ["Collection Name", "Options"],
    colWidths: [30, 40],
  });

  collections.forEach((collection) => {
    table.push([
      chalk.green(collection.name),
      chalk.green(JSON.stringify(collection.options)),
    ]);
  });

  console.log(table.toString());
};

const displayIndexes = (indexes) => {
  console.log(chalk.green("[i] Indexes\n"));
  indexes.forEach((coll) => {
    const table = new Table({
      head: ["Collection", "Index Name", "Key", "Unique"],
      colWidths: [20, 30, 30, 10],
    });

    coll.indexes.forEach((index) => {
      table.push([
        chalk.green(coll.collection),
        chalk.green(index.name),
        chalk.green(JSON.stringify(index.key)),
        index.unique ? chalk.green("Yes") : chalk.red("No"),
      ]);
    });

    console.log(table.toString());
  });
};

const displayWelcomeMessage = () => {
  console.log(
    chalk.blue.bold(`
     
  `)
  );
};

const main = () => {
  displayWelcomeMessage();
  analyzeMongoDB();
};

main();
