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

//add target status
const addTargetStatus = async (req, res) => {
    const target_status = req.body.target_status ? req.body.target_status.trim() : "";
    const description = req.body.description ? req.body.description.trim() : "";
    if (!target_status) {
        return error422("Target Status is required.", res);
    } 

    //check Target Status already is exists or not
    const isExistTargetStatusQuery = `SELECT * FROM target_status WHERE LOWER(TRIM(target_status))= ?`;
    const isExistTargetStatusResult = await pool.query(isExistTargetStatusQuery , [
        target_status.toLowerCase(),
    ]);
    if (isExistTargetStatusResult[0].length > 0) {
        return error422(" Target Status is already exists.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
        //insert into target status
        const insertTargetStatusQuery = `INSERT INTO target_status (target_status, description) VALUES (?, ?)`;
        const insertTargetStatusValues = [target_status, description];
        const insertTargetStatusResult = await connection.query(insertTargetStatusQuery, insertTargetStatusValues);
        
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: `Target Status added successfully`,
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

//get target status list
const getTargetStatus = async (req, res) => {
    const { page, perPage, key } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getTargetStatusQuery = `SELECT * FROM target_status`;
        let countQuery = `SELECT COUNT(*) AS total FROM target_status`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getTargetStatusQuery += ` WHERE status = 1`;
                countQuery += ` WHERE status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getTargetStatusQuery += ` WHERE status = 0`;
                countQuery += ` WHERE status = 0`;
            } else {
                getTargetStatusQuery += ` WHERE  LOWER(target_status) LIKE '%${lowercaseKey}%' `;
                countQuery += ` WHERE LOWER(target_status) LIKE '%${lowercaseKey}%' `;
            }
        }
        getTargetStatusQuery += " ORDER BY created_at DESC";
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getTargetStatusQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getTargetStatusQuery);
        const targetStatus = result[0];

        const data = {
            status: 200,
            message: "Target Status retrieved successfully",
            data: targetStatus,
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

//get target status by id
const getTargetStatusById = async (req, res) => {
    const target_id = parseInt(req.params.id);

    const checkTargetStatusQuery = "SELECT * FROM target_status WHERE target_id = ?";
    const checkTargetStatusResult = await pool.query(checkTargetStatusQuery, [target_id]);
    if (checkTargetStatusResult[0].length === 0) {
        return error422("Target Not Found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const targetStatusQuery = `SELECT * FROM target_status WHERE target_id = ?`;
        const targetStatusResult = await connection.query(targetStatusQuery, [target_id]);

        const targetStatus = targetStatusResult[0][0];
        res.status(200).json({
            status: 200,
            message: "Target Status Retrived Successfully",
            data: targetStatus,
        });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

//user type update
const updateTargetStatus = async (req, res) => {
    const targetId = parseInt(req.params.id); 
    const target_status = req.body.target_status ? req.body.target_status.trim() : ""; 
    const description = req.body.description ? req.body.description.trim() : "";
    const newDate = new Date();
    if (!target_status) {
        return error422("Target Status is required.", res);
    }

    // Check if the target status exists in the database
    const checkTargetStatusQuery = "SELECT * FROM target_status WHERE target_id = ?";
    const checkTargetStatusResult = await pool.query(checkTargetStatusQuery, [targetId]);
    if (checkTargetStatusResult[0].length === 0) {
        return error422("Target Not Found.", res);
    }


    // Check if the user type already exists for a different user
    const isTargetStatusExistsQuery =
        "SELECT * FROM target_status WHERE target_status = ? AND target_id != ?";
    const isTargetStatusExistsResult = await pool.query(isTargetStatusExistsQuery, [target_status, targetId]);
    if (isTargetStatusExistsResult[0].length > 0) {
        return error422("Target Status already exists.", res);
    }

    // Obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Update target status details in the database
        const updateTargetStatusQuery = `UPDATE target_status SET target_status = ?, description = ?, mts = ? WHERE target_id = ?`;
        const updateTargetStatusResult = await connection.query(updateTargetStatusQuery, [
            target_status,
            description,
            newDate,
            targetId
        ]);

        // Commit the transaction
        await connection.commit();

        // Return success response
        return res.status(200).json({
            status: 200,
            message: "Target Status updated successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

//status change of target status...
const onStatusChange = async (req, res) => {
    const targetId = parseInt(req.params.id);
    const status = parseInt(req.query.status); 
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Check if the target status  exists
        const checkTargetStatusQuery = "SELECT * FROM target_status WHERE target_id = ?";
        const checkTargetStatusResult = await connection.query(checkTargetStatusQuery, [targetId]);

        if (checkTargetStatusResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Target Status Not Found.",
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

        // Soft update the user status
        const updateQuery = `
              UPDATE target_status
              SET status = ?
              WHERE target_id = ?`;

        await connection.query(updateQuery, [status, targetId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";
        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Target Status ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//get target status active...
const getTargetStatusWma = async (req, res) => {

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Start a transaction
        let targetStatusQuery = `SELECT * FROM target_status
        WHERE status = 1 ORDER BY target_status `;
        const targetStatusResult = await connection.query(targetStatusQuery);
        const target = targetStatusResult[0];

        res.status(200).json({
            status: 200,
            message: "Target Status retrieved successfully.",
            data: target
        });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports ={
    addTargetStatus,
    getTargetStatus,
    getTargetStatusById,
    updateTargetStatus,
    onStatusChange,
    getTargetStatusWma

}