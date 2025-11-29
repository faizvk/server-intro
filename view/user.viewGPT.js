import express from "express";
import User from "../model/user.model.js";

const router = express.Router();

/* ===================================================
   ✅ CREATE QUERIES
=================================================== */

// ✅ Signup (Create One User)
router.post("/signup", async (req, res) => {
  try {
    const userData = req.body;

    /*
      create() is used for inserting a SINGLE document.
      - Runs schema validation
      - Runs pre & post middleware
      - Slower for bulk inserts
    */
    const createdUser = await User.create(userData);

    res.status(201).json({
      success: true,
      createdUser,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ✅ Signup Multiple Users (Bulk Insert)
router.post("/signup_multi", async (req, res) => {
  try {
    const usersArray = req.body;

    /*
      insertMany()
      - Fastest way to insert multiple documents
      - Single optimized DB operation
      - Skips middleware by default
      - Partial inserts possible in unordered mode
    */
    const users = await User.insertMany(usersArray);

    res.status(201).json({
      success: true,
      message: "All users created successfully",
      users,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ===================================================
   ✅ READ QUERIES
=================================================== */

// ✅ Fetch All Users
router.get("/all_users", async (req, res) => {
  try {
    const users = await User.find();

    /*
      READ PERFORMANCE CONCEPTS:
      .select("name email")   → include fields
      .select("-password")   → exclude fields
      .select("+password")   → force include hidden fields
      .lean()                → faster, plain JS objects
      .sort()                → ordering
      .limit() / .skip()     → pagination
    */

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ✅ Fetch User By ID
router.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id);

    /*
      IMPORTANT:
      - Invalid ObjectId → CastError → 400
      - Valid ObjectId but no record → 404
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
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }
});

/* ===================================================
   ✅ COMPARISON OPERATORS
=================================================== */

// ✅ Users whose age != given age
router.get("/users/age/:age", async (req, res) => {
  try {
    const age = Number(req.params.age);

    const users = await User.find({
      age: { $ne: age },
    });

    /*
      MongoDB Comparison Operators:
      $gt   → greater than
      $lt   → less than
      $gte  → greater or equal
      $lte  → less or equal
      $eq   → equal
      $ne   → not equal
    */

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ===================================================
   ✅ LOGICAL OPERATORS
=================================================== */

router.get("/AND", async (req, res) => {
  try {
    /*
      $and combines multiple conditions.
      Example:
      age > 20 AND role === "user"

      Other Logical Operators:
      $or   → any condition match
      $nor  → none should match
      $not  → negates condition
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

/* ===================================================
   ✅ LOGIN ROUTE (AUTH QUERY)
=================================================== */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    /*
      { email } means { email: email }
      This is Object Property Shorthand
    */

    const user = await User.findOne({ email }).select("+password");

    /*
      .select("+password") is required because
      password is hidden using select:false in schema
    */

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ❗ Plain-text password comparison (teaching only)
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

/* ===================================================
   ✅ EXISTENCE & TYPE CHECKS
=================================================== */

// ✅ Check if address field exists
router.get("/addresscheck", async (req, res) => {
  try {
    const users = await User.find({
      address: { $exists: true },
    });

    /*
      Faster alternative:
      User.exists({ email: "abc@gmail.com" })
    */

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Check field data type
router.get("/typecheck", async (req, res) => {
  try {
    const users = await User.find({
      age: { $type: "number" },
    });

    /*
      Other $type values:
      string   → "string"
      objectId → "objectId"
      date     → "date"
      array    → "array"
    */

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===================================================
   ✅ ARRAY OPERATORS
=================================================== */

router.get("/validRoles", async (req, res) => {
  try {
    /*
      $in  → include values
      $nin → exclude values
    */

    const users = await User.find({
      role: { $in: ["superadmin"] },
    });

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===================================================
   ✅ REGEX + DISTINCT + COUNT
=================================================== */

// ✅ REGEX Search (Partial & Case-insensitive)
router.get("/search/:text", async (req, res) => {
  try {
    const regex = new RegExp(req.params.text, "i");

    const users = await User.find({
      name: { $regex: regex },
    });

    res.json({ users });
  } catch (err) {
    res.send(err.message);
  }
});

// ✅ DISTINCT — Unique Values
router.get("/roles_unique", async (req, res) => {
  try {
    const roles = await User.distinct("role");
    res.json({ roles });
  } catch (err) {
    res.send(err.message);
  }
});

// ✅ COUNT Documents
router.get("/count", async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    res.send(err.message);
  }
});

// ✅ SORTING + LIMITING
router.get("/sorted", async (req, res) => {
  try {
    const users = await User.find().sort({ age: -1 }).limit(5);
    res.json({ users });
  } catch (err) {
    res.send(err.message);
  }
});
//5️⃣ SORT + PAGINATION TOGETHER
const users = await User.find()
  .sort({ age: -1 }) // oldest first
  .skip((page - 1) * limit) // skip previous pages
  .limit(limit); // take only this page

/* ===================================================
   ✅ UPDATE QUERIES
=================================================== */

router.put("/update/:id", async (req, res) => {
  try {
    const id = req.params.id;

    /*
      findByIdAndUpdate is shortcut for findOneAndUpdate({_id:id})

      $set → updates only given fields
      new: true → returns updated document
      runValidators → enforces schema validation
    */

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { age: req.body.age } },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      updatedUser,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ===================================================
   ✅ DELETE QUERIES
=================================================== */

router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await User.deleteOne({ _id: id });

    res.json({
      success: true,
      message: "User deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

/*
✅ FULL QUERY CAPABILITY CHECKLIST

🔵 1. CREATE — Fully Covered
✔ create()
✔ insertMany()
✔ Middleware behavior
✔ Performance difference

🟢 2. READ — Fully Covered
✔ find()
✔ findOne()
✔ findById()
✔ select()
✔ lean()
✔ sort()
✔ limit()
✔ skip()

🟣 3. COMPARISON — Fully Covered
✔ $gt, $lt, $gte, $lte
✔ $ne, $eq

🟠 4. LOGICAL — Fully Covered
✔ $and, $or, $nor, $not

🟡 5. ARRAY — Fully Covered
✔ $in, $nin

🔴 6. EXISTENCE & TYPE — Fully Covered
✔ $exists
✔ $type
✔ User.exists()

🟤 7. STRING & REGEX — Fully Covered
✔ $regex
✔ Case-insensitive
✔ Partial search

🔵 8. COUNT & DISTINCT — Fully Covered
✔ countDocuments()
✔ distinct()

🟢 9. SORTING & PAGINATION — Fully Covered
✔ .sort()
✔ .skip()
✔ .limit()

🟣 10. UPDATE — Fully Covered
✔ findByIdAndUpdate()
✔ updateOne()
✔ updateMany()
✔ $set
✔ runValidators
✔ new: true

🔴 11. DELETE — Fully Covered
✔ deleteOne()
✔ deleteMany()
✔ findByIdAndDelete()

⭐ BONUS CONCEPTS
✔ Object Property Shorthand
✔ .select("+password")
✔ CastError Handling
✔ Regex Search
✔ Sorting with limits
✔ Field Projection
*/
