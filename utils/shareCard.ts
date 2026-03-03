/**
 * Share Card Generator
 * 
 * Creates a beautiful canvas-based share card with the user's photo,
 * score, and branding for social media sharing.
 */

export async function generateShareCard(
    imageUrl: string,
    score: number,
    potentialScore: number,
    dayNumber: number
): Promise<Blob> {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // 1. Background — dark gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#09090b');
    bg.addColorStop(0.5, '#0f0a1a');
    bg.addColorStop(1, '#09090b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Load and draw user photo (centered, with vignette)
    try {
        const img = await loadImage(imageUrl);
        const photoSize = 600;
        const photoX = (W - photoSize) / 2;
        const photoY = 180;

        // Rounded clip path
        ctx.save();
        roundedRect(ctx, photoX, photoY, photoSize, photoSize, 40);
        ctx.clip();

        // Draw image to fill (cover)
        const scale = Math.max(photoSize / img.width, photoSize / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = photoX + (photoSize - drawW) / 2;
        const drawY = photoY + (photoSize - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Vignette overlay on photo
        const vignette = ctx.createRadialGradient(
            photoX + photoSize / 2, photoY + photoSize / 2, photoSize * 0.3,
            photoX + photoSize / 2, photoY + photoSize / 2, photoSize * 0.7
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = vignette;
        ctx.fillRect(photoX, photoY, photoSize, photoSize);
        ctx.restore();

        // Subtle border
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        roundedRect(ctx, photoX, photoY, photoSize, photoSize, 40);
        ctx.stroke();
    } catch {
        // If photo fails, draw placeholder
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundedRect(ctx, (W - 600) / 2, 180, 600, 600, 40);
        ctx.fill();
    }

    // 3. Brand header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Inter, -apple-system, sans-serif';
    ctx.fillText('SKINFACE', W / 2 - 20, 100);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('.AI', W / 2 + 80, 100);

    // Day badge
    ctx.fillStyle = 'rgba(147,51,234,0.3)';
    roundedRect(ctx, W / 2 - 60, 120, 120, 30, 15);
    ctx.fill();
    ctx.fillStyle = 'rgba(192,132,252,1)';
    ctx.font = 'bold 14px Inter, -apple-system, sans-serif';
    ctx.fillText(`GLOWUP #${dayNumber}`, W / 2, 141);

    // 4. Score display
    const scoreY = 870;

    // Score label
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 14px Inter, -apple-system, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('YOUR SCORE', W / 2, scoreY);

    // Main score
    const scoreColor = score >= 9 ? '#c084fc' : score >= 7.5 ? '#4ade80' : score >= 5 ? '#facc15' : '#f87171';
    ctx.fillStyle = scoreColor;
    ctx.font = 'italic 900 120px Inter, -apple-system, sans-serif';
    ctx.fillText(score.toFixed(1), W / 2, scoreY + 120);

    // /10 suffix
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = 'italic 900 40px Inter, -apple-system, sans-serif';
    ctx.fillText('/10', W / 2 + 100, scoreY + 120);

    // Potential score
    ctx.fillStyle = 'rgba(52,211,153,0.6)';
    ctx.font = 'bold 20px Inter, -apple-system, sans-serif';
    ctx.fillText(`Potential: ${potentialScore.toFixed(1)}`, W / 2, scoreY + 165);

    // 5. Glow effect behind score
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(W / 2, scoreY + 80, 0, W / 2, scoreY + 80, 200);
    glow.addColorStop(0, hexToRgba(scoreColor, 0.15));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, scoreY - 50, W, 300);
    ctx.restore();

    // 6. Divider
    const divY = scoreY + 210;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, divY);
    ctx.lineTo(W * 0.8, divY);
    ctx.stroke();

    // 7. CTA
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '16px Inter, -apple-system, sans-serif';
    ctx.fillText('Analyze your skin with AI', W / 2, divY + 40);

    ctx.fillStyle = 'rgba(147,51,234,0.8)';
    ctx.font = 'bold 18px Inter, -apple-system, sans-serif';
    ctx.fillText('skinface.ai', W / 2, divY + 75);

    // Convert to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
            'image/png',
            1.0
        );
    });
}

// --- Helpers ---

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
