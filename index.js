import express from "express";
import mongoose from "mongoose";
import UserRoutes from "./view/user.view.js";
import aggregation from "./view/aggregation.js";

const app = express();
app.use(express.json());

//Database connection code
const uri =
  "mongodb+srv://faizvk:4dVb04IN7q7Nyd5v@cluster0.jn8alm4.mongodb.net/?appName=Cluster0";
//URI -> Uniform Resource Identifier

//implement a db connection promise
mongoose
  .connect(uri)
  .then(() => console.log("Connected to Database Successfully"))
  .catch((err) => console.error(err.message));

app.use(UserRoutes);
app.use(aggregation);
//signup, login, reset password, logout, fetch users
// security
// database (cloud DB Atlas)
// Modelling and Validating the data
//mongoose

//read mongoosejs.com/docs/

app.listen(3000, () => {
  console.log("Server is live on http://localhost:3000/");
});
