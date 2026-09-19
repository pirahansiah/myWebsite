---
layout: farshid_default
title: "Tips and tricks to run a local model for Hermes Agent on your laptop"
permalink: /expert-coaching-resources/localAI/
description: "Running a local model for Hermes Agent on a laptop: budgeting a 32k context between instructions, references and the answer, chunked retrieval, and using Jev’s yes/no filter to pick chunks before the main model sees them."
---

# Tips and tricks to run a local model for Hermes Agent on your laptop


## How do I write good prompts when my context is 32k and I also need to include reference material?

Treat the 32k as a budget. Everything counts against it: your instructions, the reference text, the chat history, and the model's answer.

1. **Plan the split.** I would keep 4k to 8k free for the answer. Keep instructions under 1k. The rest is for reference text. Don't fill it to the limit, because quality often drops before you hit 32k.

2. **Don't paste whole documents.** Split them into small chunks (300 to 500 tokens each) and pick only the best 4 to 6 for each question. That is what RAG does. It works better than a big paste.

3. **Watch the order.** Models often miss things in the middle of long input. Put the task and rules first, then the reference text, then the question last. Repeat the key rule in one line at the end.

4. **Label the references.** Use simple tags like `<doc id="1">...</doc>`. Then you can say "cite the doc id".

5. **Limit the model to your text.** Write: "Use only the documents. If the answer is not there, say 'not found'." This stops made-up answers.

6. **Shrink the history.** Replace old chat turns with a short summary. Old turns waste space.

7. **Check the real limit.** If you use Ollama, the default context is much smaller than 32k. Set `num_ctx` to 32768 yourself. Otherwise the model quietly cuts your input, and you won't see an error. Also count tokens with a tool. Don't guess.



## Jev — https://console.typesafe.ai/home

Jev does not generate text. It returns a constrained decision, like a yes/no probability or a choice among fixed options, and your code decides what to do with it. That fits your idea well. Jev is the picker. Your normal LLM is the writer.

**How I would build it**

1. **Split first.** Cut code by function or class. Cut docs by heading. Give each chunk an id.
2. **Ask Jev one yes/no question per chunk.** The question type is called Noul. It returns one number from 0 to 1, the probability that the answer is yes. Your state is the question plus one chunk. The instruction is: "The chunk contains information needed to answer the question."
3. **Sort by that number.** Take the best chunks until your token budget is full. For code, add the chunk above and below too.
4. **Send only those chunks to your main LLM.** Tell it to answer in max 150 words and name the chunk ids it used. That gives you the small result.

The guide describes this same shape: fetch wide first, then use a yes/no question per passage to filter before anything expensive sees it. It says the filter costs less than the context window it saves. The price is $0.042 per million input tokens, and output is free. Scanning 1 million tokens of code costs about 4 cents.

Here is a rough sketch based on the guide. I did not test it:

```python
from typesafe_sdk import Noul, TypeSafeClient

client = TypeSafeClient()

def rank(question, chunks):
    scored = []
    for c in chunks:
        r = client.system_one(
            state={"question": question, "chunk": c["text"]},
            questions={"useful": Noul(instructions="The chunk contains information needed to answer the question")},
        )
        scored.append((r.answers["useful"].noul, c))
    return sorted(scored, key=lambda x: x[0], reverse=True)
```

**Things I would watch**

- **Send one chunk per call, not a whole file.** The docs say accuracy drops when the state holds material the question does not need.
- **Rate limit.** 1,200 requests per minute for jev-1.13. Many chunks means you need batching.
- **Jev reads literally.** It answers the question you wrote, not the one you meant. Write the instruction very plainly.
- **Hostile text.** Text in the state that argues for its own classification can move the answer. Be careful with web docs.
- **Access.** It is in early access with a waitlist. Keys are at console.typesafe.ai/settings/keys.
- **Pin the version.** `jev-latest` can change under you, so use `jev-1.13.0`.