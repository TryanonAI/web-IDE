import mime from 'mime-types';
import { ArconnectSigner, TurboFactory } from "@ardrive/turbo-sdk/web";
import axios from 'axios';
import Arweave from 'arweave';

const FREE_UPLOAD_SIZE = 100 * 1024 // 100KB in bytes
const PRICE_BUFFER = 1.1 // 10% buffer for price fluctuations
const TURBO_AR_ADDRESS = 'JNC6vBhjHY1EPwV3pEeNmrsgFMxH5d38_LHsZ7jful8'

// Initialize authenticated client with Wander
console.log('Checking for arweaveWallet...', !!window.arweaveWallet);
if (!window.arweaveWallet) {
    console.error('ArweaveWallet not found - Please install Wander');
    throw new Error('Please install Wander')
}
console.log('ArweaveWallet found, initializing...');

const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https"
})

console.log('Arweave initialized with config:', { host: "arweave.net", port: 443, protocol: "https" });

// const jwk = await arweave.wallets.generate();
// const signer = new ArweaveSigner(jwk as JWKInterface);

const signer = new ArconnectSigner(window.arweaveWallet);
const turbo = TurboFactory.authenticated({ signer });

console.log('Turbo client initialized with ArconnectSigner');

function fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

// Function to get token price from CoinGecko
const getTokenPrice = async (token: string) => {
    console.log(`Fetching price for token: ${token}`);
    const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`
    )
    console.log(`Token price response:`, response.data);
    return response.data[token].usd
}


// Function to calculate required token amount
const calculateTokenAmount = async (
    wincAmount: string,
    tokenType: string
) => {
    console.log(`Calculating token amount for ${wincAmount} winc, token type: ${tokenType}`);

    // Get fiat rates for 1 GiB
    const fiatRates = await turbo.getFiatRates()
    console.log('Fiat rates:', fiatRates);
    const usdPerGiB = fiatRates.fiat.usd

    // Get winc cost for 1 GiB
    const costs = await turbo.getUploadCosts({ bytes: [1024 * 1024 * 1024] }) // 1 GiB in bytes
    console.log('Upload costs for 1 GiB:', costs);
    const wincPerGiB = BigInt(costs[0].winc)

    // Calculate cost per winc in USD
    const usdPerWinc = Number(usdPerGiB) / Number(wincPerGiB)
    console.log(`USD per winc: ${usdPerWinc}`);

    // Calculate required USD amount
    const requiredUsd = Number(wincAmount) * usdPerWinc
    console.log(`Required USD: ${requiredUsd}`);

    // Get token price
    const tokenPrice = await getTokenPrice(tokenType)
    const tokenAmount = (requiredUsd / tokenPrice) * PRICE_BUFFER

    console.log(`Token amount needed: ${tokenAmount} ${tokenType}`);
    return tokenAmount
}

const ensureSufficientBalance = async (
    fileSize: number,
    tokenType: string,
) => {
    console.log(`Ensuring sufficient balance for file size: ${fileSize} bytes, token type: ${tokenType}`);

    // Check current balance
    const balance = await turbo.getBalance()
    console.log('Current balance:', balance);
    const currentWinc = BigInt(balance.controlledWinc)

    // If file is under 100KB, it's free
    if (fileSize <= FREE_UPLOAD_SIZE) {
        console.log('File is under 100KB, upload is free');
        return true
    }

    // Get upload cost
    const costs = await turbo.getUploadCosts({ bytes: [fileSize] })
    console.log('Upload costs:', costs);
    const requiredWinc = BigInt(costs[0].winc)
    console.log(`Current winc: ${currentWinc}, Required winc: ${requiredWinc}`);

    // If we have enough balance, return true
    if (currentWinc >= requiredWinc) {
        console.log('Sufficient balance available');
        return true
    }

    console.log('Insufficient balance, purchasing tokens...');
    // Calculate and purchase required tokens
    const tokenAmount = await calculateTokenAmount(
        requiredWinc.toString(),
        tokenType
    )

    console.log(`Creating transaction for ${tokenAmount} AR tokens`);
    // Create transaction
    let transaction;
    try {
        transaction = await arweave.createTransaction({
            target: TURBO_AR_ADDRESS,
            quantity: arweave.ar.arToWinston(tokenAmount.toString())
        })
    } catch (error) {
        console.error('Error creating transaction:', error);
        return false
    }

    console.log('Signing transaction...');
    // Sign and post transaction
    await window.arweaveWallet?.sign(transaction)
    await arweave.transactions.post(transaction)
    console.log(`Transaction posted with ID: ${transaction.id}`);

    console.log('Waiting for confirmation (36 minutes)...');
    // Wait for confirmation (typically 30-36 minutes)
    await new Promise((resolve) => setTimeout(resolve, 36 * 60 * 1000))

    console.log('Submitting transaction to Turbo...');
    // Submit transaction to Turbo
    await turbo.submitFundTransaction({
        txId: transaction.id
    })

    console.log('Balance funding complete');
    return true
}

export const uploadToTurbo = async (file: File, walletAddress: string, isManifest = false) => {
    console.log(`Starting upload to Turbo for file: ${file.name}, size: ${file.size} bytes, wallet: ${walletAddress}, isManifest: ${isManifest}`);

    const fileSize = file.size;
    const fileName = file.name;
    const contentType = file.type || mime.lookup(fileName) || 'application/octet-stream';

    console.log(`File details - Name: ${fileName}, Size: ${fileSize}, Content-Type: ${contentType}`);

    await ensureSufficientBalance(file.size, 'arweave');

    try {
        console.log('Converting file to buffer...');
        const buffer = await fileToUint8Array(file);

        console.log('Starting file upload to Turbo...');
        const uploadResult = await turbo.uploadFile({
            fileStreamFactory: () => {
                return new ReadableStream({
                    start(controller) {
                        controller.enqueue(buffer);
                        controller.close();
                    }
                });
            },
            fileSizeFactory: () => fileSize,
            dataItemOpts: {
                tags: [
                    { name: 'Version', value: '2.0.1' },
                    { name: 'App-Name', value: 'Anon' },
                    { name: 'Owner', value: walletAddress },
                    { name: 'Content-Type', value: contentType },
                    ...(isManifest ? [{ name: 'Type', value: 'manifest' }] : [])
                ]
            }
        });

        console.log(`Uploaded ${fileName} (${contentType}) successfully. TX ID: ${uploadResult.id}`);
        return uploadResult.id;
    } catch (error) {
        console.error('Upload error:', error);
        if (error instanceof Error && error.message.includes("File size is too large")) {
            console.log("File size is too large");
            return;
        }
        throw error;
    }
};

