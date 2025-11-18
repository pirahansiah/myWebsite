import time
import os
import pytesseract
from PIL import Image, ImageGrab
from datetime import datetime
import hashlib
import pyautogui
import cv2
import numpy as np
from collections import defaultdict

class WhatsAppAutoMonitor:
    def __init__(self, interval_minutes=1, output_file="whatsapp_messages.txt"):
        self.interval = interval_minutes * 60
        self.output_file = output_file
        self.screenshots_dir = "screenshots"
        self.processed_messages = set()  # Track processed messages
        self.last_message_count = defaultdict(int)  # Track message count per contact
        
        # Configure pyautogui
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 1
        
        if not os.path.exists(self.screenshots_dir):
            os.makedirs(self.screenshots_dir)
    
    def take_screenshot(self):
        """Take a screenshot of the entire desktop"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        screenshot_path = os.path.join(self.screenshots_dir, f"screenshot_{timestamp}.png")
        screenshot = ImageGrab.grab()
        screenshot.save(screenshot_path)
        return screenshot, screenshot_path
    
    def find_green_dots(self, screenshot):
        """Find green notification dots in WhatsApp Web"""
        # Convert PIL to OpenCV format
        cv_image = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
        
        # Define range for green color (WhatsApp notification dots)
        # You may need to adjust these HSV values based on your theme
        hsv = cv2.cvtColor(cv_image, cv2.COLOR_BGR2HSV)
        
        # Green color range for WhatsApp notifications
        lower_green = np.array([35, 100, 100])
        upper_green = np.array([85, 255, 255])
        
        # Create mask for green colors
        mask = cv2.inRange(hsv, lower_green, upper_green)
        
        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        dots = []
        for contour in contours:
            area = cv2.contourArea(contour)
            # Filter by size (notification dots are small circles)
            if 10 < area < 200:  # Adjust these values based on your screen resolution
                x, y, w, h = cv2.boundingRect(contour)
                # Check if it's roughly circular
                aspect_ratio = w / h
                if 0.7 < aspect_ratio < 1.3:  # Roughly square/circular
                    center_x = x + w // 2
                    center_y = y + h // 2
                    dots.append((center_x, center_y, area))
        
        return dots
    
    def find_whatsapp_chat_area(self, screenshot):
        """Try to locate WhatsApp Web chat area"""
        # This is a basic implementation - you might need to adjust
        # based on your WhatsApp Web layout
        width, height = screenshot.size
        
        # Assume chat area is roughly in the right 2/3 of the screen
        chat_area = (width // 3, 0, width, height)
        return chat_area
    
    def click_near_green_dot(self, dot_position):
        """Click on the contact list item near the green dot"""
        x, y, area = dot_position
        
        # Click slightly to the left of the dot (where the contact name usually is)
        click_x = max(x - 100, 50)  # Ensure we don't click too far left
        click_y = y
        
        print(f"Clicking on contact at ({click_x}, {click_y})")
        pyautogui.click(click_x, click_y)
        time.sleep(2)  # Wait for chat to load
    
    def extract_chat_messages(self, screenshot):
        """Extract messages from the current chat view"""
        # Focus on the chat area (right side of WhatsApp Web)
        width, height = screenshot.size
        chat_area = screenshot.crop((width // 2, height // 4, width - 50, height - 100))
        
        # Extract text using OCR
        text = pytesseract.image_to_string(chat_area, config='--psm 6')
        
        return self.parse_whatsapp_messages(text)
    
    def parse_whatsapp_messages(self, text):
        """Parse WhatsApp messages from OCR text"""
        lines = text.split('\n')
        messages = []
        current_message = ""
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for time patterns (common WhatsApp format: HH:MM)
            if self.is_time_pattern(line):
                if current_message:
                    messages.append(current_message.strip())
                current_message = ""
            else:
                # Skip very short lines or lines that look like UI elements
                if len(line) > 2 and not self.is_ui_element(line):
                    current_message += " " + line
        
        # Add the last message if any
        if current_message:
            messages.append(current_message.strip())
        
        return messages
    
    def is_time_pattern(self, text):
        """Check if text looks like a time pattern"""
        import re
        # Match patterns like "14:30", "2:45 PM", etc.
        time_patterns = [
            r'\d{1,2}:\d{2}',
            r'\d{1,2}:\d{2}\s*(AM|PM)',
        ]
        
        for pattern in time_patterns:
            if re.search(pattern, text):
                return True
        return False
    
    def is_ui_element(self, text):
        """Filter out common UI elements"""
        ui_keywords = [
            'online', 'last seen', 'typing', 'recording', 'whatsapp',
            'search', 'menu', 'call', 'video', 'attach', 'emoji'
        ]
        
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in ui_keywords)
    
    def get_current_contact_name(self, screenshot):
        """Try to extract the current contact/chat name"""
        width, height = screenshot.size
        # Header area where contact name is usually displayed
        header_area = screenshot.crop((width // 2, 0, width, height // 8))
        
        text = pytesseract.image_to_string(header_area, config='--psm 7')
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Return the first substantial line as contact name
        for line in lines:
            if len(line) > 2 and not self.is_ui_element(line):
                return line
        
        return "Unknown Contact"
    
    def save_new_messages(self, contact_name, messages, timestamp):
        """Save only new messages to file"""
        if not messages:
            return 0
        
        contact_key = contact_name.lower().replace(' ', '_')
        previous_count = self.last_message_count[contact_key]
        current_count = len(messages)
        
        # Determine new messages
        new_messages = []
        if current_count > previous_count:
            new_messages = messages[previous_count:]
            self.last_message_count[contact_key] = current_count
        
        if new_messages:
            with open(self.output_file, 'a', encoding='utf-8') as f:
                f.write(f"\n=== NEW MESSAGES from {contact_name} at {timestamp} ===\n")
                for i, message in enumerate(new_messages, 1):
                    f.write(f"[{i}] {message}\n")
                f.write("=" * 60 + "\n")
            
            print(f"✅ Saved {len(new_messages)} new messages from {contact_name}")
            return len(new_messages)
        
        return 0
    
    def monitor_whatsapp(self):
        """Main monitoring function"""
        print("🚀 Starting WhatsApp Auto-Monitor...")
        print(f"📷 Screenshots every {self.interval//60} minute(s)")
        print(f"💾 Saving to: {self.output_file}")
        print("⚠️  Make sure WhatsApp Web is open and visible!")
        print("🛑 Press Ctrl+C to stop\n")
        
        try:
            while True:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"\n🔍 [{timestamp}] Scanning for new messages...")
                
                # Take screenshot
                screenshot, screenshot_path = self.take_screenshot()
                
                # Find green notification dots
                green_dots = self.find_green_dots(screenshot)
                
                if green_dots:
                    print(f"🟢 Found {len(green_dots)} notification dot(s)!")
                    
                    total_new_messages = 0
                    
                    for i, dot in enumerate(green_dots, 1):
                        print(f"\n📱 Processing notification {i}/{len(green_dots)}...")
                        
                        # Click on the contact with notification
                        self.click_near_green_dot(dot)
                        
                        # Take another screenshot to get the chat view
                        time.sleep(2)
                        chat_screenshot, _ = self.take_screenshot()
                        
                        # Get contact name
                        contact_name = self.get_current_contact_name(chat_screenshot)
                        print(f"👤 Contact: {contact_name}")
                        
                        # Extract messages from chat
                        messages = self.extract_chat_messages(chat_screenshot)
                        print(f"💬 Found {len(messages)} total messages")
                        
                        # Save new messages
                        new_count = self.save_new_messages(contact_name, messages, timestamp)
                        total_new_messages += new_count
                        
                        # Small delay between processing different chats
                        time.sleep(1)
                    
                    if total_new_messages > 0:
                        print(f"\n✨ Total new messages saved: {total_new_messages}")
                    else:
                        print("\n📝 No new messages detected")
                        
                else:
                    print("⚪ No notification dots found")
                
                # Wait for next check
                print(f"\n⏰ Waiting {self.interval//60} minute(s) for next scan...")
                time.sleep(self.interval)
                
        except KeyboardInterrupt:
            print("\n\n🛑 Monitoring stopped by user")
        except Exception as e:
            print(f"\n❌ Error during monitoring: {e}")
            import traceback
            traceback.print_exc()

def main():
    # Configuration
    CHECK_INTERVAL_MINUTES = 1  # Check every minute
    OUTPUT_FILE = "whatsapp_new_messages.txt"
    
    print("WhatsApp Auto-Monitor")
    print("====================")
    print("This script will:")
    print("1. Scan for green notification dots in WhatsApp Web")
    print("2. Automatically click on contacts with new messages")
    print("3. Extract and save only NEW messages")
    print("\nMake sure:")
    print("- WhatsApp Web is open in your browser")
    print("- The browser window is visible (not minimized)")
    print("- You're logged into WhatsApp Web")
    
    input("\nPress Enter to start monitoring...")
    
    monitor = WhatsAppAutoMonitor(
        interval_minutes=CHECK_INTERVAL_MINUTES,
        output_file=OUTPUT_FILE
    )
    
    monitor.monitor_whatsapp()

if __name__ == "__main__":
    main()