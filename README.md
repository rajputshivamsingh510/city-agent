````markdown
# 🌍 City Intelligence Console

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-Web%20Framework-black?logo=flask)
![LangChain](https://img.shields.io/badge/LangChain-Agent-green)
![Mistral](https://img.shields.io/badge/Mistral-LLM-orange)
![Tavily](https://img.shields.io/badge/Tavily-Search-purple)
![OpenWeather](https://img.shields.io/badge/OpenWeather-API-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

### AI-powered City Intelligence Assistant with Human-in-the-Loop Tool Approval

[🚀 Live Demo](https://city-agent-uhok.onrender.com)
&nbsp;&nbsp;
[📂 Source Code](https://https://github.com/rajputshivamsingh510/city-agent)

</div>

---

# 📸 Application Preview

> Replace the image below with your own screenshot.

<p align="center">
<img src="images/city-console.png" width="100%">
</p>

---

# 📖 Overview

City Intelligence Console is an AI-powered assistant built using **LangChain Agents**, **Mistral AI**, **Flask**, and **Tool Calling**.

The assistant can:

- 🌤 Fetch real-time weather
- 📰 Retrieve the latest city news
- 🤖 Automatically decide when tools are required
- 👨‍💻 Ask the user for approval before executing any external tool
- 💬 Provide conversational responses through a modern web interface

Unlike traditional chatbots, this project demonstrates **Agentic AI** by allowing the LLM to reason about when external APIs should be used.

---

# ✨ Features

- 🤖 LangChain Agent
- 🧠 Mistral Large Language Model
- 🛠 Tool Calling
- 👨 Human-in-the-loop approval
- 🌤 OpenWeather API integration
- 📰 Tavily Search integration
- 💬 Modern chat interface
- 🔒 Tool execution approval workflow
- ⚡ Flask backend
- 🌐 Render deployment ready
- 🧵 Thread-safe approval middleware
- 💾 Session-based conversation history
- 🔄 Reset conversation support
- 🎨 Professional UI

---

# 🛠 Tech Stack

## Backend

- Python
- Flask
- LangChain
- LangChain Agents
- LangChain Middleware
- LangChain Tools
- Mistral AI

## APIs

- OpenWeather API
- Tavily Search API

## Frontend

- HTML5
- CSS3
- JavaScript

## Deployment

- Render
- Gunicorn

---

# 🏗 Architecture

```
                User
                  │
                  ▼
         Flask Web Server
                  │
                  ▼
        LangChain Agent
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
  Weather Tool         News Tool
(OpenWeather API)   (Tavily Search)
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
      Human Approval Middleware
                  │
          Approve / Deny
                  │
                  ▼
          Final AI Response
```

---

# 📂 Project Structure

```
City-Intelligence-Agent/

│
├── app.py
├── requirements.txt
├── README.md
├── .env
│
├── templates/
│   └── index.html
│
├── static/
│   ├── style.css
│   └── script.js
│
└── images/
    └── city-console.png
```

---

# ⚙ Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Go inside the project

```bash
cd City-Intelligence-Agent
```

Create a virtual environment

```bash
python -m venv venv
```

Activate it

Windows

```bash
venv\Scripts\activate
```

Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

# 🔑 Environment Variables

Create a `.env` file.

```env
MISTRAL_API_KEY=YOUR_KEY
OPENWEATHER_API_KEY=YOUR_KEY
TAVILY_API_KEY=YOUR_KEY
```

---

# ▶ Running the Project

```bash
python app.py
```

Open

```
http://localhost:5000
```

---

# 🚀 Deployment

This project is deployed on **Render** using **Gunicorn**.

Build Command

```bash
pip install -r requirements.txt
```

Start Command

```bash
gunicorn app:app
```

---

# 💡 How It Works

### Step 1

User asks a question.

```
What's the weather in Delhi?
```

### Step 2

The LLM reasons that weather information requires an external tool.

### Step 3

The Human Approval Middleware intercepts the tool call.

```
Approve Tool?

YES
NO
```

### Step 4

If approved,

```
Agent

↓

OpenWeather API

↓

Weather Data

↓

LLM

↓

Final Response
```

If denied,

The LLM generates a response without executing the tool.

---

# 🛠 Available Tools

## 🌤 Weather Tool

Returns

- Temperature
- Weather condition

Powered by

- OpenWeather API

---

## 📰 News Tool

Returns

- Latest news
- Source URL
- News summary

Powered by

- Tavily Search API

---

# 🌐 API Endpoints

## Home

```
GET /
```

Returns the web interface.

---

## Chat

```
POST /api/chat
```

---

## Pending Approval

```
GET /api/pending
```

---

## Approve Tool

```
POST /api/approve
```

---

## Reset Session

```
POST /api/reset
```

---

# 📷 Screenshots

## Main Interface

```
images/home.png
```

# 🔮 Future Improvements

- Voice Assistant
- Multiple tools
- Maps integration
- Air Quality API
- Currency conversion
- Hotel finder
- Restaurant recommendations
- Travel planner
- Authentication
- Database support
- Chat history storage
- Docker deployment
- CI/CD pipeline

---

# 👨‍💻 Author

**Shivam Singh**

GitHub

https://github.com/rajputshivamsingh510

LinkedIn

https://www.linkedin.com/in/shivam-singh-243000232/

---

# ⭐ If you found this project useful

Please consider giving it a **Star ⭐** on GitHub.
````
