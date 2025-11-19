import express from "express";
import User from "../model/user.model.js";

// Router groups all user-related endpoints in one place
const router = express.Router();

/* ---------------------------------------------------
   CREATE QUERIES
----------------------------------------------------*/

// Signup (Create one user)
router.post("/signup", async (req, res) => {
  try {
    // Extract user data sent from frontend
    const userData = req.body;

    // Creates one document inside MongoDB
    const createdUser = await User.create(userData);

    res.status(201).json({
      success: true,
      createdUser,
    });
  } catch (err) {
    // Handles validation errors from Mongoose schema
    res.status(400).json({ success: false, message: err.message });
  }
});

// Signup multiple users (Bulk insert)
router.post("/signup_multi", async (req, res) => {
  try {
    // Accepts an array of documents to insert
    const usersArray = req.body;

    /* 
      insertMany() is used instead of create() because:
      - It performs ONE optimized bulk operation (faster)
      - It avoids running save() middleware for each doc (unless configured)
      - It supports unordered inserts (partial success)
      - create([]) internally loops → slower for large datasets
    */
    const users = await User.insertMany(usersArray);

    res.status(201).json({
      success: true,
      message: "All users created successfully",
      users,
    });
  } catch (err) {
    // Captures validation errors during bulk insert
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------
   READ QUERIES
----------------------------------------------------*/

// Fetch all users
router.get("/all_users", async (req, res) => {
  try {
    // Finds all documents in the Users collection
    const users = await User.find();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    // Internal DB/connection-level errors
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Fetch user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // findById is shorthand for findOne({ _id: id })
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    // Happens when ID is not a valid MongoDB ObjectId
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }
});

/* ---------------------------------------------------
   COMPARISON QUERIES
----------------------------------------------------*/

// Users whose age != given age
router.get("/users/age/:age", async (req, res) => {
  try {
    // Converts string query param to number
    const age = Number(req.params.age);

    // $ne → "not equal" operator in MongoDB
    const users = await User.find({
      age: { $ne: age },
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------
   LOGICAL OPERATORS
----------------------------------------------------*/

// Get users with age > 20 AND role = "user"
router.get("/AND", async (req, res) => {
  try {
    /* 
      $and allows combining multiple filter conditions.
      Equivalent to:
      age > 20 AND role === "user"
    */
    const users = await User.find({
      $and: [{ age: { $gt: 20 } }, { role: "user" }],
    });

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Users not found" });
    }

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------
   LOGIN ROUTE
----------------------------------------------------*/

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    /* 
      { email } is shorthand for { email: email }
      JS automatically maps variable name → key name.
      This is called "Object Property Shorthand".
    */
    const user = await User.findOne({ email }).select("+password");

    /* 
      Why .select("+password")?
      In schema, password has `select: false`
      → password is hidden in all queries by default.

      Adding "+" overrides schema and explicitly includes it.
      Needed only during login to compare passwords.
    */

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Plain-text password comparison (teaching purpose only)
    if (user.password !== password) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------
   EXISTENCE / TYPE CHECKS
----------------------------------------------------*/

// Find users whose "address" field exists
router.get("/addresscheck", async (req, res) => {
  try {
    // $exists checks if a field exists in a document
    const users = await User.find({ address: { $exists: true } });

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users with addresses" });
    }

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Find users where age is of type number
router.get("/typecheck", async (req, res) => {
  try {
    // $type checks BSON data type in MongoDB
    const users = await User.find({
      age: { $type: "number" },
    });

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users with numeric age" });
    }

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------
   ARRAY QUERIES
----------------------------------------------------*/

// Find users whose role is in list ["superadmin"]
router.get("/validRoles", async (req, res) => {
  try {
    /* 
      $in checks if field value matches ANY element in the array.
      Useful for filtering multiple allowed roles.
    */
    const users = await User.find({
      role: { $in: ["superadmin"] },
    });

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------
   UPDATE QUERIES
----------------------------------------------------*/

router.put("/update/:id", async (req, res) => {
  try {
    const id = req.params.id;

    /*
      findOneAndUpdate updates a document in one DB call.
      $set ensures only specified fields change.
      new: true → return updated document, not old one.
      runValidators: true → validates updated data using schema rules.
    */
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $set: { age: req.body.age } },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      updatedUser,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------
   DELETE QUERIES
----------------------------------------------------*/

router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // deleteOne removes a document matching a filter condition
    const result = await User.deleteOne({ _id: id });

    // deletedCount = 0 means no document matched the filter
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    // Invalid ObjectId leads to error
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
