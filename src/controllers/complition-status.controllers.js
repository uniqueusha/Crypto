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

//add complition status
const addComplitionStatus = async (req, res) => {
    const complition_status = req.body.complition_status ? req.body.complition_status.trim() : "";
    const description = req.body.description ? req.body.description.trim() : "";
    if (!complition_status) {
        return error422("Complition Status is required.", res);
    } 

    //check Complition Status already is exists or not
    const isExistComplitionStatusQuery = `SELECT * FROM complition_status WHERE LOWER(TRIM(complition_status))= ?`;
    const isExistComplitionStatusResult = await pool.query(isExistComplitionStatusQuery , [
        complition_status.toLowerCase(),
    ]);
    if (isExistComplitionStatusResult[0].length > 0) {
        return error422(" Complition Status is already exists.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
        //insert into target status
        const insertComplitionStatusQuery = `INSERT INTO complition_status (complition_status, description) VALUES (?, ?)`;
        const insertComplitionStatusValues = [complition_status, description];
        const insertComplitionStatusResult = await connection.query(insertComplitionStatusQuery, insertComplitionStatusValues);
        
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: `Complition Status added successfully`,
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

//get complition status list
const getComplitionStatus = async (req, res) => {
    const { page, perPage, key } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getComplitionStatusQuery = `SELECT * FROM complition_status`;
        let countQuery = `SELECT COUNT(*) AS total FROM complition_status`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getComplitionStatusQuery += ` WHERE status = 1`;
                countQuery += ` WHERE status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getComplitionStatusQuery += ` WHERE status = 0`;
                countQuery += ` WHERE status = 0`;
            } else {
                getComplitionStatusQuery += ` WHERE  LOWER(complition_status) LIKE '%${lowercaseKey}%' `;
                countQuery += ` WHERE LOWER(complition_status) LIKE '%${lowercaseKey}%' `;
            }
        }
        getComplitionStatusQuery += " ORDER BY created_at DESC";
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getComplitionStatusQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getComplitionStatusQuery);
        const complitionStatus = result[0];

        const data = {
            status: 200,
            message: "Complition Status retrieved successfully",
            data: complitionStatus,
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

//get complition status by id
const getComplitionStatusById = async (req, res) => {
    const complition_id = parseInt(req.params.id);

    const checkComplitionStatusQuery = "SELECT * FROM complition_status WHERE complition_id = ?";
    const checkComplitionStatusResult = await pool.query(checkComplitionStatusQuery, [complition_id]);
    if (checkComplitionStatusResult[0].length === 0) {
        return error422("Complition Not Found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const complitionStatusQuery = `SELECT * FROM complition_status WHERE complition_id = ?`;
        const complitionStatusResult = await connection.query(complitionStatusQuery, [complition_id]);

        const complitionStatus = complitionStatusResult[0][0];
        res.status(200).json({
            status: 200,
            message: "Complition Status Retrived Successfully",
            data: complitionStatus,
        });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

//  Complition update
const updateComplitionStatus = async (req, res) => {
    const complitionId = parseInt(req.params.id); 
    const complition_status = req.body.complition_status ? req.body.complition_status.trim() : ""; 
    const description = req.body.description ? req.body.description.trim() : "";
    const newDate = new Date();
    if (!complition_status) {
        return error422("Complition Status is required.", res);
    }

    // Check if the complition status exists in the database
    const checkComplitionStatusQuery = "SELECT * FROM complition_status WHERE complition_id = ?";
    const checkComplitionStatusResult = await pool.query(checkComplitionStatusQuery, [complitionId]);
    if (checkComplitionStatusResult[0].length === 0) {
        return error422("Complition Not Found.", res);
    }


    // Check if the Complition status already exists for a different user
    const isComplitionStatusExistsQuery =
        "SELECT * FROM complition_status WHERE complition_status = ? AND complition_id != ?";
    const isComplitionStatusExistsResult = await pool.query(isComplitionStatusExistsQuery, [complition_status, complitionId]);
    if (isComplitionStatusExistsResult[0].length > 0) {
        return error422("Complition Status already exists.", res);
    }

    // Obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Update Complition status details in the database
        const updateComplitionStatusQuery = `UPDATE complition_status SET complition_status = ?, description = ?, mts = ? WHERE complition_id = ?`;
        const updateComplitionStatusResult = await connection.query(updateComplitionStatusQuery, [
            complition_status,
            description,
            newDate,
            complitionId
        ]);

        // Commit the transaction
        await connection.commit();

        // Return success response
        return res.status(200).json({
            status: 200,
            message: "Complition Status updated successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

//status change of complition status...
const onStatusChange = async (req, res) => {
    const complitionId = parseInt(req.params.id);
    const status = parseInt(req.query.status); 
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Check if the complition status  exists
        const checkComplitionStatusQuery = "SELECT * FROM complition_status WHERE complition_id = ?";
        const checkComplitionStatusResult = await connection.query(checkComplitionStatusQuery, [complitionId]);

        if (checkComplitionStatusResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "Complition Status Not Found.",
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

        // Soft update the complition status
        const updateQuery = `
              UPDATE complition_status
              SET status = ?
              WHERE complition_id = ?`;

        await connection.query(updateQuery, [status, complitionId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";
        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `Complition Status ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//get complition status active...
const getComplitionStatusWma = async (req, res) => {

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Start a transaction
        let complitionStatusQuery = `SELECT * FROM complition_status
        WHERE status = 1 ORDER BY complition_status `;
        const complitionStatusResult = await connection.query(complitionStatusQuery);
        const complition = complitionStatusResult[0];

        res.status(200).json({
            status: 200,
            message: "Complition Status retrieved successfully.",
            data: complition
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
    addComplitionStatus,
    getComplitionStatus,
    getComplitionStatusById,
    updateComplitionStatus,
    onStatusChange,
    getComplitionStatusWma

}