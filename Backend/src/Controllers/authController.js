import bcrypt from 'bcrypt'
import User from "../Models/UserModel.js"
import jwt from "jsonwebtoken"

export const signup = async (req,res) => {
    try{
        const user = await User.create(req.body);
        
        // Create JWT token and set cookie after successful signup
        const token = jwt.sign(
            {id: user._id},
            process.env.JWT_SECRET,
            {expiresIn:"1d"}
        );

        const isProd = process.env.NODE_ENV === "production";
        res.cookie("access_token",token,{
            httpOnly: true,
            path: "/",
            sameSite: isProd ? "none" : "lax",
            secure: isProd,
            maxAge: 24 * 60 * 60 * 1000 
        });
        
        res.status(201).json({message: "User created and logged in", user: {id: user._id, username: user.username, email: user.email}});
    }catch(err){
        res.status(400).json({error: err.message });
    }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const emailLower = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: emailLower }).select("+password");

    if (!user) {
      console.log("[Login] User not found for email:", emailLower);
      return res.status(401).json({ message: "User not found", email: emailLower });
    }

    if (!user.password) {
      console.log("[Login] User has no password set (email:", emailLower + ")");
      return res.status(401).json({ message: "User has no password set", email: emailLower });
    }

    const passwordMatch = await bcrypt.compare(String(password), user.password);

    if (!passwordMatch) {
      console.log("[Login] Password mismatch for email:", emailLower);
      return res.status(401).json({ message: "Password mismatch", email: emailLower });
    }

    const token = jwt.sign(
      {id: user._id},
      process.env.JWT_SECRET,
      {expiresIn:"1d"}
    );

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("access_token",token,{
      httpOnly: true,
      path: "/",
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000 
    })
    
    res.status(200).json({message: "Login successful"});

  } catch (err) {
    console.error("[Login] Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};
