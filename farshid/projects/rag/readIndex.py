"""```

`
import ollama
import chromadb

DB_PATH = "/Volumes/4tb/2026-05-26/_Farshid/my_code_index"
COLLECTION_NAME = "project_docs"

client = chromadb.PersistentClient(path=DB_PATH)
collection = client.get_collection(name=COLLECTION_NAME)

def ask_question(query):
    # 1. Embed the user question
    query_emb = ollama.embeddings(model="nomic-embed-text", prompt=query)["embedding"]
    #query_emb = ollama.embeddings(model="qwen3.5:9b-mlx", prompt=query)["embedding"]

    # 2. Find relevant code chunks (Top 5)
    results = collection.query(query_embeddings=[query_emb], n_results=5)
    context = "\n\n".join(results['documents'][0])
    
    # 3. Ask Qwen 3.5 to answer using that context
    prompt = f"Use the following code context to answer the question: \n\n{context}\n\nQuestion: {query}"
    
    response = ollama.generate(model="qwen3.5:9b-mlx", prompt=prompt)
    return response['response']

if __name__ == "__main__":
    while True:
        user_query = input("\nAsk something about your project (or 'exit'): ")
        if user_query.lower() == 'exit': break
        print("\nThinking...")
        print(ask_question(user_query))