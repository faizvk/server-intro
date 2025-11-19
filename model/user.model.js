import mongoose from "mongoose";

//defined the schema
//define the fields that are allowed
//defining rules for each and every field
//mongoose has built in validators

//OOP -> DOP-> Document oriented programming
const userSchema = mongoose.Schema(
  {
    name: {
      //string
      type: String, //this will allow only string to be added in this field
      required: true, //this will make name to be included mandatorily in every document
      trim: true, //it removes unecessary spaces from end and beginning
    },
    age: {
      type: Number,
      required: true,
      min: [18, "You are too young"], //minimum allowed value of the number
      max: 100, //maximum allowed value of the number
    },
    email: {
      type: String,
      index: true, //that will make querying through email faster
      required: true,
      lowercase: true, //make sure that all the characters that we have entered are converted to lowercase
      unique: [true, "this is my custom error for duplicate email"],
      //this will make sure that no duplicated email is used by an user
      validate: {
        validator: function (email) {
          // return (email.includes("@") && email.includs(".com"))
          return /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/.test(
            email
          );
        },
        message: "{VALUE} is not a valid email",
      },
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      maxLength: 20,
      select: false, //will make sure that whenever we are fetching any user details, password is not included in that
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin", "guest"], //enumeration -> array of allowed values
      default: "user", //if the user doesnt manually add role, use this value
      required: true,
    },
  },

  {
    timestamps: true, //logging the data-> it will keep a record of when the data was created and when it was last updated
  }
);

//model
//ensure a schema is applied to data and in what collection is it stored
const User = mongoose.model("Users", userSchema);

export default User;

// Mongoose Data types
// String
// Number
// Date
// Buffer
// Boolean
// Mixed
// ObjectId -> unique id
// Array
// Decimal128
// Map
// UUID
// Double
// Int32
