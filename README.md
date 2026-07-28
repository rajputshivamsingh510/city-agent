# City Intelligence Console

A web UI for the City Intelligence Agent — a LangChain agent (Mistral) with
`get_weather` and `get_news` tools, and a human-in-the-loop approval step
before any tool runs.

## Setup

```bash
cd city-agent
pip install -r requirements.txt
cp .env.example .env   # then fill in your API keys
python app.py
```

Open **http://localhost:5000** in your browser.

## How it works

- `app.py` — Flask server. Wraps the original LangChain agent and tools
  unchanged. The `human_approval` middleware no longer blocks on `input()`;
  instead it parks the tool call and waits for a decision made in the browser.
- `templates/index.html` / `static/` — the console UI: a sidebar showing the
  session and connected tools, a chat log, and "Clearance Request" cards that
  appear whenever the agent wants to call a tool.
- Approve or deny each clearance request as it appears — the agent resumes
  (or the tool call is skipped) based on your decision.
- **Clear session** in the sidebar wipes the conversation history for a fresh start.

## Notes

- Requires a Mistral API key, an OpenWeather API key, and a Tavily API key.
- Runs with Flask's built-in dev server (`threaded=True`) so the UI can poll
  for pending approvals while a request is in flight. For production, put it
  behind a proper WSGI server (gunicorn, etc.) with `threaded=True` equivalent
  concurrency.
