import time
import os
import pytesseract
from PIL import Image, ImageGrab
from datetime import datetime
import hashlib

class WhatsAppMonitor:
    def __init__(self, interval_minutes=2, output_file="whatsapp_messages.txt"):
        self.interval = interval_minutes * 60  # Convert to seconds
        self.output_file = output_file
        self.last_screenshot_hash = None
        self.screenshots_dir = "screenshots"
        
        # Create screenshots directory if it doesn't exist
        if not os.path.exists(self.screenshots_dir):
            os.makedirs(self.screenshots_dir)
    
    def take_screenshot(self):
        """Take a screenshot of the entire desktop"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        screenshot_path = os.path.join(self.screenshots_dir, f"screenshot_{timestamp}.png")
        
        # Take screenshot
        screenshot = ImageGrab.grab()
        screenshot.save(screenshot_path)
        return screenshot, screenshot_path
    
    def get_image_hash(self, image):
        """Generate hash of image to detect changes"""
        return hashlib.md5(image.tobytes()).hexdigest()
    
    def extract_text_from_image(self, image):
        """Extract text from image using OCR"""
        try:
            # Convert image to text using Tesseract
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            print(f"Error in OCR: {e}")
            return ""
    
    def find_whatsapp_messages(self, text):
        """Extract potential WhatsApp messages from OCR text"""
        lines = text.split('\n')
        messages = []
        
        # Look for patterns that might indicate WhatsApp messages
        # This is a basic implementation - you may need to adjust based on your screen
        for i, line in enumerate(lines):
            line = line.strip()
            if line and len(line) > 3:  # Filter out very short lines
                # Look for time patterns (HH:MM format)
                if any(char.isdigit() for char in line) and ':' in line:
                    messages.append(line)
                # Or lines that look like messages (contain common words)
                elif any(word in line.lower() for word in ['hello', 'hi', 'hey', 'message', 'text']):
                    messages.append(line)
        
        return messages
    
    def save_messages(self, messages, timestamp):
        """Save new messages to text file"""
        if not messages:
            return
        
        with open(self.output_file, 'a', encoding='utf-8') as f:
            f.write(f"\n--- Messages captured at {timestamp} ---\n")
            for message in messages:
                f.write(f"{message}\n")
            f.write("-" * 50 + "\n")
        
        print(f"Saved {len(messages)} messages at {timestamp}")
    
    def has_screen_changed(self, current_image):
        """Check if screen has changed significantly"""
        current_hash = self.get_image_hash(current_image)
        
        if self.last_screenshot_hash is None:
            self.last_screenshot_hash = current_hash
            return True
        
        if current_hash != self.last_screenshot_hash:
            self.last_screenshot_hash = current_hash
            return True
        
        return False
    
    def monitor(self):
        """Main monitoring loop"""
        print(f"Starting WhatsApp Web monitor...")
        print(f"Taking screenshots every {self.interval//60} minutes")
        print(f"Saving messages to: {self.output_file}")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"\n[{timestamp}] Taking screenshot...")
                
                # Take screenshot
                screenshot, screenshot_path = self.take_screenshot()
                print(f"Screenshot saved: {screenshot_path}")
                
                # Check if screen changed significantly
                if self.has_screen_changed(screenshot):
                    print("Screen change detected, extracting text...")
                    
                    # Extract text from screenshot
                    extracted_text = self.extract_text_from_image(screenshot)
                    
                    if extracted_text:
                        # Find potential WhatsApp messages
                        messages = self.find_whatsapp_messages(extracted_text)
                        
                        if messages:
                            self.save_messages(messages, timestamp)
                        else:
                            print("No new messages detected")
                    else:
                        print("No text extracted from screenshot")
                else:
                    print("No significant screen changes detected")
                
                # Wait for next interval
                print(f"Waiting {self.interval//60} minutes until next check...")
                time.sleep(self.interval)
                
        except KeyboardInterrupt:
            print("\nMonitoring stopped by user")
        except Exception as e:
            print(f"Error during monitoring: {e}")

def main():
    # Configuration
    CHECK_INTERVAL_MINUTES = 2  # How often to check (in minutes)
    OUTPUT_FILE = "whatsapp_messages.txt"
    
    # Create and start monitor
    monitor = WhatsAppMonitor(
        interval_minutes=CHECK_INTERVAL_MINUTES,
        output_file=OUTPUT_FILE
    )
    
    monitor.monitor()

if __name__ == "__main__":
    main()