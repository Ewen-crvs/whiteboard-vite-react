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

    socket.on("erase", ({ channel, shapes }) => {
        if (!drawings[channel]) {
            drawings[channel] = [];
        }
        // Update the server's record of drawings with the new shapes array after erasure
        drawings[channel] = shapes;
        // Broadcast the updated shapes to all clients in the channel
        io.to(channel).emit("erase", { shapes: drawings[channel] });
        console.log(`Erase action in channel: ${channel}, shapes remaining: ${shapes.length}`);
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

server.listen(6001, () => {
    console.log("Serveur en écoute sur http://localhost:6001");
});
