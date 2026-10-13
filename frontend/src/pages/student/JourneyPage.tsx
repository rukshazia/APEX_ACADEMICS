import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import {
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';

export const JourneyPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.analytics.getJourney(user.id)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading chronological journey...</div>;
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <BookOpen className="w-4 h-4 text-brand-blue" />;
      case 'academic':
      case 'grade':
        return <Award className="w-4 h-4 text-brand-sage" />;
      case 'activity':
        return <Sparkles className="w-4 h-4 text-[#B69A65]" />;
      case 'intervention':
        return <HeartHandshake className="w-4 h-4 text-status-warning" />;
      case 'placement':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      default:
        return <Calendar className="w-4 h-4 text-txt-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-txt-primary">Chronological Student Journey</h1>
        <p className="text-xs text-txt-secondary mt-1">
          Milestones, assessment achievements, verified activities, and support history across your academic career
        </p>
      </div>

      {/* Journey Timeline */}
      <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
        {events.length === 0 ? (
          <div className="p-8 text-center text-xs text-txt-muted">No journey milestones logged yet.</div>
        ) : (
          <div className="relative border-l-2 border-brd ml-4 space-y-8 pl-6 my-2">
            {events.map((ev) => (
              <div key={ev.id} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-white border-2 border-brd flex items-center justify-center shadow-subtle group-hover:border-brand-blue transition-colors">
                  {getEventIcon(ev.event_type)}
                </div>

                {/* Event Card */}
                <div className="p-4 rounded-xl bg-bg-highlight/60 border border-brd shadow-subtle hover:bg-bg-highlight transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-bold text-txt-primary">{ev.title}</h3>
                      <Badge variant={ev.severity === 'success' ? 'success' : ev.severity === 'warning' ? 'warning' : 'neutral'}>
                        {ev.event_type.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-txt-muted flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(ev.timestamp).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {ev.description && (
                    <p className="text-xs text-txt-secondary mt-2 leading-relaxed">{ev.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
