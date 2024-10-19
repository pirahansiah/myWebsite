'''
Launch your chat app with OpenRouter's AI! 🚀 Utilize asyncio and aiohttp for seamless conversations and manage interactions with a smart queue. 
Dive into the future of chat applications now!"
'''
from dotenv import load_dotenv
import os
import asyncio
import aiohttp
from collections import deque
load_dotenv()
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
YOUR_SITE_URL = os.getenv('YOUR_SITE_URL')
YOUR_APP_NAME = os.getenv('YOUR_APP_NAME')
class OpenRouterChatApp:
    def __init__(self):
        self.session = None
        self.selected_model = "openrouter/auto"
        self.conversation_history = deque(maxlen=30)
        self.semaphore = asyncio.Semaphore(10)
    async def init_session(self):
        self.session = aiohttp.ClientSession()
    async def close_session(self):
        await self.session.close()
    async def get_chat_completion(self, user_input):
        async with self.semaphore:
            self.add_to_conversation_history("user", user_input)
            api_url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Referer": f"Bearer {YOUR_SITE_URL}", 
                "X-Title": f"Bearer {YOUR_APP_NAME}", 
            }
            data = {
                "model": self.selected_model,
                "messages": list(self.conversation_history),
            }
            async with self.session.post(url=api_url, headers=headers, json=data) as response:
                response.raise_for_status()
                api_result = await response.json()
                return api_result['choices'][0]['message']  
    def add_to_conversation_history(self, role, content):
        self.conversation_history.append({"role": role, "content": content})
    def select_model(self):        
        self.selected_model='nousresearch/nous-capybara-7b'        
    async def main(self):
        print("Welcome to the LLM!")
        await self.init_session()
        self.select_model()
        try:
            while True:
                user_input = input("Ask:")
                if user_input.lower() in ["exit", "quit"]:
                    print("Exiting the app. Goodbye!")
                    break
                print("Processing...")
                assistant_response = await self.get_chat_completion(user_input)
                content = assistant_response.get('content', '')
                print(content.replace('\n', '\n'))                
        except KeyboardInterrupt:
            print("\nUser interrupted. Exiting the app. Goodbye!")
        finally:
            await self.close_session()
if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(OpenRouterChatApp().main())
