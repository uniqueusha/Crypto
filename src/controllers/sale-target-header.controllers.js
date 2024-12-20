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

//error 422 handler
error422 = (message, res) => {
    return res.status(422).json({
        status: 422,
        message: message
    })
};
//error 500 handler
error500 = (error, res) => {
    console.log(error);
    return res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
        error: error
    })
};

const addSaleTargetHeader = async (req, res) => {
        const coin = req.body.coin ? req.body.coin: '';
        const base_price = req.body.base_price ? req.body.base_price: '';
        const return_x = req.body.return_x ? req.body.return_x: '';
        const final_sale_price = req.body.final_sale_price ? req.body.final_sale_price: '';
        const available_coins = req.body.available_coins ? req.body.available_coins	: '';
        const setTargetFooter = req.body.setTargetFooter ? req.body.setTargetFooter: [];
        const untitled_id = req.companyData.untitled_id;
        if (!coin) {
            return error422("Coin is required.", res);
        }  else if (!base_price) {
            return error422("Base Price is required.", res);
        }  else if (!return_x) {
            return error422("Return_x is required.", res);
        }  else if (!available_coins) {
            return error422("Available Coins is required.", res);
        } 
        let connection = await getConnection();
        try {
            
            //Start the transaction
            await connection.beginTransaction();
            // let final_sale_price = base_price * return_x;

            const insertSaleTargetHeaderQuery = `INSERT INTO sale_target_header (coin, base_price, return_x, final_sale_price, available_coins, untitled_id) VALUES (?, ?, ?, ?, ?, ?)`;
            const insertSaleTargetHeaderValue = [coin, base_price, return_x, final_sale_price, available_coins, untitled_id];
            const insertSaleTargetHeaderResult = await connection.query(insertSaleTargetHeaderQuery,insertSaleTargetHeaderValue);
            const sale_target_id = insertSaleTargetHeaderResult[0].insertId
            
            //insert into set target footer
            let setTargetFooterArray = setTargetFooter.reverse()
            let sale_target = final_sale_price
            for (let i =0 ; i < setTargetFooterArray.length; i++) {
                const element = setTargetFooterArray[i];
                if (!element || typeof element !== 'object') {
                    continue;
                }
                
                sale_target = Math.round(sale_target -((sale_target-base_price)/4),0);
                if (i == 0) {
                    sale_target = final_sale_price
                }
                
                const sale_target_coin  = element.sale_target_coin  ? element.sale_target_coin : '';
                const target_status_id = element.target_status_id ? element.target_status_id: '';
                const complition_status_id = element.complition_status_id ? element.complition_status_id: '';
                const sale_target_percent = element.sale_target_percent ? element.sale_target_percent: '';
                
                const targetValue = (available_coins / 100) * sale_target_coin;

                let insertSetTargetFooterQuery = 'INSERT INTO set_target_footer (sale_target_id, sale_target_coin, sale_target, target_status_id, complition_status_id, sale_target_percent, untitled_id) VALUES (?,?,?,?,?,?,?)';
                let insertSetTargetFootervalues = [sale_target_id, targetValue, sale_target, target_status_id, complition_status_id, sale_target_percent, untitled_id];
                let insertSetTargetFooterResult = await connection.query(insertSetTargetFooterQuery, insertSetTargetFootervalues);
                
            }
            //commit the transation
            await connection.commit();
            res.status(200).json({
                status: 200,
                message: "Sale Target Added successfully",
            });
        }catch (error) {
            return error500(error, res);
        } finally {
            await connection.release();
        }
};

//create current price
const createCurrentPrice = async (req, res) => {
    const tricker = req.body.tricker ? req.body.tricker: '';
    if (!tricker) {
        return error422("Tricker Symbol is required.", res);
    }   
    let connection = await getConnection();
    try {
        
        //Start the transaction
        await connection.beginTransaction();
        // let final_sale_price = base_price * return_x;
        if (!tricker) {
            const insertTrickerQuery = `INSERT INTO api_settings ( tricker ) VALUES (?)`;
            const insertTrickerResult = await connection.query(insertTrickerQuery, [tricker]);  
        } else {
            const updateTrickerQuery = `UPDATE api_settings SET tricker = ? WHERE id = 1`;
            const updateTrickerResult = await connection.query(updateTrickerQuery, [tricker]);
        }
        const query = 'SELECT url, tricker, currency_name FROM api_settings';
        const result = await connection.query(query);
        // Loop through the results and concatenate the fields
        const fullUrls = result[0].map(row => `${row.url}${row.tricker}${row.currency_name}`);
        const currentPriceUrl = await axios.get(fullUrls);
        const price = currentPriceUrl.data.USD;
        
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Sale Target Added successfully",
            data:{
            currentPrice: price
            }
        });
    }catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//Currant Price Update Target Complition Status (cron job)
const currantPriceUpdateTargetComplitionStatus = async (req, res) => {
    const untitledId = req.companyData.untitled_id;
    let connection = await getConnection();
    try {
        
        //Start the transaction
        await connection.beginTransaction();
        
        const getSaleTargetHeaderQuery = `SELECT sth.currant_price, sth.untitled_id, stf.sale_target, stf.untitled_id AS footer_untitled_id  FROM sale_target_header sth
        LEFT JOIN set_target_footer stf
        ON stf.sale_target_id = sth.sale_target_id
        WHERE stf.untitled_id = ?`;

        const result = await connection.query(getSaleTargetHeaderQuery, [untitledId]);
        
        const resultReverse = result[0].reverse();
        
        // Check if result contains rows
        if (resultReverse && resultReverse.length > 0) {
            // Loop through the results to compare the values
            
            for (let i = 0; i < resultReverse.length; i++) {
                const row = resultReverse[i];
                const currantPrice = parseFloat(row.currant_price);
                const saleTarget = parseFloat(row.sale_target);
            
                // Check if currentPrice is less than saleTarget
                if (currantPrice > saleTarget) {
                    const updateStatusQuery = 'UPDATE set_target_footer SET target_status_id = 1 WHERE untitled_id = ? AND sale_target = ?';
                    const updateStatusResult = await connection.query (updateStatusQuery, [ untitledId, saleTarget])
                }
            }
        } 
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Target Status Update successfully",
        });
    }catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};
 

module.exports = {
    addSaleTargetHeader,
    currantPriceUpdateTargetComplitionStatus,
    createCurrentPrice
}