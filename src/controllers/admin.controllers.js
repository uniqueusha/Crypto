const pool = require("../../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "mail.freshchi.com",
    port: 587,
    secure: false, // Use false for explicit TLS
    auth: {
      user: "crypto@freshchi.com",
      pass: "Imago@7265",
    },
    tls: {
      rejectUnauthorized: false, // Prevent self-signed certificate errors
    },
  });

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
}


//add user..
// const addUser = async (req, res) => {
//     const user_name = req.body.user_name ? req.body.user_name.trim() : "";
//     const email_id = req.body.email_id ? req.body.email_id.trim() : "";
//     const user_type_id = req.body.user_type_id ? req.body.user_type_id : "";
//     const password = req.body.password ? req.body.password : "";
//     if (!user_name) {
//         return error422("User Name is required.", res);
//     } else if (!password) {
//         return error422("Password is required.", res);
//     } else if (!email_id) {
//         return error422("Email Id required.", res);
//     }

//     //check User Name already is exists or not
//     // const isExistUserNameQuery = `SELECT * FROM users WHERE LOWER(TRIM(user_name))= ?`;
//     // const isExistUserNameResult = await pool.query(isExistUserNameQuery, [
//     //     user_name.toLowerCase(),
//     // ]);
//     // if (isExistUserNameResult[0].length > 0) {
//     //     return error422(" User Name is already exists.", res);
//     // }

//     //check Email Id already is exists or not
//     const isExistEmailIdQuery = `SELECT * FROM untitled WHERE email_id= ?`;
//     const isExistEmailIdResult = await pool.query(isExistEmailIdQuery, [
//         email_id,
//     ]);
//     if (isExistEmailIdResult[0].length > 0) {
//         return error422("Email Id is already exists.", res);
//     }

//     // Check if user type exists
//     const userTypeQuery ="SELECT * FROM user_type WHERE user_type_id = ?";
//     const userTypeResult = await pool.query(userTypeQuery, [
//         user_type_id,
//     ]);
//     if (userTypeResult[0].length == 0) {
//         return error422("User Type Not Found.", res);
//     }

//     // Attempt to obtain a database connection
//     let connection = await getConnection();
//     try {
//         //Start the transaction
//         await connection.beginTransaction();
//         //insert into user
//         const insertUserQuery = `INSERT INTO untitled (user_name, email_id, user_type_id) VALUES (?, ?, ? )`;
//         const insertUserValues = [user_name, email_id, user_type_id];
//         const insertuserResult = await connection.query(
//             insertUserQuery,
//             insertUserValues
//         );
//         const untitled_id = insertuserResult[0].insertId;

//         const hash = await bcrypt.hash(password, 10); // Hash the password using bcrypt

//         //insert into contrasena
//         const insertContrasenaQuery =
//             "INSERT INTO contrasena (untitled_id, extenstions) VALUES (?,?)";
//         const insertContrasenaValues = [untitled_id, hash];
//         const contrasenaResult = await connection.query(
//             insertContrasenaQuery,
//             insertContrasenaValues
//         )
       
//         //commit the transation
//         await connection.commit();
//         res.status(200).json({
//             status: 200,
//             message: `User added successfully`,
//         });
//     } catch (error) {
//         await connection.rollback();
//         return error500(error, res);
//     } finally {
//         await connection.release();
//     }
// };
const addUser = async (req, res) => {
    const user_name = req.body.user_name ? req.body.user_name.trim() : "";
    const email_id = req.body.email_id ? req.body.email_id.trim() : "";
    const user_type_id = req.body.user_type_id ? req.body.user_type_id : "";
    const password = req.body.password ? req.body.password : "";
    if (!user_name) {
        return error422("User Name is required.", res);
    } else if (!password) {
        return error422("Password is required.", res);
    } else if (!email_id) {
        return error422("Email Id required.", res);
    }

    //check User Name already is exists or not
    // const isExistUserNameQuery = `SELECT * FROM users WHERE LOWER(TRIM(user_name))= ?`;
    // const isExistUserNameResult = await pool.query(isExistUserNameQuery, [
    //     user_name.toLowerCase(),
    // ]);
    // if (isExistUserNameResult[0].length > 0) {
    //     return error422(" User Name is already exists.", res);
    // }

    //check Email Id already is exists or not
    const isExistEmailIdQuery = `SELECT * FROM untitled WHERE email_id= ?`;
    const isExistEmailIdResult = await pool.query(isExistEmailIdQuery, [
        email_id,
    ]);
    if (isExistEmailIdResult[0].length > 0) {
        return error422("Email Id is already exists.", res);
    }

    // // Check if user type exists
    // const userTypeQuery ="SELECT * FROM user_type WHERE user_type_id = ?";
    // const userTypeResult = await pool.query(userTypeQuery, [
    //     user_type_id,
    // ]);
    // if (userTypeResult[0].length == 0) {
    //     return error422("User Type Not Found.", res);
    // }

    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
        //insert into user
        const insertUserQuery = `INSERT INTO untitled (user_name, email_id, user_type_id) VALUES (?, ?, ? )`;
        const insertUserValues = [user_name, email_id, user_type_id];
        const insertuserResult = await connection.query(
            insertUserQuery,
            insertUserValues
        );
        const untitled_id = insertuserResult[0].insertId;
        

        const hash = await bcrypt.hash(password, 10); // Hash the password using bcrypt

        //insert into contrasena
        const insertContrasenaQuery =
            "INSERT INTO contrasena (untitled_id, extenstions) VALUES (?,?)";
        const insertContrasenaValues = [untitled_id, hash];
        const contrasenaResult = await connection.query(
            insertContrasenaQuery,
            insertContrasenaValues
        )

        //commit the transation
        await connection.commit();
        res.status(200).json({
            status: 200,
            message: `User added successfully`,
        });
    } catch (error) {
       
        
        await connection.rollback();
        return error500(error, res);
    } finally {
        await connection.release();
    }
};
//Login user...
const userLogin = async (req, res) => {
    const email_id = req.body.email_id ? req.body.email_id.trim() : "";
    const password = req.body.password ? req.body.password : "";
    if (!email_id) {
        return error422("Email Id is Required.", res);
    } else if (!password) {
        return error422("Password is Required.", res);
    }
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
        // Check if the user with the provided user email id exists or not
        const checkUserQuery = "SELECT * FROM untitled WHERE LOWER(TRIM(email_id)) = ? AND status = 1";
        const checkUserResult = await connection.query(checkUserQuery, [email_id.toLowerCase()]);
        const check_user = checkUserResult[0][0];
        if (!check_user) {
            return error422("Authentication failed.", res);
        }
        // Check if the user with the provided untitled id exists
        const checkUserContrasenaQuery ="SELECT * FROM contrasena WHERE untitled_id = ?";
        const checkUserContrasenaResult = await connection.query(checkUserContrasenaQuery,[check_user.untitled_id]);
        const user_contrasena = checkUserContrasenaResult[0][0];
        if (!user_contrasena) {
            return error422("Authentication failed.", res);
        }

        const isPasswordValid = await bcrypt.compare(password,user_contrasena.extenstions);
        if (!isPasswordValid) {
            return error422("Password wrong.", res);
        }
        // Generate a JWT token
        const token = jwt.sign(
            {
                untitled_id: user_contrasena.untitled_id,
                email_id: check_user.email_id,
            },
            "secret_this_should_be", // Use environment variable for secret key
            { expiresIn: "10h" }
        );
        const userDataQuery = `SELECT u.*, c.contrasena_id, ut.user_type FROM untitled u 
        LEFT JOIN contrasena c
        ON c.untitled_id =u.untitled_id
        LEFT JOIN user_type ut
        ON ut.user_type_id = u.user_type_id 
        WHERE u.untitled_id = ? `;
        let userDataResult = await connection.query(userDataQuery, [check_user.untitled_id]);

        // Commit the transaction
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: "Authentication successfully",
            token: token,
            expiresIn: 36000000, // 10 hour in seconds,
            data: userDataResult[0][0],
        });

    } catch (error) {
        return error500(error, res)
    } finally {
        await connection.release();
    }
};

//Get users list...
const getUsers = async (req, res) => {
    const { page, perPage, key } = req.query;
    
    // Attempt to obtain a database connection
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        let getUserQuery = `SELECT u.*,ut.user_type FROM untitled u
        LEFT JOIN user_type ut
        ON u.user_type_id = ut.user_type_id
        WHERE u.user_type_id = 2`;
        let countQuery = `SELECT COUNT(*) AS total FROM untitled u
        LEFT JOIN user_type ut
        ON u.user_type_id = ut.user_type_id
        WHERE u.user_type_id = 2`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getUserQuery += ` AND u.status = 1`;
                countQuery += ` AND u.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getUserQuery += ` AND u.status = 0`;
                countQuery += ` AND u.status = 0`;
            } else {
                getUserQuery += ` AND  LOWER(u.user_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` AND LOWER(u.user_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        // getUserQuery += ` ORDER BY u.user_name ASC`;
       
        // Apply pagination if both page and perPage are provided
        let total = 0;
        if (page && perPage) {
            const totalResult = await connection.query(countQuery);
            total = parseInt(totalResult[0][0].total);

            const start = (page - 1) * perPage;
            getUserQuery += ` LIMIT ${perPage} OFFSET ${start}`;
        }
        const result = await connection.query(getUserQuery);
        const user = result[0];

        const data = {
            status: 200,
            message: "User retrieved successfully",
            data: user
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
        await connection.release();
    }
};

// get users by id...
const getUser = async (req, res) => {
    const untitled_id = parseInt(req.params.id);

    const userCheckQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
    const userCheckResult = await pool.query(userCheckQuery, [untitled_id]);
    if (userCheckResult[0].length === 0) {
        return error422("User Not Found.", res);
    }

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        const userQuery = `SELECT u.*,ut.user_type FROM untitled u
        LEFT JOIN user_type ut
        ON u.user_type_id = ut.user_type_id WHERE untitled_id = ?`;
        const userResult = await connection.query(userQuery, [untitled_id]);

        const user = userResult[0][0];
        res.status(200).json({
            status: 200,
            message: "user Retrived Successfully",
            data: user,
        });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//user Update
const updateUser = async (req, res) => {
    const untitledId = parseInt(req.params.id); 
    const user_name = req.body.user_name ? req.body.user_name.trim() : ""; 
    const email_id = req.body.email_id ? req.body.email_id.trim() : ""; 
    const user_type_id = req.body.user_type_id ? req.body.user_type_id : ""; 

    
    if (!untitledId) {
        return error422("User Id is required.", res);
    } else if (!user_name) {
        return error422("User Name is required.", res);
    }

    // Check if the user exists in the database
    const userQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
    const userResult = await pool.query(userQuery, [untitledId]);
    if (userResult[0].length === 0) {
        return error422("User Not Found.", res);
    }

    // Check if the user type exists in the database
    const isUserTypeExistsQuery = "SELECT * FROM user_type WHERE user_type_id = ?";
    const isUserTypeResult = await pool.query(isUserTypeExistsQuery, [user_type_id]);
    if (isUserTypeResult[0].length === 0) {
        return error422("User Type Not Found.", res);
    }

    // Check if the user name already exists for a different user
    const isUserNameExistsQuery =
        "SELECT * FROM untitled WHERE user_name = ? AND untitled_id != ?";
    const isUserNameExistsResult = await pool.query(isUserNameExistsQuery, [
        user_name,
        untitledId,
    ]);
    if (isUserNameExistsResult[0].length > 0) {
        return error422("User Name already exists.", res);
    }

    // Obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        // Update user details in the database
        const updateQuery = `UPDATE untitled SET user_name = ?, email_id = ?, user_type_id = ? WHERE untitled_id = ?`;
        const updateResult = await connection.query(updateQuery, [
            user_name,
            email_id,
            user_type_id,
            untitledId,
        ]);

        // Commit the transaction
        await connection.commit();

        // Return success response
        return res.status(200).json({
            status: 200,
            message: "User updated successfully.",
        });
    } catch (error) {
        // Rollback the transaction in case of an error
        await connection.rollback();
        return error500(error, res);
    } finally {
        // Release the database connection
        await connection.release();
    }
};

//status change of user...
const onStatusChange = async (req, res) => {
    const untitledId = parseInt(req.params.id);
    const status = parseInt(req.query.status); // Validate and parse the status parameter
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Check if the user  exists
        const userQuery = "SELECT * FROM untitled WHERE untitled_id = ?";
        const userResult = await connection.query(userQuery, [untitledId]);

        if (userResult[0].length == 0) {
            return res.status(404).json({
                status: 404,
                message: "User Not Found.",
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
              UPDATE untitled
              SET status = ?
              WHERE untitled_id = ?`;

        await connection.query(updateQuery, [status, untitledId]);

        const statusMessage = status === 1 ? "activated" : "deactivated";
        //commit the transation
        await connection.commit();
        return res.status(200).json({
            status: 200,
            message: `User ${statusMessage} successfully.`,
        });
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

//get user active...
const getUserWma = async (req, res) => {

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Start a transaction
        let userQuery = `SELECT * FROM untitled
        WHERE untitled_id != 10 AND status = 1 ORDER BY user_name `;
        const userResult = await connection.query(userQuery);
        const user = userResult[0];

        res.status(200).json({
            status: 200,
            message: "User retrieved successfully.",
            data: user,
        });
    } catch (error) {
        error500(error, res);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//user count
const getUserCount = async (req, res) => {
    // const { created_at, user_id } = req.query;
    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();

        let admin_user_count = 0;
        
        let adminUserCountQuery = `SELECT COUNT(*) AS total FROM untitled
            WHERE user_type_id = 2 AND status = 1`;
        let adminUserCountResult = await connection.query(adminUserCountQuery);
        admin_user_count = parseInt(adminUserCountResult[0][0].total);

        const data = {
            status: 200,
            message: "User Count retrieved successfully",
            admin_user_count: admin_user_count
        };

        return res.status(200).json(data);
    } catch (error) {
        return error500(error, res);
    } finally {
        await connection.release();
    }
};

// const onChangePassword = async (req, res) => {
//     const email_id = req.body.email_id ? req.body.email_id.trim() : "";
//     const password = req.body.password || "";
//     const new_password = req.body.new_password || "";
  
//     if (!email_id) {
//       return error422("Email Id required.", res);
//     }
//     if (!password) {
//       return error422("Password is required.", res);
//     }
//     if (!new_password) {
//       return error422("New password is required.", res);
//     }
  
//     let connection = await getConnection();
  
//     try {
//         await connection.beginTransaction();
  
//       // Check if email_id exists
//       const checkUserQuery = "SELECT * FROM untitled WHERE LOWER(TRIM(email_id)) = ? AND status = 1";
//       const [checkUserResult] = await connection.query(checkUserQuery, [email_id.toLowerCase()]);
//       if (checkUserResult.length === 0) {
//         return error422('Email id is not found.', res);
//       }
//       const userData = checkUserResult[0]; // Extract the first row
      

//       // Retrieve the hashed password from the database (update column name if needed)
//       const contrasenaQuery = 'SELECT extenstions FROM contrasena WHERE untitled_id = ?';
//       const [contrasenaResult] = await connection.query(contrasenaQuery, [userData.untitled_id]);
  
//       if (contrasenaResult.length === 0) {
//         return error422("Password not found for this user.", res);
//       }
      
//       const hash = contrasenaResult[0].extenstions;
//       if (!hash) {
//         return error422('Stored password hash is missing.', res);
//       }
  
//       const isValid = await bcrypt.compare(password, hash);
//       if (!isValid) {
//         return error422('Incorrect password.', res);
//       }
  
//       // Hash the new password
//       const newHashedPassword = await bcrypt.hash(new_password, 10);
  
//       // Update the user's password in the database
//       const updateQuery = `UPDATE contrasena SET extenstions = ? WHERE untitled_id = ?`;
//       await connection.query(updateQuery, [newHashedPassword, userData.untitled_id]);
  
//       await connection.commit();
//       return res.status(200).json({ 
//         status: 200,
//         message: "Password updated successfully."
//        });
//     } catch (error) {
      
//       error500(error, res);
//     } finally {
//       if (connection) connection.release();
//     }
// };
const onChangePassword = async (req, res) => {
    const email_id = req.body.email_id ? req.body.email_id.trim() : "";
    const password = req.body.password || "";
    const new_password = req.body.new_password || "";
    const new_email = req.body.new_email ? req.body.new_email.trim() : "";

    if (!email_id) {
        return error422("Email Id required.", res);
    }
    if (!password) {
        return error422("Password is required.", res);
    }
    if (!new_password) {
        return error422("New password is required.", res);
    }

    let connection = await getConnection();

    try {
        await connection.beginTransaction();

        // Check if email_id exists
        const checkUserQuery = "SELECT * FROM untitled WHERE LOWER(TRIM(email_id)) = ? AND status = 1";
        const [checkUserResult] = await connection.query(checkUserQuery, [email_id.toLowerCase()]);
        if (checkUserResult.length === 0) {
            return error422('Email id is not found.', res);
        }

        const userData = checkUserResult[0]; // Extract the first row

        // Retrieve the hashed password from the database (update column name if needed)
        const contrasenaQuery = 'SELECT extenstions FROM contrasena WHERE untitled_id = ?';
        const [contrasenaResult] = await connection.query(contrasenaQuery, [userData.untitled_id]);

        if (contrasenaResult.length === 0) {
            return error422("Password not found for this user.", res);
        }

        const hash = contrasenaResult[0].extenstions;
        if (!hash) {
            return error422('Stored password hash is missing.', res);
        }

        const isValid = await bcrypt.compare(password, hash);
        if (!isValid) {
            return error422('Incorrect password.', res);
        }

        // Hash the new password
        const newHashedPassword = await bcrypt.hash(new_password, 10);

        // Update the user's password in the database
        const updatePasswordQuery = `UPDATE contrasena SET extenstions = ? WHERE untitled_id = ?`;
        await connection.query(updatePasswordQuery, [newHashedPassword, userData.untitled_id]);

        // If new email is provided, update it
        if (new_email) {
            // Check if the new email already exists
            const checkNewEmailQuery = "SELECT email_id FROM untitled WHERE LOWER(TRIM(email_id)) = ?";
            const [emailCheckResult] = await connection.query(checkNewEmailQuery, [new_email.toLowerCase()]);

            if (emailCheckResult.length > 0) {
                return error422("New email is already in use.", res);
            }

            // Update the email
            const updateEmailQuery = `UPDATE untitled SET email_id = ? WHERE untitled_id = ?`;
            await connection.query(updateEmailQuery, [new_email, userData.untitled_id]);
        }

        await connection.commit();
        return res.status(200).json({ 
            status: 200,
            message: "Email and password updated successfully."
        });

    } catch (error) {
        await connection.rollback();
        error500(error, res);
    } finally {
        if (connection) connection.release();
    }
};


//hash password to normal
// const getPassword = async (req, res) => {
//     const { untitled_id } = req.query;
    
//     const extenstions = req.body.extenstions ? req.body.extenstions.trim() : "";
//     // Attempt to obtain a database connection
//     let connection = await getConnection();

//     try {
//         // Start a transaction
//         await connection.beginTransaction();

//         let getPasswordQuery = `SELECT u.untitled_id,c.extenstions FROM untitled u
//             LEFT JOIN contrasena C
//             ON u.untitled_id = c.untitled_id
//             WHERE u.untitled_id = ${untitled_id} AND c.extenstions = ${extenstions}`;
//         let getPasswordResult = await connection.query(getPasswordQuery);
        
//         const data = {
//             status: 200,
//             message: "Password Normal successfully",
            
//         };

//         return res.status(200).json(data);
//     } catch (error) {
//         return error500(error, res);
//     } finally {
//         await connection.release();
//     }
// };

// const getPassword = async (req, res) => {
//     const { untitled_id } = req.query;
//     const extenstions = req.body.extenstions ? req.body.extenstions.trim() : "";

//     // Define or import passwordMap
//     const passwordMap = {
//         "pdf": "secure123",
//         "doc": "wordpass",
//         "jpg": "imagekey"
//     };

//     let connection = await getConnection();

//     try {
//         await connection.beginTransaction();

//         let getPasswordQuery = `
//             SELECT u.untitled_id, c.extenstions  
//             FROM untitled u
//             LEFT JOIN contrasena c
//             ON u.untitled_id = c.untitled_id
//             WHERE u.untitled_id = ? AND c.extenstions = ?
//         `;

//         let [getPasswordResult] = await connection.query(getPasswordQuery, [untitled_id, extenstions]);
        
//         if (getPasswordResult.length === 0) {
//             return res.status(404).json({ status: 404, message: "No record found" });
//         }
        
//         // Fix typo: Use "extenstions" instead of "extensions"
//         const extValue = getPasswordResult[0].extenstions;
//         const plainTextPassword = passwordMap[extValue] || "Unknown";
        
//         console.log(plainTextPassword);
//         return res.status(200).json({
//             status: 200,
//             message: "Password retrieved successfully",
//             password: plainTextPassword
//         });

//     } catch (error) {
//         console.log(error);
//         return error500(error, res);
//     } finally {
//         await connection.release();
//     }
// };

//send otp 
const sendOtp = async (req, res) => {
    const email_id = req.body.email_id;
    if (!email_id) {
      return error422("Email is  required.", res);
    }
    // Check if email_id exists
    const query = 'SELECT * FROM untitled WHERE TRIM(LOWER(email_id)) = ?';
    const result = await pool.query(query, [email_id.toLowerCase()]);
    if (result[0].length === 0) {
      return error422('Email id is not found.', res);
    }
    
    let user_name = result[0][0].user_name;
    
    
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
      const otp = Math.floor(100000 + Math.random() * 900000);
      const deleteQuery = `DELETE FROM otp WHERE cts < NOW() - INTERVAL 5 MINUTE`;
      const deleteResult = await connection.query(deleteQuery);

      const otpQuery = "INSERT INTO otp (otp, email_id) VALUES (?, ?)";
      const otpResult = await connection.query(otpQuery, [otp, email_id])
  
      const message = `
      <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Welcome to Crypto.com</title>
          <style>
              div{
              font-family: Arial, sans-serif; 
               margin: 0px;
                padding: 0px;
                color:black;
              }
          </style>
        </head>
        <body>
        <div>
       <h2 style="text-transform: capitalize;">Hello ${user_name},</h2>
        <p>It seems you requested a password reset for your Crypto.com account. Use the OTP below to complete the process and regain access to your account.</p>
        <h3>Your OTP: <strong>${otp}</strong></h3>
        <p>For security, this OTP will expire in 5 minutes. Please don’t share this code with anyone. If you didn’t request a password reset, please ignore this email or reach out to our support team for assistance.</p>
        <h4>What’s Next?</h4>
        <ol>
          <li>Enter the OTP on the password reset page.</li>
          <li>Set your new password, and you’re all set to log back in.</li>
        <li>Thank you for using Crypto.com!</li>
        </ol>
        <p>Best regards,<br>The Crypto Team</p>
    
  
         </div>
        </body>
        </html>
     `;
     
         // Validate required fields.
         if ( !email_id || !message) {
           return res
             .status(400)
             .json({ status: "error", message: "Missing required fields" });
         }
     
         // Prepare the email message options.
         const mailOptions = {
           from: "crypto@freshchi.com", // Sender address from environment variables.
           to: `${email_id}`, // Recipient's name and email address.
           replyTo: "rohitlandage86@gmail.com", // Sets the email address for recipient responses.
           cc: "ushamyadav777@gmail.com",
           subject: "Reset Your Crypto Password – OTP Inside", // Subject line.
           html: message, 
         };
     
         // Send email 
          await transporter.sendMail(mailOptions);
     
      return res.status(200).json({
        status: 200,
        message: `OTP sent successfully to ${email_id}.`,
  
      })
    }  catch (error) {
        
        
      return error500(error, res)
  } finally {
      if (connection) connection.release()
  }
  }
  
  const verifyOtp = async (req, res) => {
    const otp = req.body.otp ? req.body.otp : null;
    const email_id = req.body.email_id ? req.body.email_id.trim() : null;
    if (!otp) {
      return error422("Otp is required.", res);
    } else if (!email_id) {
      return error422("Email id is required.", res);
    }
    
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
  
      // Delete expired OTPs
      
      const deleteQuery = `DELETE FROM otp WHERE cts < NOW() - INTERVAL 5 MINUTE`;
      const deleteResult = await connection.query(deleteQuery);
  
      // Check if OTP is valid and not expired
      const verifyOtpQuery = `
        SELECT * FROM otp 
        WHERE TRIM(LOWER(email_id)) = ? AND otp = ?
      `;
      const verifyOtpResult = await connection.query(verifyOtpQuery, [email_id.trim().toLowerCase(), otp]);
  
      // If no OTP is found, return a failed verification message
      if (verifyOtpResult[0].length === 0) {
        return error422("OTP verification failed.", res);
      }
  
      // Check if the OTP is expired
      const otpData = verifyOtpResult;
      const otpCreatedTime = otpData.cts;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
      if (otpCreatedTime < fiveMinutesAgo) {
        return error422("OTP has expired. Please request a new one.", res);
      }
  
      // OTP is valid and within the 5-minute limit
      return res.status(200).json({
        status: 200,
        message: "OTP verified successfully"
      });
  
    } catch (error) {
       
        return error500(error, res)
    } finally {
      if (connection) connection.release();
    }
  };
  
  //check email_id
  const checkEmailId = async (req, res) => {
    const email_id = req.body.email_id ? req.body.email_id.trim() : ""; // Extract and trim email_id from request body
  
    if (!email_id) {
      return error422("Email Id required.", res);
    }
  
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
  
     // Check if email_id exists
    const query = 'SELECT * FROM untitled WHERE TRIM(LOWER(email_id)) = ?';
    const result = await connection.query(query, [email_id.toLowerCase()]);
    if (result[0].length === 0) {
      return error422('Email id is not found.', res);
    }
    const untitledData = result;
  
     return res.status(200).json({
        status: 200,
        message: "Email Id Exists",
        email_id: true,
      });
    } catch (error) {
        console.log(error);
        
      return error500(error, res);
    } finally {
      if (connection) connection.release();
    }
  };
  //forget password
  const forgotPassword = async (req, res) => {
    const email_id = req.body.email_id ? req.body.email_id.trim() : null;
    const newPassword = req.body.newPassword ? req.body.newPassword.trim() : null;
    const confirmPassword = req.body.confirmPassword ? req.body.confirmPassword.trim() : null;
    if (!email_id) {
      return error422("Email id is requried", res);
    } else if (!newPassword) {
      return error422("New password is required.", res);
    } else if (!confirmPassword) {
      return error422("Confirm password is required.", res);
    } else if (newPassword !== confirmPassword) {
      return error422("New password and Confirm password do not match.", res);
    }
    
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();

        // Check if email_id exists
    const query = 'SELECT * FROM untitled WHERE TRIM(LOWER(email_id)) = ?';
    const result = await connection.query(query, [email_id.toLowerCase()]);
    if (result[0].length === 0) {
      return error404('Email id is not found.', res);
    }
    const untitledData = result[0];
    
  // Hash the new password
  const hash = await bcrypt.hash(confirmPassword, 10);
  const updateQuery = `UPDATE contrasena SET extenstions = ? WHERE untitled_id = ?`;
  const [updateResult] = await connection.query(updateQuery, [hash, untitledData.untitled_id]);
  
  
      // Commit the transaction
      await connection.commit();
      return res.status(200).json({
        status: 200,
        message: "Password has been updated successfully"
      })
    }catch (error) {
      return error500(error, res);
    } finally {
      if(connection) connection.release();
    }
  }
  const sendOtpIfEmailIdNotExists = async (req, res) => {
    const email_id = req.body.email_id;
    if (!email_id) {
      return error422("Email is required.", res);
    }
  
    // Check if email_id exists
    const query = 'SELECT * FROM untitled WHERE TRIM(LOWER(email_id)) = ?';
    const result = await pool.query(query, [email_id.toLowerCase()]);
    
    if (result.rowCount > 0) {
      // If email_id exists, return an error response
      return error422('Email ID already exists. OTP will not be sent.', res);
    }
  
    let connection = await getConnection();
    try {
        //Start the transaction
        await connection.beginTransaction();
  
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
  
      // Delete expired OTPs from the table (older than 5 minutes)
      const deleteQuery = `DELETE FROM otp WHERE cts < NOW() - INTERVAL 5 MINUTE`;
      const deleteResult = await connection.query(deleteQuery);
  
      // Insert the new OTP into the database
      const otpQuery = "INSERT INTO otp (otp, email_id) VALUES (?, ?)";
      await connection.query(otpQuery, [otp, email_id]);
  
      // Compose the email message with OTP details
      const message = `
      <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Welcome to Crypto.com</title>
          <style>
              div {
                font-family: Arial, sans-serif; 
                margin: 0px;
                padding: 0px;
                color: black;
              }
          </style>
        </head>
        <body>
        <div>
          <h2>Hello,</h2>
          <p>Thank you for registering at Crypto.com. Use the OTP below to complete your registration.</p>
          <h3>Your OTP: <strong>${otp}</strong></h3>
          <p>This OTP will expire in 5 minutes. Please don’t share this code with anyone.</p>
          <p>Best regards,<br>The Crypto Team</p>
          
        </div>
        </body>
        </html>
      `;
  
      // Email options
      const mailOptions = {
        from: "crypto@freshchi.com",
        to: email_id,
        replyTo: "rohitlandage86@gmail.com",
        cc: "ushamyadav777@gmail.com",
        subject: "Your Speculate Registration OTP",
        html: message,
      };
  
      // Send the email
      await transporter.sendMail(mailOptions);
  
      // Return success response
      return res.status(200).json({
        status: 200,
        message: `OTP sent successfully to ${email_id}.`,
      });
    } catch (error) {
     return error500(error, res);
    } finally {
      if (connection) connection.release();
    }
  };
module.exports = {
    addUser,
    userLogin,
    getUsers,
    getUser,
    updateUser,
    onStatusChange,
    getUserWma,
    getUserCount,
    onChangePassword,
    sendOtp,
    verifyOtp,
    checkEmailId,
    forgotPassword,
    sendOtpIfEmailIdNotExists
}
