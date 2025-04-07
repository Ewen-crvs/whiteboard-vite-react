import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const drawings: { [channel: string]: any[] } = {};

io.on("connection", (socket: Socket) => {
    console.log("Un utilisateur s'est connecté");

    socket.on("join-channel", (channel: string) => {
        socket.join(channel);
        if (!drawings[channel]) {
            drawings[channel] = [];
        }
        socket.emit("load-drawings", drawings[channel]);
        console.log(`Utilisateur rejoint le channel: ${channel}`);
    });

    socket.on("draw", ({ channel, shape }) => {
        if (!drawings[channel]) {
            drawings[channel] = [];
        }
        drawings[channel].push(shape);
        io.to(channel).emit("draw", shape);
    });

    socket.on("clear", (channel: string) => {
        drawings[channel] = [];
        io.to(channel).emit("clear");
        console.log(`Clear demandé pour le channel ${channel}`);
    });

    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté");
    });
});

server.listen(6000, () => {
    console.log("Serveur en écoute sur http://localhost:3001");
});
