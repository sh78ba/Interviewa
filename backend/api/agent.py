import json
import re
from typing import TypedDict, Annotated, Sequence, Optional
from langgraph.graph import StateGraph, END
from services.llm_service import llm

class InterviewState(TypedDict):
    interview_id: str
    question_id: str
    question_text: str
    history_text: str
    last_user_input: str
    action: Optional[str]
    response: Optional[str]
    ai_service_url: Optional[str]
    groq_api_key: Optional[str]

async def analyze_intent(state: InterviewState):
    """Analyze the user's input and decide how to respond."""
    user_turns = state['history_text'].count("User:")
    turn_instruction = ""
    if user_turns >= 3:
        turn_instruction = "\n- CRITICAL: The user has provided multiple responses. You MUST wrap up, acknowledge their effort, and set action to \"complete\"."

    prompt = f"""You are an AI technical interviewer. 
The current interview question is: "{state['question_text']}"

Here is the conversation so far for this question:
{state['history_text']}

Analyze the user's latest input. This is a highly interactive, two-way interview.
- If the user's answer is brief, incomplete, or if they ask a clarifying question, you MUST respond with a follow-up question, nudge, or clarification to keep the conversation going. Set action to "reply".
- If the user is struggling, give them a small hint. Set action to "reply".
- If the user has fully and deeply answered the question, or explicitly says they are done, acknowledge their answer and move on. Set action to "complete".{turn_instruction}

Return ONLY a valid JSON object in this format (no markdown, no backticks, just the raw JSON object):
{{
  "action": "reply" | "complete",
  "response": "Your short spoken conversational response"
}}
"""
    try:
        llm_response = await llm(
            prompt, 
            task="hr", 
            ai_service_url=state.get('ai_service_url'), 
            groq_api_key=state.get('groq_api_key')
        )
        json_match = re.search(r'\{.*?\}', llm_response, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
        else:
            parsed = json.loads(llm_response.replace("```json", "").replace("```", "").strip())
        
        state["action"] = parsed.get("action", "reply")
        state["response"] = parsed.get("response", "Please continue.")
    except Exception as e:
        print(f"Agent failed to parse: {e}")
        state["action"] = "reply"
        state["response"] = "I'm sorry, could you repeat that or continue your thought?"
    
    return state

def router(state: InterviewState):
    if state["action"] == "complete":
        return "evaluate_answer"
    else:
        return "handle_doubt"

async def handle_doubt(state: InterviewState):
    # State already contains the response generated in analyze_intent
    return state

async def evaluate_answer(state: InterviewState):
    # Finalize the answer. The WebSocket endpoint will handle saving to the DB.
    return state

# Compile the LangGraph
workflow = StateGraph(InterviewState)

workflow.add_node("analyze_intent", analyze_intent)
workflow.add_node("handle_doubt", handle_doubt)
workflow.add_node("evaluate_answer", evaluate_answer)

workflow.set_entry_point("analyze_intent")
workflow.add_conditional_edges("analyze_intent", router, {
    "handle_doubt": "handle_doubt",
    "evaluate_answer": "evaluate_answer"
})
workflow.add_edge("handle_doubt", END)
workflow.add_edge("evaluate_answer", END)

interview_agent = workflow.compile()
