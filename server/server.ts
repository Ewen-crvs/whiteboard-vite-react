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
        // Use socket.to() to broadcast to all clients EXCEPT the sender
        socket.to(channel).emit("draw", { shape });
    });

    socket.on("undo", (data) => {
        if (!drawings[data.channel]) {
            drawings[data.channel] = [];
        }
        // Update the server's record with the shapes after undo
        drawings[data.channel] = data.shapes;
        // Broadcast to all OTHER clients in the channel
        socket.to(data.channel).emit("undo", data.shapes);
    });

    socket.on("redo", (data) => {
        if (!drawings[data.channel]) {
            drawings[data.channel] = [];
        }
        // Update the server's record with the shapes after redo
        drawings[data.channel] = data.shapes;
        // Broadcast to all OTHER clients in the channel
        socket.to(data.channel).emit("redo", data.shapes);
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

    socket.on("shape-moved", (data) => {
        const { id, x, y, channel = "default" } = data;
        
        // Update the shape position in the server's record
        if (drawings[channel]) {
            drawings[channel] = drawings[channel].map(shape => 
                shape.id === id ? { ...shape, x, y } : shape
            );
        }
        
        // Broadcast the shape movement to all OTHER clients in the channel
        socket.to(channel).emit("shape-moved", { id, x, y });
    });

    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté");
    });
});

server.listen(6001, () => {
    console.log("Serveur en écoute sur http://localhost:6001");
});
