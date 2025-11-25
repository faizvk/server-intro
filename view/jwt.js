/*
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJpZCI6IjEyMyIsInJvbGUiOiJ1c2VyIn0.
gVDzVyGm9t.qpQZhh7dpiS0L-9B8ZaYFb3mE

HEADER.PAYLOAD.SIGNATURE

🌟 4. HEADER

Example header (before encoding):

{
  "alg": "HS256",
  "typ": "JWT"
}


Meaning:

alg: algorithm used for signing

typ: token type

After base64 encoding:

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
////////////////////////////////////////////////////
🌟 5. PAYLOAD

This contains the actual data.

Example:

{
  "id": "23987498",
  "role": "admin",
  "name": "faiz",
  "iat": 1712845263,
  "exp": 1712848863
}


Contains:

User ID

Email

Role

Expiry time

Issue time

⚠️ Payload is NOT encrypted!
Anyone can decode it.

But they cannot modify it successfully.
///////////////////////////////////////////////////
🌟 6. SIGNATURE (most important part)

This is what prevents hacking:

HMACSHA256( base64UrlEncode(header) + "." + base64UrlEncode(payload), SECRET )


If someone modifies the payload:

The signature becomes invalid

Server rejects it

This is why JWT is safe.
//////////////////////////////////////////////////////////////////////////////
✔ Best: HTTP-Only Cookie

Protected from JavaScript (XSS attacks)

✔ OK: localStorage

Easier, but less secure

Vulnerable to XSS

✔ Good: Secure memory (mobile apps)
/////////////////////////////////////////////////////////////
🌟 10. JWT Expiry & Refresh Tokens
✔ Access Token

Lifetime: 10–30 minutes
Used in headers for API access.

✔ Refresh Token

Lifetime: days/weeks
Stored securely in cookies or database.

Flow:

Access token expires

User sends refresh token

Server verifies it

Server issues a new access token

This prevents constant login while keeping high security.
/////////////////////////////////////////////////////////////
✔ The client sends the JWT token with every protected request
✔ The server uses the secret key to verify the token
✔ If token is valid → user is allowed
✔ If token is invalid/expired → user is denied
*/
//When login succeeds:
import jwt from "jsonwebtoken";

const token = jwt.sign(
  { id: user._id, role: user.role }, // payload
  process.env.JWT_SECRET, // secret key
  { expiresIn: "1h" } // expiration
);

res.json({ message: "Logged in", token });
//This creates a JWT.

//🌟 9. Verifying JWT (Protected Route)

//Middleware:

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).send("Token missing");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // attach user info
    next();
  } catch (err) {
    res.status(401).send("Invalid or expired token");
  }
};

//Use it:

router.get("/profile", auth, (req, res) => {
  res.send("Welcome " + req.user.id);
});

/*
| Feature                    | Sessions             | JWT                            |
| -------------------------- | -------------------- | ------------------------------ |
| Where is user data stored? | Server memory/Redis  | Inside token (client)          |
| Client stores              | Only session ID      | Full JWT                       |
| Server checks              | Session store        | Signature verification         |
| Scaling                    | Hard                 | Very easy                      |
| Stateless?                 | ❌ No                 | ✔ Yes                          |
| Ideal for                  | Traditional websites | Modern APIs, SPAs, Mobile apps |
*/

/*
⭐ 4. Modern Auth Architecture (Full Flow)
🔹 1. Signup

Hash password with bcrypt

Store hashed password

No token created here

🔹 2. Login

Compare password using bcrypt

If correct → create:

Short-lived Access Token (5–15 min)

Long-lived Refresh Token (7–30 days)

🔹 3. Access Protected Routes

Client sends Access Token

Server verifies token with secret key

🔹 4. When Access Token expires

Server rejects request: 401 Token expired

Client silently uses Refresh Token to request new Access Token

User continues without logging in again

🔹 5. Logout

Clear refresh token cookie

Optionally revoke refresh tokens in DB
*/
