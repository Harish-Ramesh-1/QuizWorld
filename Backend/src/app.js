import express from 'express'
import cors from 'cors'
import authRoutes from '../src/Routes/authRoute.js'
import historyRoutes from '../src/Routes/historyRoutes.js'
import cookieParser from 'cookie-parser'

const app=express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser());
app.use('/auth',authRoutes);
app.use('/history',historyRoutes);


export default app;