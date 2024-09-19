const { Client } = require("pg");
const chalk = require("chalk");
const Table = require("cli-table3");
const url = require("url");
const path = require("path");

const analyzePostgreSQLConnection = async (connectionString) => {
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

    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
        //ca: path.join(__dirname, "../../../../ca-certificate.crt"), // give user --cert flag so they can pass certificate
      },
    });

    await client.connect();
    console.log(
      chalk.greenBright(`[i] Connected to PostgreSQL database: ${database}\n`)
    );
    await analyzeDatabase(client);

    await client.end();
  } catch (error) {
    console.error(chalk.red("[x] Error: "), error.message);
    process.exit(1);
  }
};

const analyzeDatabase = async (client) => {
  try {
    await getCurrentUser(client);
    await getAccessibleDatabases(client);
    await getAccessibleTables(client);
    await getUserRoles(client);
    await getAccessibleRoutines(client);
  } catch (error) {
    console.error(chalk.red("[x] Error during analysis: "), error.message);
  }
};

const getCurrentUser = async (client) => {
  try {
    const res = await client.query("SELECT CURRENT_USER AS user");
    console.log(chalk.greenBright.bold("[i] Current User:"));
    console.log(chalk.green("User:"), res.rows[0].user);
    console.log();
  } catch (err) {
    console.error(chalk.red("[x] Error fetching current user: "), err.message);
  }
};

const getAccessibleDatabases = async (client) => {
  try {
    const res = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false"
    );
    const databases = res.rows.map((row) => row.datname);

    const table = new Table({
      head: ["Database Name"],
      colWidths: [40],
      wordWrap: true,
    });

    databases.forEach((db) => {
      table.push([chalk.green(db)]);
    });

    console.log(chalk.greenBright.bold("[i] Accessible Databases:"));
    console.log(table.toString());
    console.log();
  } catch (err) {
    console.error(chalk.red("[x] Error fetching databases: "), err.message);
  }
};

const getAccessibleTables = async (client) => {
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const table = new Table({
      head: ["Table Name"],
      colWidths: [40],
      wordWrap: true,
    });

    res.rows.forEach((row) => {
      table.push([chalk.green(row.table_name)]);
    });

    console.log(chalk.greenBright.bold("[i] Accessible Tables:"));
    console.log(table.toString());
    console.log();
  } catch (err) {
    console.error(chalk.red("[x] Error fetching tables: "), err.message);
  }
};

// Get roles and privileges of the current user
const getUserRoles = async (client) => {
  try {
    const res = await client.query(`
      SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin 
      FROM pg_roles 
      WHERE rolname = CURRENT_USER
    `);

    console.log(chalk.greenBright.bold("[i] User Roles and Privileges:"));
    const table = new Table({
      head: ["Role", "Superuser", "Create Role", "Create DB", "Can Login"],
      colWidths: [20, 15, 15, 15, 15],
      wordWrap: true,
    });

    res.rows.forEach((row) => {
      table.push([
        chalk.green(row.rolname),
        row.rolsuper ? "Yes" : "No",
        row.rolcreaterole ? "Yes" : "No",
        row.rolcreatedb ? "Yes" : "No",
        row.rolcanlogin ? "Yes" : "No",
      ]);
    });
    console.log(table.toString());
    console.log();
  } catch (err) {
    console.error(chalk.red("[x] Error fetching user roles: "), err.message);
  }
};

// Get all accessible routines (functions/procedures) in the current database
const getAccessibleRoutines = async (client) => {
  try {
    const res = await client.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE specific_schema = 'public'
    `);

    const table = new Table({
      head: ["Routine Name", "Routine Type"],
      colWidths: [40, 20],
      wordWrap: true,
    });

    res.rows.forEach((row) => {
      table.push([chalk.green(row.routine_name), row.routine_type]);
    });

    console.log(chalk.greenBright.bold("[i] Accessible Routines:"));
    console.log(table.toString());
    console.log();
  } catch (err) {
    console.error(chalk.red("[x] Error fetching routines: "), err.message);
  }
};

const postgresqlAnalyzer = (postgresConnectionString) => {
  if (!postgresConnectionString) {
    console.error(
      chalk.red(
        "[x] Error: Please provide a valid PostgreSQL connection string."
      )
    );
    process.exit(1);
  }
  analyzePostgreSQLConnection(postgresConnectionString);
};

module.exports = { postgresqlAnalyzer };
