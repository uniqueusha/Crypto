const mysql = require('mysql2/promise') ;
//Create a connection pool
const pool = mysql.createPool({
    port:3306,
    host:'localhost',
    user:'root',
    password:'',
    database:'crypto_db',
    connectionLimit:10
});

//check if the pool successfully connects to the database
pool.getConnection((err, connection)=>{
    if (err) {
      console.log("Error connecting to database:",err);
    } else {
    console.log('Connected to database');
    connection.release();
    }
});

//Export the pool to be used in other modules
module.exports = pool;