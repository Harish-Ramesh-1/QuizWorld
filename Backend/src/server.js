
import app from './app.js'
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./Config/db.js";
import { Server } from "socket.io";
import { createServer } from "http";
import  SocketHandler  from './Socket/socketHandler.js'
import  RoomHandler  from './Socket/roomHandler.js'
import redisClient from './Config/redisdb.js';


dotenv.config({path: "../.env"});
const port = process.env.PORT;

const startServer = async () => {
    try {
        await connectDB();

        httpServer.listen(port,() => {
            console.log(`The app is running in ${port}`);
        })
    } catch (err) {
        console.error("Server startup aborted due to database connection failure.");
        process.exit(1);
    }
}

await redisClient.connect()
    .then(() => console.log("Connected to Redis successfully."))
    .catch((err) => {
        console.error("Failed to connect to Redis:", err);
        process.exit(1);
    });


const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
    },
});


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))


SocketHandler(io);  // Singleplayer quiz handler
RoomHandler(io);    // Multiplayer room handler


startServer();
