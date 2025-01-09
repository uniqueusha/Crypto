const pool = require("../../db");
const axios = require('axios');
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
        error: error
    });
};

//add current_price
const addCurrentPrice = async (req, res) => {
    // const ticker = req.body.ticker ? req.body.ticker.trim() : "";

    
            
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
        //check ticker
        const isExistTickerQuery = `SELECT ticker FROM sale_target_header`;
        const isExistTickerResult = await connection.query(isExistTickerQuery);
        
       
            const element = isExistTickerResult[0];
             const tickers = isExistTickerResult[0]
            .map(element => element.ticker) 
            .join(',');
            // console.log(tickers);
            
            
            
            
   
        const query = 'SELECT url, ticker, currency_name, api_key FROM api_settings';
            const result = await connection.query(query);
            // Loop through the results and concatenate the fields
            const fullUrls = result[0].map(row => `${row.url}${tickers}${row.currency_name}${row.api_key}`);
            const currentPriceUrl = await axios.get(fullUrls);
            const cryptoSymbol = tickers;
            const tickerArray = tickers.split(',');
            
            tickerArray.forEach(cryptoSymbol => {
                const price = currentPriceUrl.data[cryptoSymbol]?.USD; // Safely access USD price
                 console.log(price);
                 
            });
            // console.log(currentPriceUrl.data);
            // const price = currentPriceUrl.data[cryptoSymbol];
            
    

        //insert into target status
        const insertComplitionStatusQuery = `INSERT INTO current_ptice (ticker, current_price) VALUES (?, ?)`;
        const insertComplitionStatusValues = [cryptoSymbol, price];
        const insertComplitionStatusResult = await connection.query(insertComplitionStatusQuery, insertComplitionStatusValues);
        
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: `Current Price added successfully`,
        });
    } catch (error) {
        console.log(error);
        
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    addCurrentPrice
}
