const pool = require("../../db");
const axios = require("axios");
// Function to obtain a database connection
const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    throw new Error("Failed to obtain database connection: " + error.message);
  }
};

//errror 422 handler...
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message,
  });
};
//error 500 handler...
error500 = (error, res) => {
  res.send({
    status: 500,
    message: "Internal Server Error",
    error: error,
  });
};

//add current_price
const addCurrentPrice = async (req, res) => {
    let connection;
  
    try {
      connection = await getConnection();

      await connection.beginTransaction();
      const isExistTickerQuery = `SELECT ticker FROM sale_target_header`;
      const isExistTickerResult = await connection.query(isExistTickerQuery);
  
      const tickers = isExistTickerResult[0]
        .map((element) => element.ticker)
        .join(",");
  
      if (!tickers) {
        throw new Error("No tickers found in the database.");
      }
      const query = "SELECT url, ticker, currency_name, api_key FROM api_settings";
      const result = await connection.query(query);

      const fullUrls = result[0].map(
        (row) => `${row.url}${tickers}${row.currency_name}${row.api_key}`
      );
      const currentPriceResponse = await axios.get(fullUrls[0]); 
      const currentPriceData = currentPriceResponse.data;
      const tickerArray = tickers.split(",");

      for (const cryptoSymbol of tickerArray) {
        const price = currentPriceData[cryptoSymbol]?.USD; 
        if (price) {
          const checkExistsQuery = `SELECT COUNT(*) AS count FROM current_price WHERE ticker = ?`;
          const [checkExistsResult] = await connection.query(checkExistsQuery, [cryptoSymbol]);
  
          if (checkExistsResult[0].count > 0) {
            const updateQuery = `UPDATE current_price SET current_price = ? WHERE ticker = ?`;
            await connection.query(updateQuery, [price, cryptoSymbol]);
           
          } else {
            const insertQuery = `INSERT INTO current_price (ticker, current_price) VALUES (?, ?)`;
            await connection.query(insertQuery, [cryptoSymbol, price]);
          }
        } else {
          console.warn(`No price found for ${cryptoSymbol}`);
        }
      }

      await connection.commit();
  
      res.status(200).json({
        status: 200,
        message: `Current prices added/updated successfully.`,
      });
    } catch (error) {
      console.error("Error:", error.message);
  
      if (connection) await connection.rollback();
      return res.status(500).json({
        status: 500,
        message: "An error occurred while adding current prices.",
        error: error.message,
      });
    } finally {
      if (connection) connection.release();
    }
  };
  
  

module.exports = {
  addCurrentPrice,
};
