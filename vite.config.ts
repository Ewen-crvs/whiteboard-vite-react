import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
        hmr: {
            clientPort: 3000,
        },
        watch: {
            usePolling: true,
        },
    },
    preview: {
        port: 3000,
        host: "0.0.0.0",
    },
});
