/* ---------------------------------------------------------
   🔐 COMPLETE SECURITY SETUP FOR EXPRESS APPLICATION
   Includes:
   - dotenv
   - CORS
   - Helmet
   - XSS Protection
   - Rate Limiting
   - CSRF Protection
   - Input Validation + Sanitization
------------------------------------------------------------*/

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import xssClean from "xss-clean";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import { body, validationResult } from "express-validator";

// Load environment variables from .env file
dotenv.config();

const app = express();

/* ---------------------------------------------------------
   1. BASIC MIDDLEWARES
------------------------------------------------------------*/

// Parse JSON bodies
app.use(express.json());

// Parse cookies (needed for CSRF + refresh token)
app.use(cookieParser());

/* ---------------------------------------------------------
   2. CORS SECURITY
------------------------------------------------------------*/
/*
  CORS prevents unauthorized frontends from calling your backend.
  Set allowed frontend origin.
*/
app.use(
  cors({
    origin: ["http://localhost:5173"], // frontend origin
    credentials: true, // enable cookies if using JWT refresh cookies
  })
);

/* ---------------------------------------------------------
   3. HELMET (SECURITY HEADERS)
------------------------------------------------------------*/
/*
  Helmet adds HTTP security headers:
  - XSS protection
  - Prevent clickjacking
  - Prevent MIME sniffing
  - Content Security Policy
*/
app.use(helmet());

/* ---------------------------------------------------------
   4. XSS PROTECTION
------------------------------------------------------------*/
/*
  Removes malicious HTML/JS from user input:
  <script> alert("hack") </script>
*/
app.use(xssClean());

/* ---------------------------------------------------------
   5. RATE LIMITING
------------------------------------------------------------*/
/*
  Prevent brute-force attacks on login/signup routes.
  Example: max 50 requests per 15 minutes from one IP.
*/
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/auth", limiter); // Apply only on authentication routes

/* ---------------------------------------------------------
   6. CSRF PROTECTION (Only if using cookies)
------------------------------------------------------------*/
/*
  CSRF attacks trick a user into performing actions without consent.
  CSRF protection ensures every request has a valid token.
*/
const csrfMiddleware = csurf({
  cookie: true, // token stored in a cookie
});

// Apply CSRF only to routes that modify data
app.use("/protected", csrfMiddleware);

// Route to send CSRF token to frontend
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

/* ---------------------------------------------------------
   7. INPUT VALIDATION + SANITIZATION
------------------------------------------------------------*/
/*
  Prevents attacks through user data like:
  - SQL Injection
  - MongoDB injection
  - Script injection
  - Invalid emails/passwords
*/

// Example signup route with validation
app.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(), // sanitization

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be 8 characters long"),

    body("name")
      .trim()
      .escape() // prevent HTML/script injection
      .notEmpty()
      .withMessage("Name is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    res.json({
      success: true,
      message: "Signup validation passed!",
      data: req.body,
    });
  }
);

/* ---------------------------------------------------------
   DEFAULT TEST ROUTE
------------------------------------------------------------*/

app.get("/", (req, res) => {
  res.send("Security setup is active!");
});

/* ---------------------------------------------------------
   START SERVER
------------------------------------------------------------*/

app.listen(3000, () => {
  console.log("Secure server running at http://localhost:3000");
});

// xss-clean automatically sanitizes all incoming request data (body, query, params).
// Modern Express apps use xss-clean instead of xss because it provides global protection
// without needing to manually sanitize each field.
