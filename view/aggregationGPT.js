import express from "express";
import User from "../model/user.model.js";

const router = express.Router();

/* ---------------------------------------------------
   BASIC AGGREGATION EXAMPLE
----------------------------------------------------*/

router.get("/aggregation", async (req, res) => {
  try {
    /*  
      .aggregate() ALWAYS expects an ARRAY OF STAGES.
      Each stage runs sequentially → like a pipeline.
      
      $match = filtering stage (like WHERE in SQL)
      Here: selecting only users whose role = "admin"
    */
    const data = await User.aggregate([
      {
        $match: {
          role: "admin",
        },
      },
    ]);

    /*
      NOTE: data is always an array.
      If no match → data = []
      So `!data` is never true.
    */
    if (data.length === 0) {
      return res.send("No data found");
    }

    res.json({ data });
  } catch (err) {
    res.send(err.message);
  }
});

/* ---------------------------------------------------
   AGGREGATION PIPELINE:
   COUNT USERS BY ROLE
----------------------------------------------------*/

router.get("/roles", async (req, res) => {
  try {
    /*
      This pipeline performs:
      1. GROUP documents by role
      2. COUNT number of users in each role
      3. Rename fields for a clean output
      4. Sort results by count (descending)
    */

    const analytics = await User.aggregate([
      {
        /*
          $group collects documents into groups based on a key.
          _id: "$role" → groups all users having the same role.
          
          $sum: 1  → adds +1 for each document in the group
          Final result:
          [
            { _id: "user", countofUsers: 10 },
            { _id: "admin", countofUsers: 3 }
          ]
        */
        $group: {
          _id: "$role",
          countofUsers: { $sum: 1 },
        },
      },
      {
        /*
          $project reshapes each output document.
          Here:
          - Removing `_id`
          - Creating a readable "role" field
        */
        $project: {
          _id: 0,
          role: "$_id",
          countofUsers: 1, // keep the field
        },
      },
      {
        /*
          Sort roles by count in descending order:
          Highest number of users → first
        */
        $sort: {
          countofUsers: -1,
        },
      },
    ]);

    // Other useful accumulator operators:
    // $avg, $sum, $max, $min, $push, $addToSet

    res.json({ analytics });
  } catch (err) {
    res.send(err.message);
  }
});

/* ---------------------------------------------------
   AGGREGATION-BASED PAGINATION
----------------------------------------------------*/

router.get("/pagination/:page", async (req, res) => {
  try {
    const page = Number(req.params.page);
    const limit = 2; // number of results per page

    /*
      skip = number of docs to ignore before returning results.
      Example:
      page 1 → skip 0
      page 2 → skip 2
      page 3 → skip 4
    */
    const skip = (page - 1) * limit;

    /*
      $skip: skips N documents
      $limit: returns next N documents
      
      Using skip & limit inside aggregation allows
      pagination AND additional complex stages after/before.
    */
    const users = await User.aggregate([{ $skip: skip }, { $limit: limit }]);

    res.json({ users });
  } catch (err) {
    res.send(err.message);
  }
});

export default router;
