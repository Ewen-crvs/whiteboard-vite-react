import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

// Initialisation de l'application express
const app = express();
const server = http.createServer(app);

// Initialisation de Socket.IO avec CORS configuré pour accepter toutes les origines
const io = new Server(server, {
    cors: {
        origin: "*", // Permet à tous les domaines de se connecter
        methods: ["GET", "POST"],
    },
});

// Tableau pour stocker les dessins
let drawings: any[] = [];

// Connexion du client via socket
io.on("connection", (socket: Socket) => {
    console.log("Un utilisateur s'est connecté");

    // Envoyer les dessins existants à l'utilisateur qui se connecte
    socket.emit("load-drawings", drawings);

    // Écouter les nouveaux dessins
    socket.on("draw", (data) => {
        drawings.push(data);
        io.emit("draw", data); // Diffuse le dessin à tous les clients connectés
    });

    // Écouter l'événement "clear" pour effacer le tableau
    socket.on("clear", () => {
        drawings = [];
        io.emit("clear"); // Diffuse le message "clear" à tous les clients pour effacer le tableau
    });

    // Lors de la déconnexion d'un utilisateur
    socket.on("disconnect", () => {
        console.log("Un utilisateur s'est déconnecté");
    });
});

// Démarrage du serveur
server.listen(3001, () => {
    console.log("Serveur en écoute sur http://localhost:3001");
});
