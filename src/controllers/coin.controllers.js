const pool = require("../../db");
const axios = require('axios');
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
        message: message
    })
}
//error 500 handler
error500 = (error, res) => {
    console.log(error);
    return res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
        error: error
    })
}
const addCoin = async (req, res)=>{
    let connection;
   try {
    connection = await pool.getConnection();
    let response = await axios.get(
        `https://min-api.cryptocompare.com/data/all/coinlist?summary=true`
      );
    let rawData = response.data.Data
          const responseArray = Object.keys(rawData).map(coin => ({
        coin, // include the original key as a field
        ...rawData[coin] // spread the object data
    }));

    let emptyImageCount = 0;
    let duplicateCount = 0;
    let insertCount = 0;

    for (let index = 0; index < responseArray.length; index++) {
        const element = responseArray[index];

        let isExistCoinQuery = "SELECT * FROM coins WHERE TRIM(LOWER(ticker_symbol)) = ?";
        let isExistCoinResult = await connection.query(isExistCoinQuery, [(element.Symbol).toLowerCase()]);

        if (!(isExistCoinResult[0].length > 0)) {
            if (element.ImageUrl) {
                let coinQuery = "INSERT INTO coins (id, image_url, ticker_symbol, coin_name, short_name) VALUES (?, ?, ?, ?, ?)";
                let coinValue = [element.Id, element.ImageUrl, element.Symbol, element.FullName, element.Symbol];
                const coinResult = await connection.query(coinQuery, coinValue);

                insertCount++;

                // console.log(element.Symbol);

            } else {
                // console.log("Image empty for symbol:", element.Symbol);
                emptyImageCount++;
            }
        } else {
            // console.log("Duplicate entry for symbol:", element.Symbol);
            duplicateCount++;
        }
    }

    

    connection.commit();
    res.status(200).json({
        status:200,
        message:"Coin added successfully!",
        data: {
         "emptyImageCount" :  emptyImageCount,
         "duplicateCount" : duplicateCount,
         "insertCount" : insertCount
        }
    })
   } catch (error) {
    connection.rollback();
    return error500(error, res)
   } finally {
    connection.release()

   }
};
// const addCoin = async (req, res)=>{
//     let connection;
//    try {
//     connection = await pool.getConnection();
//     let response = await axios.get(
//         // `https://min-api.cryptocompare.com/data/all/coinlist?summary=true`
//         `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD`
//       );
//     let rawData = response.data.Data;
    
//     // const responseArray = Object.keys(rawData).map(CoinInfo => ({
//     //     CoinInfo, // include the original key as a field
//     //     ...rawData[CoinInfo] // spread the object data
//     // }));
//     // console.log(responseArray[0].FullName);
    
//     let emptyImageCount = 0;
//     let duplicateCount = 0;
//     let insertCount = 0;
    
//     for (let index = 0; index < rawData.length; index++) {
//         const element = rawData[index].CoinInfo;
        
//         let isExistCoinQuery = "SELECT * FROM coins WHERE TRIM(LOWER(ticker_symbol)) = ?";
//         let isExistCoinResult = await connection.query(isExistCoinQuery, [(element.Symbol)]);
    
//         if (!(isExistCoinResult[0].length > 0)) {
//             if (element.ImageUrl) {
//                 let coinQuery = "INSERT INTO coins (id, image_url, ticker_symbol, coin_name, short_name) VALUES (?, ?, ?, ?, ?)";
//                 let coinValue = [element.Id, element.ImageUrl, element.Internal, element.FullName, element.Name];
//                 const coinResult = await connection.query(coinQuery, coinValue);
    
//                 insertCount++;

//             } else {
//                 // console.log("Image empty for symbol:", element.Symbol);
//                 emptyImageCount++;
//             }
//         } else {
//             // console.log("Duplicate entry for symbol:", element.Symbol);
//             duplicateCount++;
//         }
//     }
    
//     connection.commit();
//     res.status(200).json({
//         status:200,
//         message:"Coin added successfully!",
//         data: {
//          "emptyImageCount" :  emptyImageCount,
//          "duplicateCount" : duplicateCount,
//          "insertCount" : insertCount
//         }
//     })
//    } catch (error) {
//     console.log(error);
    
//     connection.rollback();
//     return error500(error, res)
//    } finally {
//     connection.release()

//    }
// };

//get coins list...
// const getCoins = async(req, res)=>{
//     let connection;  
//     // return res.json("Hii")
//     try {
//         connection = await pool.getConnection();

//         let coinQuery = "SELECT * FROM coins";
//         let coinResult = await connection.query(coinQuery)
//         for (let index = 0; index < coinResult[0].length; index++) {
//             const element = coinResult[0][index];
//             // let response = await axios.get(
//             //     `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${element.ticker_symbol}&tsyms=USD&api_key=c9dbe355a7cb4069138048c0f96468825e753dce674be4bb1e0af386b6c6e2cc`
//             //   );
//             // let ticker_symbol = Object.keys(response.data)
            
//             // let rawData = response.data[ticker_symbol[0]]
//             // console.log(rawData);

//         }
//         connection.commit()
//         return res.status(200).json({
//             status:200,
//             message:"Coins retrived successfully!",
//             data:coinResult[0]
//         })
//     } catch (error) {
//         await connection.rollback()
//         return error500(error, res)
//     } finally {
//         if(connection) connection.release()
//     }
// };


// const getCoins = async (req, res) => {
//     const { page, perPage, key } = req.query;
//     let connection;
//     try {
//         connection = await pool.getConnection();
//         let response = await axios.get(
//             `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD`
//         );
//         let rawData = response.data.Data;
//         let coinsData = [];
        
//         // Loop through the data to log CoinInfo and DISPLAY information
//         for (let index = 0; index < rawData.length; index++) {
//             const coinInfo = rawData[index].CoinInfo;
//             const displayData = rawData[index].DISPLAY?.USD;
//             const raw =  rawData[index].RAW?.USD;
            
            
            
//             let coinDetails = {};
            
//             if (coinInfo) {   
//                 coinDetails.ImageUrl = coinInfo.ImageUrl; 
//                 coinDetails.FullName = coinInfo.FullName;
//                 coinDetails.Name = coinInfo.Name;
//             }
            
//             if (displayData) {
//                 coinDetails.PRICE = displayData.PRICE
//                 const price = displayData.PRICE.replace(/[^0-9.-]+/g, "");
//                 const openHour = displayData.OPENHOUR.replace(/[^0-9.-]+/g, "");
//                 const open24HOUR = displayData.OPEN24HOUR.replace(/[^0-9.-]+/g, "");
//                 coinDetails.OPENHOUR = displayData.OPENHOUR
//                 let oneH = ((price - openHour) / openHour) * 100;
//                 let one24H = ((price - open24HOUR) / open24HOUR) * 100;
                
//                 coinDetails.oneh = oneH.toFixed(3);
//                 coinDetails.OPEN24HOUR = displayData.OPEN24HOUR;
//                 coinDetails.one24h = one24H.toFixed(3);

//             coinDetails.VOLUME24HOUR = displayData.VOLUME24HOUR;
//             // coinDetails.MKTCAP = raw.MKTCAP;
//             }
            
//             if (raw) {
//                 coinDetails.MKTCAP = raw.MKTCAP;
//             }
//             coinsData.push(coinDetails);  
//         }
//         if (key) {
//             coinsData = coinsData.filter((coin) =>
//                 coin.FullName?.toLowerCase().includes(key.toLowerCase())
//             );
//         }

//         // Calculate the total count based on the filtered data
//         const total = coinsData.length;
//         let coinData = coinsData;

//         // Apply pagination to the filtered data
//         if (page && perPage) {
//             const start = (page - 1) * perPage;
//             coinData = coinsData.slice(start, start + parseInt(perPage, 10));
//         }

//         // Add rank to the paginated data
//         coinsData.forEach((coin, index) => {
//             coin.Rank = index + 1; // Rank starts at the current page's first item
//         });

//         // Respond with success
//         const data = {
//             status: 200,
//             message: "Coins retrieved successfully!",
//             data:coinData
//         };

//         // Add pagination information if applicable
//         if (page && perPage) {
//             data.pagination = {
//                 page: parseInt(page, 10),
//                 per_page: parseInt(perPage, 10),
//                 total: total,
//                 current_page: parseInt(page, 10),
//                 last_page: Math.ceil(total / perPage),
//             };
//         }

//         return res.status(200).json(data);
//     } catch (error) {
//         if (connection) await connection.rollback();
//         return error500(error, res);
//     } finally {
//         if (connection) connection.release();
//     }
// };
const getCoins = async (req, res) => {
    const { page, perPage, key } = req.query;
    let connection;
    try {
      connection = await pool.getConnection();
      let response = await axios.get(
        `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD`
      );
      let rawData = response.data.Data;
      let coinsData = [];
  
      // Loop through the data to log CoinInfo and DISPLAY information
      for (let index = 0; index < rawData.length; index++) {
        const coinInfo = rawData[index].CoinInfo;
        const displayData = rawData[index].DISPLAY?.USD;
        const raw = rawData[index].RAW?.USD;
  
        let coinDetails = {};
  
        if (coinInfo) {
          coinDetails.ImageUrl = coinInfo.ImageUrl;
          coinDetails.FullName = coinInfo.FullName;
          coinDetails.Name = coinInfo.Name;
        }
  
        if (displayData) {
          coinDetails.PRICE = displayData.PRICE;
          const price = displayData.PRICE.replace(/[^0-9.-]+/g, "");
          const openHour = displayData.OPENHOUR.replace(/[^0-9.-]+/g, "");
          const open24HOUR = displayData.OPEN24HOUR.replace(/[^0-9.-]+/g, "");
          coinDetails.OPENHOUR = displayData.OPENHOUR;
          let oneH = ((price - openHour) / openHour) * 100;
          let one24H = ((price - open24HOUR) / open24HOUR) * 100;
  
          coinDetails.oneh = oneH.toFixed(3);
          coinDetails.OPEN24HOUR = displayData.OPEN24HOUR;
          coinDetails.one24h = one24H.toFixed(3);
  
          coinDetails.VOLUME24HOUR = displayData.VOLUME24HOUR;
        }
  
        if (raw) {
          const circulatingSupply = raw.CIRCULATINGSUPPLY;
          const totalSupply = raw.SUPPLY ;
  
          const FDV = circulatingSupply / totalSupply;
          const mktcap = FDV * raw.MKTCAP;
  
          coinDetails.FDV = FDV.toFixed(3);
          coinDetails.MKTCAP = mktcap.toFixed(2);
        }
  
        coinsData.push(coinDetails);
      }
  
      if (key) {
        coinsData = coinsData.filter((coin) =>
          coin.FullName?.toLowerCase().includes(key.toLowerCase())
        );
      }
  
      // Calculate the total count based on the filtered data
      const total = coinsData.length;
      let coinData = coinsData;
  
      // Apply pagination to the filtered data
      if (page && perPage) {
        const start = (page - 1) * perPage;
        coinData = coinsData.slice(start, start + parseInt(perPage, 10));
      }
  
      // Add rank to the paginated data
      coinsData.forEach((coin, index) => {
        coin.Rank = index + 1;
      });
  
      // Respond with success
      const data = {
        status: 200,
        message: "Coins retrieved successfully!",
        data: coinData,
      };
  
      // Add pagination information if applicable
      if (page && perPage) {
        data.pagination = {
          page: parseInt(page, 10),
          per_page: parseInt(perPage, 10),
          total: total,
          current_page: parseInt(page, 10),
          last_page: Math.ceil(total / perPage),
        };
      }
  
      return res.status(200).json(data);
    } catch (error) {
      if (connection) await connection.rollback();
      return error500(error, res);
    } finally {
      if (connection) connection.release();
    }
  };
  

// const getCoins = async (req, res) => {
//     let connection;
//     try {
//         connection = await pool.getConnection();
//         let response = await axios.get(
//             `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD`
//         );
//         let rawData = response.data.Data;
//         let coinsData = [];

//         // Loop through the data to log CoinInfo and DISPLAY information
//         for (let index = 0; index < rawData.length; index++) {
//             const coinInfo = rawData[index].CoinInfo;
//             const displayData = rawData[index].DISPLAY?.USD; 

//             let coinDetails = {};

//             if (coinInfo) {   
//                 coinDetails.ImageUrl = coinInfo.ImageUrl; 
//                 coinDetails.FullName = coinInfo.FullName;
//                 coinDetails.Name = coinInfo.Name;
//             }

//             if (displayData) {
//                 coinDetails.PRICE = displayData.PRICE;

//                 // Ensure the values are parsed as floats for calculation
//                 const price = parseFloat(displayData.PRICE); // Remove non-numeric characters
//                 const openHour = parseFloat(displayData.OPENHOUR.replace(/[^0-9.]+/g, "")); // Remove non-numeric characters

//                 // Calculate percentage change for the past hour
//                 const oneH = ((price - openHour) / openHour) * 100;
//                 coinDetails.OPENHOUR = oneH.toFixed(2);  // Limiting to 2 decimal places

//                 coinDetails.OPEN24HOUR = displayData.OPEN24HOUR;
//                 coinDetails.VOLUME24HOUR = displayData.VOLUME24HOUR;
//                 coinDetails.MKTCAP = displayData.MKTCAP;
//             }

//             coinsData.push(coinDetails);
//         }

//         // Respond with success
//         res.status(200).json({
//             status: 200,
//             message: "Coins retrieved successfully!",
//             data: coinsData
//         });
//     } catch (error) {
//         console.error(error);

//         if (connection) await connection.rollback();
//         return error500(error, res);
//     } finally {
//         if (connection) connection.release();
//     }
// };



// get coin by id...
const getCoin = async (req, res) => {
    const coin_id = parseInt(req.params.id);
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
    
        const coinQuery = `SELECT * FROM coins WHERE coin_id = ?`;
        const coinResult = await connection.query(coinQuery, [coin_id]);
        if (coinResult[0].length === 0) {
            return error422("Coin Not Found.", res);
        }
        const coin = coinResult[0][0];
        res.status(200).json({
            status: 200,
            message: "Coin Retrived Successfully",
            data: coin,
        });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//get coin active list limit 200
const getCoinWma = async (req, res) => {
    const { key } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        //check Coin already is exists or not
        // const isExistCoinQuery = `SELECT * FROM sale_target_header WHERE LOWER(TRIM(coin))= ? AND untitled_id = ?`;
        // const isExistCoinResult = await pool.query(isExistCoinQuery, [coin.toLowerCase(), untitled_id]);
        // if (isExistCoinResult[0].length > 0) {
        //     return error422(" Coin is already exists.", res);
        // }

        // Start a transaction
        let coinQuery = `SELECT * FROM coins
        WHERE status = 1`;
        // if (key) {
        //     const lowercaseKey = key.toLowerCase().trim();
        //     coinQuery += ` AND LOWER(short_name) LIKE '%${lowercaseKey}%'`;  
        // }
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            coinQuery += ` AND TRIM(LOWER(short_name)) = '${lowercaseKey}'`;
        }
        coinQuery += ` ORDER BY short_name ASC`;
        coinQuery += ` limit 200`;
        const coinResult = await connection.query(coinQuery);
        const coin = coinResult[0];

        res.status(200).json({
            status: 200,
            message: "Coin retrieved successfully.",
            data: coin,
        });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//get coin active price display  -- cron job
// const getCoinActiveCurrentPrice = async (req, res) => {
//     // Attempt to obtain a database connection
//     let connection = await getConnection();

//     try {
//         // Start a transaction
//         await connection.beginTransaction();
//         // Start a transaction
//         let coinQuery = `SELECT * FROM coins WHERE status = 1`;
//         const coinResult = await connection.query(coinQuery);
//         const coin = coinResult[0];
//         for (let i = 0; i < coinResult.length; i++) {
//             const element = coinResult[i];
//             const tricker = element[i].short_name; // Short name of the coin
//             console.log(tricker);
            
//             if(tricker){

//             const query = 'SELECT url, tricker, currency_name FROM api_settings WHERE tricker = ?';
//             const result = await connection.query(query, [tricker]);
//             if (result.length > 0) {
//             const fullUrls = result[0].map(row => `${row.url}${row.tricker}${row.currency_name}`);
//             const currentPriceUrl = await axios.get(fullUrls);
//             const price = currentPriceUrl.data.USD;
            
//             console.log(price);
//             }
//         }
//         }
//         res.status(200).json({
//             status: 200,
//             message: "Coin Active Current Price retrieved successfully.",
//             data: coin,
//         });
//     } catch (error) {
//         error500(error, res);
//     } finally {
//         if (connection) {
//             connection.release();
//         }
//     }
// };
// const getCoinActiveCurrentPrice = async (req, res) => {
//     // Attempt to obtain a database connection
//     let connection = await getConnection();

//     try {
//         // Start a transaction
//         await connection.beginTransaction();

//         // Fetch active coins from the coins table
//         let coinQuery = `SELECT * FROM coins WHERE status = 1`;
//         const [coinResult] = await connection.query(coinQuery); // coinResult contains rows from the query

//         // Loop through each active coin
//         for (let i = 0; i < coinResult.length; i++) {
//             const element = coinResult[i];
//             const tricker = element.short_name; // Short name of the coin
            
// console.log('name',tricker);

//             if (tricker) {
//                 // Fetch URL, tricker, and currency_name from api_settings table
//                 const query = 'SELECT url, tricker, currency_name FROM api_settings WHERE tricker = ?';
//                 const [apiSettings] = await connection.query(query, [tricker]);
                
                
//                 if (apiSettings.length > 0) {
                   
//                     const fullUrl = `${apiSettings[0].url}${apiSettings[0].tricker}${apiSettings[0].currency_name}`;
                   

//                     // // Make the API call to fetch the current price
//                     // for (let i = 0; i < tricker.length; i++ ){
//                     const currentPriceUrl = await axios.get(fullUrl);
//                     const price = currentPriceUrl.data.USD; // Assuming the API returns a price field in USD
                    
// console.log('hiii',price);


//                 // }
//             }
//             }
//         }

//         // Commit the transaction after processing
//         await connection.commit();

//         // Send success response
//         res.status(200).json({
//             status: 200,
//             message: "Coin Active Current Price retrieved successfully.",
//             data: coinResult, // Return the coins data as part of the response
//         });
//     } catch (error) {
//         error500(error, res); // Handle the error
//     } finally {
//         if (connection) {
//             connection.release(); // Release the connection
//         }
//     }
// };


const getCoinActiveCurrentPrice = async (req, res) => {
    let connection = await getConnection(); // Obtain a database connection

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Fetch active coins from the coins table
        const coinQuery = `SELECT * FROM coins WHERE status = 1`;
        const [coinResult] = await connection.query(coinQuery); // coinResult contains rows from the query

        // Array to store the coin prices
        const coinPrices = [];

        // Loop through each active coin
        for (let i = 0; i < coinResult.length; i++) {
            const element = coinResult[i];
            const tricker = element.short_name; // Short name of the coin

            if (tricker) {
                // Fetch URL, tricker, and currency_name from the api_settings table
                const query = 'SELECT url, tricker, currency_name FROM api_settings WHERE tricker = ?';
                const [apiSettings] = await connection.query(query, [tricker]);

                if (apiSettings.length > 0) {
                    // Loop through each API setting (handle multiple settings per tricker if needed)
                    for (let j = 0; j < apiSettings.length; j++) {
                        const apiSetting = apiSettings[j];

                        // Construct the URL dynamically for each tricker
                        const fullUrl = `${apiSetting.url}${apiSetting.tricker}${apiSetting.currency_name}`;
                        

                        try {
                            // Make the API call to fetch the current price
                            const response = await axios.get(fullUrl);
                            const price = response.data.USD; // Assuming the API returns a price in USD

                            // Add the coin price to the result array
                            coinPrices.push({
                                tricker,
                                price,
                            });
                        } catch (apiError) {
                            // console.error(`Error fetching price for ${tricker}:`, apiError.message);
                            coinPrices.push({
                                tricker,
                                price: null,
                                error: apiError.message,
                            });
                        }
                    }
                } else {
                    // console.warn(`No API settings found for tricker: ${tricker}`);
                    coinPrices.push({
                        tricker,
                        price: null,
                        error: 'No API settings found',
                    });
                }
            }
        }

        // Commit the transaction after processing
        await connection.commit();

        // Send success response
        res.status(200).json({
            status: 200,
            message: "Coin Active Current Price retrieved successfully.",
            data: coinPrices, // Return the coin prices as part of the response
        });
    } catch (error) {
        // console.error('Error:', error.message);
        error500(error, res); // Handle the error
    } finally {
        if (connection) {
            connection.release(); // Release the connection
        }
    }
};




module.exports = {
    addCoin,
    getCoins,
    getCoin,
    getCoinWma,
    getCoinActiveCurrentPrice
}
    