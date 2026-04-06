import express from 'express'
import { signup , login } from '../Controllers/authController.js';
import auth from '../Middlewares/authMiddleware.js';
import User from '../Models/UserModel.js';
const router = express.Router();

router.post('/signup',signup);
router.post('/login',login);
router.get('/me',auth, async (req,res) => {
  try {
    const user = await User.findById(req.user.id).select('username email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: "You are authenticated",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
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