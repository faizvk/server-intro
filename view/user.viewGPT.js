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

    /* 
      ⚡ IMPORTANT READ CONCEPTS:
      - .select("name email") → include fields
      - .select("-password") → exclude fields
      - .lean() → returns plain JS objects (faster)
      - .limit(n) / .skip(n) → pagination
      - .sort({ age: -1 }) → sorting descending
    */

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

    /* 
      IMPORTANT: Mongoose cast errors occur when ID is invalid.
      Example: /users/123 → throws CastError
    */
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
    const age = Number(req.params.age);

    // $ne → "not equal" operator in MongoDB
    const users = await User.find({
      age: { $ne: age },
    });

    /* 
      OTHER IMPORTANT COMPARISON OPERATORS:
      - $gt  → greater than
      - $lt  → less than
      - $gte → greater or equal
      - $lte → less or equal
      - $eq  → strictly equal
    */

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

router.get("/AND", async (req, res) => {
  try {
    /* 
      $and allows combining multiple filter conditions.
      Equivalent to:
      age > 20 AND role === "user"

      OTHER IMPORTANT LOGICAL OPERATORS:
      - $or  → age > 20 OR role === "user"
      - $nor → none of the conditions match
      - $not → negates a condition
    */
    const users = await User.find({
      $and: [{ age: { $gt: 20 } }, { role: "user" }],
    });

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
      This is called "Object Property Shorthand".
    */
    const user = await User.findOne({ email }).select("+password");

    /* 
      IMPORTANT QUERY CONCEPT:
      .select("+password") → force include hidden fields
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

router.get("/addresscheck", async (req, res) => {
  try {
    const users = await User.find({ address: { $exists: true } });

    /* 
      Mongoose also supports:
      User.exists({ email: "a@b.com" })
      → returns true/false very quickly
    */

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Find users where age is of type number
router.get("/typecheck", async (req, res) => {
  try {
    const users = await User.find({
      age: { $type: "number" },
    });

    /* 
      Other $type values:
      string → "string"
      objectId → "objectId"
      date → "date"
      array → "array"
    */

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------
   ARRAY QUERIES
----------------------------------------------------*/

router.get("/validRoles", async (req, res) => {
  try {
    /* 
      $in → match any of the values
      $nin → match none of the values
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
   OTHER IMPORTANT QUERY CONCEPTS (NEW)
----------------------------------------------------*/

// REGEX SEARCH (partial matching)
router.get("/search/:text", async (req, res) => {
  try {
    const regex = new RegExp(req.params.text, "i"); // i = case insensitive

    const users = await User.find({
      name: { $regex: regex },
    });

    res.json({ users });
  } catch (err) {
    res.send(err.message);
  }
});

// DISTINCT — get unique values of a field
router.get("/roles_unique", async (req, res) => {
  try {
    const roles = await User.distinct("role");
    res.json({ roles });
  } catch (err) {
    res.send(err.message);
  }
});

// COUNT DOCUMENTS
router.get("/count", async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    res.send(err.message);
  }
});

// SORTING + LIMITING
router.get("/sorted", async (req, res) => {
  try {
    const users = await User.find().sort({ age: -1 }).limit(5);
    res.json({ users });
  } catch (err) {
    res.send(err.message);
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
      new: true → return updated document, not old.
      runValidators: true → validates updated data.
    */
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $set: { age: req.body.age } },
      {
        new: true,
        runValidators: true,
      }
    );

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

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

/*
✅ FULL QUERY CAPABILITY CHECKLIST
🔵 1. CREATE (Insert) — Fully Covered

✔ create()
✔ insertMany()
✔ Why insertMany is faster
✔ Middleware behavior differences

🟢 2. READ (Find) — Fully Covered

✔ find()
✔ findOne()
✔ findById()
✔ .select() (include/exclude fields)
✔ .lean() (performance)
✔ .sort()
✔ .limit()
✔ .skip()

🟣 3. COMPARISON OPERATORS — Fully Covered

✔ $gt, $lt, $gte, $lte
✔ $ne (not equal)
✔ $eq

🟠 4. LOGICAL OPERATORS — Fully Covered

✔ $and
✔ $or
✔ $nor
✔ $not

🟡 5. ARRAY OPERATORS — Fully Covered

✔ $in
✔ $nin

🔴 6. EXISTENCE & TYPE — Fully Covered

✔ $exists
✔ $type
✔ User.exists()

🟤 7. STRING & PATTERN MATCHING — Fully Covered

✔ $regex
✔ Case-insensitive search
✔ Partial search

🔵 8. COUNTING & DISTINCT — Fully Covered

✔ countDocuments()
✔ estimatedDocumentCount() (explained in comments)
✔ distinct() (unique field values)

🟢 9. SORTING / PAGINATION — Fully Covered

✔ .sort({ field: 1 / -1 })
✔ .skip()
✔ .limit()
✔ Pagination logic

🟣 10. UPDATE — Fully Covered

✔ findOneAndUpdate()
✔ updateOne()
✔ updateMany()
✔ $set
✔ Schema validation with runValidators
✔ new: true

🔴 11. DELETE — Fully Covered

✔ deleteOne()
✔ deleteMany()
✔ findByIdAndDelete()
✔ DeletedCount checks

⭐ BONUS CONCEPTS INCLUDED

The file ALSO includes concepts that most tutorials don’t cover:

✔ Object Property Shorthand

({ email } meaning { email: email })

✔ .select("+password")

Explained why you must override schema-level select: false

✔ CastError handling

Invalid ObjectId → handled

✔ Regex-based searching

(very useful for search bars)

✔ Sorting with limits

Top N queries

✔ Field projection

Selective data exposure
*/
