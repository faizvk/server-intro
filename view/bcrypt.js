import bcrypt from "bcrypt";

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. generate salt
    const salt = await bcrypt.genSalt(10);

    // 2. hash password
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. store hashed password
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.json({ message: "User created", user });
  } catch (err) {
    res.json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // fetch user with password
    const user = await User.findOne({ email }).select("+password");

    if (!user) return res.status(400).send("Invalid email");

    // compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).send("Incorrect password");

    res.send("Login success!");
  } catch (err) {
    res.send(err.message);
  }
});

/*
You can let Mongoose hash automatically.

User schema:

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});


Now you can simply do:

user.password = req.body.password;
await user.save();


And hashing happens automatically.

| Algorithm | Security | Speed  | Notes                  |
| --------- | -------- | ------ | ---------------------- |
| bcrypt    | ⭐⭐⭐⭐     | Medium | Most common            |
| argon2    | ⭐⭐⭐⭐⭐    | Fast   | Best modern algorithm  |
| scrypt    | ⭐⭐⭐⭐⭐    | Medium | Strong memory hardness |

*/
