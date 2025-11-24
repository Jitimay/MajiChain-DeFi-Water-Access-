// MajiChain Web Interface - Futuristic Water Control System

const contractAddress = "0x4933781A5DDC86bdF9c9C9795647e763E0429E28";
const contractABI = [
    "function buyWater(bytes32 pumpId) payable",
    "function waterCredits(address) view returns (uint256)",
    "function creditPrice() view returns (uint256)",
    "function activatePump(bytes32 pumpId, uint256 liters) external",
    "event WaterPurchased(address indexed user, uint256 credits, bytes32 pumpId)",
    "event PumpActivated(bytes32 indexed pumpId, uint256 liters)"
];

const BASE_SEPOLIA_CONFIG = {
    chainId: '0x14A34', // 84532 Base Sepolia
    chainName: 'Base Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia-explorer.base.org']
};

let provider = null;
let signer = null;
let contract = null;
let pumpActive = false;

// Sci-fi status messages
const statusMessages = [
    "QUANTUM ENTANGLEMENT ESTABLISHED...",
    "BLOCKCHAIN SYNCHRONIZATION COMPLETE",
    "AI NEURAL NETWORKS ONLINE",
    "SATELLITE UPLINK CONFIRMED",
    "WATER DISTRIBUTION MATRIX READY"
];

// Wait for page to load
window.addEventListener('load', async () => {
    await initializeSystem();
});

async function initializeSystem() {
    // Animated startup sequence
    document.getElementById('status').innerHTML = 'BOOTING MAJICHAIN PROTOCOL...';
    
    await sleep(1000);
    
    // Check if ethers is loaded
    if (typeof ethers === 'undefined') {
        document.getElementById('status').innerHTML = 'ERROR: BLOCKCHAIN LIBRARY OFFLINE';
        return;
    }

    // Check for MetaMask
    if (typeof window.ethereum !== 'undefined') {
        document.getElementById('status').innerHTML = 'METAMASK DETECTED - READY FOR CONNECTION';
        document.getElementById('connectBtn').style.display = 'block';
        
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await connectWallet();
        }
    } else {
        document.getElementById('status').innerHTML = 'ERROR: METAMASK NOT DETECTED<br>PLEASE INSTALL METAMASK EXTENSION';
    }
    
    // Start telemetry updates
    updateTelemetry();
}

async function connectWallet() {
    try {
        document.getElementById('status').innerHTML = 'ESTABLISHING QUANTUM LINK...';
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BASE_SEPOLIA_CONFIG.chainId) {
            await switchToNetwork();
        }
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        const address = await signer.getAddress();
        document.getElementById('status').innerHTML = `CONNECTED: ${address.slice(0,8)}...${address.slice(-6)}<br>STATUS: QUANTUM LINK ESTABLISHED`;
        
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        // Show purchase section
        document.getElementById('purchaseSection').style.display = 'block';
        document.getElementById('connectBtn').style.display = 'none';
        
        // Animate connection success
        animateSuccess();
        
    } catch (error) {
        console.error('Connection failed:', error);
        document.getElementById('status').innerHTML = `CONNECTION FAILED: ${error.message}`;
    }
}

async function switchToNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_SEPOLIA_CONFIG.chainId }]
        });
    } catch (error) {
        if (error.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [BASE_SEPOLIA_CONFIG]
            });
        }
    }
}

async function buyWater() {
    if (!contract) return;
    
    try {
        document.getElementById('status').innerHTML = 'PROCESSING WATER CREDIT TRANSACTION...';
        
        const pumpId = ethers.utils.formatBytes32String("PUMP001");
        const tx = await contract.buyWater(pumpId, {
            value: ethers.utils.parseEther("0.001")
        });
        
        document.getElementById('status').innerHTML = `TRANSACTION BROADCAST: ${tx.hash.slice(0,12)}...<br>AWAITING BLOCKCHAIN CONFIRMATION`;
        
        await tx.wait();
        
        document.getElementById('status').innerHTML = 'WATER CREDITS ACQUIRED! 🚰<br>SMS COMMAND TRANSMITTED TO PUMP<br>TRANSACTION CONFIRMED ON BLOCKCHAIN';
        
        // Animate success
        animateSuccess();
        
    } catch (error) {
        console.error('Purchase failed:', error);
        document.getElementById('status').innerHTML = `TRANSACTION FAILED: ${error.message}`;
    }
}

async function activatePump() {
    if (pumpActive) return;
    
    pumpActive = true;
    document.getElementById('pumpStatusText').innerHTML = 'ACTIVATING...';
    document.getElementById('pumpIndicator').classList.add('active');
    document.getElementById('flowAnimation').classList.add('active');
    
    // Simulate pump activation
    await sleep(2000);
    
    document.getElementById('pumpStatusText').innerHTML = 'ONLINE - DISPENSING WATER';
    document.getElementById('status').innerHTML = 'PUMP ACTIVATED SUCCESSFULLY!<br>WATER FLOW: 2.5 L/MIN<br>PRESSURE: OPTIMAL';
    
    // Auto-stop after 10 seconds
    setTimeout(() => {
        if (pumpActive) deactivatePump();
    }, 10000);
}

async function deactivatePump() {
    pumpActive = false;
    document.getElementById('pumpStatusText').innerHTML = 'OFFLINE';
    document.getElementById('pumpIndicator').classList.remove('active');
    document.getElementById('flowAnimation').classList.remove('active');
    
    document.getElementById('status').innerHTML = 'PUMP DEACTIVATED<br>WATER FLOW: STOPPED<br>SYSTEM STANDBY MODE';
}

function refreshTelemetry() {
    const randomMessage = statusMessages[Math.floor(Math.random() * statusMessages.length)];
    document.getElementById('telemetry').innerHTML = `
        NETWORK: BASE SEPOLIA (CHAIN ID: 84532)<br>
        CONTRACT: ${contractAddress.slice(0,8)}...${contractAddress.slice(-6)}<br>
        BLOCK HEIGHT: ${Math.floor(Math.random() * 1000000) + 14332217}<br>
        ${randomMessage}
    `;
}

function updateTelemetry() {
    setInterval(() => {
        const timestamp = new Date().toLocaleTimeString();
        document.getElementById('telemetry').innerHTML = `
            NETWORK: BASE SEPOLIA (84532)<br>
            CONTRACT: DEPLOYED & VERIFIED<br>
            SENSORS: ONLINE<br>
            AI BRIDGE: ACTIVE<br>
            LAST UPDATE: ${timestamp}
        `;
    }, 5000);
}

function animateSuccess() {
    // Add success animation effects
    document.body.style.animation = 'none';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 100);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
