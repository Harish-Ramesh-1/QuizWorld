import express from 'express'
import { signup , login } from '../Controllers/authController.js';
import auth from '../Middlewares/authMiddleware.js';
const router = express.Router();

router.post('/signup',signup);
router.post('/login',login);
router.get('/me',auth,(req,res) => {
    res.json({message: "You are authenticated"})
})
router.get('/logout',(req,res) => {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("access_token",{
      httpOnly: true,
      path: "/",
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000 
    })
    res.status(200).json({message: "Logout successful"});
})
export default router;