// MajiChain Web Interface - Complete Water Purchase App

const contractAddress = "0x4933781A5DDC86bdF9c9C9795647e763E0429E28";
const contractABI = [
    "function buyWater(bytes32 pumpId) payable",
    "function waterCredits(address) view returns (uint256)",
    "function creditPrice() view returns (uint256)",
    "event WaterPurchased(address indexed user, uint256 credits, bytes32 pumpId)"
];

const BASE_SEPOLIA_CONFIG = {
    chainId: '0x507', // 1287 Moonbase Alpha
    chainName: 'Moonbase Alpha',
    nativeCurrency: { name: 'DEV', symbol: 'DEV', decimals: 18 },
    rpcUrls: ['https://rpc.api.moonbase.moonbeam.network'],
    blockExplorerUrls: ['https://moonbase.moonscan.io']
};

let provider = null;
let signer = null;
let contract = null;

// Wait for page to load
window.addEventListener('load', async () => {
    // Check if ethers is loaded
    if (typeof ethers === 'undefined') {
        document.getElementById('status').innerHTML = 'Error: Blockchain library not loaded';
        return;
    }

    // Check for MetaMask
    if (typeof window.ethereum !== 'undefined') {
        document.getElementById('status').innerHTML = 'Please connect your wallet';
        document.getElementById('connectBtn').style.display = 'block';
        
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await connectWallet();
        }
    } else {
        document.getElementById('status').innerHTML = 'Please install MetaMask';
    }
});

async function connectWallet() {
    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BASE_SEPOLIA_CONFIG.chainId) {
            await switchToBaseSepolia();
        }
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        const address = await signer.getAddress();
        document.getElementById('status').innerHTML = `Connected: ${address.slice(0,6)}...${address.slice(-4)}`;
        
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        document.getElementById('purchaseSection').style.display = 'block';
        document.getElementById('connectBtn').style.display = 'none';
        
    } catch (error) {
        console.error('Connection failed:', error);
        document.getElementById('status').innerHTML = `Connection failed: ${error.message}`;
    }
}

async function switchToBaseSepolia() {
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
        document.getElementById('status').innerHTML = 'Processing purchase...';
        
        const pumpId = ethers.utils.formatBytes32String("PUMP001");
        const tx = await contract.buyWater(pumpId, {
            value: ethers.utils.parseEther("0.001")
        });
        
        document.getElementById('status').innerHTML = `Transaction sent: ${tx.hash.slice(0,10)}...`;
        await tx.wait();
        document.getElementById('status').innerHTML = 'Water purchased successfully! 🚰 SMS sent to pump.';
        
    } catch (error) {
        console.error('Purchase failed:', error);
        document.getElementById('status').innerHTML = `Purchase failed: ${error.message}`;
    }
}
