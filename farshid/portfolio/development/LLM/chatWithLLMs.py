
YOUR_SITE_URL = "https://pirahansiah.com"
YOUR_APP_NAME = "Farshid Pirahansiah"
import asyncio
import aiohttp
from collections import deque
import json
import re

class OpenRouterChatApp:
    def __init__(self):
        self.session = None
        self.selected_model = "openrouter/auto"  # Default model; adjust as needed
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
                "Referer": YOUR_SITE_URL,  # Adjust as needed
                "X-Title": YOUR_APP_NAME,  # Adjust as needed
            }
            data = {
                "model": self.selected_model,
                "messages": list(self.conversation_history),
            }
            async with self.session.post(url=api_url, headers=headers, json=data) as response:
                response.raise_for_status()
                api_result = await response.json()
                return api_result['choices'][0]['message']  # Assuming the API response structure
    def add_to_conversation_history(self, role, content):
        self.conversation_history.append({"role": role, "content": content})
    def select_model(self):
        #self.selected_model='nousresearch/nous-capybara-7b'
        self.selected_model='mistralai/mistral-7b-instruct:free'
    async def main(self):
        # print("Welcome to the Turbo Chat!")
        # await self.init_session()
        # self.select_model()
        # try:
        #     while True:
        #         user_input = input("You: ")
        #         if user_input.lower() in ["exit", "quit"]:
        #             print("Exiting the app. Goodbye!")
        #             break
        #         print("Processing...")
        #         assistant_response = await self.get_chat_completion(user_input)
        #         content = assistant_response.get('content', '')
        #         print(content.replace('\n', '\n'))
        # except KeyboardInterrupt:
        #     print("\nUser interrupted. Exiting the app. Goodbye!")
        # finally:
        #     await self.close_session()
        await self.init_session()
        self.select_model()
        str_py=''
        try:
            while True:
                user_input = input("You: ")
                if user_input.lower() in ["exit", "quit"]:
                    print("Exiting the app. Goodbye!")
                    break
                assistant_response = await self.get_chat_completion(user_input)
                content = assistant_response.get('content', '')
                
                # Use regular expression to extract Python code blocks
                python_code_blocks = re.findall(r'```python(.*?)```', content, re.DOTALL)
                if python_code_blocks:
                    for code_block in python_code_blocks:
                        print(code_block.strip())
                        #str_py=str_py+code_block.strip()
                        str_py += code_block.strip() + "\n\n"
                    print("run -----")
                    try:
                        exec(str_py)
                    except SyntaxError as e:
                        print(f"Syntax error in exec'd code: {e}")
                        print("Here's the problematic code:\n", str_py)
                
                    print("run -----")
                else:
                    print("No Python code found in the response.")
        finally:
            await self.close_session()
        
if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(OpenRouterChatApp().main())
