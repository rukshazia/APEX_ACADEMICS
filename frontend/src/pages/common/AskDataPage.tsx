import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import {
  HelpCircle,
  Send,
  Sparkles,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Info,
  CornerDownLeft,
} from 'lucide-react';
import { AskDataResponse } from '../../types';

export const AskDataPage: React.FC = () => {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([]);
  const [response, setResponse] = useState<AskDataResponse | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.askData.getSampleQuestions()
      .then(setSampleQuestions)
      .catch(console.error);
  }, []);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;
    setIsAsking(true);
    setError(null);
    try {
      const res = await api.askData.query(q);
      setResponse(res);
      setQuestion(q);
    } catch (err: any) {
      setError(err.message || 'Failed to process natural language query');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-txt-primary">Ask Your Data</h1>
          <Badge variant="accent">Role-Aware Analytics</Badge>
        </div>
        <p className="text-xs text-txt-secondary mt-1">
          Query your institutional data, attendance patterns, and academic metrics using conversational natural language
        </p>
      </div>

      {/* Query Input Card */}
      <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your attendance, course grades, deadlines, or risk queues..."
              className="w-full text-xs p-3.5 border border-brd rounded-xl bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[11px] text-txt-muted flex items-center">
              <Cpu className="w-3.5 h-3.5 mr-1 text-brand-blue" />
              Predefined analytical functions & deterministic fallback active
            </span>
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAsking ? 'Analyzing...' : 'Ask Question'}</span>
            </button>
          </div>
        </form>

        {/* Suggested Role Questions */}
        <div className="pt-3 border-t border-brd">
          <p className="text-[11px] uppercase font-semibold text-txt-muted tracking-wider mb-2">
            Suggested questions for your role:
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAsk(q)}
                className="px-3 py-1.5 text-xs rounded-lg bg-bg-highlight border border-brd hover:border-brand-blue text-txt-primary transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer Narrative Card */}
      {response && (
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brd pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-sage" />
              <h2 className="text-sm font-bold text-txt-primary">Analytics Engine Response</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="neutral">{response.provider}</Badge>
              <Badge variant={response.confidence === 'high' ? 'success' : 'neutral'}>
                Confidence: {response.confidence.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Narrative */}
          <div className="p-4 rounded-xl bg-bg-highlight border border-brd text-xs text-txt-primary leading-relaxed whitespace-pre-line font-medium">
            {response.answer}
          </div>

          {/* Supporting Evidence */}
          {response.evidence && response.evidence.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <p className="text-xs font-semibold text-txt-primary flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-status-success" />
                Supporting Analytical Evidence:
              </p>
              <div className="space-y-1">
                {response.evidence.map((ev, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-brd bg-white text-xs text-txt-secondary">
                    • {ev}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
