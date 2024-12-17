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
                let coinValue = [element.Id, element.ImageUrl, element.Symbol, element.FullName, element.Id];
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
    console.log(`Total empty images: ${emptyImageCount}`);
    console.log(`Total duplicates: ${duplicateCount}`);
    console.log(`Total inserted: ${insertCount}`);
    
    connection.commit();
    res.status(200).json({
        status:200,
        message:"Coin added successfully!"
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
            message:"Coin retrived successfully!",
            data:coinResult[0]
        })
    } catch (error) {
        await connection.rollback()
        return error500(error, res)
    } finally {
        if(connection) connection.release()
    }
};

//get coin active
const getCoinWma = async (req, res) => {

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Start a transaction
        let coinQuery = `SELECT * FROM coins
        WHERE status = 1 ORDER BY coin_name `;
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

module.exports = {
    addCoin,
    getCoins,
    getCoinWma
}