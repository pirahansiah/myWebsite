from bleak import BleakScanner
import cv2 
async def scan_devices():
    devices = await BleakScanner.discover()
    for device in devices:
        print(f"Device: {device.name}, MAC: {device.address}, RSSI: {device.rssi}")

import asyncio
asyncio.run(scan_devices())


