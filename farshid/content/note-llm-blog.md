Blog posts on RAG vs CAG, multi-agent architectures, AI's impact on jobs, and the future of software development.

# 2025

## May

### RAG vs. CAG: Choosing the Right Approach for Your AI Projects

```
                    AI Text Generation Methods
                  /                         \
                 /                           \
     Generation Approaches                  Emerging LLM Methods
        /           \                       /        |       \
       /             \                     /         |        \
     RAG              CAG           Transformer²    MML     Mosaic
    /   \            /   \            |              |        |
Access to   Higher   Fast    Simple   Self-      Modular   Composite
up-to-date  complex- response architec-adaptive components  pruning
  info       ity     times    ture    weights    |          |
                                                Better     Faster
                                               reasoning  inference
```

**Ultra-Brief Summary:** Compare RAG (retrieval-based, updated info, complex) with CAG (cache-based, faster, simpler) approaches, plus three new LLM methods: self-adaptive Transformer², modular MML, and efficient Mosaic pruning.

### Retrieval-Augmented Generation (RAG)
RAG joins a language model with a retrieval system that gets relevant documents from a knowledge base before creating responses. This works very well with large or frequently updated information sets because it can access the newest information.

**Advantages:**
* Access to up-to-date information
* Works well with changing or large data sets

**Things to consider:**
* Might be slower due to the retrieval step
* More complex system to build and maintain

### Cache-Augmented Generation (CAG)
CAG skips the retrieval step by loading important information into the model's context window first. This method works better with stable and limited knowledge bases, giving faster answers and simpler system design.

**Advantages:**
* Faster responses with lower waiting time
* Simpler system design with no need for a retrieval system

**Things to consider:**
* Not as good for large or frequently changing data sets

**How to choose:** Pick RAG when you need real-time access to large or changing information. Choose CAG when your data is stable and you need quick responses.

### Emerging Methods in Large Language Models

**1. Transformer-Squared: Self-Adaptive LLMs** — Lets LLMs adjust to new tasks in real-time by changing parts of their weight matrices.

**2. Modular Machine Learning (MML)** — Breaks LLMs into smaller components, improving reasoning, factual accuracy, and understanding.

**3. Mosaic: Composite Projection Pruning** — Combines unstructured and structured pruning to make models smaller without losing performance.

---

## April

- **VSCode: C++, CUDA, Windows** — [Set up C++, CUDA in VS Code with nvcc, MSVC paths, IntelliSense, and debugging](https://www.pirahansiah.com/notes/docs/cuda/cuda-vscode/)
- **The New Era of SEO: Optimizing Websites for LLMs** — [Structured data, Q&A formats, and authoritative citations for LLM-driven search](https://www.pirahansiah.com/notes/docs/seo/)
- **The All-Local Video Avatar Generator** — [Create talking video avatars locally using Ollama LLM, Piper TTS, and Wav2Lip](https://www.pirahansiah.com/notes/docs/llm/avatar/)
- **Computer Vision Coaching and Tutoring Service** — [Personalized online tutoring from fundamentals to advanced techniques](https://www.pirahansiah.com/notes/docs/coaching/)
- **3D Vision & Real-Time Multi-Camera** — [Converting 2D depth maps to 3D point clouds in real-time with multi-camera sync](https://www.pirahansiah.com/notes/docs/cv/3d/)

---

# CUDA

Leveraging CUDA for High-Performance GPU Computing with PyCUDA and Numba.

- [Numba JIT Tutorial](/notes/docs/cuda/numba) — Speed up Python with `@jit(nopython=True)`
- [PyCUDA Kernel Explanation](/notes/docs/cuda/pycuda) — Run CUDA C kernels from Python

---

# LLM

<img src="/farshid/content/Mind_Map_Orchestrating_Agents.png" alt="Mind Map Orchestrating Agents" style="max-width: 100%; height: auto;">

## Orchestrating AI Agents

Coordinating multiple AI agents for complex tasks like research, planning, and multi-step processes. By breaking tasks into subtasks, agents work together efficiently.

**Key Frameworks:**
- [LangChain](https://github.com/hwchase17/langchain) — Agent logic, memory, tool usage
- [Ray](https://github.com/ray-project/ray) — Scalable distributed computing
- [Auto-GPT](https://github.com/Significant-Gravitas/Auto-GPT) — Autonomous task planning
- [MetaGPT](https://github.com/geekan/MetaGPT) — Multi-agent software company
- [Phidata](https://github.com/phidatahq/phidata) — Multi-modal agents with memory
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) — AI software engineering agent
- [Awesome AI Agents](https://github.com/e2b-dev/awesome-agents) — Curated list of AI agent projects

**Multi-Agent Architecture:**
- Database agent, process agent, frontend/backend agent, UX/UI agent
- Each agent specializes in its domain with its own memory and tools
- Agents collaborate to solve complex problems like a real team

  
    
  
  

---

## TheAgentCompany Benchmark

The paper "TheAgentCompany: Benchmarking LLM Agents on Consequential Real World Tasks" introduces a benchmark evaluating AI agents on tasks like web browsing, coding, and collaborating. The best agent autonomously completed 24% of tasks — complex, long-term tasks remain challenging.

**Agent Frameworks Compared:**

| Framework | Description |
|-----------|-------------|
| [MetaGPT](https://github.com/geekan/MetaGPT) | Multi-agent software company framework |
| [AGiXT](https://github.com/Josh-XT/AGiXT) | AI automation with adaptive memory |
| [AgentVerse](https://github.com/OpenBMB/AgentVerse) | Multi-agent deployment framework |
| [AgentGPT](https://github.com/reworkd/AgentGPT) | Browser-based autonomous agent platform |
| [AFlow](https://github.com/geekan/MetaGPT) | Automated agentic workflow generation via MCTS |

---

# Silent Tsunami: The Greatest Wealth Transfer in History

A brief overview of the most critical event that will challenge humanity in the next few years, replacing over **70% of administrative/industrial jobs globally**.

## Why Will Most Jobs Become Obsolete?

Stunning forecasts by **McKinsey** and **Goldman Sachs** predict AI agents will take over **70% of administrative jobs** and add **$7 trillion** to the global economy.

## The AI-Powered Workplace of the Future

AI agents are not merely chatbots — they are **independent systems** capable of understanding their environment and performing tasks **entirely without human intervention**.

**Key Abilities:**
1. **Task Execution** — Respond to emails, schedule meetings, write reports, manage projects, analyze data
2. **Simultaneous Multi-tasking** — Perform tasks simultaneously at unbelievable speeds
3. **Decision-Making** — Analyze data, weigh options, make informed decisions
4. **Context Awareness** — Interpret conversations, understand intent and dependencies

## Beyond Automation: Human Capital Transformation

Value will shift toward those with **superior ideas and creativity**. New roles will emerge:
- AI Supervisors
- Creative AI Managers
- Human-AI Collaboration Specialists
- Digital Workforce Managers

## Preparing for the Future

1. Learn to collaborate with AI systems
2. Develop unique human skills
3. Focus on creative and strategic thinking

---

# LLM Multi-Agent Swarm Architecture

A **Multi-Agent Swarm Architecture** entails multiple (semi)autonomous agents cooperating in a decentralized manner to solve complex tasks.

**Core Principles:**
- **Decentralized Decision-Making** — Agents act independently while coordinating for a common goal
- **Emergent Behavior** — Complex global outcomes arise from simple local interactions
- **Adaptability** — System reconfigures automatically based on context

## Relevant LLMs

- **Meta's Llama** — Open-source, multiple parameter sizes, fine-tunable. Coordinate via LangChain or Ray.
- **Mistral AI's Mistral** — Efficient 7B model. Multiple instances can run in parallel for swarm behavior.
- **Anthropic's Claude** — Commercial API, large context windows. Integrate as agents within an orchestrator.

## Frameworks & Techniques

- **LangChain** — Agent logic with memory modules and tool integration
- **Ray** — Scalable distributed computing for LLM workers
- **PettingZoo** — Multi-agent reinforcement learning environments
- **Auto-GPT / BabyAGI / AgentGPT** — Autonomous task planning and execution

## Example Architectures

1. **LangChain + Ray** — LangChain manages agent logic, Ray handles concurrency
2. **Docker Swarm / Kubernetes** — Multiple LLM microservices with Kafka/RabbitMQ coordination
3. **MARL with LLM Observers** — RLlib for multi-agent training with LLM policy modules

## Further Reading

- *Emergent Tool Use from Multi-Agent Autocurricula* (OpenAI)
- *Learning to Collaborate in Multi-Agent Games* (DeepMind)
- Experiment with smaller models (Mistral 7B, Llama 2 7B) for parallel deployment