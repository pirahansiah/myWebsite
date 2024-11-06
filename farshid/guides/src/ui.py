import chainlit as cl
from chainlit.message import Message

@cl.on_message
async def main(message):
    # Access the text content of the message
    content = message.content if hasattr(message, 'content') else str(message)

    if content.lower() == "hello":
        await Message(content="Hello! How can I assist you today?").send()
    else:
        await Message(content="I'm here to help! Please tell me what you need.").send()