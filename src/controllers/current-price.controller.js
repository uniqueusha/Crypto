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

const addCurrentPrice = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  let connection;

  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Fetch all sale_target_id, ticker, base_price, and available_coins
    let saleTargetQuery = `
      SELECT sale_target_id, ticker, base_price, available_coins 
      FROM sale_target_header 
      WHERE untitled_id = ${untitledId} AND status = 1
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
      const { sale_target_id, ticker, base_price, available_coins } = saleTarget;

      // Fetch the current price for this ticker
      const price = currentPriceData[ticker]?.USD;

      if (price) {
        // Calculate current_return_x (current_price / base_price)
        const current_return_x = base_price > 0 ? price / base_price : 0;

        // // Fetch supply data for FDV calculation
        // const responses = await axios.get(
        //   `https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms=${ticker}&tsym=USD`
        // );

        // const supply = responses.data.Data[0]?.ConversionInfo?.Supply || 0;
        // const fdv_ratio = price / supply;

const mktResponse = await axios.get(
  `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD`
);

// market cap
let mktcap = null;
let fdv_ratio = null;
if (mktResponse.data && mktResponse.data.Data) {
  //ticker
  const coinData = mktResponse.data.Data.find(
      (coin) => coin.CoinInfo.Name === ticker
  );

  if (coinData && coinData.RAW && coinData.RAW.USD) {
                fdv_ratio  = coinData.RAW.USD.CIRCULATINGSUPPLY / coinData.RAW.USD.SUPPLY;
                mktcap = fdv_ratio * coinData.RAW.USD.MKTCAP;
      // console.log(`Market Cap of ${ticker}: $${mktcap}`);
  } else {
      // console.log(`Market Cap data for ${ticker} is not available.`);
  }
} 
        // Calculate current_value = current_price * available_coins
        const current_value = price * available_coins;

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
          // Update existing record with current_price, fdv_ratio, current_return_x, and current_value
          const updateQuery = `
            UPDATE current_price 
            SET current_price = ?, current_return_x = ?, fdv_ratio = ?, market_cap = ?, current_value = ? 
            WHERE ticker = ? AND untitled_id = ?
          `;
          await connection.query(updateQuery, [
            price,
            current_return_x,
            fdv_ratio,
            mktcap,
            current_value,
            ticker,
            untitledId,
          ]);
        } else {
          // Insert new record with current_price, fdv_ratio, current_return_x, and current_value
          const insertQuery = `
            INSERT INTO current_price (ticker, current_price, current_return_x, fdv_ratio, market_cap, current_value, sale_target_id, untitled_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await connection.query(insertQuery, [
            ticker,
            price,
            current_return_x,
            fdv_ratio,
            mktcap,
            current_value,
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
      message: `All current price  added/updated successfully .`,
    });
  } catch (error) {
    console.log(error);
    
    if (connection) await connection.rollback();
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

const getCurrentprice = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Updated totalCurrentValue query
    const getTotalCurrentValueQuery = `
      SELECT (
        COALESCE(
          (SELECT SUM(current_value) 
           FROM current_price 
           WHERE untitled_id = ? AND status = 1),
          0
        ) 
        + 
        COALESCE(
          (SELECT SUM(sh.current_value)
           FROM sale_target_header sh
           WHERE NOT EXISTS (
             SELECT 1 
             FROM current_price c 
             WHERE c.ticker = sh.ticker
           ) 
           AND sh.untitled_id = ? AND sh.status = 1),
          0
        )
      ) AS totalCurrentValue
    `;

    const [totalValueResult] = await connection.query(
      getTotalCurrentValueQuery,
      [untitledId, untitledId]
    );

    // Fetch all columns
    const getCurrentPriceDetailsQuery = `
      SELECT * 
      FROM current_price  
      WHERE untitled_id = ? AND status = 1
    `;
    const [priceDetails] = await connection.query(getCurrentPriceDetailsQuery, [
      untitledId,
    ]);

    const totalCurrentValue = totalValueResult[0]?.totalCurrentValue || 0;

    // Prepare response data
    const data = {
      status: 200,
      message: "Current Price Retrieved Successfully",
      totalCurrentValue,
      data: priceDetails,
    };

    // Commit the transaction
    await connection.commit();

    return res.status(200).json(data);
  } catch (error) {
    if (connection) await connection.rollback();
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};







module.exports = {
  addCurrentPrice,
  getCurrentprice,
};
