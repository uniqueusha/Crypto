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

// add sale target header
const addSaleTargetHeader = async (req, res) => {
    const coin = req.body.coin ? req.body.coin: '';
    const base_price = req.body.base_price ? req.body.base_price: '';
    const currant_price = req.body.currant_price ? req.body.currant_price: '';
    const return_x = req.body.return_x ? req.body.return_x: '';
    const final_sale_price = req.body.final_sale_price ? req.body.final_sale_price: '';
    const available_coins = req.body.available_coins ? req.body.available_coins	: '';
    // const sale_target_coin = req.body.sale_target_coin ? req.body.sale_target_coin	: '';
    // const sale_target = req.body.sale_target ? req.body.sale_target	: '';
    // const target_status = req.body.target_status ? req.body.target_status: '';
    // const complition_status = req.body.complition_status ? req.body.complition_status: '';
    const setTargetFooter = req.body.setTargetFooter ? req.body.setTargetFooter: [];
    if (!coin) {
        return error422("Coin is required.", res);
    }  else if (!base_price) {
        return error422("Base Price is required.", res);
    }  else if (!currant_price) {
        return error422("Currant Price is required.", res);
    }  else if (!return_x) {
        return error422("Return_x is required.", res);
    }  else if (!final_sale_price) {
        return error422("Final Sale Price is required.", res);
    }  else if (!available_coins) {
        return error422("Available Coins is required.", res);
    } 
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
        //insert into Sale target header
        const insertSaleTargetHeaderQuery = `INSERT INTO sale_target_header (coin, base_price, currant_price, return_x, final_sale_price, available_coins) VALUES (?, ?, ?, ?, ?, ?)`;
        const insertSaleTargetHeaderValue = [coin, base_price, currant_price, return_x, final_sale_price, available_coins];
        const insertSaleTargetHeaderResult = await connection.query(insertSaleTargetHeaderQuery,insertSaleTargetHeaderValue);
        const sale_target_id = insertSaleTargetHeaderResult[0].insertId
        //insert into set target footer
        let setTargetFooterArray = setTargetFooter
        for (let i = 0; i < 5; i++) {
            const element = setTargetFooterArray[i];
            if (!element || typeof element !== 'object') {
                continue;
            }
            const sale_target_coin  = element.sale_target_coin  ? element.sale_target_coin : '';
            const sale_target = element.sale_target ? element.sale_target: '';
            const target_status_id = element.target_status_id ? element.target_status_id: '';
            const complition_status_id = element.complition_status_id ? element.complition_status_id: '';
            
            const targetValue = (available_coins / 100) * sale_target_coin;

            let insertSetTargetFooterQuery = 'INSERT INTO set_target_footer (sale_target_id, sale_target_coin, sale_target, target_status_id, complition_status_id) VALUES (?,?,?,?,?)';
            let insertSetTargetFootervalues = [sale_target_id, targetValue, sale_target, target_status_id, complition_status_id];
            let insertSetTargetFooterResult = await connection.query(insertSetTargetFooterQuery, insertSetTargetFootervalues);
        }
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Sale Target Added successfully",
        });
    }catch (error) {
        console.log(error);
        
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

module.exports = {
    addSaleTargetHeader
}