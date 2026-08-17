'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SUGGESTED_PROMPTS = [
  'Explain your strongest criticism',
  'How would you invalidate this concern?',
  'What evidence would change your mind?',
  'Which competitor worries you most?',
  'How would an investor react?',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChallengeTheAdvocateProps {
  solutionId?: string;
}

export function ChallengeTheAdvocate({ solutionId }: ChallengeTheAdvocateProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = (textOverride ?? value).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    setValue('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      if (!solutionId) {
        // Fallback demo response if operating without a live solutionId
        setTimeout(() => {
          const lower = textToSend.toLowerCase();
          let reply = 'My prosecution case stands firmly on the evidence outlined. The primary vulnerability remains your unvalidated distribution channel and unit economics assumptions.';

          if (lower.includes('fix') || lower.includes('validate') || lower.includes('change your mind') || lower.includes('evidence')) {
            reply = 'To weaken Charge #01 (Zero Distribution Strategy), you must run a 14-day outbound test targeting 50 cold prospects. If you achieve a CAC < $25 with a conversion rate above 4%, I will formally withdraw that accusation. How do you plan to execute that test?';
          } else if (lower.includes('strongest') || lower.includes('fatal') || lower.includes('criticism')) {
            reply = 'My strongest charge is Charge #01: Distribution Fantasy. Building a product without an owned acquisition channel means paying unsustainably high CAC on ad networks that competitors already dominate.';
          } else if (lower.includes('competitor') || lower.includes('notion') || lower.includes('linear')) {
            reply = 'Competitors like Notion and Linear possess deep distribution moats and existing workflows. Unless your solution offers deep vertical specialization they cannot clone, customers will default to tool consolidation.';
          }

          setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
          setIsLoading(false);
        }, 1000);
        return;
      }

      const res = await fetch('/api/devil-advocate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solutionId,
          message: textToSend,
          history: messages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reach the Advocate.');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setError('The Advocate has no further comments at the moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <Card className="border-rose-500/30 bg-zinc-950/90 p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">😈</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              CHALLENGE THE ADVOCATE
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Disagree with the prosecution? Defend your idea and debate the case.
          </p>
        </div>
        <span className="text-[10px] text-rose-400/90 font-mono bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded self-start sm:self-center">
          Report Grounded
        </span>
      </div>

      {/* Suggested prompt pills */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Suggested questions">
        {SUGGESTED_PROMPTS.map((promptText, i) => (
          <button
            key={i}
            type="button"
            className="text-xs bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 hover:border-rose-500/40 px-3 py-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50"
            onClick={() => void handleSend(promptText)}
            disabled={isLoading}
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Message history */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 py-2 border-t border-b border-zinc-800/80" role="log" aria-label="Conversation history">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-rose-950/40 border border-rose-500/30 text-rose-100 ml-6 sm:ml-12'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 mr-6 sm:mr-12'
              }`}
            >
              <div className="text-[10px] font-mono font-bold mb-1 uppercase tracking-wider text-zinc-400">
                {msg.role === 'user' ? 'Founder (You)' : 'The Advocate'}
              </div>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="p-3 rounded-lg text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 mr-6 sm:mr-12 flex items-center gap-2">
              <span className="text-xs font-mono animate-pulse">The Advocate is reviewing your evidence...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 flex items-center justify-between gap-2" role="alert">
          <p className="text-xs text-rose-300">{error}</p>
          <button
            type="button"
            className="text-xs text-rose-400 underline hover:text-rose-300 cursor-pointer"
            onClick={() => {
              if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
                void handleSend(messages[messages.length - 1].content);
              }
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
        <textarea
          id="challenge-input"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 resize-none"
          placeholder="Challenge a specific charge, ask how to validate, or present counter-evidence..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={isLoading}
          aria-label="Challenge the Advocate input"
        />
        <Button
          id="challenge-send-btn"
          type="button"
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-3 h-auto cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/20"
          onClick={() => void handleSend()}
          disabled={isLoading || !value.trim()}
          aria-label="Send challenge"
        >
          {isLoading ? 'Deliberating...' : 'Challenge'}
        </Button>
      </div>
    </Card>
  );
}
