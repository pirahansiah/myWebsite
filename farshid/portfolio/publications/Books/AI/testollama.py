
import threading
import time
import requests
import json
import random
import logging
from queue import Queue
from typing import Dict, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

# Ollama local API endpoint
OLLAMA_URL = "http://localhost:11434/api/generate"

class OllamaGermanTeacher:
    """
    A class to interact with a local Ollama API to generate
    random German words, translations, and example sentences.
    """
    def __init__(self, poll_interval: int = 10, model: str = "deepseek-r1:8b"):
        """
        Initialize the OllamaGermanTeacher.

        :param poll_interval: Time in seconds between word generations
        :param model: Default model to use for requests
        """
        self.running = False
        self.results_queue = Queue()
        self.results = []
        self.poll_interval = poll_interval
        self.model = model
        self.thread: Optional[threading.Thread] = None

    def interact_with_ollama(self, prompt: str, model: Optional[str] = None) -> str:
        """
        Send a prompt to the Ollama API endpoint and return the response.

        :param prompt: The text prompt to send.
        :param model: The Ollama model to use. Falls back to the default if None.
        :return: The decoded text response.
        """
        if model is None:
            model = self.model

        headers = {"Content-Type": "application/json"}
        payload = {
            "model": model,
            "prompt": prompt
        }

        try:
            response = requests.post(
                OLLAMA_URL, 
                headers=headers, 
                data=json.dumps(payload), 
                stream=True,
                timeout=30
            )

            if response.status_code == 200:
                final_content = ""
                for line in response.iter_lines():
                    if line:
                        try:
                            data = json.loads(line.decode("utf-8"))
                            if "response" in data:
                                final_content += data["response"]
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError as e:
                            logging.error(f"JSON decode error: {e}, Line: {line}")
                return final_content.strip() or "No response content"
            else:
                return f"Error: Received status code {response.status_code} from the server."
        except requests.exceptions.RequestException as e:
            return f"Connection error: {str(e)}"

    def generate_learning_content(self) -> Dict[str, str]:
        """
        Generate a random German word along with its translation and example sentence.

        :return: A dictionary containing word, type, translation, example sentence, and sentence translation.
        """
        # Prompt to generate a random word and its type
        prompt_generate = (
            "Generate a random German word (noun, verb, or adjective) and specify its type. "
            "Format: word | type"
        )
        word_response = self.interact_with_ollama(prompt_generate)

        try:
            word, word_type = word_response.split('|')
            word = word.strip()
            word_type = word_type.strip()
        except ValueError:
            # If the response doesn't match the expected format
            word = word_response.strip()
            word_type = "unknown"

        # Prompt for translation
        prompt_translation = f"Translate the German word '{word}' into English."
        translation = self.interact_with_ollama(prompt_translation)

        # Prompt for example sentence
        prompt_example = (
            f"Create a simple example sentence in German using the word '{word}'. "
            f"Format: German sentence / English translation"
        )
        example_response = self.interact_with_ollama(prompt_example)

        try:
            german_sentence, english_translation = example_response.split('/')
            german_sentence = german_sentence.strip()
            english_translation = english_translation.strip()
        except ValueError:
            german_sentence = example_response.strip()
            english_translation = "Translation not provided"

        result = {
            'Word': word,
            'Type': word_type,
            'Translation': translation,
            'Example Sentence': german_sentence,
            'Sentence Translation': english_translation
        }

        logging.info("\n=== New Learning Content ===")
        logging.info(f"Word: {result['Word']}")
        logging.info(f"Type: {result['Type']}")
        logging.info(f"Translation: {result['Translation']}")
        logging.info(f"Example: {result['Example Sentence']}")
        logging.info(f"Example Translation: {result['Sentence Translation']}")
        logging.info("============================\n")

        return result

    def learning_loop(self) -> None:
        """
        Continuously generates new learning content until stopped.
        """
        while self.running:
            result = self.generate_learning_content()
            self.results.append(result)
            time.sleep(self.poll_interval)

    def start_learning(self) -> None:
        """
        Start the background thread for generating German words.
        """
        if not self.running:
            self.running = True
            logging.info("Starting German learning session...")
            self.thread = threading.Thread(target=self.learning_loop, daemon=True)
            self.thread.start()
        else:
            logging.info("German learning session is already running.")

    def stop_learning(self) -> None:
        """
        Stop the background thread from generating German words.
        """
        if self.running:
            self.running = False
            logging.info("Stopping German learning session...")
            if self.thread:
                self.thread.join()
        else:
            logging.info("German learning session is not running.")

def main():
    """
    Main entry point for the script. Starts an OllamaGermanTeacher instance
    and keeps it running until a keyboard interrupt is detected.
    """
    teacher = OllamaGermanTeacher(poll_interval=10, model="deepseek-r1:8b")
    
    try:
        teacher.start_learning()
        while True:
            time.sleep(1)  # Keep the main thread alive
    except KeyboardInterrupt:
        teacher.stop_learning()
        logging.info("Program terminated by user.")

if __name__ == "__main__":
    main()