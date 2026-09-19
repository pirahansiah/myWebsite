---
layout: farshid_default
title: "Tips and tricks to run a local model for Hermes Agent on your laptop"
permalink: /expert-coaching-resources/localAI/
description: "Running a local model for Hermes Agent on a laptop: budgeting a 32k context between instructions, references and the answer, a yes/no filter that picks the chunks before the main model sees them, and notes from two AMD laptops."
---
# On my laptop with 8gb vram 
- 131k qwen3.5-9b q4
- 32k Ternary-Bonsai-2-27B (based on qwen3.8-27b) it is q1 





# Tips and tricks to run a local model for Hermes Agent on your laptop

A local model on a laptop is small in one thing only: the context window. The tips below keep that window for the answer, not for the packing.

## Writing prompts on a 32k budget

You have 32k of context and you must also include reference material. Treat the 32k as a budget. Your instructions, the reference text, the chat history and the model's answer all count against it.

1. **Plan the split.** Keep 4k to 8k free for the answer and keep the instructions under 1k. The rest is for reference text. Do not fill the window to the limit, because quality often drops before you reach 32k.

2. **Do not paste whole documents.** Split them into small chunks of 300 to 500 tokens and select only the best 4 to 6 for each question. That is what RAG does, and it works better than one large paste.

3. **Watch the order.** Models often miss things in the middle of a long input. Put the task and the rules first, then the reference text, then the question last. Repeat the key rule in one line at the end.

4. **Label the references.** Use simple tags, for example `<doc id="1">...</doc>`. Then you can tell the model to cite the doc id.

5. **Limit the model to your text.** Write: "Use only the documents. If the answer is not there, say 'not found'." This stops invented answers.

6. **Shrink the history.** Replace old chat turns with a short summary. Old turns waste space.

7. **Check the real limit.** If you use Ollama, the default context is much smaller than 32k. Set `num_ctx` to 32768 yourself. Otherwise the model quietly cuts your input and you see no error. Count the tokens with a tool; do not guess.

## Let Jev pick the chunks before the model writes

Jev (console.typesafe.ai) does not generate text. It returns a constrained decision, such as a yes/no probability or a choice among fixed options, and your code decides what to do with it. Jev is the picker; your normal LLM is the writer.

How I would build it:

1. **Split first.** Cut code by function or class and documents by heading. Give each chunk an id.
2. **Ask Jev one yes/no question per chunk.** The question type is called Noul. It returns one number from 0 to 1: the probability that the answer is yes. The state is the question plus one chunk. The instruction is: "The chunk contains information needed to answer the question."
3. **Sort by that number.** Take the best chunks until your token budget is full. For code, add the chunk above and the chunk below.
4. **Send only those chunks to the main LLM.** Tell it to answer in 150 words or fewer and to name the chunk ids it used. That gives you the small result.

The guide describes this same shape: fetch wide first, then use a yes/no question per passage to filter the material before anything expensive sees it. It says the filter costs less than the context window it saves. The price is $0.042 per million input tokens, and output is free. Scanning 1 million tokens of code costs about 4 cents.

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

What I would watch:

- **Send one chunk per call, not a whole file.** The documents say accuracy drops when the state holds material the question does not need.
- **Rate limit.** jev-1.13.0 allows 1,200 requests per minute. Many chunks means you need batching.
- **Jev reads literally.** It answers the question you wrote, not the question you meant. Write the instruction plainly.
- **Hostile text.** Text in the state that argues for its own classification can move the answer. Be careful with web documents.
- **Access.** It is in early access with a waitlist. Keys are at console.typesafe.ai/settings/keys.
- **Pin the version.** `jev-latest` can change under you, so use `jev-1.13.0`.

## What I tested on two AMD laptops

Both machines use AMD Ryzen AI processors: the Ryzen AI 400 series in the Legion, and Ryzen AI Max with unified memory in the ZBook.

### Ternary-Bonsai-2-27B on a Lenovo Legion 5 15AGP11

The laptop has an AMD Ryzen AI 7 450 processor, 32 GB of RAM, a 1 TB SSD and an NVIDIA GeForce RTX 5060 GPU. Ternary-Bonsai-2-27B performed quickly and accurately. The updated model, Ternary Bonsai 2 27B PTQ1_0, needs a different version of the Ollama server, so it needs custom compilation and build procedures. With 8 GB of VRAM the context window is limited to 32k tokens, which makes the model well suited to short tasks. For larger projects I use Qwen3.5-9B, which supports a 100k token context window.

### HP ZBook Ultra G1a — Ryzen AI Max+ Pro 395, 128 GB unified memory

The 14-inch 2.8K touch display model. Performance was quick and accurate, but the AMD architecture needed extensive compilation and configuration, because no component worked out of the box.

## Tasks that stay with the specialist

The tasks that expert developers will increasingly have to handle in the AI era:

* Design and maintain the high-level system architecture and the overall software structure.
* Review, validate and critique AI-generated code for correctness, security and quality.
* Refactor AI output to improve reusability, reduce duplication and lower complexity.
* Write precise prompts, set constraints and guide AI agents or coding tools.
* Find and resolve the complex bugs, edge cases and integration problems that AI struggles with.
* Enforce coding standards, design patterns and long-term maintainability.
* Manage the technical debt that rapid AI-assisted development creates.
* Optimise performance, scalability and resource use beyond what basic AI suggestions give.
* Make sure that domain logic, business rules and regulatory requirements are implemented correctly.
* Integrate several AI tools, models and pipelines, and control cost and reliability.
* Use advanced test strategies, including adversarial and system-level testing.
* Mentor teams and set best practices for productive human-AI collaboration.
* Decide when to use AI, and when to write or redesign the code by hand.

These responsibilities move the specialist from pure code production towards oversight, architecture, quality control and strategic guidance.

## Scheduling a job on Windows

Windows Task Scheduler is close to cron jobs on Linux and macOS.

1. Press the Windows key and S, then search for "Task Scheduler".
2. Or run `taskschd.msc` in the Run dialog (Win + R).

## Referral links

The tools I use, with my referral links, are on the [QR codes page](/qr/).

<!--
Working notes kept from the draft of this page (not rendered, and kept out of the search
index and llms-full.txt). Nothing here is published:

- handoff documents summarized
- JSON as a database
- add: always remember agent / llm / chat write in ASD-STE100 (applied to the text on this page)
- vision intelligence · technical product engineer lead · management · motion graphics
- what is domain knowledge, and why solve this problem
- Vision-Language-Action models that let robots understand and interact with the world with unprecedented generalisation; large-scale foundation models and real-world robotic execution, bridging the gap between research and deployed embodied intelligence. design, implement and scale VLA models and foundation architectures for robotic manipulation and navigation.
- PKM convention: atomic notes, not more than 255 characters if possible; link down for
  more depth, up for the wider view.
-->
