export const exportToImage = (canvas: HTMLCanvasElement, filename: string = 'whiteboard.png'): void => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    link.click();
};

export const loadImage = (canvas: HTMLCanvasElement): Promise<void> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            const img = new Image();
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            img.onload = () => {
                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw the loaded image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                resolve();
            };

            img.onerror = () => reject(new Error('Error loading image'));

            // Read the file as data URL
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    img.src = event.target.result as string;
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsDataURL(file);
        };

        input.click();
    });
};
