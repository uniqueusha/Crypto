const pool = require("../../db");
const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
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

//Add Set target
const addSaleTargetHeader = async (req, res) => {
        const coin = req.body.coin ? req.body.coin: '';
        const base_price = req.body.base_price ? req.body.base_price: '';
        const currant_price = req.body.currant_price ? req.body.currant_price: '';
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

            //check Coin already is exists or not
            const isExistCoinQuery = `SELECT * FROM sale_target_header WHERE LOWER(TRIM(coin))= ? AND untitled_id = ? AND status = 1`;
            const isExistCoinResult = await pool.query(isExistCoinQuery, [coin.toLowerCase(), untitled_id]);
            if (isExistCoinResult[0].length > 0) {
                return error422(" Coin is already exists.", res);
            }
            
            //Start the transaction
            await connection.beginTransaction();
            // let final_sale_price = base_price * return_x;

            const insertSaleTargetHeaderQuery = "INSERT INTO sale_target_header (coin, base_price, currant_price, return_x, final_sale_price, available_coins, untitled_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
            const insertSaleTargetHeaderValue = [coin, base_price, currant_price, return_x, final_sale_price, available_coins, untitled_id];
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
                
                // sale_target = Math.round(sale_target -((sale_target-base_price)/4),0);
                // if (i > 0) {
                    sale_target = sale_target - ((sale_target - base_price) / 4);
                // }

                if (i == 0) {
                    sale_target = final_sale_price
                }
                
                const sale_target_coin  = element.sale_target_coin  ? element.sale_target_coin : '';
                
                const sale_target_percent = element.sale_target_percent ? element.sale_target_percent: '';
                
                const targetValue = (available_coins / 100) * sale_target_coin;
                
                let insertSetTargetFooterQuery = "INSERT INTO set_target_footer (sale_target_id, sale_target_coin, sale_target, sale_target_percent, untitled_id) VALUES (?,?,?,?,?)";
                let insertSetTargetFootervalues = [sale_target_id, targetValue, sale_target, sale_target_percent, untitled_id];
                let insertSetTargetFooterResult = await connection.query(insertSetTargetFooterQuery, insertSetTargetFootervalues);
   
            }
            //commit the transation
            await connection.commit();
            res.status(200).json({
                status: 200,
                message: "Set Target Added successfully",
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
            message: "Fetch Current Price successfully",
            data:{
            currentPrice: price
            }
        });
    }catch (error) {
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
        
        const getSaleTargetHeaderQuery = `SELECT sth.currant_price, sth.untitled_id, stf.sale_target, stf.untitled_id AS footer_untitled_id, stf.complition_id  FROM sale_target_header sth
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
                const complitionId = parseFloat(row.complition_id);

                if (complitionId === 4) {
                    // console.log(`Skipping update for complition_id = 4, Sale Target: ${saleTarget}`);
                    continue;
                }
            
                // Check if currentPrice is less than saleTarget
                if (currantPrice > saleTarget ) {
                    const updateStatusQuery = 'UPDATE set_target_footer SET target_id = 2, complition_id = 3 WHERE untitled_id = ? AND sale_target = ?';
                    const updateStatusResult = await connection.query (updateStatusQuery, [ untitledId, saleTarget]);
                } else {
                    const updateStatusQuery = 'UPDATE set_target_footer SET target_id = 1, complition_id = 2 WHERE untitled_id = ? AND sale_target = ?';
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
 
//Get Set Target List
const getSetTargets = async (req, res) => {
    const untitledId = req.companyData.untitled_id;
    const { page, perPage, key } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getSetTargetQuery = `SELECT * FROM sale_target_header WHERE untitled_id = ${untitledId} AND status = 1`;
        let countQuery = `SELECT COUNT(*) AS total FROM sale_target_header WHERE untitled_id = ${untitledId} `;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getSetTargetQuery += ` AND status = 1`;
                countQuery += ` AND status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getSetTargetQuery += ` AND status = 0`;
                countQuery += ` AND status = 0`;
            } else {
                getSetTargetQuery += ` AND  LOWER(coin) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(coin) LIKE '%${lowercaseKey}%' `;
            }
        }
        getSetTargetQuery += " ORDER BY sale_date DESC";
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getSetTargetQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
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
            setTarget[i]['footer']= setFooterResult[0].reverse();
        }

        const data = {
            status: 200,
            message: "Set Target retrieved successfully",
            data: setTarget,
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
const getSetTargetDownload = async (req, res) => {
    const untitledId = req.companyData.untitled_id;
    const { key } = req.query;

    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        // Start a transaction
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
        getSetTargetQuery += " ORDER BY sale_date DESC";

        let result = await connection.query(getSetTargetQuery);
        let setTarget = result[0];

        // Prepare flattened data for Excel
        let flattenedData = [];

        for (let i = 0; i < setTarget.length; i++) {
            const element = setTarget[i];

            // Fetch footer data for each sale_target
            const setFooterQuery = `SELECT stf.*,ts.target_status, cs.complition_status FROM set_target_footer stf 
            LEFT JOIN target_status ts
            ON ts.target_id = stf.target_id
            LEFT JOIN complition_status cs
            ON cs.complition_id = stf.complition_id 
            WHERE stf.sale_target_id = ${element.sale_target_id} AND
            stf. untitled_id = ${untitledId}`;
            const setFooterResult = await connection.query(setFooterQuery);
            const setFooterResultReverse = setFooterResult[0].reverse(); 
            // If there are footer rows, add each to the flattenedData array
            if (setFooterResultReverse.length > 0) {
                setFooterResultReverse.forEach((footer) => {
                    flattenedData.push({
                        sale_target_id: element.sale_target_id,
                        sale_date: element.sale_date,
                        coin: element.coin,
                        base_price: element.base_price,
                        currant_price: element.currant_price,
                        return_x: element.return_x,
                        final_sale_price: element.final_sale_price,
                        available_coins: element.available_coins,
                        sale_target_coin: footer.sale_target_coin,
                        sale_target: footer.sale_target,
                        target_status: footer.target_status,
                        complition_status: footer.complition_status,
                        footer_percent: footer.sale_target_percent,
                    });
                });
            } 
        }

        if (flattenedData.length === 0) {
            return error422("No data found.", res);
        }

        // Create a new workbook
        const workbook = xlsx.utils.book_new();

        // Create a worksheet and add flattened data to it
        const worksheet = xlsx.utils.json_to_sheet(flattenedData);

        // Add the worksheet to the workbook
        xlsx.utils.book_append_sheet(workbook, worksheet, "SetTargetInfo");

        // Create a unique file name (e.g., based on timestamp)
        const excelFileName = `exported_data_${Date.now()}.xlsx`;

        // Write the workbook to a file
        xlsx.writeFile(workbook, excelFileName);

        // Send the file to the client for download
        res.download(excelFileName, (err) => {
            if (err) {
                // Handle any errors that occur during download
                console.error(err);
                res.status(500).send("Error downloading the file.");
            } else {
                // Delete the file after it's been sent
                fs.unlinkSync(excelFileName);
            }
        });

        // Commit the transaction
        await connection.commit();
    } catch (error) {
        return error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

// update sell to sold
const updateSellSold = async (req, res) => {
    const untitledId = req.companyData.untitled_id;

    let connection = await getConnection();
    try {
        // Start the transaction
        await connection.beginTransaction();

        // Fetch sale target header and footer details
        const getSaleTargetHeaderQuery = `
            SELECT sth.currant_price, sth.untitled_id, sth.base_price, stf.sale_target, stf.untitled_id AS footer_untitled_id, 
            stf.complition_id, sth.coin, stf.set_footer_id, stf.sale_target_percent 
            FROM sale_target_header sth
            LEFT JOIN set_target_footer stf ON stf.sale_target_id = sth.sale_target_id
            WHERE stf.untitled_id = ?`;
        const result = await connection.query(getSaleTargetHeaderQuery, [untitledId]);

        const resultReverse = result[0].reverse();

        // Variable to hold the data for insertion after the loop
        let soldCoinData = null;

        if (resultReverse && resultReverse.length > 0) {
            // Loop through the results to compare values
            for (let i = 0; i < resultReverse.length; i++) {
                const row = resultReverse[i];
                
                const complitionId = parseFloat(row.complition_id);
                const complition_id = req.body.complition_id ? parseInt(req.body.complition_id) : '';
                const currant_price = req.body.currant_price ? parseFloat(req.body.currant_price) : '';
                const set_footer_id = req.body.set_footer_id ? parseFloat(req.body.set_footer_id) : '';
                const coin = req.body.coin ? req.body.coin : '';
                const base_price = req.body.base_price ? parseFloat(req.body.base_price) : '';


                // Check if completion ID is 3
                if (complitionId === 3) {
                    // Update complition_id to 4
                    const updateSoldQuery = `
                        UPDATE set_target_footer 
                        SET complition_id = ?
                        WHERE untitled_id = ? AND complition_id = 3 AND set_footer_id = ?`;
                    await connection.query(updateSoldQuery, [complition_id, untitledId, set_footer_id]);

                    // Check if complition_id is 4, collect data for insertion after the loop
                    if (complition_id === 4) {
                        // Gather values to insert only once
                        // const coin = row.coin;
                        const sale_target_percent = row.sale_target_percent;
                       

                        // Collect only one set of values to insert after the loop
                        if (coin && sale_target_percent && currant_price && base_price) {
                            soldCoinData = [coin, set_footer_id, sale_target_percent, currant_price, base_price, untitledId];
                        }
                    }
                }
            }
        }

        // Insert into sold_coin table once after the loop, only if the data is available
        if (soldCoinData) {
            const insertSoldCoinQuery = `
                INSERT INTO sold_coin (coin, set_footer_id, sale_target_percent, sold_current_price, base_price, untitled_id) 
                VALUES (?, ?, ?, ?, ?, ?)`;
            await connection.query(insertSoldCoinQuery, soldCoinData);
        }

        // Commit the transaction
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Sell to Sold updated successfully",
        });
    } catch (error) {
        // Rollback the transaction in case of error
        if (connection) await connection.rollback();
       
        return error500(error, res);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getSetTargetCount = async (req, res) => {
    const untitledId = req.companyData.untitled_id;
    // const { created_at, user_id } = req.query;
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
            set_target_count: set_target_count
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
    const coin = req.body.coin ? req.body.coin: '';
    const base_price = req.body.base_price ? req.body.base_price: '';
    const currant_price = req.body.currant_price ? req.body.currant_price: '';
    const return_x = req.body.return_x ? req.body.return_x: '';
    const final_sale_price = req.body.final_sale_price ? req.body.final_sale_price: '';
    const available_coins = req.body.available_coins ? req.body.available_coins	: '';
    const setTargetFooter = req.body.setTargetFooter ? req.body.setTargetFooter: [];
    const untitled_id = req.companyData.untitled_id;
    if (!coin) {
        return error422("Coin is required.", res);
    }  else if (!return_x) {
        return error422("Return_x is required.", res);
    }  else if (!available_coins) {
        return error422("Available Coins is required.", res);
    } 

    // Check if sale target header exists
    const saleTargetHeaderQuery = "SELECT * FROM sale_target_header WHERE sale_target_id = ?";
    const saleTargetHeaderResult = await pool.query(saleTargetHeaderQuery, [sale_target_id]);
    if (saleTargetHeaderResult[0].length === 0) {
        return error422("Sale Target Header Not Found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // let final_sale_price = base_price * return_x;

        // Update Task Heater
        const updatesaleTargetHeaderQuery = `UPDATE sale_target_header SET coin = ?, currant_price = ?, return_x = ?, final_sale_price = ?, available_coins = ? WHERE sale_target_id = ? AND untitled_id = ?`;
        await connection.query(updatesaleTargetHeaderQuery, [coin, currant_price, return_x, final_sale_price, available_coins, sale_target_id, untitled_id]);
        
        //update into sale target header
        let setTargetFooterArray = setTargetFooter.reverse();
        let sale_target = final_sale_price

        for (let i =0 ; i < setTargetFooterArray.length; i++) {
            const element = setTargetFooterArray[i];
            if (!element || typeof element !== 'object') {
                continue;
            }
            // sale_target = Math.round(sale_target -((sale_target-base_price)/4),0);
            sale_target = sale_target - ((sale_target - base_price) / 4);

            if (i == 0) {
                sale_target = final_sale_price
            }
            
            const set_footer_id = element.set_footer_id ? element.set_footer_id : '';

            const sale_target_coin  = element.sale_target_coin  ? element.sale_target_coin : '';
            // const sale_target_percent = element.sale_target_percent ? element.sale_target_percent: '';
            
            const targetValue = (available_coins / 100) * sale_target_coin;

            let updateSetTargetFooterQuery = `UPDATE set_target_footer SET sale_target_id = ?, sale_target_coin = ?, sale_target = ? WHERE sale_target_id = ? AND set_footer_id = ? AND untitled_id = ?`;
            let updateSetTargetFootervalues = [sale_target_id, targetValue, sale_target, sale_target_id, set_footer_id, untitled_id];
            let updateSetTargetFooterResult = await connection.query(updateSetTargetFooterQuery, updateSetTargetFootervalues);
        }
        // Commit the transaction
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
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getSetTargetQuery = `SELECT * FROM sale_target_header WHERE sale_target_id = ${sale_target_id} AND untitled_id = ${untitledId} `;
        let result = await connection.query(getSetTargetQuery);
        if (result[0].length == 0) {
            return error422("Sale target Header Not Found.", res);
       }
        let setTarget = result[0][0];
 
        //get set_header_footer
        
            let setFooterQuery = `SELECT stf.*,ts.target_status, cs.complition_status FROM set_target_footer stf 
            LEFT JOIN target_status ts
            ON ts.target_id = stf.target_id
            LEFT JOIN complition_status cs
            ON cs.complition_id = stf.complition_id 
            WHERE stf.sale_target_id = ? AND
            stf. untitled_id = ${untitledId}`;
            setFooterResult = await connection.query(setFooterQuery, [sale_target_id]);
            setTarget['footer']= setFooterResult[0].reverse();

        const data = {
            status: 200,
            message: "Set Target retrieved successfully",
            data: setTarget
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
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Check if the set target  exists
        const saleTargetHeaderQuery = "SELECT * FROM sale_target_header WHERE sale_target_id = ? AND untitled_id = ?";
        const saleTargetHeaderResult = await connection.query(saleTargetHeaderQuery, [sale_target_id, untitledId]);
        if (saleTargetHeaderResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Sale Target Header Not Found.",
            });
        }

        // Validate the status parameter
        if (status !== 0 && status !== 1) {
            return res.status(400).json({
                status: 400,
                message:
                    "Invalid status value. Status must be 0 (inactive) or 1 (active).",
            });
        }

        // Soft update the set target status
        const updateQuery = `
              UPDATE sale_target_header
              SET status = ?
              WHERE sale_target_id = ? AND untitled_id = ?`;
        await connection.query(updateQuery, [status, sale_target_id, untitledId]);

        const updatefooterQuery = `
              UPDATE set_target_footer
              SET status = ?
              WHERE sale_target_id = ? AND untitled_id = ?`;
        await connection.query(updatefooterQuery, [status, sale_target_id, untitledId]);
    
        const statusMessage = status === 1 ? "activated" : "Deleted";
        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Set Target ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//set target reached list

const getSetTargetReached = async (req, res) => {
    const untitledId = req.companyData.untitled_id;
    const { page, perPage, key } = req.query;

    let connection = await getConnection();
    try {
        // Start the transaction
        await connection.beginTransaction();

        // Base queries
        let getSetTargetQuery = `
            SELECT * FROM sale_target_header 
            WHERE untitled_id = ${untitledId} AND status = 1`;
        let countQuery = `
            SELECT COUNT(*) AS total 
            FROM sale_target_header 
            WHERE untitled_id = ${untitledId}`;

        // Add search/filtering if a key is provided
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

        getSetTargetQuery += " ORDER BY sale_date DESC";

        // Apply pagination if both `page` and `perPage` are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getSetTargetQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }

        // Fetch the header data
        let result = await connection.query(getSetTargetQuery);
        let setTarget = result[0];

        // Filter headers based on footer data
        let filteredData = [];
        for (let i = 0; i < setTarget.length; i++) {
            const element = setTarget[i];

            // Fetch all footer data for the current header
            let setFooterQuery = `
                SELECT stf.*, ts.target_status, cs.complition_status 
                FROM set_target_footer stf
                LEFT JOIN target_status ts ON ts.target_id = stf.target_id
                LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id 
                WHERE stf.sale_target_id = ${element.sale_target_id} 
                AND stf.untitled_id = ${untitledId}`;

            const setFooterResult = await connection.query(setFooterQuery);

            // Check if at least one footer record has `target_id = 2`
            const hasTargetId2 = setFooterResult[0].some((footer) => footer.target_id === 2);

            // Include the header only if `target_id = 2` exists, along with all footer data
            if (hasTargetId2) {
                element['footer'] = setFooterResult[0].reverse(); // Include all footer data
                filteredData.push(element);
            }
        }

        // Build the response object
        const data = {
            status: 200,
            message: "Set Target retrieved successfully",
            data: filteredData,
        };

        // Add pagination information if applicable
        if (page && perPage) {
            data.pagination = {
                per_page: parseInt(perPage, 10),
                total: total,
                current_page: parseInt(page, 10),
                last_page: Math.ceil(total / perPage),
            };
        }

        // Return the response
        return res.status(200).json(data);
    } catch (error) {
        return error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};
// const getSetTargetReached = async (req, res) => {
//     const untitledId = req.companyData.untitled_id;
//     const { page, perPage, key } = req.query;

//     let connection = await getConnection();
//     try {
//         // Start the transaction
//         await connection.beginTransaction();

//         // Base queries
//         let getSetTargetQuery = `
//             SELECT * FROM sale_target_header 
//             WHERE untitled_id = ${untitledId} AND status = 1`;
//         let countQuery = `
//             SELECT COUNT(*) AS total 
//             FROM sale_target_header 
//             WHERE untitled_id = ${untitledId}`;

//         // Add search/filtering if a key is provided
//         if (key) {
//             const lowercaseKey = key.toLowerCase().trim();
//             if (lowercaseKey === "activated") {
//                 getSetTargetQuery += ` AND status = 1`;
//                 countQuery += ` AND status = 1`;
//             } else if (lowercaseKey === "deactivated") {
//                 getSetTargetQuery += ` AND status = 0`;
//                 countQuery += ` AND status = 0`;
//             } else {
//                 getSetTargetQuery += ` AND LOWER(coin) LIKE '%${lowercaseKey}%'`;
//                 countQuery += ` AND LOWER(coin) LIKE '%${lowercaseKey}%'`;
//             }
//         }

//         getSetTargetQuery += " ORDER BY sale_date DESC";

//         // Apply pagination if both `page` and `perPage` are provided
//         let total = 0;
//         if (page && perPage) {
//             const totalResult = await connection.query(countQuery);
//             total = parseInt(totalResult[0][0].total);

//             const start = (page - 1) * perPage;
//             getSetTargetQuery += ` LIMIT ${perPage} OFFSET ${start}`;
//         }

//         // Fetch the header data
//         let result = await connection.query(getSetTargetQuery);
//         let setTarget = result[0];

//         // Filter headers based on footer data
//         let filteredData = [];
//         for (let i = 0; i < setTarget.length; i++) {
//             const element = setTarget[i];

//             // Fetch all footer data for the current header, excluding complition_id = 4
//             let setFooterQuery = `
//                 SELECT stf.*, ts.target_status, cs.complition_status 
//                 FROM set_target_footer stf
//                 LEFT JOIN target_status ts ON ts.target_id = stf.target_id
//                 LEFT JOIN complition_status cs ON cs.complition_id = stf.complition_id 
//                 WHERE stf.sale_target_id = ${element.sale_target_id} 
//                 AND stf.untitled_id = ${untitledId}
//                 AND stf.complition_id != 4`; // Exclude records with complition_id = 4

//             const setFooterResult = await connection.query(setFooterQuery);

//             // Only include the header if there is valid footer data (i.e., excluding complition_id = 4)
//             if (setFooterResult[0] && setFooterResult[0].length > 0) {
//                 // Include footer data that doesn't have complition_id = 4
//                 element['footer'] = setFooterResult[0].reverse(); // Include all footer data
//                 filteredData.push(element);
//             } else {
//                 // If no matching footer is found, include the header with an empty footer array
//                 element['footer'] = [];
//                 filteredData.push(element);
//             }
//         }

//         // Build the response object
//         const data = {
//             status: 200,
//             message: "Set Target retrieved successfully",
//             data: filteredData,
//         };

//         // Add pagination information if applicable
//         if (page && perPage) {
//             data.pagination = {
//                 per_page: parseInt(perPage, 10),
//                 total: total,
//                 current_page: parseInt(page, 10),
//                 last_page: Math.ceil(total / perPage),
//             };
//         }

//         // Return the response
//         return res.status(200).json(data);
//     } catch (error) {
//         return error500(error, res);
//     } finally {
//         if (connection) connection.release();
//     }
// };


//Get Sold Coin
const getSoldCoin = async (req, res) => {
    const untitledId = req.companyData.untitled_id;
    const { page, perPage, key } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getSoldCoinQuery = `SELECT sc.*,sf.sale_target_coin FROM sold_coin sc
        LEFT JOIN set_target_footer sf
        ON sc.set_footer_id = sf.set_footer_id
        WHERE sc.untitled_id = ${untitledId}`;
        let countQuery = `SELECT COUNT(*) AS total FROM sold_coin sc
        LEFT JOIN set_target_footer sf
        ON sc.set_footer_id = sf.set_footer_id
        WHERE sc.untitled_id = ${untitledId}`;

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
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getSoldCoinQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getSoldCoinQuery);
        const soldCoin = result[0];

        const data = {
            status: 200,
            message: "Sold Coin retrieved successfully",
            data: soldCoin,
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
    getSoldCoin
}
