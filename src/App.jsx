import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Mail,
  FileText,
  ListChecks,
  Search,
  MessageSquare,
  Send,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Loader2,
  ChevronRight,
} from "lucide-react";

/* ---------------------------------------------------------
   Design tokens
   bg:        #F4F5F7   surface: #FFFFFF   border: #E4E6EA
   navy:      #14203A   navy-2:  #1F3864   ink: #171A21
   muted:     #6B7280   accent:  #0F9B8E   accent-soft: #E4F5F3
   amber:     #B45309   amber-soft: #FFF7E8
--------------------------------------------------------- */

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');";

// NOTE: Browsers cannot call api.anthropic.com directly (CORS + it would expose
// your API key to every visitor). This calls YOUR OWN backend instead, which
// forwards the request to Anthropic server-side. See README.md "Connecting the AI"
// for a 10-line Express proxy you can deploy in minutes.
const API_ENDPOINT = import.meta.env.VITE_CLAUDE_PROXY_URL || "/api/claude";

async function callClaude(systemPrompt, userPrompt) {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await response.json();
  const text = (data.content || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .filter(Boolean)
    .join("\n");
  return text;
}

function stripJsonFence(text) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

/* ---------------------------------------------------------
   Small shared UI
--------------------------------------------------------- */

function Disclaimer({ compact }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border ${
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
      }`}
      style={{
        background: "#FFF7E8",
        borderColor: "#F3D9A4",
        color: "#8A5A0C",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <ShieldAlert size={compact ? 14 : 16} className="shrink-0" />
      <span>AI-generated content may require human review.</span>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{
            background: "#0F9B8E",
            animation: `assistantPulse 1s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      <div
        className="text-xs font-semibold tracking-widest uppercase mb-1"
        style={{ color: "#0F9B8E", fontFamily: "Inter, sans-serif" }}
      >
        {eyebrow}
      </div>
      <h1
        className="text-2xl sm:text-3xl font-bold"
        style={{ color: "#14203A", fontFamily: "Sora, sans-serif" }}
      >
        {title}
      </h1>
      {description && (
        <p
          className="mt-2 text-sm sm:text-base max-w-2xl"
          style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${className}`}
      style={{ background: "#FFFFFF", borderColor: "#E4E6EA" }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ onClick, disabled, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
      style={{
        background: disabled ? "#9CA9BE" : "#14203A",
        color: "#FFFFFF",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {disabled ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

function Label({ children }) {
  return (
    <label
      className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
      style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}
    >
      {children}
    </label>
  );
}

const inputStyle = {
  background: "#F9FAFB",
  border: "1px solid #E4E6EA",
  color: "#171A21",
  fontFamily: "Inter, sans-serif",
};

function OutputPanel({ loading, empty, emptyText, children }) {
  if (loading) {
    return (
      <div
        className="rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-sm"
        style={{ background: "#E4F5F3", color: "#0F6E64", minHeight: "140px", fontFamily: "Inter, sans-serif" }}
      >
        <TypingDots />
        <span>Generating…</span>
      </div>
    );
  }
  if (empty) {
    return (
      <div
        className="rounded-xl p-6 flex items-center justify-center text-sm text-center"
        style={{ background: "#F9FAFB", color: "#9CA3AF", minHeight: "140px", fontFamily: "Inter, sans-serif" }}
      >
        {emptyText}
      </div>
    );
  }
  return <>{children}</>;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
      style={{ color: "#0F9B8E", background: "#E4F5F3", fontFamily: "Inter, sans-serif" }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ---------------------------------------------------------
   1. Smart Email Generator
--------------------------------------------------------- */

function EmailGenerator() {
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("Formal");
  const [audience, setAudience] = useState("Manager");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const generate = async () => {
    if (!context.trim()) return;
    setLoading(true);
    setResult("");
    const system =
      "You are a professional workplace email writing assistant. You write clear, well-structured, ready-to-send emails. Always include a subject line, greeting, body, and sign-off placeholder '[Your name]'. Do not add commentary before or after the email.";
    const user = `Write a professional email based on this context:
"${context}"

Tone: ${tone}
Audience: ${audience} (adapt formality, structure, and level of detail accordingly)

Output only the email, formatted with a "Subject:" line followed by the email body.`;
    try {
      const text = await callClaude(system, user);
      setResult(text.trim());
    } catch (e) {
      setResult("Something went wrong generating this email. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Feature 01"
        title="Smart Email Generator"
        description="Describe what you need to say — get a ready-to-send, context-aware email in the right tone for your audience."
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <Label>What's this email about?</Label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Ask my manager for two days of leave next month to attend a family event"
            rows={6}
            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
            style={{ ...inputStyle, "--tw-ring-color": "#0F9B8E" }}
          />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <Label>Tone</Label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              >
                <option>Formal</option>
                <option>Informal</option>
                <option>Persuasive</option>
              </select>
            </div>
            <div>
              <Label>Audience</Label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              >
                <option>Client</option>
                <option>Manager</option>
                <option>Team</option>
              </select>
            </div>
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={generate} disabled={loading || !context.trim()} icon={Sparkles}>
              Generate email
            </PrimaryButton>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}>
              Draft
            </span>
            {result && !loading && <CopyButton text={result} />}
          </div>
          <OutputPanel loading={loading} empty={!result} emptyText="Your generated email will appear here.">
            <pre
              className="whitespace-pre-wrap text-sm leading-relaxed p-4 rounded-xl"
              style={{ background: "#F9FAFB", color: "#171A21", fontFamily: "'IBM Plex Mono', monospace", minHeight: "140px" }}
            >
              {result}
            </pre>
          </OutputPanel>
          {result && !loading && (
            <div className="mt-3">
              <Disclaimer compact />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   2. Meeting Notes Summarizer
--------------------------------------------------------- */

function MeetingSummarizer() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rawFallback, setRawFallback] = useState("");

  const summarize = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    setResult(null);
    setRawFallback("");
    const system =
      "You are a precise meeting-notes summarizer for busy professionals. You always respond with valid JSON only, no markdown fences, no commentary, matching exactly this schema: {\"summary\": string, \"keyPoints\": string[], \"decisions\": string[], \"actionItems\": [{\"task\": string, \"owner\": string, \"deadline\": string}]}. If owner or deadline is not mentioned, use \"Not specified\".";
    const user = `Summarize these raw meeting notes into the required JSON schema. Be concise and only include what is actually stated.

Meeting notes:
"""${notes}"""`;
    try {
      const text = await callClaude(system, user);
      const clean = stripJsonFence(text);
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setRawFallback("Could not structure the summary automatically. Please try again with more detailed notes.");
    }
    setLoading(false);
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Feature 02"
        title="Meeting Notes Summarizer"
        description="Paste raw, messy meeting notes — get key points, decisions, and action items with owners and deadlines pulled out automatically."
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <Label>Raw meeting notes</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your meeting notes or transcript here…"
            rows={12}
            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none"
            style={inputStyle}
          />
          <div className="mt-4">
            <PrimaryButton onClick={summarize} disabled={loading || !notes.trim()} icon={Sparkles}>
              Summarize notes
            </PrimaryButton>
          </div>
        </Card>

        <Card>
          <span className="text-xs font-semibold uppercase tracking-wide block mb-3" style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}>
            Summary
          </span>
          <OutputPanel loading={loading} empty={!result && !rawFallback} emptyText="Your structured summary will appear here.">
            {rawFallback ? (
              <div className="text-sm p-4 rounded-xl" style={{ background: "#FFF7E8", color: "#8A5A0C", fontFamily: "Inter, sans-serif" }}>
                {rawFallback}
              </div>
            ) : result ? (
              <div className="space-y-5" style={{ fontFamily: "Inter, sans-serif" }}>
                <div>
                  <p className="text-sm leading-relaxed" style={{ color: "#171A21" }}>
                    {result.summary}
                  </p>
                </div>
                {result.keyPoints?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#0F9B8E" }}>
                      Key points
                    </h4>
                    <ul className="space-y-1.5">
                      {result.keyPoints.map((p, i) => (
                        <li key={i} className="text-sm flex gap-2" style={{ color: "#171A21" }}>
                          <ChevronRight size={14} className="mt-0.5 shrink-0" style={{ color: "#0F9B8E" }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.decisions?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#0F9B8E" }}>
                      Decisions
                    </h4>
                    <ul className="space-y-1.5">
                      {result.decisions.map((d, i) => (
                        <li key={i} className="text-sm flex gap-2" style={{ color: "#171A21" }}>
                          <ChevronRight size={14} className="mt-0.5 shrink-0" style={{ color: "#0F9B8E" }} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.actionItems?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#0F9B8E" }}>
                      Action items
                    </h4>
                    <div className="space-y-2">
                      {result.actionItems.map((a, i) => (
                        <div key={i} className="rounded-lg p-3 text-sm" style={{ background: "#F9FAFB", border: "1px solid #E4E6EA" }}>
                          <div className="font-medium" style={{ color: "#171A21" }}>{a.task}</div>
                          <div className="flex gap-4 mt-1 text-xs" style={{ color: "#6B7280" }}>
                            <span>Owner: {a.owner}</span>
                            <span>Due: {a.deadline}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </OutputPanel>
          {result && (
            <div className="mt-4">
              <Disclaimer compact />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   3. AI Task Planner / Scheduler
--------------------------------------------------------- */

const PRIORITY_COLORS = {
  High: { bg: "#FDECEC", text: "#B42318" },
  Medium: { bg: "#FFF7E8", text: "#8A5A0C" },
  Low: { bg: "#E4F5F3", text: "#0F6E64" },
};

function TaskPlanner() {
  const [tasks, setTasks] = useState("");
  const [horizon, setHorizon] = useState("Today");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rawFallback, setRawFallback] = useState("");

  const plan = async () => {
    if (!tasks.trim()) return;
    setLoading(true);
    setResult(null);
    setRawFallback("");
    const system =
      "You are an AI task planner for a working professional. You always respond with valid JSON only, no markdown fences, no commentary, matching exactly this schema: {\"plan\": [{\"task\": string, \"priority\": \"High\"|\"Medium\"|\"Low\", \"suggestedTime\": string, \"reason\": string}], \"tip\": string}. Order the plan array by priority, highest first.";
    const user = `Build a structured, prioritized ${horizon.toLowerCase()} plan from this task list. Consider urgency and importance, and suggest realistic time blocks.

Tasks:
"""${tasks}"""`;
    try {
      const text = await callClaude(system, user);
      const clean = stripJsonFence(text);
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setRawFallback("Could not build a structured plan automatically. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Feature 03"
        title="AI Task Planner"
        description="Dump your task list — get it prioritized, time-blocked, and reasoned through in seconds."
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <Label>List your tasks (one per line)</Label>
          <textarea
            value={tasks}
            onChange={(e) => setTasks(e.target.value)}
            placeholder={"e.g.\nReconcile petty cash float\nRespond to auditor query\nDraft cover letter for Gravan role\nBook UNISA exam slot"}
            rows={9}
            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none"
            style={inputStyle}
          />
          <div className="mt-4">
            <Label>Planning horizon</Label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inputStyle}
            >
              <option>Today</option>
              <option>This week</option>
            </select>
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={plan} disabled={loading || !tasks.trim()} icon={Sparkles}>
              Build plan
            </PrimaryButton>
          </div>
        </Card>

        <Card>
          <span className="text-xs font-semibold uppercase tracking-wide block mb-3" style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}>
            Prioritized plan
          </span>
          <OutputPanel loading={loading} empty={!result && !rawFallback} emptyText="Your prioritized plan will appear here.">
            {rawFallback ? (
              <div className="text-sm p-4 rounded-xl" style={{ background: "#FFF7E8", color: "#8A5A0C", fontFamily: "Inter, sans-serif" }}>
                {rawFallback}
              </div>
            ) : result ? (
              <div style={{ fontFamily: "Inter, sans-serif" }}>
                <div className="space-y-2">
                  {result.plan?.map((t, i) => {
                    const c = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.Medium;
                    return (
                      <div key={i} className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #E4E6EA" }}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium" style={{ color: "#171A21" }}>{t.task}</span>
                          <span
                            className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: c.bg, color: c.text }}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <div className="text-xs mt-1.5" style={{ color: "#6B7280" }}>
                          {t.suggestedTime} · {t.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {result.tip && (
                  <div className="mt-4 text-xs p-3 rounded-lg" style={{ background: "#E4F5F3", color: "#0F6E64" }}>
                    💡 {result.tip}
                  </div>
                )}
              </div>
            ) : null}
          </OutputPanel>
          {result && (
            <div className="mt-4">
              <Disclaimer compact />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   4. AI Research Assistant
--------------------------------------------------------- */

function ResearchAssistant() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const research = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult("");
    const system =
      "You are a research assistant that simplifies complex information for busy professionals. Structure your response with a short plain-language explanation, 3-5 key insights as bullet points (prefix each with '- '), and one practical recommendation at the end prefixed with 'Recommendation: '. Be accurate and concise. If you are not fully certain about a specific fact, say so rather than inventing it.";
    const user = `Summarize and provide key insights and recommendations on the following topic or text:

"""${topic}"""`;
    try {
      const text = await callClaude(system, user);
      setResult(text.trim());
    } catch (e) {
      setResult("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Feature 04"
        title="AI Research Assistant"
        description="Paste an article, report, or just describe a topic — get it simplified into key insights and a practical recommendation."
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <Label>Topic, article text, or question</Label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Summarize the key IFRS 9 impairment requirements relevant to a junior accountant"
            rows={10}
            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none"
            style={inputStyle}
          />
          <div className="mt-4">
            <PrimaryButton onClick={research} disabled={loading || !topic.trim()} icon={Sparkles}>
              Research this
            </PrimaryButton>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}>
              Insights
            </span>
            {result && !loading && <CopyButton text={result} />}
          </div>
          <OutputPanel loading={loading} empty={!result} emptyText="Key insights and a recommendation will appear here.">
            <div
              className="whitespace-pre-wrap text-sm leading-relaxed p-4 rounded-xl"
              style={{ background: "#F9FAFB", color: "#171A21", fontFamily: "Inter, sans-serif", minHeight: "140px" }}
            >
              {result}
            </div>
          </OutputPanel>
          {result && !loading && (
            <div className="mt-3">
              <Disclaimer compact />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   5. AI Chatbot Interface
--------------------------------------------------------- */

function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi — I'm your workplace assistant. Ask me anything about your tasks, emails, or work questions." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const system =
      "You are a helpful, concise workplace productivity assistant embedded in a professional dashboard. Keep answers practical and to the point. If asked something outside a professional/workplace context, gently redirect.";
    try {
      const historyText = newMessages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");
      const text = await callClaude(system, historyText);
      setMessages((prev) => [...prev, { role: "assistant", content: text.trim() }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        eyebrow="Feature 05"
        title="AI Chatbot"
        description="An interactive assistant for quick workplace questions, on demand."
      />
      <Card className="flex flex-col flex-1 min-h-[420px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4" style={{ maxHeight: "440px" }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: m.role === "user" ? "#14203A" : "#F0F2F5",
                  color: m.role === "user" ? "#FFFFFF" : "#171A21",
                  fontFamily: "Inter, sans-serif",
                  borderBottomRightRadius: m.role === "user" ? "4px" : "16px",
                  borderBottomLeftRadius: m.role === "user" ? "16px" : "4px",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3" style={{ background: "#F0F2F5", borderBottomLeftRadius: "4px" }}>
                <TypingDots />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid #E4E6EA" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a work question…"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={inputStyle}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="rounded-xl px-4 flex items-center justify-center disabled:opacity-50"
            style={{ background: "#0F9B8E", color: "#FFFFFF" }}
          >
            <Send size={16} />
          </button>
        </div>
      </Card>
      <div className="mt-4">
        <Disclaimer compact />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Dashboard
--------------------------------------------------------- */

function Dashboard({ setTab }) {
  const cards = [
    { key: "email", label: "Smart Email Generator", desc: "Draft context-aware emails in any tone.", icon: Mail },
    { key: "meetings", label: "Meeting Notes Summarizer", desc: "Turn raw notes into decisions and actions.", icon: FileText },
    { key: "planner", label: "AI Task Planner", desc: "Prioritize and time-block your day.", icon: ListChecks },
    { key: "research", label: "AI Research Assistant", desc: "Simplify topics into key insights.", icon: Search },
    { key: "chat", label: "AI Chatbot", desc: "Ask quick workplace questions.", icon: MessageSquare },
  ];
  return (
    <div>
      <SectionHeader
        eyebrow="Dashboard"
        title="Good to see you."
        description="Five tools, one goal: less time on repetitive admin, more time on the work that matters."
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => setTab(c.key)}
            className="text-left rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
            style={{ background: "#FFFFFF", borderColor: "#E4E6EA" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "#E4F5F3", color: "#0F9B8E" }}
            >
              <c.icon size={18} />
            </div>
            <h3 className="font-semibold text-sm mb-1" style={{ color: "#14203A", fontFamily: "Sora, sans-serif" }}>
              {c.label}
            </h3>
            <p className="text-xs" style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}>
              {c.desc}
            </p>
            <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: "#0F9B8E" }}>
              Open <ChevronRight size={13} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   App shell
--------------------------------------------------------- */

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "email", label: "Email Generator", icon: Mail },
  { key: "meetings", label: "Meeting Summarizer", icon: FileText },
  { key: "planner", label: "Task Planner", icon: ListChecks },
  { key: "research", label: "Research Assistant", icon: Search },
  { key: "chat", label: "Chatbot", icon: MessageSquare },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderTab = () => {
    switch (tab) {
      case "email":
        return <EmailGenerator />;
      case "meetings":
        return <MeetingSummarizer />;
      case "planner":
        return <TaskPlanner />;
      case "research":
        return <ResearchAssistant />;
      case "chat":
        return <Chatbot />;
      default:
        return <Dashboard setTab={setTab} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F5F7" }}>
      <style>{`
        ${FONT_IMPORT}
        @keyframes assistantPulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
        * { box-sizing: border-box; }
        ::selection { background: #0F9B8E; color: white; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 h-screen w-64 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "#14203A" }}
      >
        <div className="px-6 py-6 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#0F9B8E" }}
          >
            <Sparkles size={16} color="#fff" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "Sora, sans-serif" }}>
              Workplace Assistant
            </div>
            <div className="text-[11px]" style={{ color: "#8B96AE", fontFamily: "Inter, sans-serif" }}>
              AI Productivity Suite
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setTab(item.key);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium relative transition-colors"
                style={{
                  background: active ? "rgba(15,155,142,0.15)" : "transparent",
                  color: active ? "#FFFFFF" : "#9AA5BD",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full"
                    style={{ background: "#0F9B8E" }}
                  />
                )}
                <item.icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: "rgba(255,255,255,0.05)", color: "#9AA5BD", fontFamily: "Inter, sans-serif" }}>
            <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
              <ShieldAlert size={13} /> Responsible AI
            </div>
            Outputs are AI-generated and may require human review before use.
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="flex items-center justify-between px-4 sm:px-8 py-4"
          style={{ background: "#FFFFFF", borderBottom: "1px solid #E4E6EA" }}
        >
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700" />
          </button>
          <div className="text-sm font-medium" style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}>
            {NAV.find((n) => n.key === tab)?.label}
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "#1F3864", fontFamily: "Sora, sans-serif" }}
          >
            You
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">{renderTab()}</div>
        </main>
      </div>
    </div>
  );
}
