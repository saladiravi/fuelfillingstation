require('dotenv').config();
const Pool = require("pg").Pool;


const pool = new Pool({  
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false, 
  },
  
  });
  console.log("Database URL:", process.env.DATABASE_URL);

  module.exports = pool;