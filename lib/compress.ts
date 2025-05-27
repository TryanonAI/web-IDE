const MAX_FILE_SIZE = 89484; // 89.484kb
const MAX_DIMENSION = 1024;

/**
 * Convert a File to an HTMLImageElement
 */
function fileToImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Compress an image to a Blob using canvas
 */
async function compressImage(
    img: HTMLImageElement,
    quality: number,
    mimeType: string,
    scaleFactor: number = 1
): Promise<Blob> {
    const canvas = document.createElement('canvas');

    let width = img.width * scaleFactor;
    let height = img.height * scaleFactor;

    // Clamp to max dimension
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
            height = (height * MAX_DIMENSION) / width;
            width = MAX_DIMENSION;
        } else {
            width = (width * MAX_DIMENSION) / height;
            height = MAX_DIMENSION;
        }
    }

    canvas.width = Math.round(width);
    canvas.height = Math.round(height);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (!blob) return reject(new Error('Canvas toBlob returned null'));
                resolve(blob);
            },
            mimeType,
            quality
        );
    });
}

/**
 * Compress a user image File to under 100 kilobits
 */
export async function compressUserImageFile(file: File): Promise<File> {
    console.log("hi");
    const img = await fileToImage(file);

    const filename = file.name;
    const mimeType = 'image/jpeg'; // Use WebP for better compression

    let quality = 0.8;
    let scale = 1.0;
    let compressed = await compressImage(img, quality, mimeType, scale);

    // Step 1: Reduce quality
    while (compressed.size > MAX_FILE_SIZE && quality >= 0.05) {
        quality -= 0.05;
        compressed = await compressImage(img, quality, mimeType, scale);
    }

    // Step 2: Reduce dimensions
    while (compressed.size > MAX_FILE_SIZE && scale > 0.1) {
        scale -= 0.1;
        compressed = await compressImage(img, quality, mimeType, scale);
    }

    console.log(`Final size: ${Math.round(compressed.size)} bytes`);

    if (compressed.size > MAX_FILE_SIZE) {
        console.warn(`Warning: could not compress below 100 kilobits (final size: ${Math.round(compressed.size)} bytes)`);
    }

    return new File([compressed], filename.replace(/\.[^.]+$/, '.webp'), {
        type: mimeType,
    });
}
