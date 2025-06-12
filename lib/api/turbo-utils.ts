import mime from 'mime-types';
import { ArconnectSigner, TurboFactory } from "@ardrive/turbo-sdk/web";

function fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

export const uploadToTurbo = async (file: File, walletAddress: string) => {
    const fileSize = file.size;
    const fileName = file.name;
    const contentType = file.type || mime.lookup(fileName) || 'application/octet-stream';

    // const jwk = await arweave.wallets.generate();
    // const signer = new ArweaveSigner(jwk as JWKInterface);
    
    const signer = new ArconnectSigner(window.arweaveWallet);
    const turbo = TurboFactory.authenticated({ signer });


    // Check size and log appropriate message
    // if (fileSize > 102400) {
    //     const [{ winc: fileSizeCost }] = await turbo.getUploadCosts({ bytes: [fileSize] });
    //     console.log(`OriginalSize: ${fileSize} bytes, Cost: ${fileSizeCost} Winc`);
    //     // compressedFile = await compressUserImageFile(file);
    //     compressedFile = await imageCompression(file, {
    //         maxSizeMB: 0.105688,
    //         maxWidthOrHeight: 1024,
    //         useWebWorker: true,
    //     });
    //     console.log("\n\n", compressedFile, "\n\n");
    //     const [{ winc: compressedFileSizeCost }] = await turbo.getUploadCosts({ bytes: [compressedFile.size] });
    //     console.log(`CompressedSize: ${compressedFile.size} bytes, Cost: ${compressedFileSizeCost} Winc`);
    // } else {
    //     compressedFile = file;
    //     console.log(`Size: ${fileSize} bytes (Free upload)`);
    // }

    try {
        const buffer = await fileToUint8Array(file);
        const uploadResult = await turbo.uploadFile({
            // @ts-expect-error ignore
            fileStreamFactory: () => {
                return new ReadableStream({
                    start(controller) {
                        controller.enqueue(buffer);
                        controller.close();
                    }
                });
            },
            fileSizeFactory: () => fileSize,
            fileName: fileName,
            contentType,
            dataItemOpts: {
                tags: [
                    { name: 'Version', value: '2.0.1' },
                    { name: "App-Name", value: "Anon" },
                    { name: 'Content-Type', value: contentType },
                    { name: 'Avatar-Owner', value: walletAddress.toString() },
                    { name: 'File-Extension', value: fileName.split('.').pop() || 'jpg' },
                ]
            }
        });

        console.log(`Uploaded ${fileName} (${contentType}) successfully. TX ID: ${uploadResult.id}`);
        return uploadResult.id;
    } catch (error) {
        if (error instanceof Error && error.message.includes("File size is too large")) {
            console.log("File size is too large");
        }
        throw error;
    }
};

