const pool = require("../../db");
const axios = require("axios");
const xlsx = require("xlsx");
const fs = require("fs");
const { log } = require("console");

// Function to obtain a database connection
const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    throw new Error("Failed to obtain database connection: " + error.message);
  }
};

//error 422 handler
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message,
  });
};
//error 500 handler
error500 = (error, res) => {
  console.log(error);
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    error: error,
  });
};

//Add Set target
const addSaleTargetHeader1 = async (req, res) => {
  const ticker = req.body.ticker ? req.body.ticker : "";
  const coin = req.body.coin ? req.body.coin : "";
  const base_price = req.body.base_price ? req.body.base_price : "";
  const currant_price = req.body.currant_price ? req.body.currant_price : "";
  const current_value = req.body.current_value ? req.body.current_value : "";
  const current_return_x = req.body.current_return_x
    ? req.body.current_return_x
    : "";
  const market_cap = req.body.market_cap ? req.body.market_cap : "";
  const return_x = req.body.return_x ? req.body.return_x : "";
  const final_sale_price = req.body.final_sale_price
    ? req.body.final_sale_price
    : "";
  const available_coins = req.body.available_coins
    ? req.body.available_coins
    : "";
  const timeframe = req.body.timeframe ? req.body.timeframe : "";
  const fdv_ratio = req.body.fdv_ratio ? req.body.fdv_ratio : "";
  const setTargetFooter = req.body.setTargetFooter
    ? req.body.setTargetFooter
    : [];
  const untitled_id = req.companyData.untitled_id;
  if (!coin) {
    return error422("Coin is required.", res);
  } else if (!base_price) {
    return error422("Base Price is required.", res);
  } else if (!return_x) {
    return error422("Return_x is required.", res);
  } else if (!available_coins) {
    return error422("Available Coins is required.", res);
  }
  let connection = await getConnection();
  try {
    //check Coin already is exists or not
    const isExistCoinQuery = `SELECT * FROM sale_target_header WHERE LOWER(TRIM(coin))= ? AND untitled_id = ? AND status = 1`;
    const isExistCoinResult = await pool.query(isExistCoinQuery, [
      coin.toLowerCase(),
      untitled_id,
    ]);
    if (isExistCoinResult[0].length > 0) {
      return error422(" Coin is already exists.", res);
    }

    //Start the transaction
    await connection.beginTransaction();
    // let final_sale_price = base_price * return_x;

    const insertSaleTargetHeaderQuery =
      "INSERT INTO sale_target_header ( ticker, coin, base_price, currant_price, current_value ,current_return_x, market_cap, return_x, final_sale_price, available_coins, timeframe, fdv_ratio, untitled_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const insertSaleTargetHeaderValue = [
      ticker,
      coin,
      base_price,
      currant_price,
      current_value,
      current_return_x,
      market_cap,
      return_x,
      final_sale_price,
      available_coins,
      timeframe,
      fdv_ratio,
      untitled_id,
    ];
    const insertSaleTargetHeaderResult = await connection.query(
      insertSaleTargetHeaderQuery,
      insertSaleTargetHeaderValue
    );
    const sale_target_id = insertSaleTargetHeaderResult[0].insertId;

    //insert into set target footer
    let setTargetFooterArray = setTargetFooter.reverse();
    let sale_target = final_sale_price;
    for (let i = 0; i < setTargetFooterArray.length; i++) {
      const element = setTargetFooterArray[i];
      if (!element || typeof element !== "object") {
        continue;
      }

      sale_target = sale_target - (sale_target - base_price) / 4;

      if (i == 0) {
        sale_target = final_sale_price;
      }

      const sale_target_value = element.sale_target_value
        ? element.sale_target_value
        : "0";
      const sale_target_percent = element.sale_target_percent
        ? element.sale_target_percent
        : "";

      const targetValue = (available_coins / 100) * sale_target_value;

      let insertSetTargetFooterQuery =
        "INSERT INTO set_target_footer (sale_target_id, sale_target_coin, sale_target, sale_target_value, sale_target_percent, untitled_id) VALUES (?,?,?,?,?,?)";
      let insertSetTargetFootervalues = [
        sale_target_id,
        targetValue,
        sale_target,
        sale_target_value,
        sale_target_percent,
        untitled_id,
      ];
      let insertSetTargetFooterResult = await connection.query(
        insertSetTargetFooterQuery,
        insertSetTargetFootervalues
      );
    }
    //commit the transation
    await connection.commit();
    res.status(200).json({
      status: 200,
      message: "Set Target Added successfully",
    });
  } catch (error) {
    return error500(error, res);
  } finally {
    await connection.release();
  }
};
const addSaleTargetHeader = async (req, res) => {
  const ticker = req.body.ticker || "";
  const coin = req.body.coin || "";
  const exchange = req.body.exchange || "";
  const base_price = req.body.base_price || 0;
  const currant_price = req.body.currant_price || 0;
  const current_value = req.body.current_value || 0;
  const current_return_x = req.body.current_return_x || 0;
  const market_cap = req.body.market_cap || "";
  const return_x = req.body.return_x || 0;
  const final_sale_price = req.body.final_sale_price || 0;
  const available_coins = req.body.available_coins?.toString() || "0";
  const timeframe = req.body.timeframe || "";
  const fdv_ratio = req.body.fdv_ratio || "";
  const narrative = req.body.narrative || "";
  const setTargetFooter = Array.isArray(req.body.setTargetFooter) ? req.body.setTargetFooter : [];
  const untitled_id = req.companyData.untitled_id;

  if (!coin) {
    return error422("Coin is required.", res);
  } else if (!base_price) {
    return error422("Base Price is required.", res);
  } else if (!return_x) {
    return error422("Return_x is required.", res);
  } else if (!available_coins) {
    return error422("Available Coins is required.", res);
  }

  let connection = await getConnection();

  try {
    await connection.beginTransaction();

    const insertSaleTargetHeaderQuery = `
      INSERT INTO sale_target_header (
          ticker, coin, exchange, base_price, currant_price, current_value, current_return_x,
          market_cap, return_x, final_sale_price, available_coins, total_available_coins, timeframe, fdv_ratio, narrative, untitled_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const insertSaleTargetHeaderValues = [
      ticker,
      coin,
      exchange,
      base_price,
      currant_price,
      current_value,
      current_return_x,
      market_cap,
      return_x,
      final_sale_price,
      available_coins, 
      available_coins, 
      timeframe,
      fdv_ratio,
      narrative,
      untitled_id,
    ];

    const [insertSaleTargetHeaderResult] = await connection.query(
      insertSaleTargetHeaderQuery,
      insertSaleTargetHeaderValues
    );
    const sale_target_id = insertSaleTargetHeaderResult.insertId;

    // Insert into set_target_footer
    let setTargetFooterArray = setTargetFooter.reverse();
    let sale_target = final_sale_price;

    for (let i = 0; i < setTargetFooterArray.length; i++) {
      const element = setTargetFooterArray[i];
      if (!element || typeof element !== "object") continue;

      sale_target = sale_target - (sale_target - base_price) / 4;
      if (i === 0) {
        sale_target = final_sale_price;
      }

      const sale_target_value = element.sale_target_value?.toString() || "0";
      const sale_target_percent = element.sale_target_percent?.toString() || "0";
      const targetValue = ((parseFloat(available_coins) / 100) * parseFloat(sale_target_value)).toString();

      const insertSetTargetFooterQuery = `
        INSERT INTO set_target_footer (
            sale_target_id, sale_target_coin, sale_target, sale_target_value, sale_target_percent, untitled_id
        ) VALUES (?, ?, ?, ?, ?, ?)`;

      const insertSetTargetFooterValues = [
        sale_target_id,
        targetValue,
        sale_target,
        sale_target_value,
        sale_target_percent,
        untitled_id,
      ];
      await connection.query(insertSetTargetFooterQuery, insertSetTargetFooterValues);
    }

    await connection.commit();

    res.status(200).json({
      status: 200,
      message: "Set Target Added successfully",
    });
  } catch (error) {
    await connection.rollback();
    return error500(error, res);
  } finally {
    await connection.release();
  }
};



//coin and exchange already exist
// const addCoinExchange = async (req, res) => {
//     const coin = req.body.coin || '';
//     const exchange = req.body.exchange || '';
//     const untitled_id = req.companyData.untitled_id;

//     if (!coin) {
//         return error422("Coin is required.", res);
//     }

//     let connection = await getConnection();

//     try {
//         // Check if the coin already exists
//         const isExistCoinQuery = ` SELECT coin FROM sale_target_header WHERE LOWER(TRIM(coin)) = ? AND untitled_id = ? AND status = 1 LIMIT 1`;
//         const isExistCoinResult = await connection.query(isExistCoinQuery, [coin.toLowerCase(), untitled_id]);
//         const coinResult = isExistCoinResult;
//         console.log(coinResult);

//         // Check if the exchange already exists
//         const isExistExchangeQuery = `SELECT exchange FROM sale_target_header WHERE exchange = ? AND untitled_id = ? AND status = 1 LIMIT 1`;
//         const isExistExchangeResult = await connection.query(isExistExchangeQuery, [untitled_id, exchange]);
//         const exchnageResult = isExistExchangeResult[0];
//         console.log(exchnageResult);

//         // Check if both exist
//         if (coinResult.length > 0 && exchnageResult.length > 0) {
//             return error422("Coin And Exchange already exist.", res);
//         }

//         // Perform further actions
//         await connection.commit();
//         res.status(200).json({
//             status: 200,
//             message: "successfully",
//         });
//     } catch (error) {
//         console.log(error);

//         return error500(error, res);
//     } finally {
//         await connection.release();
//     }
// };

// const addCoinExchange = async (req, res) => {
//     const coin = req.body.coin || '';
//     const exchange = req.body.exchange || '';
//     const untitled_id = req.companyData.untitled_id;

//     if (!coin) {
//         return error422("Coin is required.", res);
//     }

//     let connection = await getConnection();

//     try {

// const isExistCoinQuery = `SELECT * FROM sale_target_header WHERE LOWER(TRIM(coin)) = ? AND untitled_id = ? AND status = 1 AND LOWER(TRIM(exchange)) = ?`;
// const coinResult = await connection.query(isExistCoinQuery, [coin.toLowerCase(), untitled_id, exchange.toLowerCase()]);

// const existingCoin = coinResult[0].coin; // ✅ Renamed variable to 'existingCoin'
// console.log(existingCoin);

//         // const existingExchange = coinResult[0].exchange;
//         // console.log(existingExchange);

//         // Check if both exist
//         if (existingCoin.length > 0 == existingExchange.length > 0) {
//             return error422("Coin and Exchange already exist.", res);
//         }

//         // Perform further actions
//         await connection.commit();
//         res.status(200).json({
//             status: 200,
//             message: "Successfully added.",
//         });
//     } catch (error) {
//         console.log(error);
//         return error500(error, res);
//     } finally {
//         await connection.release();
//     }
// };

const checkCoinExchange = async (req, res) => {
  const coin = req.body.coin || "";
  const exchange = req.body.exchange || "";
  const sale_target_id = req.body.sale_target_id;
  const untitled_id = req.companyData.untitled_id;

  if (!coin) {
    return error422("Coin is required.", res);
  }

  let connection = await getConnection();

  try {
    let isExistCoinQuery = `SELECT * FROM sale_target_header WHERE LOWER(TRIM(coin)) = ? AND untitled_id = ? AND status = 1 AND LOWER(TRIM(exchange)) = ? `;
    if (sale_target_id) {
      isExistCoinQuery += ` AND sale_target_id != ${sale_target_id}`;
    }
    const [coinResult] = await connection.query(isExistCoinQuery, [
      coin.toLowerCase(),
      untitled_id,
      exchange.toLowerCase(),
    ]);

    const existingCoin = coinResult[0]?.coin || "";
    const existingExchange = coinResult[0]?.exchange || "";

    if (existingCoin.length > 0 && existingExchange.length > 0) {
      return error422("Coin and Exchange already exist.", res);
    }

    await connection.commit();
    res.status(200).json({
      status: 200,
    });
  } catch (error) {
    return error500(error, res);
  } finally {
    await connection.release();
  }
};

//create current price
// const createCurrentPrice = async (req, res) => {
//     const ticker = req.body.ticker ? req.body.ticker : '';
//     if (!ticker) {
//         return error422("Ticker  is required.", res);
//     }
//     let connection = await getConnection();
//     try {

//         //Start the transaction
//         await connection.beginTransaction();
//         // let final_sale_price = base_price * return_x;
//         if (!ticker) {
//             const insertTickerQuery = `INSERT INTO api_settings ( ticker ) VALUES (?)`;
//             const insertTickerResult = await connection.query(insertTickerQuery, [tricker]);
//         } else {
//             const updateTickerQuery = `UPDATE api_settings SET ticker = ? WHERE id = 1`;
//             const updateTickerResult = await connection.query(updateTickerQuery, [ticker]);
//         }
//         const query = 'SELECT url, ticker, currency_name FROM api_settings';
//         const result = await connection.query(query);
//         // Loop through the results and concatenate the fields
//         const fullUrls = result[0].map(row => `${row.url}${row.ticker}${row.currency_name}`);
//         const currentPriceUrl = await axios.get(fullUrls);
//         const cryptoSymbol = ticker;
//         const price = currentPriceUrl.data[cryptoSymbol].USD;

//         //commit the transation
//         await connection.commit();
//         res.status(200).json({
//             status: 200,
//             message: "Fetch Current Price successfully",
//             data: {
//                 currentPrice: price
//             }
//         });
//     } catch (error) {
//         return error500(error, res);
//     } finally {
//         if (connection) connection.release();
//     }
// };

const createCurrentPrice = async (req, res) => {
  const ticker = req.body.ticker ? req.body.ticker : "";
  if (!ticker) {
    return error422("Ticker is required.", res);
  }

  let connection;
  try {
    connection = await getConnection();

    // Start the transaction
    await connection.beginTransaction();

    // Check if ticker exists in api_settings, otherwise insert it
    const existingTickerQuery = `SELECT COUNT(*) AS count FROM api_settings WHERE id = 1`;
    const [existingResult] = await connection.query(existingTickerQuery);
    if (existingResult[0].count === 0) {
      const insertTickerQuery = `INSERT INTO api_settings (ticker) VALUES (?)`;
      await connection.query(insertTickerQuery, [ticker]);
    } else {
      const updateTickerQuery = `UPDATE api_settings SET ticker = ? WHERE id = 1`;
      await connection.query(updateTickerQuery, [ticker]);
    }

    // Fetch URL details from `api_settings`
    const query =
      "SELECT url, ticker, currency_name FROM api_settings WHERE ticker = ?";
    const [result] = await connection.query(query, [ticker]);

    if (result.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No API settings found for the given ticker.",
      });
    }

    // Construct the full URL to fetch the price
    const { url, ticker: fetchedTicker, currency_name } = result[0];
    const fullUrl = `${url}${fetchedTicker}${currency_name}`;

    // Fetch current price from the API
    const response = await axios.get(fullUrl);
    const priceRaw = response.data?.[ticker]?.USD;

    // Handle scientific notation (e.g., 5.1e-8, 5e-10) conversion and regular numbers
    let price = priceRaw;

    // If the price is in scientific notation (e.g., "5e-8"), convert it to decimal format
    if (/e/.test(priceRaw)) {
      price = parseFloat(priceRaw).toFixed(10); // Convert scientific notation to a readable decimal with 10 digits
    } else {
      price = priceRaw.toString(); // If not in scientific notation, keep as-is
    }

    // // FDV
    // const responses = await axios.get(
    //     `https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms=${ticker}&tsym=USD`
    // )

    // let supply = responses.data.Data[0].ConversionInfo.Supply;
    // let FDV = (price/supply).toFixed(10);

    const mktResponse = await axios.get(
      `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD`
    );

    // market cap
    let mktcap = null;
    let FDV = null;
    if (mktResponse.data && mktResponse.data.Data) {
      //ticker
      const coinData = mktResponse.data.Data.find(
        (coin) => coin.CoinInfo.Name === ticker
      );

      if (coinData && coinData.RAW && coinData.RAW.USD) {
        FDV = coinData.RAW.USD.CIRCULATINGSUPPLY / coinData.RAW.USD.SUPPLY;
        mktcap = FDV * coinData.RAW.USD.MKTCAP;
        // console.log(`Market Cap of ${ticker}: $${mktcap}`);
      } else {
        // console.log(`Market Cap data for ${ticker} is not available.`);
      }
    }

    // Commit the transaction
    await connection.commit();

    // Respond with the fetched and formatted price
    res.status(200).json({
      status: 200,
      message: "Fetch Current Price successfully",
      data: { currentPrice: price, FDV, mktcap },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

//Currant Price Update Target Complition Status (cron job)
const currantPriceUpdateTargetComplitionStatus = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  let connection = await getConnection();
  try {
    //Start the transaction
    await connection.beginTransaction();

    let getSetTargetQuery = `SELECT sh.*, cp.current_price AS UpdatedCurrentPrice 
        FROM sale_target_header sh 
        LEFT JOIN current_price cp
        ON cp.sale_target_id = sh.sale_target_id
        WHERE sh.untitled_id = ${untitledId} AND sh.status = 1`;
    let result = await connection.query(getSetTargetQuery);
    let setTarget = result[0];

    //get set_header_footer
    for (let i = 0; i < setTarget.length; i++) {
      const element = setTarget[i];

      let setFooterQuery = `SELECT stf.*,ts.target_status, cs.complition_status FROM set_target_footer stf 
            LEFT JOIN target_status ts
            ON ts.target_id = stf.target_id
            LEFT JOIN complition_status cs
            ON cs.complition_id = stf.complition_id 
            WHERE stf.sale_target_id = ${element.sale_target_id} AND
            stf. untitled_id = ${untitledId}`;
      setFooterResult = await connection.query(setFooterQuery);
      setTarget[i]["footer"] = setFooterResult[0].reverse();
    }
    for (let index = 0; index < setTarget.length; index++) {
      const element = setTarget[index];
      const currentPrice = setTarget[index].currant_price;

      const current_price = setTarget[index].UpdatedCurrentPrice;

      for (let index = 0; index < element.footer.length; index++) {
        const elements = element.footer[index];
        const sale_target = parseFloat(elements.sale_target);
        const complition_id = parseFloat(elements.complition_id);
        const sale_target_id = parseFloat(elements.sale_target_id);
        if (complition_id === 4) {
          continue;
        }
        // Check if currentPrice is less than saleTarget
        if (current_price > sale_target) {
          const updateStatusQuery =
            "UPDATE set_target_footer SET target_id = 2, complition_id = 3 WHERE untitled_id = ? AND sale_target_id = ? AND sale_target = ?";
          const updateStatusResult = await connection.query(updateStatusQuery, [
            untitledId,
            sale_target_id,
            sale_target,
          ]);
        } else if (currentPrice > sale_target) {
          const updateStatusQuery =
            "UPDATE set_target_footer SET target_id = 2, complition_id = 3 WHERE untitled_id = ? AND sale_target_id = ? AND sale_target = ?";
          const updateStatusResult = await connection.query(updateStatusQuery, [
            untitledId,
            sale_target_id,
            sale_target,
          ]);
        } else {
          const updateStatusQuery =
            "UPDATE set_target_footer SET target_id = 1, complition_id = 2 WHERE untitled_id = ? AND sale_target_id = ? AND sale_target = ?";
          const updateStatusResult = await connection.query(updateStatusQuery, [
            untitledId,
            sale_target_id,
            sale_target,
          ]);
        }
      }
    }

    //commit the transation
    await connection.commit();
    res.status(200).json({
      status: 200,
      message: "Target Status Update successfully",
    });
  } catch (error) {
    return error500(error, res);
  } finally {
    await connection.release();
  }
};

//Get Set Target List untitled
const getSetTargets = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  const { page, perPage, key } = req.query;

  // Attempt to obtain a database connection
  let connection = await getConnection();
  try {
    // Start the transaction
    await connection.beginTransaction();

    let getSetTargetQuery = `SELECT * FROM sale_target_header WHERE untitled_id = ${untitledId} AND status = 1`;
    let countQuery = `SELECT COUNT(*) AS total FROM sale_target_header WHERE untitled_id = ${untitledId} AND status = 1`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getSetTargetQuery += ` AND status = 1`;
        countQuery += ` AND status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getSetTargetQuery += ` AND status = 0`;
        countQuery += ` AND status = 0`;
      } else {
        getSetTargetQuery += ` AND LOWER(coin) LIKE '%${lowercaseKey}%'`;
        countQuery += ` AND LOWER(coin) LIKE '%${lowercaseKey}%'`;
      }
    }
    getSetTargetQuery += " ORDER BY market_cap DESC";
    let result = await connection.query(getSetTargetQuery);
    let setTarget = result[0];

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await connection.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getSetTargetQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    // Get set_header_footer
    for (let i = 0; i < setTarget.length; i++) {
      const element = setTarget[i];

      // Query to fetch data from current_price table if available
      let currentPriceQuery = `SELECT * FROM current_price WHERE sale_target_id = ${element.sale_target_id}`;
      let currentPriceResult = await connection.query(currentPriceQuery);
      let currentPriceData = currentPriceResult[0][0]; // First result

      if (currentPriceData) {
        // If data exists in current_price, use that and exclude sale_target_header data
        setTarget[i].update_current_price = currentPriceData.current_price;
        setTarget[i].market_cap = currentPriceData.market_cap;
        setTarget[i].current_value = currentPriceData.current_value;
        setTarget[i].fdv_ratio = currentPriceData.fdv_ratio;
        setTarget[i].current_return_x = currentPriceData.current_return_x;
      } else {
        // If no data found in current_price, use sale_target_header values
        setTarget[i].current_price = element.current_price;
        setTarget[i].market_cap = element.market_cap;
        setTarget[i].current_value = element.current_value;
        setTarget[i].fdv_ratio = element.fdv_ratio;
        setTarget[i].current_return_x = element.current_return_x;
      }

      // Fetch footer data
      let setFooterQuery = `SELECT stf.*, ts.target_status, cs.complition_status FROM set_target_footer stf
                LEFT JOIN target_status ts ON ts.target_id = stf.target_id
                LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id
                WHERE stf.sale_target_id = ${element.sale_target_id} AND stf.untitled_id = ${untitledId}`;
      let setFooterResult = await connection.query(setFooterQuery);
      setTarget[i]["footer"] = setFooterResult[0].reverse();
    }

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

    // Get total current value
    let totalCurrentValueResult = await connection.query(
      getTotalCurrentValueQuery,
      [untitledId, untitledId]
    );
    let totalCurrentValue = totalCurrentValueResult[0][0].totalCurrentValue;

    const data = {
      status: 200,
      message: "Set Target retrieved successfully",
      data: setTarget,
      totalCurrentValue: totalCurrentValue, // Add total current value to the response
    };

    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      };
    }

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

// Set Target Download
// const getSetTargetDownload = async (req, res) => {
//   const untitledId = req.companyData.untitled_id;
//   const { key } = req.query;

//   if (!untitledId) {
//     return res.status(400).send("Invalid untitledId.");
//   }

//   let connection = await getConnection();
//   try {
//     await connection.beginTransaction();

//     let getSetTargetQuery = `
//             SELECT sth.sale_target_id, sth.sale_date AS target_date, sth.coin AS coins, sth.exchange, sth.base_price,
//                    COALESCE(cp.current_price, sth.currant_price) AS currant_price,
//                    COALESCE(cp.market_cap, sth.market_cap) AS market_cap,
//                    sth.return_x AS target_return_x,
//                    COALESCE(cp.current_return_x, sth.current_return_x) AS current_return_x,
//                    COALESCE(cp.current_value, sth.current_value) AS current_value,
//                    sth.final_sale_price,
//                    sth.available_coins AS total_coins,
//                    sth.total_available_coins,
//                    sth.timeframe AS major_unlock_date,
//                    COALESCE(cp.fdv_ratio, sth.fdv_ratio) AS fdv,
//                    sth.narrative
//             FROM sale_target_header sth
//             LEFT JOIN current_price cp ON sth.sale_target_id = cp.sale_target_id
//             WHERE sth.untitled_id = ${untitledId} AND sth.status = 1
//         `;

//     if (key) {
//       const lowercaseKey = key.toLowerCase().trim();
//       if (lowercaseKey === "activated") {
//         getSetTargetQuery += ` AND sth.status = 1`;
//       } else if (lowercaseKey === "deactivated") {
//         getSetTargetQuery += ` AND sth.status = 0`;
//       } else {
//         getSetTargetQuery += ` AND LOWER(sth.coin) LIKE '%${lowercaseKey}%'`;
//       }
//     }

//     getSetTargetQuery +=
//       " ORDER BY COALESCE(cp.market_cap, sth.market_cap) DESC";

//     let [setTarget] = await connection.query(getSetTargetQuery);

//     if (setTarget.length === 0) {
//       return error422("No data found.", res);
//     }

//     const saleTargetIds = setTarget.map((item) => item.sale_target_id);
//     let setFooterResult = [];

//     if (saleTargetIds.length > 0) {
//       let setFooterQuery = `
//                 SELECT
//                     stf.sale_target_id,
//                     stf.sale_target_coin,
//                     stf.sale_target,
//                     ts.target_status,
//                     cs.complition_status,
//                     stf.sale_target_percent
//                 FROM set_target_footer stf
//                 LEFT JOIN target_status ts ON ts.target_id = stf.target_id
//                 LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id
//                 WHERE stf.untitled_id = ? AND stf.sale_target_id IN (${saleTargetIds.join(
//                   ","
//                 )})
//                 ORDER BY stf.sale_target_id ASC
//             `;

//       [setFooterResult] = await connection.query(setFooterQuery, [untitledId]);
//     }

//     let footerMap = {};
//     setFooterResult.forEach((footer) => {
//       if (!footerMap[footer.sale_target_id]) {
//         footerMap[footer.sale_target_id] = [];
//       }
//       footerMap[footer.sale_target_id].push({
//         sale_target_coin: footer.sale_target_coin,
//         sale_target: footer.sale_target,
//         target_status: footer.target_status,
//         complition_status: footer.complition_status,
//         footer_percent: footer.sale_target_percent,
//       });
//     });

//     let flattenedData = [];
//     setTarget.forEach((target) => {
//       let footers = footerMap[target.sale_target_id] || [];

//       if (footers.length === 0) {
//         flattenedData.push({
//           target_date: target.target_date,
//           coin: target.coins,
//           exchange: target.exchange,
//           base_price: target.base_price,
//           currant_price: target.currant_price,
//           market_cap: target.market_cap,
//           target_return_x: target.target_return_x,
//           current_return_x: target.current_return_x,
//           current_value: target.current_value,
//           final_sale_price: target.final_sale_price,
//           total_coins: target.total_coins,
//           available_coins: target.total_available_coins,
//           major_unlock_date: target.major_unlock_date,
//           fdv: target.fdv,
//           narrative: target.narrative,
//           sale_target: null,
//           sale_target_coin: null,
//           target_status: null,
//           complition_status: null,
//           footer_percent: null,
//         });
//       } else {
//         footers.forEach((footer) => {
//           flattenedData.push({
//             target_date: target.target_date,
//             coin: target.coins,
//             exchange: target.exchange,
//             base_price: target.base_price,
//             currant_price: target.currant_price,
//             market_cap: target.market_cap,
//             target_return_x: target.target_return_x,
//             current_return_x: target.current_return_x,
//             current_value: target.current_value,
//             final_sale_price: target.final_sale_price,
//             total_coins: target.total_coins,
//             available_coins: target.total_available_coins,
//             major_unlock_date: target.major_unlock_date,
//             fdv: target.fdv,
//             narrative: target.narrative,
//             sale_target: footer.sale_target,
//             sale_target_coin: footer.sale_target_coin,
//             target_status: footer.target_status,
//             complition_status: footer.complition_status,
//             footer_percent: footer.footer_percent,
//           });
//         });
//       }
//     });

//     const workbook = xlsx.utils.book_new();
//     const worksheet = xlsx.utils.json_to_sheet(flattenedData);
//     xlsx.utils.book_append_sheet(workbook, worksheet, "SetTargetInfo");

//     const excelFileName = `exported_data_${Date.now()}.xlsx`;
//     xlsx.writeFile(workbook, excelFileName);

//     res.download(excelFileName, (err) => {
//       if (err) {
//         console.error(err);
//         res.status(500).send("Error downloading the file.");
//       } else {
//         fs.unlinkSync(excelFileName);
//       }
//     });

//     await connection.commit();
//   } catch (error) {
//     await connection.rollback();
//     return error500(error, res);
//   } finally {
//     if (connection) connection.release();
//   }
// };
const getSetTargetDownload = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  const { key } = req.query;

  if (!untitledId) {
    return res.status(400).send("Invalid untitledId.");
  }

  let connection = await getConnection();
  try {
    await connection.beginTransaction();

    let getSetTargetQuery = `
              SELECT sth.sale_target_id, sth.sale_date AS target_date, sth.coin AS coins, sth.ticker, sth.exchange, sth.base_price,  
                     COALESCE(cp.current_price, sth.currant_price) AS currant_price,
                     COALESCE(cp.market_cap, sth.market_cap) AS market_cap,
                     sth.return_x AS target_return_x,
                     COALESCE(cp.current_return_x, sth.current_return_x) AS current_return_x,
                     COALESCE(cp.current_value, sth.current_value) AS current_value,
                     sth.final_sale_price,
                     sth.available_coins AS total_coins,
                     sth.total_available_coins,
                     sth.timeframe AS major_unlock_date,
                     COALESCE(cp.fdv_ratio, sth.fdv_ratio) AS fdv,
                     sth.narrative
              FROM sale_target_header sth
              LEFT JOIN current_price cp ON sth.sale_target_id = cp.sale_target_id
              WHERE sth.untitled_id = ${untitledId} AND sth.status = 1 
          `;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getSetTargetQuery += ` AND sth.status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getSetTargetQuery += ` AND sth.status = 0`;
      } else {
        getSetTargetQuery += ` AND LOWER(sth.coin) LIKE '%${lowercaseKey}%'`;
      }
    }

    getSetTargetQuery += " ORDER BY sth.market_cap DESC";

    let [setTarget] = await connection.query(getSetTargetQuery);

    if (setTarget.length === 0) {
      return error422("No data found.", res);
    }

    const saleTargetIds = setTarget.map((item) => item.sale_target_id);
    let setFooterResult = [];

    if (saleTargetIds.length > 0) {
      let setFooterQuery = `
                  SELECT 
                      stf.sale_target_id, 
                      stf.sale_target_coin, 
                      stf.sale_target, 
                      ts.target_status, 
                      cs.complition_status, 
                      stf.sale_target_percent
                  FROM set_target_footer stf
                  LEFT JOIN target_status ts ON ts.target_id = stf.target_id
                  LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id
                  WHERE stf.untitled_id = ? AND stf.sale_target_id IN (${saleTargetIds.join(",")})
                  ORDER BY COALESCE(stf.sale_target_percent, 0) DESC, stf.sale_target_id ASC
              `;

      [setFooterResult] = await connection.query(setFooterQuery, [untitledId]);
    }

    let footerMap = {};
    setFooterResult.forEach((footer) => {
      if (!footerMap[footer.sale_target_id]) {
        footerMap[footer.sale_target_id] = [];
      }
      footerMap[footer.sale_target_id].push({
        sale_target_coin: footer.sale_target_coin,
        sale_target: footer.sale_target,
        target_status: footer.target_status,
        complition_status: footer.complition_status,
      });
    });
    const formatCoinValue = (value) => {
      if (value == null || isNaN(Number(value))) return "0";
    
      let formattedValue = (Math.floor(Number(value) * 10000) / 10000).toFixed(4);
    
      // Remove unnecessary trailing zeros, keeping up to 4 decimals where needed
      if (formattedValue.endsWith(".0000")) {
        return formattedValue.slice(0, -5);
      }
    
      return formattedValue.replace(/(\.\d*?[1-9])0+$/, "$1");
    };
    let flattenedData = setTarget.map((target, index) => {
      let footers = footerMap[target.sale_target_id] || [];
      let rowData = {
        "Sr. No.": index + 1,
        "Date": target.target_date,
        "Coin Name": target.coins,
        "Coin Ticker": target.ticker,
        Exchange: target.exchange,
        "Base Price": target.base_price,
        "Current Price": target.currant_price,
        "Market Cap": target.market_cap,
        "Target Return X": target.target_return_x,
        "Current Return X": target.current_return_x,
        "Current Value": target.current_value,
        "Final Sale Price": target.final_sale_price,
        "Total Coins": formatCoinValue(target.total_coins),
        "Available Coins": formatCoinValue(target.total_available_coins),
        "Major Unlock Date": target.major_unlock_date,
        FDV: target.fdv,
        Narrative: target.narrative,
      };

      footers.reverse().forEach((footer, idx) => {
        rowData[`Sale Price ${idx + 1}`] = footer.sale_target;
        rowData[`Sale Coin ${idx + 1}`] = parseFloat(footer.sale_target_coin) % 1 === 0 
          ? parseInt(footer.sale_target_coin) 
          : parseFloat(footer.sale_target_coin).toFixed(4);
      });

      return rowData;
    });
    flattenedData.sort((a, b) => b["Market Cap"] - a["Market Cap"]);
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(flattenedData);
    xlsx.utils.book_append_sheet(workbook, worksheet, "SetTargetInfo");

    const excelFileName = `exported_data_${Date.now()}.xlsx`;
    xlsx.writeFile(workbook, excelFileName);

    res.download(excelFileName, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error downloading the file.");
      } else {
        fs.unlinkSync(excelFileName);
      }
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

const updateSellSold = async (req, res) => {
  const untitledId = req.companyData.untitled_id;

  let connection = await getConnection();
  try {
    // Start the transaction
    await connection.beginTransaction();

    // Extract parameters from the request body
    const sale_target_id = req.body.sale_target_id || "";
    const complition_id = req.body.complition_id || "";
    const currant_price = req.body.currant_price
      ? parseFloat(req.body.currant_price)
      : "";
    const set_footer_id = req.body.set_footer_id || "";
    const coin = req.body.coin || "";
    const base_price = req.body.base_price
      ? parseFloat(req.body.base_price)
      : "";
    const total_coins = req.body.total_coins
      ? parseFloat(req.body.total_coins)
      : "";
    // Fetch current footer details to confirm state
    const setFooterQuery = `
            SELECT sf.*,sf.sale_target_coin,sh.available_coins,sh.total_available_coins
            FROM set_target_footer sf 
            LEFT JOIN sale_target_header sh
            ON sf.sale_target_id = sh.sale_target_id
            WHERE sf.sale_target_id = ? 
            AND sf.untitled_id = ? 
            AND sf.set_footer_id = ?`;
    const [footerResult] = await connection.query(setFooterQuery, [
      sale_target_id,
      untitledId,
      set_footer_id,
    ]);
    // Extract sale_target_coin value
    const saleTargetCoin = footerResult[0].sale_target_coin || 0;

    const available_coins = footerResult[0].available_coins || 0;
    const total_available_coins = footerResult[0].total_available_coins || 0;
    // Only allow transitions from `complition_id = 3`
    if (complition_id == 3) {
      const updateQuery = `
                UPDATE set_target_footer
                SET complition_id = 4
                WHERE sale_target_id = ? AND untitled_id = ? AND set_footer_id = ? AND complition_id = 3`;
      const [updateResult] = await connection.query(updateQuery, [
        sale_target_id,
        untitledId,
        set_footer_id,
      ]);

      // Calculate available_coins
      const update_total_available_coin =
        total_available_coins - saleTargetCoin;

      // Insert into `sold_coin` table
      const insertSoldCoinQuery = `
                INSERT INTO sold_coin (coin, set_footer_id, sold_current_price, base_price, total_coins, available_coins, untitled_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const [insertSoldCoinResult] = await connection.query(
        insertSoldCoinQuery,
        [
          coin,
          set_footer_id,
          currant_price,
          base_price,
          available_coins,
          update_total_available_coin,
          untitledId,
        ]
      );

      // Update `total_available_coins` in `sale_target_header`
      const updateHeaderQuery = `
              UPDATE sale_target_header
              SET total_available_coins = ?
              WHERE sale_target_id = ? 
              AND untitled_id = ?`;
      await connection.query(updateHeaderQuery, [
        update_total_available_coin,
        sale_target_id,
        untitledId,
      ]);
    }

    // Commit the transaction
    await connection.commit();
    res.status(200).json({
      status: 200,
      message: "Sell to Sold updated successfully.",
    });
  } catch (error) {
    // Rollback transaction on error
    if (connection) await connection.rollback();

    res.status(500).json({
      status: 500,
      message: "Internal server error.",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

//count set target
const getSetTargetCount = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  // Attempt to obtain a database connection
  let connection = await getConnection();

  try {
    // Start a transaction
    await connection.beginTransaction();

    let set_target_count = 0;

    let setTargetCountQuery = `SELECT COUNT(*) AS total FROM sale_target_header WHERE untitled_id = ${untitledId} AND status = 1 `;
    let setTargetCountResult = await connection.query(setTargetCountQuery);
    set_target_count = parseInt(setTargetCountResult[0][0].total);

    const data = {
      status: 200,
      message: "Set Target Count retrieved successfully",
      set_target_count: set_target_count,
    };

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

//Update Set Target
const updateSetTarget = async (req, res) => {
  const sale_target_id = parseInt(req.params.id);
  const ticker = req.body.ticker || "";
  const coin = req.body.coin || "";
  const exchange = req.body.exchange || "";
  const base_price = parseFloat(req.body.base_price) || 0;
  const currant_price = parseFloat(req.body.currant_price) || 0;
  const current_value = parseFloat(req.body.current_value) || 0;
  const current_return_x = parseFloat(req.body.current_return_x) || 0;
  const market_cap = parseFloat(req.body.market_cap) || 0;
  const return_x = parseFloat(req.body.return_x) || 0;
  const final_sale_price = parseFloat(req.body.final_sale_price) || 0;
  let available_coins = parseFloat(req.body.available_coins) || 0;
  const timeframe = req.body.timeframe || "";
  const fdv_ratio = parseFloat(req.body.fdv_ratio) || 0;
  const narrative = req.body.narrative || "";
  const setTargetFooter = req.body.setTargetFooter || [];
  const untitled_id = req.companyData.untitled_id;

  if (!coin) return error422("Coin is required.", res);
  if (!return_x) return error422("Return_x is required.", res);
  if (!available_coins) return error422("Available Coins is required.", res);

  const saleTargetHeaderQuery = "SELECT * FROM sale_target_header WHERE sale_target_id = ?";
  const [saleTargetHeaderResult] = await pool.query(saleTargetHeaderQuery, [sale_target_id]);
  if (saleTargetHeaderResult.length === 0) {
    return error422("Sale Target Header Not Found.", res);
  }

  let connection = await getConnection();
  try {
    await connection.beginTransaction();

    const updatesaleTargetHeaderQuery = `
      UPDATE sale_target_header 
      SET ticker = ?, coin = ?, exchange = ?, currant_price = ?, 
          current_value = ?, current_return_x = ?, market_cap = ?, 
          return_x = ?, final_sale_price = ?, available_coins = ?, 
          timeframe = ?, fdv_ratio = ?, narrative = ? 
      WHERE sale_target_id = ? AND untitled_id = ?`;

    await connection.query(updatesaleTargetHeaderQuery, [
      ticker,
      coin,
      exchange,
      currant_price,
      current_value,
      current_return_x,
      market_cap,
      return_x,
      final_sale_price,
      available_coins,
      timeframe,
      fdv_ratio,
      narrative,
      sale_target_id,
      untitled_id,
    ]);

    // Update current_value in current_price table
    const updateCurrentPriceQuery = `
      UPDATE current_price 
      SET current_value = ? 
      WHERE sale_target_id = ? AND untitled_id = ?`;

    await connection.query(updateCurrentPriceQuery, [
      current_value,
      sale_target_id,
      untitled_id,
    ]);

    let setTargetFooterArray = setTargetFooter.reverse();
    let sale_target = final_sale_price;

    for (let i = 0; i < setTargetFooterArray.length; i++) {
      const element = setTargetFooterArray[i];
      if (!element || typeof element !== "object") continue;

      sale_target = sale_target - (sale_target - base_price) / 4;
      if (i === 0) sale_target = final_sale_price;

      const set_footer_id = element.set_footer_id || "";
      const sale_target_coin = parseFloat(element.sale_target_coin) || 0;
      const sale_target_value = parseFloat(element.sale_target_value) || 0;
      const targetValue = (available_coins / 100) * sale_target_value;

      const updateSetTargetFooterQuery = `
        UPDATE set_target_footer 
        SET sale_target_id = ?, sale_target_coin = ?, sale_target = ?, sale_target_value = ? 
        WHERE sale_target_id = ? AND set_footer_id = ? AND untitled_id = ?`;

      await connection.query(updateSetTargetFooterQuery, [
        sale_target_id,
        targetValue,
        sale_target,
        sale_target_value,
        sale_target_id,
        set_footer_id,
        untitled_id,
      ]);
    }

    const getTotalAvailableCoinsQuery = `
      SELECT  total_available_coins 
      FROM sale_target_header 
      WHERE sale_target_id = ? AND untitled_id = ?`;

    const [totalAvailableCoinsResult] = await connection.query(getTotalAvailableCoinsQuery, [sale_target_id, untitled_id]);

    let total_available_coins =
      totalAvailableCoinsResult.length > 0
        ? parseFloat(totalAvailableCoinsResult[0].total_available_coins) || 0
        : 0;

    total_available_coins = available_coins;

    const getSaleTargetCoinQuery = `
      SELECT SUM(sale_target_coin) AS total_sale_target_coin
      FROM set_target_footer 
      WHERE sale_target_id = ? AND untitled_id = ? AND complition_id = 4`;

    const [saleTargetCoinResult] = await connection.query(getSaleTargetCoinQuery, [sale_target_id, untitled_id]);

    const total_sale_target_coin =
      saleTargetCoinResult.length > 0
        ? parseFloat(saleTargetCoinResult[0].total_sale_target_coin) || 0
        : 0;

    total_available_coins -= total_sale_target_coin;

    const updateTotalAvailableCoinsQuery = `
      UPDATE sale_target_header 
      SET total_available_coins = ?
      WHERE sale_target_id = ? AND untitled_id = ?`;

    await connection.query(updateTotalAvailableCoinsQuery, [
      total_available_coins,
      sale_target_id,
      untitled_id,
    ]);

    await connection.commit();
    return res.status(200).json({
      status: 200,
      message: "Set Target updated successfully.",
    });
  } catch (error) {
    await connection.rollback();
    return error500(error, res);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


//set target by id
const getSetTarget = async (req, res) => {
  const sale_target_id = parseInt(req.params.id);
  const untitledId = req.companyData.untitled_id;
  let connection = await getConnection();

  try {
    await connection.beginTransaction();

    let getSetTargetQuery = `
      SELECT sth.*, 
             COALESCE(cp.current_price, sth.currant_price) AS currant_price,
             COALESCE(cp.current_value, sth.current_value) AS current_value,
             COALESCE(cp.current_return_x, sth.current_return_x) AS current_return_x,
             COALESCE(cp.fdv_ratio, sth.fdv_ratio) AS fdv_ratio,
             COALESCE(cp.market_cap, sth.market_cap) AS market_cap
      FROM sale_target_header sth
      LEFT JOIN current_price cp ON sth.sale_target_id = cp.sale_target_id
      WHERE sth.sale_target_id = ? AND sth.untitled_id = ?`;

    let result = await connection.query(getSetTargetQuery, [
      sale_target_id,
      untitledId,
    ]);

    if (result[0].length === 0) {
      return error422("Sale target Header Not Found.", res);
    }

    let setTarget = result[0][0];

    let setFooterQuery = `
      SELECT stf.*, ts.target_status, cs.complition_status 
      FROM set_target_footer stf 
      LEFT JOIN target_status ts ON ts.target_id = stf.target_id
      LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id 
      WHERE stf.sale_target_id = ? AND stf.untitled_id = ?`;

    let setFooterResult = await connection.query(setFooterQuery, [
      sale_target_id,
      untitledId,
    ]);
    setTarget["footer"] = setFooterResult[0].reverse();

    const data = {
      status: 200,
      message: "Set Target retrieved successfully",
      data: setTarget,
    };

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

//delete for forntend not database change status
const deleteSetTargetChangeStatus = async (req, res) => {
  const sale_target_id = parseInt(req.params.id);
  const untitledId = req.companyData.untitled_id;
  const status = parseInt(req.query.status); // Validate and parse the status parameter

  let connection;

  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Step 1: Check if the sale_target_header exists
    const saleTargetHeaderQuery = `
        SELECT ticker 
        FROM sale_target_header 
        WHERE sale_target_id = ? AND untitled_id = ?`;
    const [saleTargetHeaderResult] = await connection.query(
      saleTargetHeaderQuery,
      [sale_target_id, untitledId]
    );

    if (!saleTargetHeaderResult.length) {
      return res.status(404).json({
        status: 404,
        message: "Sale Target Header Not Found.",
      });
    }

    const ticker = saleTargetHeaderResult[0]?.ticker;

    // Step 2: Validate the status parameter
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        status: 400,
        message:
          "Invalid status value. Status must be 0 (inactive) or 1 (active).",
      });
    }

    // Step 3: Update the status in `sale_target_header`
    const updateHeaderQuery = `
        UPDATE sale_target_header
        SET status = ?
        WHERE sale_target_id = ? AND untitled_id = ?`;
    await connection.query(updateHeaderQuery, [
      status,
      sale_target_id,
      untitledId,
    ]);

    // Step 4: Update the status in `set_target_footer`
    const updateFooterQuery = `
        UPDATE set_target_footer
        SET status = ?
        WHERE sale_target_id = ? AND untitled_id = ?`;
    await connection.query(updateFooterQuery, [
      status,
      sale_target_id,
      untitledId,
    ]);

    // Step 5: Delete the record from `current_price` if status is 0
    if (status === 0) {
      const deleteTickerQuery = `
          DELETE FROM current_price
          WHERE sale_target_id = ?`; // Target only sale_target_id
      await connection.query(deleteTickerQuery, [sale_target_id]);
    }

    const statusMessage = status === 1 ? "activated" : "deleted";

    // Commit the transaction
    await connection.commit();

    return res.status(200).json({
      status: 200,
      message: `Set Target ${statusMessage} successfully.`,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Transaction failed:", error);
    return res
      .status(500)
      .json({ status: 500, message: "Internal Server Error." });
  } finally {
    if (connection) connection.release();
  }
};

//set target reached list untitled
const getSetTargetReached = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  const { page, perPage, key } = req.query;

  let connection = await getConnection();
  try {
    await connection.beginTransaction();

    let getSetTargetQuery = `
            SELECT * FROM sale_target_header 
            WHERE untitled_id = ${untitledId} AND status = 1`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getSetTargetQuery += ` AND status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getSetTargetQuery += ` AND status = 0`;
      } else {
        getSetTargetQuery += ` AND LOWER(coin) LIKE '%${lowercaseKey}%'`;
      }
    }

    getSetTargetQuery += " ORDER BY market_cap DESC";
    let result = await connection.query(getSetTargetQuery);
    let setTarget = result[0];

    for (let i = 0; i < setTarget.length; i++) {
      const element = setTarget[i];

      let setFooterQuery = `
                SELECT stf.*, ts.target_status, cs.complition_status 
                FROM set_target_footer stf
                LEFT JOIN target_status ts ON ts.target_id = stf.target_id
                LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id 
                WHERE stf.sale_target_id = ${element.sale_target_id} 
                AND stf.untitled_id = ${untitledId}`;
      const setFooterResult = await connection.query(setFooterQuery);
      element["footer"] = setFooterResult[0].reverse();

      let currentPriceQuery = `
                SELECT current_price AS update_current_price, market_cap, current_value, fdv_ratio, current_return_x 
                FROM current_price 
                WHERE sale_target_id = ${element.sale_target_id}`;
      const currentPriceResult = await connection.query(currentPriceQuery);
      const currentPriceData = currentPriceResult[0][0];

      if (currentPriceData) {
        element["update_current_price"] = currentPriceData.update_current_price;
        element["market_cap"] = currentPriceData.market_cap;
        element["current_value"] = currentPriceData.current_value;
        element["fdv_ratio"] = currentPriceData.fdv_ratio;
        element["current_return_x"] = currentPriceData.current_return_x;
      } else {
        element["current_price"] = element.current_price;
        element["market_cap"] = element.market_cap;
        element["current_value"] = element.current_value;
        element["fdv_ratio"] = element.fdv_ratio;
        element["current_return_x"] = element.current_return_x;
      }
    }

    let filteredData = setTarget.filter((element) =>
      element.footer.some((footer) => footer.target_id === 2)
    );

    const total = filteredData.length;
    let paginatedData = filteredData;

    if (page && perPage) {
      const start = (page - 1) * perPage;
      paginatedData = filteredData.slice(start, start + parseInt(perPage, 10));
    }

    const responseData = {
      status: 200,
      message: "Set Target retrieved successfully",
      data: paginatedData,
    };

    if (page && perPage) {
      responseData.pagination = {
        page: parseInt(page, 10),
        per_page: parseInt(perPage, 10),
        total: total,
        current_page: parseInt(page, 10),
        last_page: Math.ceil(total / perPage),
      };
    }

    return res.status(200).json(responseData);
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

//Get Sold Coin untitled
const getSoldCoin = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  const { page, perPage, key } = req.query;

  let connection = await getConnection();
  try {
    // Start the transaction
    await connection.beginTransaction();

    // Query to get sold coin data with calculated total and available_coins (total_coins - sale_target_coin)
    let getSoldCoinQuery = `
            SELECT 
                sc.*, 
                sf.sale_target_coin, 
                    sth.available_coins AS total_coins, 
    sth.available_coins - SUM(sf.sale_target_coin) OVER (PARTITION BY sf.sale_target_id ORDER BY sc.created_at) AS available_coins,
                (sc.sold_current_price * sf.sale_target_coin) AS total 
            FROM sold_coin sc
            LEFT JOIN set_target_footer sf ON sc.set_footer_id = sf.set_footer_id
            LEFT JOIN sale_target_header sth ON sf.sale_target_id = sth.sale_target_id
            WHERE sc.untitled_id = ${untitledId}`;

    let countQuery = `
            SELECT COUNT(*) AS total 
            FROM sold_coin sc
            LEFT JOIN set_target_footer sf ON sc.set_footer_id = sf.set_footer_id
            LEFT JOIN sale_target_header sth ON sf.sale_target_id = sth.sale_target_id
            WHERE sc.untitled_id = ${untitledId}`;

    // Filtering by key if provided
    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getSoldCoinQuery += ` AND sc.status = 1`;
        countQuery += ` AND sc.status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getSoldCoinQuery += ` AND sc.status = 0`;
        countQuery += ` AND sc.status = 0`;
      } else {
        getSoldCoinQuery += ` AND LOWER(sc.coin) LIKE '%${lowercaseKey}%' `;
        countQuery += ` AND LOWER(sc.coin) LIKE '%${lowercaseKey}%' `;
      }
    }

    getSoldCoinQuery += " ORDER BY sc.created_at DESC";

    // Apply pagination if both page and perPage are provided
    let totalRecords = 0;
    if (page && perPage) {
      const totalResult = await connection.query(countQuery);
      totalRecords = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getSoldCoinQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await connection.query(getSoldCoinQuery);
    const soldCoin = result[0];

    // Calculate the sum of total column
    const totalSum = soldCoin.reduce((sum, item) => sum + (item.total || 0), 0);

    const data = {
      status: 200,
      message: "Sold Coin retrieved successfully",
      data: soldCoin,
      totalSum: totalSum, // Adding total sum to the response
    };

    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: totalRecords,
        current_page: page,
        last_page: Math.ceil(totalRecords / perPage),
      };
    }

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

//current price
const getCurrentPriceCount = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  // Attempt to obtain a database connection
  let connection = await getConnection();

  try {
    // Start a transaction
    await connection.beginTransaction();

    let current_count = 0;

    let setCurrentCountQuery = `SELECT SUM(currant_price) AS total FROM sale_target_header WHERE untitled_id = ${untitledId} AND status = 1 `;
    let setCurrentCountResult = await connection.query(setCurrentCountQuery);
    current_count = parseFloat(setCurrentCountResult[0][0].total);

    const data = {
      status: 200,
      message: "Set Target Count retrieved successfully",
      current_count: current_count,
    };

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getSoldCoinDownload = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  const { key } = req.query;

  let connection = await getConnection();
  try {
    await connection.beginTransaction();

    let getSoldCoinQuery = `
           SELECT 
    sc.created_at AS "Sold Date", 
    sc.coin AS "Coin",
TRIM(TRAILING '.0000' FROM FORMAT(sth.available_coins, 4)) AS "Total Coins",  
    sc.base_price AS "Base Price",
    sc.sold_current_price AS "Sold Price", 
 TRIM(TRAILING '.0000' FROM FORMAT(sf.sale_target_coin, 4)) AS "Sold Coins",
    (sc.sold_current_price * sf.sale_target_coin) AS "Total",
    TRIM(TRAILING '.0000' FROM FORMAT(sth.available_coins - SUM(sf.sale_target_coin) OVER (PARTITION BY sf.sale_target_id ORDER BY sc.created_at), 4)) AS "Available Coins"
FROM sold_coin sc
LEFT JOIN set_target_footer sf ON sc.set_footer_id = sf.set_footer_id
LEFT JOIN sale_target_header sth ON sf.sale_target_id = sth.sale_target_id
WHERE sc.untitled_id = ${untitledId}`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getSoldCoinQuery += ` AND sc.status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getSoldCoinQuery += ` AND sc.status = 0`;
      } else {
        getSoldCoinQuery += ` AND LOWER(sc.coin) LIKE '%${lowercaseKey}%' `;
      }
    }

    getSoldCoinQuery += " ORDER BY sc.created_at DESC";

    let result = await connection.query(getSoldCoinQuery);
    let soldCoin = result[0];

    if (soldCoin.length === 0) {
      return error422("No data found.", res);
    }

    // Add "Sr No" column
    soldCoin = soldCoin.map((item, index) => ({
      "Sr No": index + 1, // Add serial number
      ...item,
    }));

    // Create a new workbook
    const workbook = xlsx.utils.book_new();

    // Create a worksheet and add only required columns
    const worksheet = xlsx.utils.json_to_sheet(soldCoin);

    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "SoldCoinInfo");

    // Create a unique file name
    const excelFileName = `exported_data_${Date.now()}.xlsx`;

    // Write the workbook to a file
    xlsx.writeFile(workbook, excelFileName);

    // Send the file to the client
    res.download(excelFileName, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error downloading the file.");
      } else {
        fs.unlinkSync(excelFileName);
      }
    });

    await connection.commit();
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

const getDashboardDownload = async (req, res) => {
  const untitledId = req.companyData.untitled_id;
  const { key } = req.query;

  let connection = await getConnection();
  try {
    await connection.beginTransaction();

    let getSetTargetQuery = `
            SELECT sth.sale_target_id, sth.sale_date, sth.coin, sth.ticker, sth.exchange, sth.base_price,  
                   COALESCE(cp.current_price, sth.currant_price) AS currant_price,
                   COALESCE(cp.market_cap, sth.market_cap) AS market_cap,
                   sth.return_x,
                   COALESCE(cp.current_return_x, sth.current_return_x) AS current_return_x,
                   COALESCE(cp.current_value, sth.current_value) AS current_value,
                   sth.final_sale_price,
                   sth.available_coins,
                   sth.total_available_coins,
                   sth.timeframe,
                   COALESCE(cp.fdv_ratio, sth.fdv_ratio) AS fdv_ratio,
                   sth.narrative
            FROM sale_target_header sth
            LEFT JOIN current_price cp ON sth.sale_target_id = cp.sale_target_id
            WHERE sth.untitled_id = ${untitledId} AND sth.status = 1
        `;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getSetTargetQuery += ` AND sth.status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getSetTargetQuery += ` AND sth.status = 0`;
      } else {
        getSetTargetQuery += ` AND LOWER(sth.coin) LIKE '%${lowercaseKey}%'`;
      }
    }

    getSetTargetQuery += " ORDER BY market_cap DESC";

    let result = await connection.query(getSetTargetQuery);
    let setTarget = result[0];

    let structuredData = [];
    let srNo = 1;

    for (let element of setTarget) {
      let setFooterQuery = `
                SELECT stf.*, ts.target_status, cs.complition_status 
                FROM set_target_footer stf
                LEFT JOIN target_status ts ON ts.target_id = stf.target_id
                LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id 
                WHERE stf.sale_target_id = ${element.sale_target_id} 
                AND stf.untitled_id = ${untitledId}`;

      const setFooterResult = await connection.query(setFooterQuery);
      const footerRows = setFooterResult[0].reverse();

      const hasTargetId2 = footerRows.some((footer) => footer.target_id === 2);
      if (hasTargetId2) {
        let saleTargetCoins = [];
        let saleTargets = [];

        for (let i = 0; i < 5; i++) {
          saleTargets.push(footerRows[i] ? footerRows[i].sale_target : "");
          saleTargetCoins.push(
            footerRows[i] ? footerRows[i].sale_target_coin : ""
          );
        }

        // Function to format numbers (convert to integer if decimal part is zero)
        const formatCoinValue = (value) => {
          if (value == null || isNaN(Number(value))) return "0";
        
          let formattedValue = (Math.floor(Number(value) * 10000) / 10000).toFixed(4);
        
          // Remove unnecessary trailing zeros, keeping up to 4 decimals where needed
          if (formattedValue.endsWith(".0000")) {
            return formattedValue.slice(0, -5);
          }
        
          return formattedValue.replace(/(\.\d*?[1-9])0+$/, "$1");
        };

        structuredData.push({
          "Sr. No": srNo++, // Add serial number
          "Date": element.sale_date,
          "Coin Name": element.coin,
          "Cion Ticker": element.ticker,
          Exchange: element.exchange,
          "Base Price": element.base_price,
          "Current Price": element.currant_price,
          "Market Cap": element.market_cap,
          "Target Return X": element.return_x,
          "Current Return X": element.current_return_x,
          "Current Value": element.current_value,
          "Final Sale Price": element.final_sale_price,
          "Total Coins": formatCoinValue(element.available_coins),
          "Available Coins": formatCoinValue(element.total_available_coins),
          "Major Unlock Date": element.timeframe,
          "FDV Ratio": element.fdv_ratio,
          Narrative: element.narrative,
          "Sale Price 1": saleTargets[0],
          "Sale Price 2": saleTargets[1],
          "Sale Price 3": saleTargets[2],
          "Sale Price 4": saleTargets[3],
          "Sale Price 5": saleTargets[4],
          "Sale Coin 1": saleTargetCoins[0]
            ? parseFloat(saleTargetCoins[0]) % 1 === 0
              ? parseInt(saleTargetCoins[0])
              : parseFloat(saleTargetCoins[0]).toFixed(4)
            : "",

          "Sale Coin 2": saleTargetCoins[1]
            ? parseFloat(saleTargetCoins[1]) % 1 === 0
              ? parseInt(saleTargetCoins[1])
              : parseFloat(saleTargetCoins[1]).toFixed(4)
            : "",

          "Sale Coin 3": saleTargetCoins[2]
            ? parseFloat(saleTargetCoins[2]) % 1 === 0
              ? parseInt(saleTargetCoins[2])
              : parseFloat(saleTargetCoins[2]).toFixed(4)
            : "",

          "Sale Coin 4": saleTargetCoins[3]
            ? parseFloat(saleTargetCoins[3]) % 1 === 0
              ? parseInt(saleTargetCoins[3])
              : parseFloat(saleTargetCoins[3]).toFixed(4)
            : "",

          "Sale Coin 5": saleTargetCoins[4]
            ? parseFloat(saleTargetCoins[4]) % 1 === 0
              ? parseInt(saleTargetCoins[4])
              : parseFloat(saleTargetCoins[4]).toFixed(4)
            : "",
        });
      }
    }

    if (structuredData.length === 0) {
      return error422("No data found.", res);
    }
    structuredData.sort((a, b) => b["Market Cap"] - a["Market Cap"]);
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(structuredData);
    xlsx.utils.book_append_sheet(workbook, worksheet, "filteredDataInfo");

    const excelFileName = `exported_data_${Date.now()}.xlsx`;
    xlsx.writeFile(workbook, excelFileName);

    res.download(excelFileName, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error downloading the file.");
      } else {
        fs.unlinkSync(excelFileName);
      }
    });

    await connection.commit();
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};


//Get Set Target List all
const getAllSetTargets = async (req, res) => {
  const { page, perPage, key } = req.query;

  // Attempt to obtain a database connection
  let connection = await getConnection();
  try {
    // Start the transaction
    await connection.beginTransaction();

    let getSetTargetQuery = `SELECT s.*,u.user_name FROM sale_target_header s
    LEFT JOIN untitled u
    ON s.untitled_id = u.untitled_id WHERE s.status = 1`;
    let countQuery = `SELECT COUNT(*) AS total FROM sale_target_header s
    LEFT JOIN untitled u
    ON s.untitled_id = u.untitled_id WHERE s.status = 1`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getSetTargetQuery += ` AND s.status = 1`;
        countQuery += ` AND status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getSetTargetQuery += ` AND s.status = 0`;
        countQuery += ` AND s.status = 0`;
      } else {
        getSetTargetQuery += ` AND LOWER(u.user_name) LIKE '%${lowercaseKey}%'`;
        countQuery += ` AND LOWER(u.user_name) LIKE '%${lowercaseKey}%'`;
      }
    }
    getSetTargetQuery += " ORDER BY s.market_cap DESC";
    let result = await connection.query(getSetTargetQuery);
    let setTarget = result[0];

    // Apply pagination if both page and perPage are provided
    let total = 0;
    if (page && perPage) {
      const totalResult = await connection.query(countQuery);
      total = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getSetTargetQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    // Get set_header_footer
    for (let i = 0; i < setTarget.length; i++) {
      const element = setTarget[i];

      // Query to fetch data from current_price table if available
      let currentPriceQuery = `SELECT * FROM current_price WHERE sale_target_id = ${element.sale_target_id}`;
      let currentPriceResult = await connection.query(currentPriceQuery);
      let currentPriceData = currentPriceResult[0][0]; // First result

      if (currentPriceData) {
        // If data exists in current_price, use that and exclude sale_target_header data
        setTarget[i].update_current_price = currentPriceData.current_price;
        setTarget[i].market_cap = currentPriceData.market_cap;
        setTarget[i].current_value = currentPriceData.current_value;
        setTarget[i].fdv_ratio = currentPriceData.fdv_ratio;
        setTarget[i].current_return_x = currentPriceData.current_return_x;
      } else {
        // If no data found in current_price, use sale_target_header values
        setTarget[i].current_price = element.current_price;
        setTarget[i].market_cap = element.market_cap;
        setTarget[i].current_value = element.current_value;
        setTarget[i].fdv_ratio = element.fdv_ratio;
        setTarget[i].current_return_x = element.current_return_x;
      }

      // Fetch footer data
      let setFooterQuery = `SELECT stf.*, ts.target_status, cs.complition_status FROM set_target_footer stf
                LEFT JOIN target_status ts ON ts.target_id = stf.target_id
                LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id
                WHERE stf.sale_target_id = ${element.sale_target_id}`;
      let setFooterResult = await connection.query(setFooterQuery);
      setTarget[i]["footer"] = setFooterResult[0].reverse();
    }

    // Updated totalCurrentValue query
    const getTotalCurrentValueQuery = `
          SELECT (
            COALESCE(
              (SELECT SUM(current_value) 
               FROM current_price 
               WHERE status = 1),
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
                AND sh.status = 1),
              0
            )
          ) AS totalCurrentValue
        `;

    // Get total current value
    let totalCurrentValueResult = await connection.query(
      getTotalCurrentValueQuery
    );
    let totalCurrentValue = totalCurrentValueResult[0][0].totalCurrentValue;

    const data = {
      status: 200,
      message: "Set Target retrieved successfully",
      data: setTarget,
      totalCurrentValue: totalCurrentValue, // Add total current value to the response
    };

    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      };
    }

    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

//Get Sold Coin All
const getAllSoldCoin = async (req, res) => {
  const { page, perPage, key } = req.query;

  let connection = await getConnection();
  try {
    // Start the transaction
    await connection.beginTransaction();

    // Query to get sold coin data with calculated total and available_coins (total_coins - sale_target_coin)
    let getSoldCoinQuery = `
            SELECT 
                sc.*, 
                sf.sale_target_coin, 
                    sth.available_coins AS total_coins, 
    sth.available_coins - SUM(sf.sale_target_coin) OVER (PARTITION BY sf.sale_target_id ORDER BY sc.created_at) AS available_coins,
                (sc.sold_current_price * sf.sale_target_coin) AS total 
            FROM sold_coin sc
            LEFT JOIN set_target_footer sf ON sc.set_footer_id = sf.set_footer_id
            LEFT JOIN sale_target_header sth ON sf.sale_target_id = sth.sale_target_id
            WHERE 1`;

    let countQuery = `
            SELECT COUNT(*) AS total 
            FROM sold_coin sc
            LEFT JOIN set_target_footer sf ON sc.set_footer_id = sf.set_footer_id
            LEFT JOIN sale_target_header sth ON sf.sale_target_id = sth.sale_target_id
            WHERE 1`;

    // Filtering by key if provided
    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getSoldCoinQuery += ` AND sc.status = 1`;
        countQuery += ` AND sc.status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getSoldCoinQuery += ` AND sc.status = 0`;
        countQuery += ` AND sc.status = 0`;
      } else {
        getSoldCoinQuery += ` AND LOWER(sc.coin) LIKE '%${lowercaseKey}%' `;
        countQuery += ` AND LOWER(sc.coin) LIKE '%${lowercaseKey}%' `;
      }
    }

    getSoldCoinQuery += " ORDER BY sc.created_at DESC";

    // Apply pagination if both page and perPage are provided
    let totalRecords = 0;
    if (page && perPage) {
      const totalResult = await connection.query(countQuery);
      totalRecords = parseInt(totalResult[0][0].total);

      const start = (page - 1) * perPage;
      getSoldCoinQuery += ` LIMIT ${perPage} OFFSET ${start}`;
    }

    const result = await connection.query(getSoldCoinQuery);
    const soldCoin = result[0];

    // Calculate the sum of total column
    const totalSum = soldCoin.reduce((sum, item) => sum + (item.total || 0), 0);

    const data = {
      status: 200,
      message: "Sold Coin retrieved successfully",
      data: soldCoin,
      totalSum: totalSum, // Adding total sum to the response
    };

    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: totalRecords,
        current_page: page,
        last_page: Math.ceil(totalRecords / perPage),
      };
    }

    return res.status(200).json(data);
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};


//set target reached list All
const getAllSetTargetReached = async (req, res) => {
  const { page, perPage, key, untitled_id } = req.query;

  let connection = await getConnection();
  try {
    await connection.beginTransaction();

    let getSetTargetQuery = `
            SELECT * FROM sale_target_header 
            WHERE status = 1`;

    if (key) {
      const lowercaseKey = key.toLowerCase().trim();
      if (lowercaseKey === "activated") {
        getSetTargetQuery += ` AND status = 1`;
      } else if (lowercaseKey === "deactivated") {
        getSetTargetQuery += ` AND status = 0`;
      } else {
        getSetTargetQuery += ` AND LOWER(coin) LIKE '%${lowercaseKey}%'`;
      }
    }

    if (untitled_id) {
      getAdhaQuery += ` AND untitled_id = ${untitled_id}`;
      countQuery += `  AND untitled_id = ${untitled_id}`;
  }

    getSetTargetQuery += " ORDER BY market_cap DESC";
    let result = await connection.query(getSetTargetQuery);
    let setTarget = result[0];

    for (let i = 0; i < setTarget.length; i++) {
      const element = setTarget[i];

      let setFooterQuery = `
                SELECT stf.*, ts.target_status, cs.complition_status 
                FROM set_target_footer stf
                LEFT JOIN target_status ts ON ts.target_id = stf.target_id
                LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id 
                WHERE stf.sale_target_id = ${element.sale_target_id} 
                `;
      const setFooterResult = await connection.query(setFooterQuery);
      element["footer"] = setFooterResult[0].reverse();

      let currentPriceQuery = `
                SELECT current_price AS update_current_price, market_cap, current_value, fdv_ratio, current_return_x 
                FROM current_price 
                WHERE sale_target_id = ${element.sale_target_id}`;
      const currentPriceResult = await connection.query(currentPriceQuery);
      const currentPriceData = currentPriceResult[0][0];

      if (currentPriceData) {
        element["update_current_price"] = currentPriceData.update_current_price;
        element["market_cap"] = currentPriceData.market_cap;
        element["current_value"] = currentPriceData.current_value;
        element["fdv_ratio"] = currentPriceData.fdv_ratio;
        element["current_return_x"] = currentPriceData.current_return_x;
      } else {
        element["current_price"] = element.current_price;
        element["market_cap"] = element.market_cap;
        element["current_value"] = element.current_value;
        element["fdv_ratio"] = element.fdv_ratio;
        element["current_return_x"] = element.current_return_x;
      }
    }

    let filteredData = setTarget.filter((element) =>
      element.footer.some((footer) => footer.target_id === 2)
    );

    const total = filteredData.length;
    let paginatedData = filteredData;

    if (page && perPage) {
      const start = (page - 1) * perPage;
      paginatedData = filteredData.slice(start, start + parseInt(perPage, 10));
    }

    const responseData = {
      status: 200,
      message: "Set Target retrieved successfully",
      data: paginatedData,
    };

    if (page && perPage) {
      responseData.pagination = {
        page: parseInt(page, 10),
        per_page: parseInt(perPage, 10),
        total: total,
        current_page: parseInt(page, 10),
        last_page: Math.ceil(total / perPage),
      };
    }

    return res.status(200).json(responseData);
  } catch (error) {
    return error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  addSaleTargetHeader,
  currantPriceUpdateTargetComplitionStatus,
  createCurrentPrice,
  getSetTargets,
  getSetTargetDownload,
  updateSellSold,
  getSetTargetCount,
  updateSetTarget,
  getSetTarget,
  deleteSetTargetChangeStatus,
  getSetTargetReached,
  getSoldCoin,
  getCurrentPriceCount,
  getSoldCoinDownload,
  getDashboardDownload,
  checkCoinExchange,
  getAllSetTargets,
  getAllSoldCoin,
  getAllSetTargetReached
};
