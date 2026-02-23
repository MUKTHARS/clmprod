from typing import Dict
from langchain import hub
from langchain_core.documents import Document
from langgraph.graph import START, StateGraph
from typing_extensions import List, TypedDict
from sayvai_rag.config import create_vector_store
import os
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.llms import BaseLLM
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from sayvai_rag.utils import format_docs
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

prompt = PromptTemplate(
    template=(
        "{prompt_msg}\n\n"
        "You are an intelligent assistant. Use the context below to answer the user question conversationally.\n\n"
        "Context:\n{context}\n\n"
        "Conversation History:\n{history}\n\n"
        "Current Question:\n{question}\n\n"
        "Answer as clearly and informatively as possible."
    ),
    input_variables=["context", "question", "prompt_msg", "history"]
)

class State(TypedDict):
    question: str
    context: List[Document]
    answer: str
    history: List[Dict]
    prompt_msg: str

class SayvaiRagAgent:
    def __init__(self, model: str):
        self.llm = self.get_llm(model)
        self.vector_store = None

    def get_llm(self, model) -> BaseLLM:
        if model[:3] == "gpt":
            return ChatOpenAI(model=model, temperature=0.0, streaming=True)
        if model[:4] == "groq":
            return ChatGroq(model=model[5:], streaming=True)
        if model[:6] == "ollama":
            return ChatOllama(model=model[7:], streaming=True)
        if model[:6] == "gemini":
            gemini_model = model[7:]
            if not gemini_model.startswith(("gemini-", "models/")):
                gemini_model = f"gemini-{gemini_model}"
            return ChatGoogleGenerativeAI(model=gemini_model, temperature=0.0)
        if model[:6] == "claude":
            return ChatAnthropic(model=model[7:], temperature=0.0, streaming=True)

    def init_vector_store(self, collection_name: str):
        self.vector_store = create_vector_store(
            embeddings,
            connection_args={"uri": os.environ["MILVUS_URI"]},
            collection_name=collection_name,
            document_name=None
        )
        print(f"[DEBUG] Vector store initialized for collection: {collection_name}")

    def retrieve(self, state: State):
        query = state["question"]

        vector_retriever = self.vector_store.as_retriever(search_type="similarity", k=10)

        # Load documents for BM25 index — only once ideally
        if not hasattr(self, "bm25"):
            all_docs = self.vector_store.similarity_search("")

            if not all_docs:
                print("[ERROR] No documents found for BM25Retriever. Falling back to vector search only.")
                top_docs = vector_retriever.get_relevant_documents(query)
            else:
                self.bm25 = BM25Retriever.from_documents(all_docs)
                hybrid_retriever = EnsembleRetriever(
                    retrievers=[vector_retriever, self.bm25],
                    weights=[0.7, 0.3]
                )
                top_docs = hybrid_retriever.get_relevant_documents(query)
        else:
            # already initialized; use hybrid
            hybrid_retriever = EnsembleRetriever(
                retrievers=[vector_retriever, self.bm25],
                weights=[0.7, 0.3]
            )
            top_docs = hybrid_retriever.get_relevant_documents(query)

        # Enrich documents
        enriched_docs = []
        for doc in top_docs:
            paragraphs = doc.page_content.split("\n\n")
            for i, para in enumerate(paragraphs):
                if query.lower() in para.lower():
                    before = paragraphs[i - 1] if i > 0 else ""
                    after = paragraphs[i + 1] if i < len(paragraphs) - 1 else ""
                    combined = f"{before}\n\n{para}\n\n{after}"
                    enriched_docs.append(Document(
                        page_content=combined,
                        metadata=doc.metadata
                    ))
                    break
            else:
                enriched_docs.append(doc)

        print("context", enriched_docs)
        return {"context": enriched_docs}

    def generate(self, state: State):
        docs_content = "\n\n".join(
            f"[Source: {doc.metadata.get('source', 'unknown')}]\n{doc.page_content}"
            for doc in state["context"]
        )

        history_entries = []
        for h in state.get("history", []):
            if h.get("user"):
                history_entries.append(f"User: {h['user']}")
            if h.get("ai"):
                history_entries.append(f"AI: {h['ai']}")
        history_str = "\n".join(history_entries)

        prompt_string = prompt.format(
            question=state["question"],
            context=docs_content,
            history=history_str,
            prompt_msg=state["prompt_msg"]
        )

        response = self.llm.invoke([{"role": "user", "content": prompt_string}])
        print("\n[DEBUG] Final Answer:\n", response.content)
        return {"answer": response.content}

    def build_graph(self, collection_name):
        self.init_vector_store(collection_name)
        memory = MemorySaver()
        graph_builder = StateGraph(State).add_sequence([self.retrieve, self.generate])
        graph_builder.add_edge(START, "retrieve")
        self.graph = graph_builder.compile(checkpointer=memory, interrupt_after=["generate"])

    async def chatter(self, input_message: str, config: Dict = {"thread_id": "1"}, history: List[Dict] = None, prompt_msg: str = ""):
        if config is None:
            config = {"thread_id": "1"}
        if history is None:
            history = []

        async for message, metadata in self.graph.astream(
            {"question": input_message, "history": history, "prompt_msg": prompt_msg},
            stream_mode="messages",
            config=config
        ):
            if metadata["langgraph_node"] == "generate":
                yield message.content
