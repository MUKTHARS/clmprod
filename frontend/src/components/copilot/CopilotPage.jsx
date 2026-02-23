import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, FileText, ChevronDown, RotateCcw,
  Loader2, BarChart2, MessageSquare
} from 'lucide-react';
import API_CONFIG from '../../config';
import './CopilotPage.css';

const DOC_SUGGESTIONS = [
  'What is the total grant amount?',
  'What are the key deliverables?',
  'What are the payment milestones?',
  'Who are the parties involved?',
  'What is the grant period (start and end dates)?',
  'What are the reporting requirements?',
];

const ANALYTICS_SUGGESTIONS = [
  'Give me an executive snapshot of the portfolio',
  'Which grants have overdue reports?',
  'What is the total portfolio value?',
  'Show me the financial summary for each grant',
  'Which grants are at risk?',
  'What reports are due in the next 30 days?',
  'What is the balance remaining per grant?',
  'Show me the overall portfolio health',
];

function CopilotPage() {
  const [mode, setMode] = useState('analytics'); // 'document' | 'analytics'
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractDropdown, setShowContractDropdown] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch contracts for document mode
  useEffect(() => {
    const fetchContracts = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/contracts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.contracts || []);
          setContracts(list);
        }
      } catch (e) {
        console.error('Failed to fetch contracts', e);
      } finally {
        setLoadingContracts(false);
      }
    };
    fetchContracts();
  }, []);

  // Reset chat when mode changes
  useEffect(() => {
    if (mode === 'analytics') {
      setMessages([{
        role: 'assistant',
        content:
          "I'm connected to your live grant database. Ask me anything about your portfolio — financials, overdue reports, risk exposure, upcoming deadlines, or overall health.",
      }]);
      setSelectedContract(null);
    } else {
      setMessages([]);
    }
  }, [mode]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowContractDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectContract = (contract) => {
    setSelectedContract(contract);
    setShowContractDropdown(false);
    setMessages([{
      role: 'assistant',
      content: `I've loaded **${contract.grant_name || contract.filename}**. Ask me anything about this grant document.`,
    }]);
  };

  const handleSend = async (text) => {
    const question = (text || inputText).trim();
    if (!question || loading) return;
    if (mode === 'document' && !selectedContract) return;

    const userMsg = { role: 'user', content: question };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    const token = localStorage.getItem('token');
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));

    const body = {
      message: question,
      contract_id: mode === 'document' ? selectedContract?.id : null,
      chat_history: history,
    };

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Request failed');
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `Sorry, I ran into an error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    if (mode === 'analytics') {
      setMessages([{
        role: 'assistant',
        content: "Conversation cleared. Ask me anything about your grant portfolio.",
      }]);
    } else {
      setMessages(selectedContract ? [{
        role: 'assistant',
        content: `Conversation cleared. Ask me anything about **${selectedContract.grant_name || selectedContract.filename}**.`,
      }] : []);
    }
  };

  const suggestions = mode === 'analytics' ? ANALYTICS_SUGGESTIONS : DOC_SUGGESTIONS;
  const canSend = mode === 'analytics' ? true : !!selectedContract;
  const contractLabel = selectedContract
    ? (selectedContract.grant_name || selectedContract.filename)
    : 'Select a grant document';

  return (
    <div className="copilot-page">
      {/* Top bar */}
      <div className="copilot-topbar">
        <div className="copilot-topbar-left">
          <Sparkles size={18} className="copilot-sparkle" />
          <span className="copilot-topbar-title">AI Copilot</span>

          {/* Mode toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn${mode === 'analytics' ? ' active' : ''}`}
              onClick={() => setMode('analytics')}
            >
              <BarChart2 size={14} />
              Portfolio Analytics
            </button>
            <button
              className={`mode-btn${mode === 'document' ? ' active' : ''}`}
              onClick={() => setMode('document')}
            >
              <MessageSquare size={14} />
              Document Chat
            </button>
          </div>
        </div>

        <div className="copilot-topbar-right">
          {/* Contract selector — only in document mode */}
          {mode === 'document' && (
            <div className="contract-selector-wrap" ref={dropdownRef}>
              <button
                className="contract-selector-btn"
                onClick={() => setShowContractDropdown((v) => !v)}
              >
                <FileText size={14} />
                <span className="contract-selector-label">{contractLabel}</span>
                <ChevronDown size={13} />
              </button>

              {showContractDropdown && (
                <div className="contract-dropdown">
                  {loadingContracts ? (
                    <div className="contract-dropdown-item contract-dropdown-loading">Loading…</div>
                  ) : contracts.length === 0 ? (
                    <div className="contract-dropdown-item contract-dropdown-loading">No documents found</div>
                  ) : (
                    contracts.map((c) => (
                      <button
                        key={c.id}
                        className={`contract-dropdown-item${selectedContract?.id === c.id ? ' active' : ''}`}
                        onClick={() => handleSelectContract(c)}
                      >
                        <FileText size={13} />
                        <div className="contract-dropdown-info">
                          <span className="contract-dropdown-name">{c.grant_name || c.filename}</span>
                          {c.status && (
                            <span className={`contract-dropdown-status status-${c.status}`}>{c.status}</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {messages.length > 1 && (
            <button className="copilot-reset-btn" onClick={handleReset} title="Clear conversation">
              <RotateCcw size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="copilot-body">
        {/* Chat area */}
        <div className="chat-area">
          {/* Empty state for document mode with no contract selected */}
          {mode === 'document' && !selectedContract && (
            <div className="copilot-empty">
              <FileText size={44} className="copilot-empty-icon" />
              <h3>Select a grant document</h3>
              <p>Choose a document from the dropdown above, then ask any question about its contents.</p>
            </div>
          )}

          {/* Messages */}
          {(mode === 'analytics' || selectedContract) && (
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="chat-avatar">
                      {mode === 'analytics' ? <BarChart2 size={13} /> : <Sparkles size={13} />}
                    </div>
                  )}
                  <div className="chat-bubble">
                    <MessageContent content={msg.content} />
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat-message assistant">
                  <div className="chat-avatar">
                    {mode === 'analytics' ? <BarChart2 size={13} /> : <Sparkles size={13} />}
                  </div>
                  <div className="chat-bubble chat-bubble-loading">
                    <Loader2 size={15} className="spin" />
                    <span>{mode === 'analytics' ? 'Querying database…' : 'Analyzing document…'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Right sidebar — suggested questions */}
        {(mode === 'analytics' || selectedContract) && (
          <div className="copilot-sidebar-right">
            <p className="suggested-label">Suggested</p>
            <div className="suggested-list">
              {suggestions.map((q) => (
                <button
                  key={q}
                  className="suggested-btn"
                  onClick={() => handleSend(q)}
                  disabled={loading || !canSend}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      {(mode === 'analytics' || selectedContract) && (
        <div className="chat-input-bar">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'analytics'
                ? 'Ask anything about your grant portfolio…'
                : 'Ask anything about this grant document…'
            }
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading || !canSend}
          >
            {loading ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
          </button>
        </div>
      )}
    </div>
  );
}

// Simple bold/newline renderer for **text**
function MessageContent({ content }) {
  const lines = content.split('\n');
  return (
    <div style={{ lineHeight: 1.65 }}>
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ margin: '2px 0' }}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

export default CopilotPage;
