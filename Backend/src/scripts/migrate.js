const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function migrate() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD
    });

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`
    );
    console.log(`Database ${process.env.MYSQL_DATABASE} created or already exists`);

    // Use the database
    await connection.query(`USE ${process.env.MYSQL_DATABASE}`);

    // Read schema file
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .filter(statement => statement.trim().length > 0);

    // Execute each statement
    for (const statement of statements) {
      await connection.query(statement);
      console.log('Executed SQL statement successfully');
    }

    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error.message);
    process.exit(1);
  }
}

migrate(); 