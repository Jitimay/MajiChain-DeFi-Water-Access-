// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WaterBroker is Ownable, ReentrancyGuard {
    mapping(address => uint256) public waterCredits;
    mapping(bytes32 => bool) public pumpActivations;
    
    uint256 public creditPrice = 0.001 ether;
    
    event WaterPurchased(address indexed user, uint256 credits, bytes32 pumpId);
    event PumpActivated(bytes32 indexed pumpId, uint256 liters);
    event Withdrawal(address indexed owner, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    function buyWater(bytes32 pumpId) external payable nonReentrant {
        require(msg.value >= creditPrice, "Insufficient payment");
        require(pumpId != bytes32(0), "Invalid pump ID");
        
        uint256 credits = msg.value / creditPrice;
        uint256 cost = credits * creditPrice;
        uint256 refund = msg.value - cost;
        
        // Update state BEFORE external call (CEI pattern)
        waterCredits[msg.sender] += credits;
        
        emit WaterPurchased(msg.sender, credits, pumpId);
        
        // Refund excess payment (after state changes)
        if (refund > 0) {
            (bool success, ) = payable(msg.sender).call{value: refund, gas: 2300}("");
            require(success, "Refund failed");
        }
    }
    
    function activatePump(bytes32 pumpId, uint256 liters) external onlyOwner {
        require(pumpId != bytes32(0), "Invalid pump ID");
        require(liters > 0, "Liters must be greater than 0");
        
        pumpActivations[pumpId] = true;
        emit PumpActivated(pumpId, liters);
    }
    
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance, gas: 2300}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawal(owner(), balance);
    }
    
    function setCreditPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        creditPrice = _newPrice;
    }
    
}
