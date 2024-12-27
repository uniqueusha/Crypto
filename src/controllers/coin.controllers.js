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
    
    // Log the counts
    // console.log(`Total empty images: ${emptyImageCount}`);
    // console.log(`Total duplicates: ${duplicateCount}`);
    // console.log(`Total inserted: ${insertCount}`);
    
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

//get coins list...
const getCoins = async(req, res)=>{
    let connection;  
    // return res.json("Hii")
    try {
        connection = await pool.getConnection();

        let coinQuery = "SELECT * FROM coins";
        let coinResult = await connection.query(coinQuery)
        for (let index = 0; index < coinResult[0].length; index++) {
            const element = coinResult[0][index];
            // let response = await axios.get(
            //     `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${element.ticker_symbol}&tsyms=USD&api_key=c9dbe355a7cb4069138048c0f96468825e753dce674be4bb1e0af386b6c6e2cc`
            //   );
            // let ticker_symbol = Object.keys(response.data)
            
            // let rawData = response.data[ticker_symbol[0]]
            // console.log(rawData);

        }
        connection.commit()
        return res.status(200).json({
            status:200,
            message:"Coins retrived successfully!",
            data:coinResult[0]
        })
    } catch (error) {
        await connection.rollback()
        return error500(error, res)
    } finally {
        if(connection) connection.release()
    }
};

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
        const isExistCoinQuery = `SELECT * FROM sale_target_header WHERE LOWER(TRIM(coin))= ? AND untitled_id = ?`;
        const isExistCoinResult = await pool.query(isExistCoinQuery, [coin.toLowerCase(), untitled_id]);
        if (isExistCoinResult[0].length > 0) {
            return error422(" Coin is already exists.", res);
        }
        
        // Start a transaction
        let coinQuery = `SELECT * FROM coins
        WHERE status = 1`;
        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            coinQuery += ` AND LOWER(coin_name) LIKE '%${lowercaseKey}%'`;  
        }
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

            console.log('Coin Name:', tricker);

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
                        console.log('Request URL:', fullUrl);

                        try {
                            // Make the API call to fetch the current price
                            const response = await axios.get(fullUrl);
                            const price = response.data.USD; // Assuming the API returns a price in USD

                            console.log(`Price for ${tricker}:`, price);

                            // Add the coin price to the result array
                            coinPrices.push({
                                tricker,
                                price,
                            });
                        } catch (apiError) {
                            console.error(`Error fetching price for ${tricker}:`, apiError.message);
                            coinPrices.push({
                                tricker,
                                price: null,
                                error: apiError.message,
                            });
                        }
                    }
                } else {
                    console.warn(`No API settings found for tricker: ${tricker}`);
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
        console.error('Error:', error.message);
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