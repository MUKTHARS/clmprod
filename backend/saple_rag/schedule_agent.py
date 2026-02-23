from typing import Dict, AsyncIterator
from langchain_core.documents import Document
from langgraph.graph import StateGraph, END
from typing_extensions import List, TypedDict
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

class State(TypedDict):
    question: str
    context: List[Document]
    answer: str
    history: List[Dict]
    prompt_msg: str


class SchedulingAgent:
    def __init__(self, model: str):
        self.llm = self._get_llm(model)
        self._build_graph()

    def _get_llm(self, model: str) -> ChatOpenAI:
        """Initialize the language model."""
        return ChatOpenAI(model=model, temperature=0.0, streaming=True)

    def _build_graph(self):
        """Build the LangGraph workflow for scheduling."""
        workflow = StateGraph(State)

        # Define nodes
        workflow.add_node("classify_request", self._classify_request)
        workflow.add_node("handle_scheduling", self._handle_scheduling)
        workflow.add_node("handle_general", self._handle_general)

        # Define edges
        workflow.add_conditional_edges(
            "classify_request",
            self._route_request,
            {
                "schedule": "handle_scheduling",
                "general": "handle_general"
            }
        )
        workflow.add_edge("handle_scheduling", END)
        workflow.add_edge("handle_general", END)

        workflow.set_entry_point("classify_request")
        self.graph = workflow.compile()

    async def _classify_request(self, state: State) -> Dict:
        """Classify if the request is scheduling-related."""
        prompt = """Analyze if this is a scheduling request. Respond with ONLY 'schedule' or 'general':
        Examples:
        - "Book a meeting" → schedule
        - "Set up appointment" → schedule
        - "What's the weather?" → general
        
        Question: {question}"""
        
        response = await self.llm.ainvoke(prompt.format(question=state["question"]))
        return {"classification": response.content.strip().lower()}

    def _route_request(self, state: State) -> str:
        """Route the request based on classification."""
        return state["classification"]

    async def _handle_scheduling(self, state: State) -> Dict:
        """Handle scheduling requests."""
        prompt = """Analyze the following user question and determine if it's related to scheduling, 
        booking appointments, or calendar management. Respond with ONLY 'yes' or 'no'.

        Question: {question}

        Consider these examples:
        - "Book a meeting with John tomorrow" → yes
        - "Schedule a dentist appointment" → yes
        - "What's the weather today?" → no
        - "Tell me about our company policies" → no
        """
        
        response = await self.llm.ainvoke(prompt.format(question=state["question"]))
        return {"answer": response.content}

    async def _handle_general(self, state: State) -> Dict:
        """Handle non-scheduling requests."""
        return {"answer": "I'm a scheduling assistant. For general questions, please use our main chat service."}

    async def chatter(self, input_message: str) -> AsyncIterator[str]:
        """Stream responses for scheduling requests."""
        state = {"question": input_message}
        
        # First classify the request
        classification = await self._classify_request(state)
        
        if classification.get("classification") == "schedule":
            # Handle scheduling request
            prompt = self._get_scheduling_prompt(input_message)
            async for chunk in self.llm.astream(prompt):
                yield chunk.content
        else:
            yield "This appears to be a general question. For scheduling help, please ask about booking appointments or meetings."

    def _get_scheduling_prompt(self, question: str) -> str:
        """Generate a detailed scheduling prompt."""
        return f"""Analyze the following user question and determine if it's related to scheduling, 
        booking appointments, or calendar management. Respond with ONLY 'yes' or 'no'.

        Question: {question}

        Consider these examples:
        - "Book a meeting with John tomorrow" → yes
        - "Schedule a dentist appointment" → yes
        - "What's the weather today?" → no
        - "Tell me about our company policies" → no
        """