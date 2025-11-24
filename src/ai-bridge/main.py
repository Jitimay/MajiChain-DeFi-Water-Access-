#!/usr/bin/env python3
"""
MajiChain AI Bridge - Blockchain to SMS Gateway
Listens to blockchain events and sends SMS commands to ESP32 pumps
"""

import asyncio
import sqlite3
from web3 import Web3
import requests
import json
import os

class WaterBridge:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(os.getenv('BASE_RPC_URL')))
        self.sms_api_url = os.getenv('SMS_API_URL')
        self.sms_api_key = os.getenv('SMS_API_KEY')
        self.init_db()
    
    def init_db(self):
        """Initialize SQLite database"""
        self.conn = sqlite3.connect('water_logs.db')
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY,
                user_address TEXT,
                pump_id TEXT,
                credits INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.conn.commit()
    
    async def listen_events(self):
        """Listen for WaterPurchased events"""
        contract_address = os.getenv('CONTRACT_ADDRESS')
        contract_abi = json.loads(os.getenv('CONTRACT_ABI'))
        contract = self.w3.eth.contract(address=contract_address, abi=contract_abi)
        
        event_filter = contract.events.WaterPurchased.create_filter(fromBlock='latest')
        
        while True:
            for event in event_filter.get_new_entries():
                await self.process_purchase(event)
            await asyncio.sleep(2)
    
    async def process_purchase(self, event):
        """Process water purchase and send SMS command"""
        user = event['args']['user']
        credits = event['args']['credits']
        pump_id = event['args']['pumpId'].hex()
        
        # Log transaction
        self.conn.execute(
            'INSERT INTO transactions (user_address, pump_id, credits) VALUES (?, ?, ?)',
            (user, pump_id, credits)
        )
        self.conn.commit()
        
        # Send SMS command (1-5 bytes)
        sms_command = f"P{credits:02d}"  # P01, P02, etc.
        phone_number = os.getenv('ESP32_PHONE')
        
        await self.send_sms(phone_number, sms_command)
        
        print(f"SMS sent: {sms_command} to {phone_number}")
    
    async def send_sms(self, phone_number, message):
        """Send SMS using your own SMS service"""
        payload = {
            'to': phone_number,
            'message': message,
            'api_key': self.sms_api_key
        }
        
        try:
            response = requests.post(self.sms_api_url, json=payload)
            response.raise_for_status()
            print(f"SMS API response: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"SMS sending failed: {e}")

if __name__ == "__main__":
    bridge = WaterBridge()
    asyncio.run(bridge.listen_events())
