import React, { ReactElement } from 'react';
import { io, Socket } from 'socket.io-client';

import './style.css';

interface BoardProps {
    color: string;
    shape: 'line' | 'rectangle' | 'circle' | 'freeform';
}

interface BoardState {}

interface MousePosition {
    x: number;
    y: number;
}

class Board extends React.Component<BoardProps, BoardState> {
    private canvasRef = React.createRef<HTMLCanvasElement>();
    timeout: NodeJS.Timeout | null = null;
    socket: Socket = io("10.26.129.232:3000");
    ctx: CanvasRenderingContext2D | null = null;
    isDrawing: boolean = false;
    startPos: MousePosition = { x: 0, y: 0 };
    baseImageData: ImageData | null = null;

    constructor(props: BoardProps) {
        super(props);

        this.socket.on("canvas-data", (data: string) => {
            const image = new Image();
            const canvas = this.canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            image.onload = () => {
                ctx.drawImage(image, 0, 0);
            };
            image.src = data;
        });
    }

    componentDidMount(): void {
        this.setupCanvas();
    }

    componentDidUpdate(prevProps: BoardProps): void {
        if (prevProps.color !== this.props.color && this.ctx) {
            this.ctx.strokeStyle = this.props.color;
        }
    }

    clearBoard = (): void => {
        if (!this.ctx || !this.canvasRef.current) return;
        const canvas = this.canvasRef.current;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const base64ImageData = canvas.toDataURL("image/png");
        this.socket.emit("canvas-data", base64ImageData);
    }

    getMousePos = (e: MouseEvent): MousePosition => {
        const canvas = this.canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    drawShape(currentPos: MousePosition): void {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.beginPath();

        switch (this.props.shape) {
            case 'line':
                ctx.moveTo(this.startPos.x, this.startPos.y);
                ctx.lineTo(currentPos.x, currentPos.y);
                break;
            case 'rectangle':
                const width = currentPos.x - this.startPos.x;
                const height = currentPos.y - this.startPos.y;
                ctx.strokeRect(this.startPos.x, this.startPos.y, width, height);
                break;
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(currentPos.x - this.startPos.x, 2) + 
                    Math.pow(currentPos.y - this.startPos.y, 2)
                );
                ctx.arc(this.startPos.x, this.startPos.y, radius, 0, 2 * Math.PI);
                break;
            case 'freeform':
                ctx.moveTo(this.startPos.x, this.startPos.y);
                ctx.lineTo(currentPos.x, currentPos.y);
                this.startPos = { ...currentPos };
                break;
        }

        if (this.props.shape !== 'rectangle') {
            ctx.stroke();
        }
        ctx.closePath();
    }

    setupCanvas(): void {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        this.ctx = canvas.getContext('2d');
        if (!this.ctx) return;

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            this.ctx!.lineWidth = 3;
            this.ctx!.lineJoin = 'round';
            this.ctx!.lineCap = 'round';
            this.ctx!.strokeStyle = this.props.color;
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('mouseleave', this.handleMouseLeave);
    }

    handleMouseDown = (e: MouseEvent): void => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        this.isDrawing = true;
        this.startPos = this.getMousePos(e);

        if (this.ctx) {
            this.baseImageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
    };

    handleMouseMove = (e: MouseEvent): void => {
        if (!this.isDrawing || !this.ctx || !this.canvasRef.current) return;
        
        const currentPos = this.getMousePos(e);

        if (this.props.shape === 'freeform') {
            this.drawShape(currentPos);
        } else if (this.baseImageData) {
            this.ctx.putImageData(this.baseImageData, 0, 0);
            this.drawShape(currentPos);
        }
    };

    handleMouseUp = (e: MouseEvent): void => {
        if (!this.isDrawing || !this.ctx || !this.canvasRef.current) return;

        if (this.props.shape !== 'freeform') {
            const currentPos = this.getMousePos(e);

            if (this.baseImageData) {
                this.ctx.putImageData(this.baseImageData, 0, 0);
                this.drawShape(currentPos);
            }
        }

        this.isDrawing = false;
        this.baseImageData = null;

        if (this.timeout !== null) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            if (!this.canvasRef.current) return;
            const base64ImageData = this.canvasRef.current.toDataURL("image/png");
            this.socket.emit("canvas-data", base64ImageData);
        }, 10);
    };

    handleMouseLeave = (): void => {
        if (this.isDrawing && this.ctx && this.baseImageData) {
            this.ctx.putImageData(this.baseImageData, 0, 0);
            this.isDrawing = false;
            this.baseImageData = null;
        }
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