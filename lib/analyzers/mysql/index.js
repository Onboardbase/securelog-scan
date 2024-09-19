const mysql = require("mysql2");
const chalk = require("chalk");
const Table = require("cli-table3");
const url = require("url");

const analyzeMySQLConnection = async (connectionString) => {
  try {
    // Parse the connection string
    const { pathname } = url.parse(connectionString, true);
    const database = pathname ? pathname.substring(1) : null;
    if (!database) {
      console.error(
        chalk.red("[x] Error: No database specified in the connection string.")
      );
      process.exit(1);
    }

    // Create a connection to the database
    const connection = mysql.createConnection(connectionString);

    connection.connect((err) => {
      if (err) {
        console.error(chalk.red("[x] Error: "), err.message);
        process.exit(1);
      }
      console.log(
        chalk.greenBright(`[i] Connected to MySQL database: ${database}\n`)
      );
      analyzeDatabase(connection);
    });
  } catch (error) {
    console.error(chalk.red("[x] Error: "), error.message);
    process.exit(1);
  }
};

const analyzeDatabase = async (connection) => {
  try {
    await getCurrentUser(connection);
    await getAccessibleDatabases(connection);
    await getAccessibleTables(connection);
    await getUserGrants(connection);
    await getAccessibleRoutines(connection);

    connection.end();
  } catch (error) {
    console.error(chalk.red("[x] Error during analysis: "), error.message);
  }
};

// Get the current MySQL user
const getCurrentUser = (connection) => {
  return new Promise((resolve, reject) => {
    connection.query("SELECT USER() AS user", (err, results) => {
      if (err) return reject(err);
      console.log(chalk.greenBright.bold("[i] Current User:"));
      console.log(chalk.green("User:"), results[0].user);
      console.log();
      resolve();
    });
  });
};

// Get all accessible databases
const getAccessibleDatabases = (connection) => {
  return new Promise((resolve, reject) => {
    connection.query("SHOW DATABASES", (err, results) => {
      if (err) return reject(err);

      const table = new Table({
        head: ["Database Name"], // Header of the table
        colWidths: [40], // Width of the columns
        wordWrap: true,
      });

      results.forEach((row) => {
        table.push([chalk.green(row.Database)]); // Add each database name to the table
      });

      console.log(chalk.greenBright.bold("[i] Accessible Databases:"));
      console.log(table.toString()); // Print the table
      console.log();
      resolve();
    });
  });
};

// Get all accessible tables in the current database
const getAccessibleTables = (connection) => {
  return new Promise((resolve, reject) => {
    connection.query("SHOW TABLES", (err, results) => {
      if (err) return reject(err);
      const table = new Table({
        head: ["Table Name"],
        colWidths: [40],
        wordWrap: true,
      });

      results.forEach((row) => {
        const tableName = row[`Tables_in_${connection.config.database}`];
        table.push([chalk.green(tableName)]);
      });

      console.log(chalk.greenBright.bold("[i] Accessible Tables:"));
      console.log(table.toString());
      console.log();
      resolve();
    });
  });
};

// Get user grants
const getUserGrants = (connection) => {
  return new Promise((resolve, reject) => {
    connection.query("SHOW GRANTS FOR CURRENT_USER", (err, results) => {
      if (err) return reject(err);
      console.log(chalk.greenBright.bold("[i] User Grants:"));
      results.forEach((row, index) => {
        console.log(chalk.green(`Grant ${index + 1}:`), Object.values(row)[0]);
      });
      console.log();
      resolve();
    });
  });
};

// Get all accessible routines in the current database
const getAccessibleRoutines = (connection) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT ROUTINE_NAME, ROUTINE_TYPE 
       FROM INFORMATION_SCHEMA.ROUTINES 
       WHERE ROUTINE_SCHEMA = ?`,
      [connection.config.database],
      (err, results) => {
        if (err) return reject(err);
        const table = new Table({
          head: ["Routine Name", "Routine Type"],
          colWidths: [40, 20],
          wordWrap: true,
        });

        results.forEach((row) => {
          table.push([chalk.green(row.ROUTINE_NAME), row.ROUTINE_TYPE]);
        });

        console.log(chalk.greenBright.bold("[i] Accessible Routines:"));
        console.log(table.toString());
        console.log();
        resolve();
      }
    );
  });
};

const mysqlAnalyzer = (mysqlConnectionString) => {
  if (!mysqlConnectionString) {
    console.error(
      chalk.red("[x] Error: Please provide a valid MySQL connection string.")
    );
    process.exit(1);
  }
  analyzeMySQLConnection(mysqlConnectionString);
};

module.exports = { mysqlAnalyzer };
