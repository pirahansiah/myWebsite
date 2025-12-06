#pip install llama-cpp-python pynput 
# tkinter


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
# Download this model file and place it in a folder named 'models' next to this script.

class SentenceFixerApp:
    def __init__(self):
        self.buffer = []
        self.lock = threading.Lock()
        self.request_queue = queue.Queue()
        
        # 1. Initialize LLM (Load once, keep in memory)
        print("Loading Model... please wait.")
        try:
            self.llm = Llama(
                model_path=self.resource_path(MODEL_PATH),
                n_ctx=512,       # Small context is fine for single sentences
                verbose=False
            )
            print("Model Loaded!")
        except Exception as e:
            print(f"Error loading model: {e}")
            sys.exit(1)

        # 2. Setup Overlay Window (GUI)
        self.root = tk.Tk()
        self.setup_window()
        
        # 3. Start Keyboard Listener
        self.listener = keyboard.Listener(on_press=self.on_press)
        self.listener.start()

        # 4. Start Processing Loop
        self.root.after(100, self.process_queue)

    def resource_path(self, relative_path):
        """ Get absolute path to resource, works for dev and for PyInstaller """
        try:
            # PyInstaller creates a temp folder and stores path in _MEIPASS
            base_path = sys._MEIPASS
        except Exception:
            base_path = os.path.abspath(".")
        return os.path.join(base_path, relative_path)

    def setup_window(self):
        """ Create a transparent, click-through notification bar at top of screen """
        self.root.overrideredirect(True) # Remove window border/title bar
        self.root.geometry(f"{self.root.winfo_screenwidth()}x60+0+0")
        self.root.attributes("-topmost", True) # Always on top
        self.root.attributes("-alpha", 0.9)    # Slight transparency
        self.root.configure(bg='black')
        
        # Label for text
        self.label = tk.Label(self.root, text="Cotypist Lite: Ready", 
                            font=("Segoe UI", 14), fg="#00ff00", bg="black")
        self.label.pack(expand=True, fill='both')
        
        # Hide initially
        self.root.withdraw()

    def show_notification(self, text, duration=4000):
        """ Show the window with text for X milliseconds """
        def _show():
            self.label.config(text=text)
            self.root.deiconify()
            # Hide automatically after 'duration' ms
            self.root.after(duration, self.root.withdraw)
        
        self.root.after(0, _show)

    def on_press(self, key):
        """ Capture keys. If '.', trigger correction. """
        try:
            if hasattr(key, 'char') and key.char:
                if key.char == '.':
                    # End of sentence detected
                    with self.lock:
                        sentence = "".join(self.buffer).strip()
                        self.buffer = [] # Clear buffer
                    
                    if len(sentence) > 5: # Only process meaningful sentences
                        self.request_queue.put(sentence)
                else:
                    with self.lock:
                        self.buffer.append(key.char)
            
            elif key == keyboard.Key.space:
                with self.lock:
                    self.buffer.append(" ")
            elif key == keyboard.Key.backspace:
                with self.lock:
                    if self.buffer:
                        self.buffer.pop()
                        
        except Exception:
            pass

    def process_queue(self):
        """ Check if there is a sentence to correct """
        try:
            sentence = self.request_queue.get_nowait()
            # Run inference in a separate thread to not freeze GUI
            threading.Thread(target=self.run_inference, args=(sentence,)).start()
        except queue.Empty:
            pass
        
        self.root.after(100, self.process_queue)

    def run_inference(self, text):
        """ Ask LLM to correct the sentence """
        prompt = (
            f"<|user|>Fix the grammar and spelling of this sentence. "
            f"Output ONLY the corrected sentence, nothing else:\n\n{text}<|end|>"
            f"<|assistant|>"
        )
        
        output = self.llm(
            prompt, 
            max_tokens=64, 
            stop=["\n", "<|end|>"], 
            echo=False
        )
        
        corrected_text = output['choices'][0]['text'].strip()
        
        # Only show if there was actually a change (ignoring case/whitespace)
        if corrected_text.lower() != text.lower():
            self.show_notification(f"Did you mean:  {corrected_text}")

    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = SentenceFixerApp()
    app.run()
