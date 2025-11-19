import express from "express";
import User from "../model/user.model.js";
const router = express.Router();

// CREATE QUERIES
//signup page
router.post("/signup", async (req, res) => {
  const userData = req.body;

  // users.push(userData);
  const createdUser = await User.create(userData);

  // const user = new User(userData);
  // await user.save(); //this is the object oriented programming way of creating the data
  //sending the data to the DB

  res.status(201).json({
    createdUser,
  });
});

//a process where multiple documents are entered in the database at once
//DATA SEEDING or handling bulk uploads

router.post("/signup_multi", async (req, res) => {
  const usersArray = req.body;

  const users = await User.create(usersArray);

  if (!users) {
    res.status(400).json({
      message: "Users couldnt be created",
    });
  }

  res.status(201).json({
    message: "All users created successfully",
    users,
  });
});

// READ

// fetch any data form the db
//conditions!!!

router.get("/all_users", async (req, res) => {
  try {
    const users = await User.find();
    //find() -:> that returns multiple documents that follow the conditions
    // findOne() -:> returns the FIRST document that matches the conditions

    //no conditions for finding ALL USERS
    res.status(200).json({
      users,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    //_id -> normal syntax for id in mongodb
    const user = await User.findOne({
      _id: id,
    });

    //basic query where we match the query with a field

    if (!user) {
      res.status(500).send("No user found");
    }

    res.status(200).json({
      user,
    });
  } catch (err) {
    res.send(err.message);
  }
});

//find = read

//find people below the age of 40
//write comparison queries
// > -- $gt
// < -- $lt
// >= -- $gte
// <= -- $lte
// != -- $ne

router.get("/users/age/:age", async (req, res) => {
  try {
    const age = req.params.age;

    const users = await User.find({
      age: {
        $ne: age,
      },
    });
    res.status(200).json({
      users,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
});

// LOGICAL OPERATORS
// AND -> true AND true = true = $and
// OR -> true OR false = true  = $or
// NOT -> true => false  = $not

// fetch users with age more than 25 AND with role user

router.get("/AND", async (req, res) => {
  try {
    const users = await User.find({
      $and: [
        {
          age: {
            $gt: 20,
          },
        },
        {
          role: "user",
        },
      ],
    });

    if (users.length === 0) {
      res.send("users not found");
    }

    res.status(200).json({
      users,
    });
  } catch (err) {
    res.send(err.message);
  }
});

//create a login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    //explicit way of including some fields

    if (!user) {
      res.status(404).send("User not found");
    }

    console.log(user);
    //match the password
    if (user.password !== password) {
      res.status(400).send("Invalid Password");
    }

    res.status(200).json({
      message: "User logged in successfully",
      user,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Existence and type checks
//find the users whos address exists in the db
router.get("/addresscheck", async (req, res) => {
  const user = await User.find({
    address: {
      $exists: true, //this will check the existence of the 'address' field in the documents
    },
  });

  if (user.length === 0) {
    res.send("No users with addresses");
  }

  res.send({ user });
});

router.get("/typecheck", async (req, res) => {
  const users = await User.find({
    age: {
      $type: "number",
    },
  });

  if (users.length === 0) {
    res.send("No users with age number");
  }

  res.send({ users });
});

// array related queries

//roles : ["user", "admin"]
// membership operators ($in, $nin)
// $in : in
// $nin: not in

router.get("/validRoles", async (req, res) => {
  const users = await User.find({
    role: {
      $in: ["superadmin"],
    },
  });

  res.send({ users });
});

//Update

// findOneAndUpdate
router.put("/update/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findOneAndUpdate(
      {
        _id: id, //contains the matching query
      },
      {
        $set: {
          age: req.body.age,
        },
      },
      {
        new: true, //return updated document
        runValidators: true, //applying schema rules to the updated data
      }
    );

    res.send(user);
  } catch (err) {
    res.send(err.message);
  }
});

//updateOne()
//updateMany()
//findByIdAndUpdate() -> first object -> id
//.save()

//homework is to read delete queries

router.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;
  const user = await User.deleteOne({
    _id: id,
  });

  res.json({
    message: "User deleted successfully",
    user,
  });
});

// DELETE
// deleteOne
// deleteMany
// findByIdAndDelete
// findOneAndDelete

export default router;

// https://www.mongodb.com/docs/manual/aggregation/

/*
201 Created (create success).

200 OK (read success).

400 Bad request (invalid input).

401 Unauthorized / 403 Forbidden (auth/permissions).

404 Not found.

500 Server error.
*/
