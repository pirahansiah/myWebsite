#pip install llama-cpp-python pynput

import sys
import os
import threading
import queue
import time
import tkinter as tk
from pynput import keyboard
from llama_cpp import Llama

# --- Configuration ---
MODEL_PATH = "models/Llama-3.2-1B-Instruct-Q4_K_M.gguf"

class SentenceFixerApp:
    def __init__(self):
        self.buffer = []
        self.lock = threading.Lock()
        self.request_queue = queue.Queue()
        self.typing_active = False
        self.last_sentence_time = 0
        self.sentence_timeout = 2.0
        
        # 1. Initialize LLM
        print("Loading Model... please wait.")
        try:
            self.llm = Llama(
                model_path=self.resource_path(MODEL_PATH),
                n_ctx=1024,
                n_threads=4,
                verbose=False
            )
            print("Model Loaded!")
        except Exception as e:
            print(f"Error loading model: {e}")
            sys.exit(1)

        # 2. Setup Overlay Window
        self.root = tk.Tk()
        self.setup_window()
        
        # 3. Start Keyboard Listener
        self.listener = keyboard.Listener(on_press=self.on_press)
        self.listener.start()
        print("Keyboard listener started.")

        # 4. Start Processing Loop
        self.root.after(100, self.process_queue)
        self.root.after(500, self.check_sentence_timeout)

    def resource_path(self, relative_path):
        try:
            base_path = sys._MEIPASS
        except Exception:
            base_path = os.path.abspath(".")
        return os.path.join(base_path, relative_path)

    def setup_window(self):
        """Create persistent overlay at TOP - shows only best suggestion"""
        self.root.overrideredirect(True)
        
        screen_width = self.root.winfo_screenwidth()
        
        # Position at TOP of screen
        window_height = 70
        self.root.geometry(f"{screen_width}x{window_height}+0+0")
        self.root.attributes("-topmost", True)
        self.root.attributes("-alpha", 0.95)
        self.root.configure(bg='#1a1a1a')
        
        # Main container
        self.container = tk.Frame(self.root, bg='#1a1a1a')
        self.container.pack(expand=True, fill='both', padx=20, pady=12)
        
        # Single suggestion label
        self.suggestion_label = tk.Label(
            self.container,
            text="✍️ Cotypist Lite: Ready (type and end with . ? !)",
            font=("SF Pro Text", 13),
            fg="#74c0fc",
            bg="#1a1a1a",
            anchor='w',
            justify='left',
            wraplength=screen_width-50
        )
        self.suggestion_label.pack(fill='both', expand=True)
        
        # Always visible
        self.root.deiconify()

    def show_suggestion(self, text, color="#74c0fc"):
        """Show single suggestion - stays visible"""
        def _show():
            self.suggestion_label.config(text=text, fg=color)
        
        self.root.after(0, _show)

    def on_press(self, key):
        """Capture keys with smarter sentence detection"""
        try:
            current_time = time.time()
            
            if hasattr(key, 'char') and key.char:
                with self.lock:
                    self.buffer.append(key.char)
                    self.last_sentence_time = current_time
                
                # Period or question mark or exclamation = end of sentence
                if key.char in ['.', '?', '!']:
                    self.process_buffer()
            
            elif key == keyboard.Key.space:
                with self.lock:
                    self.buffer.append(" ")
                    self.last_sentence_time = current_time
                    
            elif key == keyboard.Key.backspace:
                with self.lock:
                    if self.buffer:
                        self.buffer.pop()
                        
            elif key == keyboard.Key.enter:
                self.process_buffer()
                        
        except AttributeError:
            pass
        except Exception as e:
            print(f"Error in on_press: {e}")

    def check_sentence_timeout(self):
        """Check if user stopped typing - auto-process sentence"""
        current_time = time.time()
        with self.lock:
            buffer_length = len(self.buffer)
            time_since_last = current_time - self.last_sentence_time
        
        # If buffer has content and user hasn't typed in 2 seconds
        if buffer_length > 10 and time_since_last > self.sentence_timeout:
            self.process_buffer()
        
        self.root.after(500, self.check_sentence_timeout)

    def process_buffer(self):
        """Process current buffer as a sentence"""
        with self.lock:
            sentence = "".join(self.buffer).strip()
            self.buffer = []
            self.last_sentence_time = 0
        
        # Only process sentences with real words (at least 3 chars before punctuation)
        if len(sentence) > 3:
            # Remove trailing punctuation for analysis
            clean_sentence = sentence.rstrip('.?!')
            if len(clean_sentence) > 3:
                self.request_queue.put(sentence)
                self.show_suggestion("⏳ Analyzing...", "#ffaa00")

    def process_queue(self):
        """Check queue for sentences to process"""
        try:
            sentence = self.request_queue.get_nowait()
            threading.Thread(target=self.run_inference, args=(sentence,), daemon=True).start()
        except queue.Empty:
            pass
        
        self.root.after(100, self.process_queue)

    def run_inference(self, text):
        """Get the best enhanced version only"""
        
        # Combined prompt: Fix errors AND enhance in one go
        prompt = f"""You are a writing assistant. Fix any grammar or spelling errors, then improve the sentence to be clear and professional.

Sentence: {text}

Improved version:"""
        
        try:
            output = self.llm(
                prompt,
                max_tokens=120,
                temperature=0.5,
                stop=["\n\n", "Sentence:", "Original:"],
                echo=False,
                repeat_penalty=1.3,
                top_p=0.9
            )
            
            result = output['choices'][0]['text'].strip()
            result = self.clean_output(result)
            
            # Validate output quality
            if result and len(result) > 3 and not self.is_garbage(result):
                # Check if there were actual improvements
                if self.is_similar(text, result):
                    self.show_suggestion("✓ Perfect! No improvements needed.", "#51cf66")
                else:
                    self.show_suggestion(f"✨ {result}", "#74c0fc")
            else:
                # If output is bad, show original was fine
                self.show_suggestion("✓ Looks good!", "#51cf66")
                
        except Exception as e:
            print(f"Error: {e}")
            self.show_suggestion("⚠️ Error processing text", "#ff6b6b")

    def clean_output(self, text):
        """Clean up LLM output aggressively"""
        # Remove common garbage
        text = text.replace("<|eot_id|>", "")
        text = text.replace("<|end", "")
        text = text.replace("|>", "")
        
        # Remove meta-text that LLM sometimes adds
        garbage_phrases = [
            "here is the improved",
            "here's the improved", 
            "improved sentence:",
            "improved version:",
            "better version:",
            "corrected:",
            "fixed:",
            "suggestion:",
            "output:",
        ]
        
        text_lower = text.lower()
        for phrase in garbage_phrases:
            if phrase in text_lower:
                # Find where actual sentence starts (after the colon or phrase)
                idx = text_lower.find(phrase)
                text = text[idx + len(phrase):].strip()
                # Remove leading colon if present
                if text.startswith(':'):
                    text = text[1:].strip()
        
        # Remove quotes
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
        if text.startswith("'") and text.endswith("'"):
            text = text[1:-1]
        
        # Clean up extra whitespace
        text = ' '.join(text.split())
        
        return text.strip()

    def is_garbage(self, text):
        """Check if output is garbage/nonsense"""
        text_lower = text.lower()
        
        # Check for meta-instructions that didn't get cleaned
        garbage_indicators = [
            "here is",
            "here's",
            "the sentence",
            "improved sentence",
            "verb that means",
            "you are",
            "i am",
            "assistant",
            "output only",
        ]
        
        for indicator in garbage_indicators:
            if indicator in text_lower:
                return True
        
        # If it's way longer than original, probably added explanation
        return len(text) > 200
        
    def is_similar(self, text1, text2):
        """Check if two texts are essentially the same"""
        # Normalize both texts
        def normalize(t):
            return t.lower().strip().replace(" ", "").replace(".", "").replace(",", "").replace("?", "").replace("!", "").replace("'", "").replace('"', '')
        
        return normalize(text1) == normalize(text2)

    def run(self):
        print("\n" + "="*70)
        print("✍️  Cotypist Lite - AI Writing Assistant")
        print("="*70)
        print("• Type anywhere on your Mac")
        print("• Bar stays at TOP of screen (always visible)")
        print("• Shows improved version when you end sentence (. ? !)")
        print("• Or wait 2 seconds after typing")
        print("• Press Ctrl+C in terminal to quit")
        print("="*70 + "\n")
        
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            print("\nShutting down...")
            self.listener.stop()
            sys.exit(0)

if __name__ == "__main__":
    app = SentenceFixerApp()
    app.run()
