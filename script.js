(() => {
  const chatLog = document.getElementById('chat-log');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const statusPill = document.getElementById('status-pill');
  const sessionIdDisplay = document.getElementById('session-id-display');
  const resetBtn = document.getElementById('reset-btn');

  // ---------------------------------------------------------
  // Session id (persisted per browser tab / storage)
  // ---------------------------------------------------------
  let sessionId = localStorage.getItem('city-agent-session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('city-agent-session', sessionId);
  }
  sessionIdDisplay.textContent = sessionId;

  let pendingPollTimer = null;
  let activeClearanceEl = null;
  let activeClearanceId = null;

  function setStatus(state) {
    statusPill.classList.remove('status-pill--ready', 'status-pill--thinking', 'status-pill--hold');
    if (state === 'thinking') {
      statusPill.textContent = 'Thinking';
      statusPill.classList.add('status-pill--thinking');
    } else if (state === 'hold') {
      statusPill.textContent = 'Awaiting clearance';
      statusPill.classList.add('status-pill--hold');
    } else {
      statusPill.textContent = 'Ready';
      statusPill.classList.add('status-pill--ready');
    }
  }

  function scrollToBottom() {
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function addBubble(role, text) {
    const entry = document.createElement('div');
    entry.className = `log-entry log-entry--${role}`;
    const bubble = document.createElement('div');
    bubble.className = `log-bubble log-bubble--${role}`;
    bubble.textContent = text;
    entry.appendChild(bubble);
    chatLog.appendChild(entry);
    scrollToBottom();
    return bubble;
  }

  function addTypingBubble() {
    const entry = document.createElement('div');
    entry.className = 'log-entry log-entry--assistant';
    entry.id = 'typing-indicator';
    entry.innerHTML = `
      <div class="log-bubble log-bubble--assistant">
        <span class="typing-dots"><span></span><span></span><span></span></span>
      </div>`;
    chatLog.appendChild(entry);
    scrollToBottom();
  }

  function removeTypingBubble() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function formatArgs(args) {
    try {
      return JSON.stringify(args, null, 0);
    } catch {
      return String(args);
    }
  }

  function showClearanceCard(pending) {
    // Avoid duplicating the same request if already shown
    if (activeClearanceId === pending.id) return;
    activeClearanceId = pending.id;
    setStatus('hold');

    const entry = document.createElement('div');
    entry.className = 'log-entry log-entry--system';
    entry.innerHTML = `
      <div class="clearance" id="clearance-${pending.id}">
        <div class="clearance-head">
          <span class="radar"></span>
          <span class="clearance-title">Clearance Request</span>
        </div>
        <div class="clearance-tool">${pending.tool}()</div>
        <div class="clearance-args">${formatArgs(pending.args)}</div>
        <div class="clearance-actions">
          <button class="clearance-btn clearance-btn--approve" data-decision="approve">Approve</button>
          <button class="clearance-btn clearance-btn--deny" data-decision="deny">Deny</button>
        </div>
      </div>`;
    chatLog.appendChild(entry);
    activeClearanceEl = entry.querySelector('.clearance');
    scrollToBottom();

    activeClearanceEl.querySelectorAll('.clearance-btn').forEach((btn) => {
      btn.addEventListener('click', () => resolveClearance(btn.dataset.decision === 'approve'));
    });
  }

  async function resolveClearance(approved) {
    if (!activeClearanceEl) return;
    const actions = activeClearanceEl.querySelector('.clearance-actions');
    actions.remove();

    const resolved = document.createElement('div');
    resolved.className = `clearance-resolved clearance-resolved--${approved ? 'approved' : 'denied'}`;
    resolved.textContent = approved ? 'Cleared for execution' : 'Denied';
    activeClearanceEl.appendChild(resolved);

    activeClearanceEl = null;
    activeClearanceId = null;
    setStatus('thinking');

    try {
      await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, approved }),
      });
    } catch (err) {
      console.error('Failed to send clearance decision', err);
    }
  }

  function startPendingPoll() {
    stopPendingPoll();
    pendingPollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/pending?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (data.pending) {
          removeTypingBubble();
          showClearanceCard(data.pending);
        }
      } catch (err) {
        // silent - next poll will retry
      }
    }, 700);
  }

  function stopPendingPoll() {
    if (pendingPollTimer) {
      clearInterval(pendingPollTimer);
      pendingPollTimer = null;
    }
  }

  async function sendMessage(message) {
    addBubble('user', message);
    addTypingBubble();
    setStatus('thinking');
    sendBtn.disabled = true;
    chatInput.disabled = true;

    startPendingPoll();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message }),
      });
      const data = await res.json();

      stopPendingPoll();
      removeTypingBubble();

      if (data.error) {
        addBubble('error', `Error: ${data.error}`);
      } else {
        addBubble('assistant', data.reply);
      }
    } catch (err) {
      stopPendingPoll();
      removeTypingBubble();
      addBubble('error', 'Connection lost. Is the Flask server running?');
    } finally {
      setStatus('ready');
      sendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = '';
    sendMessage(message);
  });

  resetBtn.addEventListener('click', async () => {
    await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    chatLog.innerHTML = `
      <div class="log-entry log-entry--system">
        <div class="log-bubble log-bubble--system">
          Session cleared. Ask about weather or news for any city.
        </div>
      </div>`;
  });
})();
