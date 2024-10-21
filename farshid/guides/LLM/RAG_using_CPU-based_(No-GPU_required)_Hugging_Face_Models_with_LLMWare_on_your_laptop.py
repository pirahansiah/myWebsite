
# https://www.youtube.com/watch?v=JjgqOZ2v5oU
""" This example demonstrates prompting local BLING models with provided context"""

import time
from llmware.prompts import Prompt


def hello_world_questions():

    test_list = [

    {"query": "What is the total amount of the invoice?",
     "answer": "$22,500.00",
     "context": "Services Vendor Inc. \n100 Elm Street Pleasantville, NY \nTO Alpha Inc. 5900 1st Street "
                "Los Angeles, CA \nDescription Front End Engineering Service $5000.00 \n Back End Engineering"
                " Service $7500.00 \n Quality Assurance Manager $10,000.00 \n Total Amount $22,500.00 \n"
                "Make all checks payable to Services Vendor Inc. Payment is due within 30 days."
                "If you have any questions concerning this invoice, contact Bia Hermes. "
                "THANK YOU FOR YOUR BUSINESS!  INVOICE INVOICE # 0001 DATE 01/01/2022 FOR Alpha Project P.O. # 1000"},

    ]

    return test_list


# this is the main script to be run
def bling_meets_llmware_hello_world (model_name):

    t0 = time.time()
    test_list = hello_world_questions()

    print(f"\n > Loading Model: {model_name}...")

    prompter = Prompt().load_model(model_name)

    t1 = time.time()
    print(f"\n > Model {model_name} load time: {t1-t0} seconds")
 
    for i, entries in enumerate(test_list):
        print(f"\n{i+1}. Query: {entries['query']}")
     
        # run the prompt
        output = prompter.prompt_main(entries["query"],context=entries["context"]
                                      , prompt_name="default_with_context",temperature=0.30)

        llm_response = output["llm_response"].strip("\n")
        print(f"LLM Response: {llm_response}")
        print(f"Gold Answer: {entries['answer']}")
        print(f"LLM Usage: {output['usage']}")

    t2 = time.time()
    print(f"\nTotal processing time: {t2-t1} seconds")

    return 0


if __name__ == "__main__":

    # list of 'rag-instruct' laptop-ready bling models on HuggingFace
    model_list = ["llmware/bling-1b-0.1",
                  "llmware/bling-tiny-llama-v0",
                  "llmware/bling-1.4b-0.1",
                  "llmware/bling-falcon-1b-0.1",
                  "llmware/bling-cerebras-1.3b-0.1",
                  "llmware/bling-sheared-llama-1.3b-0.1",
                  "llmware/bling-sheared-llama-2.7b-0.1",
                  "llmware/bling-red-pajamas-3b-0.1",
                  "llmware/bling-stable-lm-3b-4e1t-v0"
                  ]

    #   try the newest bling model - 'tiny-llama'
    bling_meets_llmware_hello_world(model_list[1])
