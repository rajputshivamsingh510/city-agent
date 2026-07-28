from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import threading
import requests
from flask import Flask, request, jsonify, render_template

from langchain_mistralai import ChatMistralAI
from langchain.tools import tool
from langchain_core.messages import ToolMessage
from tavily import TavilyClient
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call

app = Flask(__name__)

# ============================================================
# Session + pending-approval state
#
# Each browser tab gets a session_id (generated client-side and
# stored in localStorage). The Flask dev server is run with
# threaded=True, so a /api/chat request that blocks waiting for
# human approval doesn't block other requests (like /api/pending
# and /api/approve) from being served concurrently.
# ============================================================

_thread_local = threading.local()
_sessions_lock = threading.Lock()
_sessions = {}   # session_id -> {"history": [...]}
_pending = {}    # session_id -> {"id", "tool", "args", "event", "approved"}


def _get_session(session_id):
    with _sessions_lock:
        if session_id not in _sessions:
            _sessions[session_id] = {"history": []}
        return _sessions[session_id]


# ============================================================
# Tools (same logic as the original script)
# ============================================================

@tool
def get_weather(city: str) -> str:
    """Get the current weather of a city."""

    api_key = os.getenv("OPENWEATHER_API_KEY")

    if not api_key:
        return "OpenWeather API key not found."

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}&appid={api_key}&units=metric"
    )

    response = requests.get(url)
    data = response.json()

    if data.get("cod") != 200:
        return f"Error: {data.get('message', 'Could not fetch weather')}"

    temp = data["main"]["temp"]
    desc = data["weather"][0]["description"]

    return f"Weather in {city}: {desc}, {temp}°C"


tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


@tool
def get_news(city: str) -> str:
    """Get the latest news about a city."""

    response = tavily_client.search(
        query=f"Latest news in {city}",
        search_depth="basic",
        max_results=3,
    )

    results = response.get("results", [])

    if not results:
        return f"No news found for {city}"

    news_list = []
    for r in results:
        title = r.get("title", "No title")
        url = r.get("url", "")
        snippet = r.get("content", "")
        news_list.append(f"• {title}\n🔗 {url}\n📝 {snippet[:150]}...")

    return f"Latest news in {city}:\n\n" + "\n\n".join(news_list)


# ============================================================
# Human approval middleware
#
# Instead of blocking on input(), this parks the tool call in
# _pending[session_id] and waits on a threading.Event. The web
# UI polls /api/pending, shows a "clearance request" card, and
# posts the decision to /api/approve, which sets the event.
# ============================================================

@wrap_tool_call
def human_approval(tool_request, handler):
    tool_name = tool_request.tool_call["name"]
    tool_args = tool_request.tool_call.get("args", {})
    tool_call_id = tool_request.tool_call["id"]

    session_id = getattr(_thread_local, "session_id", None)

    if not session_id:
        return handler(tool_request)

    event = threading.Event()
    _pending[session_id] = {
        "id": tool_call_id,
        "tool": tool_name,
        "args": tool_args,
        "event": event,
        "approved": None,
    }

    event.wait(timeout=300)  # auto-deny after 5 minutes of silence

    decision = _pending.get(session_id, {}).get("approved")
    _pending.pop(session_id, None)

    if decision is not True:
        return ToolMessage(
            content="Tool execution denied by the user.",
            tool_call_id=tool_call_id,
        )

    return handler(tool_request)


# ============================================================
# LLM + Agent
# ============================================================

llm = ChatMistralAI(model="mistral-small-latest")

agent = create_agent(
    model=llm,
    tools=[get_weather, get_news],
    system_prompt="""
You are a helpful City Intelligence Assistant.

Guidelines:
- Use get_weather whenever the user asks about weather.
- Use get_news whenever the user asks about latest news.
- If no tool is required, answer directly.
- Be concise and helpful.
""",
    middleware=[human_approval],
)


# ============================================================
# Routes
# ============================================================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True) or {}
    session_id = data.get("session_id") or str(uuid.uuid4())
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"error": "Empty message"}), 400

    session = _get_session(session_id)
    session["history"].append({"role": "user", "content": message})

    _thread_local.session_id = session_id

    try:
        result = agent.invoke({"messages": session["history"]})
        reply = result["messages"][-1].content
        session["history"].append({"role": "assistant", "content": reply})
        return jsonify({"session_id": session_id, "reply": reply})
    except Exception as e:
        return jsonify({"session_id": session_id, "error": str(e)}), 500
    finally:
        _pending.pop(session_id, None)


@app.route("/api/pending")
def pending():
    session_id = request.args.get("session_id")
    p = _pending.get(session_id)
    if not p:
        return jsonify({"pending": None})
    return jsonify({
        "pending": {
            "id": p["id"],
            "tool": p["tool"],
            "args": p["args"],
        }
    })


@app.route("/api/approve", methods=["POST"])
def approve():
    data = request.get_json(force=True) or {}
    session_id = data.get("session_id")
    approved = bool(data.get("approved"))

    p = _pending.get(session_id)
    if not p:
        return jsonify({"ok": False, "error": "No pending request"}), 404

    p["approved"] = approved
    p["event"].set()
    return jsonify({"ok": True})


@app.route("/api/reset", methods=["POST"])
def reset():
    data = request.get_json(force=True) or {}
    session_id = data.get("session_id")
    with _sessions_lock:
        _sessions.pop(session_id, None)
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=5000)
