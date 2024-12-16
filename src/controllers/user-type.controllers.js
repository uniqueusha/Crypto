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

//add user type
const addUserType = async (req, res) => {
    const user_type = req.body.user_type ? req.body.user_type.trim() : "";
    if (!user_type) {
        return error422("User Type is required.", res);
    } 

    //check User Type already is exists or not
    const isExistUserTypeQuery = `SELECT * FROM user_type WHERE LOWER(TRIM(user_type))= ?`;
    const isExistUserTypeResult = await pool.query(isExistUserTypeQuery, [
        user_type.toLowerCase(),
    ]);
    if (isExistUserTypeResult[0].length > 0) {
        return error422(" User Type is already exists.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
        //insert into user type
        const insertUserTypeQuery = `INSERT INTO user_type (user_type) VALUES (?)`;
        const insertUserTypeValues = [user_type];
        const insertuserTypeResult = await connection.query(insertUserTypeQuery, insertUserTypeValues);
        
        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: `User Type added successfully`,
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

//get user type list
const getUserTypes = async (req, res) => {
    const { page, perPage, key } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getUserTypeQuery = `SELECT * FROM user_type`;
        let countQuery = `SELECT COUNT(*) AS total FROM user_type`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getUserTypeQuery += ` WHERE status = 1`;
                countQuery += ` WHERE status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getUserTypeQuery += ` WHERE status = 0`;
                countQuery += ` WHERE status = 0`;
            } else {
                getUserTypeQuery += ` WHERE  LOWER(user_type) LIKE '%${lowercaseKey}%' `;
                countQuery += ` WHERE LOWER(user_type) LIKE '%${lowercaseKey}%' `;
            }
        }
        getUserTypeQuery += " ORDER BY cts DESC";
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getUserTypeQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getUserTypeQuery);
        const userType = result[0];

        const data = {
            status: 200,
            message: "User Type retrieved successfully",
            data: userType,
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

//get list by user type id
const getUserType = async (req, res) => {
    const user_type_id = parseInt(req.params.id);

    const userTypeCheckQuery = "SELECT * FROM user_type WHERE user_type_id = ?";
    const userTypeCheckResult = await pool.query(userTypeCheckQuery, [user_type_id]);
    if (userTypeCheckResult[0].length === 0) {
        return error422("User Type Not Found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const userTypeQuery = `SELECT * FROM user_type WHERE user_type_id = ?`;
        const userTypeResult = await connection.query(userTypeQuery, [user_type_id]);

        const userType = userTypeResult[0][0];
        res.status(200).json({
            status: 200,
            message: "User Type Retrived Successfully",
            data: userType,
        });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

//user type update
const updateUserType = async (req, res) => {
    const userTypeId = parseInt(req.params.id); 
    const user_type = req.body.user_type ? req.body.user_type.trim() : ""; 
    
    
    if (!userTypeId) {
        return error422("User Type Id is required.", res);
    } else if (!user_type) {
        return error422("User Type is required.", res);
    }

    // Check if the user type exists in the database
    const userTypeQuery = "SELECT * FROM user_type WHERE user_type_id = ?";
    const userTypeResult = await pool.query(userTypeQuery, [userTypeId]);
    if (userTypeResult[0].length === 0) {
        return error422("User Type Not Found.", res);
    }

    // Check if the user type already exists for a different user
    const isUserTypeExistsQuery =
        "SELECT * FROM user_type WHERE user_type = ? AND user_type_id != ?";
    const isUserTypeExistsResult = await pool.query(isUserTypeExistsQuery, [user_type, userTypeId]);
    if (isUserTypeExistsResult[0].length > 0) {
        return error422("User Type already exists.", res);
    }

    // Obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Update user type details in the database
        const updateUserTypeQuery = `UPDATE user_type SET user_type = ? WHERE user_type_id = ?`;
        const updateUserTypeResult = await connection.query(updateUserTypeQuery, [
            user_type,
            userTypeId
    
        ]);

        // Commit the transaction
        await connection.commit();

        // Return success response
        return res.status(200).json({
            status: 200,
            message: "User Type updated successfully.",
        });
    } catch (error) {
        await connection.rollback();
        return error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};

//status change of user type
const onStatusChange = async (req, res) => {
    const userTypeId = parseInt(req.params.id);
    const status = parseInt(req.query.status); 
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Check if the user type  exists
        const checkUserTypeQuery = "SELECT * FROM user_type WHERE user_type_id = ?";
        const checkUserTypeResult = await connection.query(checkUserTypeQuery, [userTypeId]);

        if (checkUserTypeResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "User Type Not Found.",
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
              UPDATE user_type
              SET status = ?
              WHERE user_type_id = ?`;

        await connection.query(updateQuery, [status, userTypeId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";
        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `User Type ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//get user type active
const getUserTypeWma = async (req, res) => {

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Start a transaction
        let userTypeQuery = `SELECT * FROM user_type
        WHERE status = 1 ORDER BY user_type `;
        const userTypeResult = await connection.query(userTypeQuery);
        const userType = userTypeResult[0];

        res.status(200).json({
            status: 200,
            message: "User  Type retrieved successfully.",
            data: userType,
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
    addUserType,
    getUserTypes,
    getUserType,
    updateUserType,
    onStatusChange,
    getUserTypeWma
}