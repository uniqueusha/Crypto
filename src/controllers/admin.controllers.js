const pool = require("../../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "poorva@webmantraitsolutions.com", // generated ethereal user
    pass: "Webmantra@123", // generated ethereal password
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
const addUser = async (req, res) => {
    const user_name = req.body.user_name ? req.body.user_name.trim() : "";
    const email_id = req.body.email_id ? req.body.email_id.trim() : "";
    const user_type_id = req.body.user_type_id ? req.body.user_type_id : "";
    const password = req.body.password ? req.body.password : "";
    if (!user_name) {
        return error422("User Name is required.", res);
    } else if (!email_id) {
        return error422("Email Id required.", res);
    }

    // //check Email Id already is exists or not
    // const isExistEmailIdQuery = `SELECT * FROM untitled WHERE email_id= ?`;
    // const isExistEmailIdResult = await pool.query(isExistEmailIdQuery, [
    //     email_id,
    // ]);
    // if (isExistEmailIdResult[0].length > 0) {
    //     return error422("Email Id is already exists.", res);
    // }

    // Check if user type exists
    const userTypeQuery ="SELECT * FROM user_type WHERE user_type_id = ?";
    const userTypeResult = await pool.query(userTypeQuery, [
        user_type_id,
    ]);
    if (userTypeResult[0].length == 0) {
        return error422("User Type Not Found.", res);
    }

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
        let length = 8,
        charset =
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        password = ''
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n))
        }

        const hash = await bcrypt.hash(password, 10); // Hash the password using bcrypt

        //insert into contrasena
        const insertContrasenaQuery =
            "INSERT INTO contrasena (untitled_id, extenstions) VALUES (?,?)";
        const insertContrasenaValues = [untitled_id, hash];
        const contrasenaResult = await connection.query(
            insertContrasenaQuery,
            insertContrasenaValues
        )

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
          <h2 style="text-transform: capitalize;" >Hello ${user_name},</h2>
<p>Welcome to <strong>Crypto</strong> – the platform where your passion for digital assets turns into limitless opportunities!</p>

          <p>Here are your account details:</p>
          
            <strong style="text-transform: capitalize;">Username:</strong> ${user_name}<br>
            <strong>Email:</strong> ${email_id}<br>
            <strong>Password:</strong> ${password}<br>
         
          <p>Get ready to dive into the exciting world of cryptocurrency trading and investment!</p>
<p>Buy, Sell, and Hold your favorite digital assets. Your journey to financial freedom starts now with <strong>Crypto</strong>.</p>
          <p>Best of luck, <br> The Crypto Team</p>

         
        </div>
      </body>
      </html>
`;

    // Validate required fields.
    if (!user_name || !email_id || !message) {
      return res.status(400).json({
        status: 400,
        message: "Missing required fields",
      });
    }

    // Prepare the email message options.
    const mailOptions = {
      from: "poorva@webmantraitsolutions.com", // Sender address from environment variables.
      to: `${email_id}`, // Recipient's name and email address.
      replyTo: "ushamyadav777@gmail.com", // Sets the email address for recipient responses.
      cc: "ushamyadav777@gmail.com",
      subject: "Welcome to Crypto!", // Subject line.
      html: message, 
    };

    // Send email and log the response.
    const info = await transporter.sendMail(mailOptions);
    

       
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
        ON u.user_type_id = ut.user_type_id`;
        let countQuery = `SELECT COUNT(*) AS total FROM untitled u
        LEFT JOIN user_type ut
        ON u.user_type_id = ut.user_type_id`;

        if (key) {
            const lowercaseKey = key.toLowerCase().trim();
            if (lowercaseKey === "activated") {
                getUserQuery += ` WHERE u.status = 1`;
                countQuery += ` WHERE u.status = 1`;
            } else if (lowercaseKey === "deactivated") {
                getUserQuery += ` WHERE u.status = 0`;
                countQuery += ` WHERE u.status = 0`;
            } else {
                getUserQuery += ` WHERE  LOWER(u.user_name) LIKE '%${lowercaseKey}%' `;
                countQuery += ` WHERE LOWER(u.user_name) LIKE '%${lowercaseKey}%' `;
            }
        }
        getUserQuery += " ORDER BY cts DESC";
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
            data: user,
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
const getUserWma = async (req, res, next) => {

    // Attempt to obtain a database connection
    let connection = await getConnection();

    try {
        // Start a transaction
        await connection.beginTransaction();
        // Start a transaction
        let userQuery = `SELECT * FROM untitled
        WHERE status = 1 ORDER BY user_name `;
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

module.exports = {
    addUser,
    userLogin,
    getUsers,
    getUser,
    updateUser,
    onStatusChange,
    getUserWma

}
