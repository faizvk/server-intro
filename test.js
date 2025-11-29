User.find({ role: { $in: ["user", "admin"] } });
User.find({
  $and: [{ age: { $gte: 25 } }, { role: { $in: ["user", "admin"] } }],
});

User.find()
  .sort({ age: -1 })
  .skip((page - 1) * limit)
  .skip(limit);

User.aggregate([
  {
    $lookup: {
      from: "orders",
      localField: "_id",
      foreignFiels: "userId",
      as: "orders",
    },
  },
]);
