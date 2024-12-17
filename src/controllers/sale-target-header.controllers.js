const pool = require("../../db");

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
        const currant_price = req.body.currant_price ? req.body.currant_price: '';
        const return_x = req.body.return_x ? req.body.return_x: '';
        const available_coins = req.body.available_coins ? req.body.available_coins	: '';
        const setTargetFooter = req.body.setTargetFooter ? req.body.setTargetFooter: [];
        if (!coin) {
            return error422("Coin is required.", res);
        }  else if (!base_price) {
            return error422("Base Price is required.", res);
        }  else if (!currant_price) {
            return error422("Currant Price is required.", res);
        }  else if (!return_x) {
            return error422("Return_x is required.", res);
        }  else if (!available_coins) {
            return error422("Available Coins is required.", res);
        } 
        let connection = await getConnection();
        try {
            const final_sale_price = base_price*return_x;
            //Start the transaction
            await connection.beginTransaction();
            //insert into Sale target header
            const insertSaleTargetHeaderQuery = `INSERT INTO sale_target_header (coin, base_price, currant_price, return_x, final_sale_price, available_coins) VALUES (?, ?, ?, ?, ?, ?)`;
            const insertSaleTargetHeaderValue = [coin, base_price, currant_price, return_x, final_sale_price, available_coins];
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
                if (i==0) {
                    sale_target = final_sale_price
                }
                
                const sale_target_coin  = element.sale_target_coin  ? element.sale_target_coin : '';
                const target_status_id = element.target_status_id ? element.target_status_id: '';
                const complition_status_id = element.complition_status_id ? element.complition_status_id: '';
                const sale_target_percent = element.sale_target_percent ? element.sale_target_percent: '';
                
                const targetValue = (available_coins / 100) * sale_target_coin;

                let insertSetTargetFooterQuery = 'INSERT INTO set_target_footer (sale_target_id, sale_target_coin, sale_target, target_status_id, complition_status_id, sale_target_percent) VALUES (?,?,?,?,?,?)';
                let insertSetTargetFootervalues = [sale_target_id, targetValue, sale_target, target_status_id, complition_status_id, sale_target_percent];
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


module.exports = {
    addSaleTargetHeader
}