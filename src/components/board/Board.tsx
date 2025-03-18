import React, { ReactElement } from "react";
import { io, Socket } from "socket.io-client";
import "./style.css";

interface BoardProps {
    color: string;
    shape: "line" | "rectangle" | "circle" | "freeform";
    penSize: number;
    isShapeFilled: boolean;
}

interface MousePosition {
    x: number;
    y: number;
}

interface DrawingData {
    shape: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    penSize: number;
    isFilled: boolean;
}

class Board extends React.Component<BoardProps> {
    private canvasRef = React.createRef<HTMLCanvasElement>();
    socket: Socket = io("localhost:3001", {
        transports: ["websocket"],
    });
    ctx: CanvasRenderingContext2D | null = null;
    isDrawing: boolean = false;
    startPos: MousePosition = { x: 0, y: 0 };
    lastPos: MousePosition = { x: 0, y: 0 };
    baseImageData: ImageData | null = null;

    constructor(props: BoardProps) {
        super(props);

        this.socket.on("load-drawings", (drawings: DrawingData[]) => {
            this.clearBoard(false);
            drawings.forEach((data) => this.drawShape(data));
        });

        this.socket.on("draw", (data: DrawingData) => {
            this.drawShape(data);
        });

        this.socket.on("clear", () => {
            this.clearBoard(false);
        });
    }

    componentDidMount(): void {
        this.setupCanvas();
    }

    clearBoard = (emit: boolean = true): void => {
        if (!this.ctx || !this.canvasRef.current) return;
        this.ctx.clearRect(
            0,
            0,
            this.canvasRef.current.width,
            this.canvasRef.current.height
        );
        if (emit) this.socket.emit("clear");
    };

    getMousePos = (e: MouseEvent): MousePosition => {
        const canvas = this.canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    drawShape(data: DrawingData): void {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.penSize;
        ctx.fillStyle = data.color;

        switch (data.shape) {
            case "line":
                ctx.moveTo(data.startX, data.startY);
                ctx.lineTo(data.endX, data.endY);
                ctx.stroke();
                break;
            case "rectangle":
                if (data.isFilled) {
                    ctx.fillRect(
                        data.startX,
                        data.startY,
                        data.endX - data.startX,
                        data.endY - data.startY
                    );
                } else {
                    ctx.strokeRect(
                        data.startX,
                        data.startY,
                        data.endX - data.startX,
                        data.endY - data.startY
                    );
                }
                break;
            case "circle":
                const radius = Math.sqrt(
                    Math.pow(data.endX - data.startX, 2) +
                        Math.pow(data.endY - data.startY, 2)
                );
                ctx.arc(data.startX, data.startY, radius, 0, 2 * Math.PI);
                if (data.isFilled) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
                break;
        }
        ctx.closePath();
    }

    finishDrawing = (): void => {
        if (!this.isDrawing || !this.ctx) return;
        this.isDrawing = false;
        this.baseImageData = null;

        this.socket.emit("draw", {
            shape: this.props.shape,
            startX: this.startPos.x,
            startY: this.startPos.y,
            endX: this.lastPos.x,
            endY: this.lastPos.y,
            color: this.props.color,
            penSize: this.props.penSize,
            isFilled: this.props.isShapeFilled,
        });
    };

    setupCanvas(): void {
        const canvas = this.canvasRef.current;
        if (!canvas) return;
        this.ctx = canvas.getContext("2d");
        if (!this.ctx) return;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        canvas.addEventListener("mousedown", this.handleMouseDown);
        canvas.addEventListener("mousemove", this.handleMouseMove);
        canvas.addEventListener("mouseup", this.handleMouseUp);
    }

    handleMouseDown = (e: MouseEvent): void => {
        this.isDrawing = true;
        this.startPos = this.getMousePos(e);
        this.lastPos = this.startPos;
        if (this.ctx)
            this.baseImageData = this.ctx.getImageData(
                0,
                0,
                this.canvasRef.current!.width,
                this.canvasRef.current!.height
            );
    };

    handleMouseMove = (e: MouseEvent): void => {
        if (!this.isDrawing || !this.ctx) return;
        this.lastPos = this.getMousePos(e);

        if (this.props.shape === "freeform") {
            this.drawShape({
                shape: "line",
                startX: this.startPos.x,
                startY: this.startPos.y,
                endX: this.lastPos.x,
                endY: this.lastPos.y,
                color: this.props.color,
                penSize: this.props.penSize,
                isFilled: false,
            });
            this.socket.emit("draw", {
                shape: "line",
                startX: this.startPos.x,
                startY: this.startPos.y,
                endX: this.lastPos.x,
                endY: this.lastPos.y,
                color: this.props.color,
                penSize: this.props.penSize,
                isFilled: false,
            });
            this.startPos = { ...this.lastPos };
        } else {
            this.ctx.putImageData(this.baseImageData!, 0, 0);
            this.drawShape({
                shape: this.props.shape,
                startX: this.startPos.x,
                startY: this.startPos.y,
                endX: this.lastPos.x,
                endY: this.lastPos.y,
                color: this.props.color,
                penSize: this.props.penSize,
                isFilled: this.props.isShapeFilled,
            });
        }
    };

    handleMouseUp = (): void => {
        this.finishDrawing();
    };

    render(): ReactElement {
        return (
            <div id="sketch" className="sketch">
                <canvas ref={this.canvasRef} className="board"></canvas>
            </div>
        );
    }
}

export default Board;
