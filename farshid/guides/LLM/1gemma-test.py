import os
import kagglehub
import sys
import torch
sys.path.append('gemma_pytorch')
from gemma_pytorch.gemma.config import get_config_for_7b, get_config_for_2b
from gemma_pytorch.gemma.model import GemmaForCausalLM
kagglehub.login()
VARIANT = '2b' 
MACHINE_TYPE = 'cpu'
weights_dir = kagglehub.model_download(f'google/gemma/pyTorch/2b')
tokenizer_path = os.path.join(weights_dir, 'tokenizer.model')
ckpt_path = os.path.join(weights_dir, f'gemma-2b.ckpt')
model_config = get_config_for_2b() if "2b" in VARIANT else get_config_for_7b()
model_config.tokenizer = tokenizer_path
model_config.quant = 'quant' in VARIANT
torch.set_default_dtype(model_config.get_dtype())
device = torch.device(MACHINE_TYPE)
model = GemmaForCausalLM(model_config)
model.load_weights(ckpt_path)
model = model.to(device).eval()
USER_CHAT_TEMPLATE = 'user\n{prompt}\n'
MODEL_CHAT_TEMPLATE = 'model\n{prompt}\n'
while True:
   user_prompt = input("Enter your prompt: ")

   prompt = (
       USER_CHAT_TEMPLATE.format(prompt=user_prompt)
       + MODEL_CHAT_TEMPLATE.format(prompt='')  # Initialize model prompt as empty
   )
   print("Chat prompt:\n", prompt)
   output = model.generate(
       prompt,
       device=device,
       output_len=100,
   )
   print("Model response:\n", output)
   while not prompt.endswith("model\n"):
       model_prompt = input("Enter your response (or type 'quit' to end): ")
       if model_prompt == "quit":
           break
       prompt += MODEL_CHAT_TEMPLATE.format(prompt=model_prompt)
       output = model.generate(
           prompt,
           device=device,
           output_len=100,
       )
       print("Model response:\n", output)
   if model_prompt == "quit":
       break
   

# prompt = (
#     USER_CHAT_TEMPLATE.format(
#         prompt='python function to add multiple numbers?'
#     )
#     + MODEL_CHAT_TEMPLATE.format(prompt='California.')
#     + USER_CHAT_TEMPLATE.format(prompt='What can I do in California?')
#     + 'model\n'
# )
# print('Chat prompt:\n', prompt)

# model.generate(
#     USER_CHAT_TEMPLATE.format(prompt=prompt),
#     device=device,
#     output_len=100,
# )
# model.generate(
#     'python function to add multiple numbers',
#     device=device,
#     output_len=60,
# )













import keras
import keras_nlp

# pip install --upgrade keras-cv
# pip install --upgrade keras-nlp
# pip install --upgrade keras

# pip install -U transformers



# os.environ["KERAS_BACKEND"] = "jax"  # Or "tensorflow" or "torch".
# gemma_lm = keras_nlp.models.GemmaCausalLM.from_preset("gemma_2b_en")
# gemma_lm.summary()
# gemma_lm.generate("What is the meaning of life?", max_length=64)





# 

# # Load model weights


# # Ensure that the tokenizer is present

# assert os.path.isfile(tokenizer_path), 'Tokenizer not found!'

# # Ensure that the checkpoint is present

# assert os.path.isfile(ckpt_path), 'PyTorch checkpoint not found!'






# Set up model config.




############## ------------------
# import sys 
# sys.path.append("/kaggle/working/gemma_pytorch/") 
# from gemma.config import GemmaConfig, get_config_for_7b, get_config_for_2b
# from gemma.model import GemmaForCausalLM
# from gemma.tokenizer import Tokenizer
# import contextlib
# import os
# import torch

# # Load the model
# VARIANT = "2b" 
# MACHINE_TYPE = "cpu" 
# weights_dir = '/kaggle/input/gemma/pytorch/2b/1' 

# @contextlib.contextmanager
# def _set_default_tensor_type(dtype: torch.dtype):
#   """Sets the default torch dtype to the given dtype."""
#   torch.set_default_dtype(dtype)
#   yield
#   torch.set_default_dtype(torch.float)

# model_config = get_config_for_2b() if "2b" in VARIANT else get_config_for_7b()
# model_config.tokenizer = os.path.join(weights_dir, "tokenizer.model")

# device = torch.device(MACHINE_TYPE)
# with _set_default_tensor_type(model_config.get_dtype()):
#   model = GemmaForCausalLM(model_config)
#   ckpt_path = os.path.join(weights_dir, f'gemma-{VARIANT}.ckpt')
#   model.load_weights(ckpt_path)
#   model = model.to(device).eval()


# # Use the model

# USER_CHAT_TEMPLATE = "<start_of_turn>user\n{prompt}<end_of_turn>\n"
# MODEL_CHAT_TEMPLATE = "<start_of_turn>model\n{prompt}<end_of_turn>\n"

# prompt = (
#     USER_CHAT_TEMPLATE.format(
#         prompt="What is a good place for travel in the US?"
#     )
#     + MODEL_CHAT_TEMPLATE.format(prompt="California.")
#     + USER_CHAT_TEMPLATE.format(prompt="What can I do in California?")
#     + "<start_of_turn>model\n"
# )

# model.generate(
#     USER_CHAT_TEMPLATE.format(prompt=prompt),
#     device=device,
#     output_len=100,
# )

####----------------------

# from transformers import AutoTokenizer, AutoModelForCausalLM

# tokenizer = AutoTokenizer.from_pretrained("google/gemma-2b-it")
# model = AutoModelForCausalLM.from_pretrained("google/gemma-2b-it")

# input_text = "Write me a poem about Machine Learning."
# input_ids = tokenizer(**input_text, return_tensors="pt")

# outputs = model.generate(input_ids)
# print(tokenizer.decode(outputs[0]))