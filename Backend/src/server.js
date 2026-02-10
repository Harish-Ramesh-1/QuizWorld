
import app from './app.js'
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./Config/db.js";


dotenv.config({path: "../.env"});
const port = process.env.PORT;
console.log(port)

connectDB();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))


app.listen(port,() => {
    console.log(`The app is running in ${port}`);
})
