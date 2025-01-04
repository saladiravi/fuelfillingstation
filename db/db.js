const Pool = require("pg").Pool;
require('dotenv').config();

const pool = new Pool({  
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,  // Default to 5432 if not provided
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // If Render requires SSL
  },
  
  });

  module.exports = pool;