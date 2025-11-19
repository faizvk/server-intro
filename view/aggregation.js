import express from "express";
import User from "../model/user.model.js";
const router = express.Router();

router.get("/aggregation", async (req, res) => {
  try {
    const data = await User.aggregate([
      {
        $match: {
          role: "admin",
        },
      },
    ]);

    if (!data) {
      res.send("No data found");
    }

    res.json({
      data,
    });
  } catch (err) {
    res.send(err.message);
  }
});

//count the number of users, admins, superadmins

router.get("/roles", async (req, res) => {
  try {
    const analytics = await User.aggregate([
      {
        $group: {
          _id: "$role",
          countofUsers: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          role: "$_id",
          countofUsers: 1,
        },
      },
      {
        $sort: {
          countofUsers: -1, //descending
        },
      },
    ]);

    //$sum, $avg, $max,$min

    res.json({
      analytics,
    });
  } catch (err) {
    res.send(err.message);
  }
});

router.get("/pagination/:page", async (req, res) => {
  try {
    const page = req.params.page;
    const limit = 2;

    const skip = (page - 1) * limit;
    // (2-1)*2= 2

    const users = await User.aggregate([
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    res.json({ users });
  } catch (err) {
    res.send(err.message);
  }
});

export default router;

// https://www.jwt.io/introduction
