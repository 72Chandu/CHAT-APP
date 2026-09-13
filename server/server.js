import dns from "dns";
import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoute.js";
import messageRouter from "./routes/messageRoute.js";
import {Server} from 'socket.io'

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const server = http.createServer(app);

//initialize socket.io server
export const io=new Server(server,{
    cors:{origin:"*"}  //all the origin allowed
})


//store online user
export const userSocketMap={} //userId:socketId
io.on("connection",(socket)=>{      //socket.io connection handler
    const userId=socket.handshake.query.userId;
    console.log("userId",userId)

    if(userId) userSocketMap[userId]=socket.id

    //emit online user to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap))

    socket.on("disconnect",()=>{
        console.log("user disconnected",userId)
        delete userSocketMap[userId]
        io.emit("getOnlineUsers",Object.keys(userSocketMap))
    })
})



// Middlewares
app.use(express.json({ limit: "4mb" }));
app.use(cors());

app.use("/api/status", (req, res) => {
    res.send("Server is live");
});
app.use('/api/auth',userRouter)
app.use('/api/message',messageRouter)

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server failed to start:", error.message);
        process.exit(1);
    }
};

startServer();