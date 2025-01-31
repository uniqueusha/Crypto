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
// const addCurrentPrice = async (req, res) => {
//   const untitledId = req.companyData.untitled_id; 
//   let connection;
//   try {
//     connection = await getConnection();

//     await connection.beginTransaction();

//     // Fetch all sale_target_id, ticker, and untitled_id from sale_target_header
//     const saleTargetQuery = `
//       SELECT sale_target_id, ticker
//       FROM sale_target_header 
//       WHERE status = 1
//     `;
//     const saleTargetResult = await connection.query(saleTargetQuery);

//     if (!saleTargetResult[0].length) {
//       throw new Error("No tickers found with status = 1 in the database.");
//     }

//     const saleTargetData = saleTargetResult[0];

//     // Construct ticker list for API call
//     const tickers = Array.from(new Set(saleTargetData.map((element) => element.ticker))).join(",");

//     // Fetch API settings
//     const apiSettingsQuery = `SELECT url, ticker, currency_name FROM api_settings`;
//     const apiSettingsResult = await connection.query(apiSettingsQuery);

//     const apiUrl = apiSettingsResult[0].map(
//       (row) => `${row.url}${tickers}${row.currency_name}`
//     )[0]; // Assuming the first URL is valid

//     // Fetch current price data from the API
//     const currentPriceResponse = await axios.get(apiUrl);
//     const currentPriceData = currentPriceResponse.data;

//     // Iterate over all sale_target_data
//     for (const saleTarget of saleTargetData) {
//       const { sale_target_id, ticker } = saleTarget;

//       // Fetch the current price for this ticker
//       const price = currentPriceData[ticker]?.USD;

//       if (price) {
//         // Check if the combination of ticker and untitled_id already exists
//         const checkExistsQuery = `
//           SELECT COUNT(*) AS count 
//           FROM current_price 
//           WHERE ticker = ? AND untitled_id = ?
//         `;
//         const [checkExistsResult] = await connection.query(checkExistsQuery, [
//           ticker,
//           untitledId,
//         ]);

//         if (checkExistsResult[0].count > 0) {
//           // Update existing record
//           const updateQuery = `
//             UPDATE current_price 
//             SET current_price = ?
//             WHERE ticker = ? AND untitled_id = ?
//           `;
//           await connection.query(updateQuery, [
//             price,
//             ticker,
//             untitledId,
//           ]);
//         } else {
//           // Insert new record
//           const insertQuery = `
//             INSERT INTO current_price (ticker, current_price, sale_target_id, untitled_id) 
//             VALUES (?, ?, ?, ?)
//           `;
//           await connection.query(insertQuery, [
//             ticker,
//             price,
//             sale_target_id,
//             untitledId
//           ]);
//         }
//       } 
//     }

//     // Commit the transaction
//     await connection.commit();

//     // Respond with success message
//     res.status(200).json({
//       status: 200,
//       message: `All sale_target_id entries with their untitled_id have been successfully added/updated in the current_price table.`,
//     });
//   } catch (error) {
//     if (connection) await connection.rollback();
//     return error500(error, res);
//   } finally {
//     if (connection) connection.release();
//   }
// };
const addCurrentPrice = async (req, res) => {
  const untitledId = req.companyData.untitled_id; 
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Fetch all sale_target_id, ticker, and untitled_id from sale_target_header
    const saleTargetQuery = `
      SELECT sale_target_id, ticker
      FROM sale_target_header 
      WHERE status = 1
    `;
    const saleTargetResult = await connection.query(saleTargetQuery);

    if (!saleTargetResult[0].length) {
      throw new Error("No tickers found with status = 1 in the database.");
    }

    const saleTargetData = saleTargetResult[0];

    // Construct ticker list for API call
    const tickers = Array.from(new Set(saleTargetData.map((element) => element.ticker))).join(",");

    // Fetch API settings
    const apiSettingsQuery = `SELECT url, ticker, currency_name FROM api_settings`;
    const apiSettingsResult = await connection.query(apiSettingsQuery);

    const apiUrl = apiSettingsResult[0].map(
      (row) => `${row.url}${tickers}${row.currency_name}`
    )[0]; // Assuming the first URL is valid

    // Fetch current price data from the API
    const currentPriceResponse = await axios.get(apiUrl);
    const currentPriceData = currentPriceResponse.data;

    // Iterate over all sale_target_data
    for (const saleTarget of saleTargetData) {
      const { sale_target_id, ticker } = saleTarget;

      // Fetch the current price for this ticker
      const price = currentPriceData[ticker]?.USD;

      if (price) {
        // Fetch supply data for FDV calculation
        const responses = await axios.get(
          `https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms=${ticker}&tsym=USD`
        );

        const supply = responses.data.Data[0]?.ConversionInfo?.Supply || 0;
        const fdv_ratio = (price / supply); // No rounding/truncation, use as is
        // Check if the combination of ticker and untitled_id already exists
        const checkExistsQuery = `
          SELECT COUNT(*) AS count 
          FROM current_price 
          WHERE ticker = ? AND untitled_id = ?
        `;
        const [checkExistsResult] = await connection.query(checkExistsQuery, [
          ticker,
          untitledId,
        ]);

        if (checkExistsResult[0].count > 0) {
          // Update existing record with current_price and fdv_ratio
          const updateQuery = `
            UPDATE current_price 
            SET current_price = ?, fdv_ratio = ? 
            WHERE ticker = ? AND untitled_id = ?
          `;
          await connection.query(updateQuery, [
            price,
            fdv_ratio, // Store FDV ratio as it is
            ticker,
            untitledId,
          ]);
        } else {
          // Insert new record with current_price and fdv_ratio
          const insertQuery = `
            INSERT INTO current_price (ticker, current_price, fdv_ratio, sale_target_id, untitled_id) 
            VALUES (?, ?, ?, ?, ?)
          `;
          await connection.query(insertQuery, [
            ticker,
            price,
            fdv_ratio, // Store FDV ratio as it is
            sale_target_id,
            untitledId
          ]);
        }
      } 
    }

    // Commit the transaction
    await connection.commit();

    // Respond with success message
    res.status(200).json({
      status: 200,
      message: `All sale_target_id entries with their untitled_id have been successfully added/updated in the current_price table with fdv_ratio.`,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};






//current price list
const getCurrentprice = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  // Attempt to obtain a database connection
  let connection = await getConnection();
  try {
    await connection.beginTransaction();

    let getCurrentpriceQuery = `SELECT * FROM current_price WHERE untitled_id = ${untitledId} AND status = 1`;

    const result = await connection.query(getCurrentpriceQuery);
    const currentPrice = result[0];

    const data = {
      status: 200,
      message: "Current Price retrieved successfully",
      data: currentPrice,
    };

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  addCurrentPrice,
  getCurrentprice,
};
