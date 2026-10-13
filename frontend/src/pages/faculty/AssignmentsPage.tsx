import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  GraduationCap,
  PlusCircle,
  FileCheck,
  CheckCircle,
  Clock,
  Eye,
  Check,
} from 'lucide-react';

export const FacultyAssignmentsPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Assignment Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newCategory, setNewCategory] = useState('Homework');
  const [newMaxMarks, setNewMaxMarks] = useState(100);
  const [newDueDate, setNewDueDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Submissions Modal
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Grading state
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  const loadAssignments = async () => {
    try {
      const [crs, asgs] = await Promise.all([
        api.academics.getCourses(),
        api.academics.getAssignments(),
      ]);
      setCourses(crs);
      if (crs.length > 0 && !newCourseId) setNewCourseId(crs[0].id);
      setAssignments(asgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.academics.createAssignment({
        course_id: newCourseId,
        title: newTitle,
        category: newCategory,
        max_marks: Number(newMaxMarks),
        due_date: newDueDate,
        description: newDescription,
      });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenSubmissions = async (asg: any) => {
    setSelectedAssignment(asg);
    setSubmissionsModalOpen(true);
    setSubmissionsLoading(true);
    try {
      const subs = await api.academics.getSubmissions(asg.id);
      setSubmissions(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleSaveGrade = async (subId: string) => {
    setSavingGrade(true);
    try {
      await api.academics.gradeSubmission(subId, {
        marks_obtained: Number(gradeMarks),
        feedback: gradeFeedback,
      });
      // Refresh submissions
      const updated = await api.academics.getSubmissions(selectedAssignment.id);
      setSubmissions(updated);
      setGradingSubId(null);
      loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Grading failed');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Course Assignments & Submission Grading</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Author assignments, monitor student submissions, and record grades with personalized feedback
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-brand-sage" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignments.map((asg) => (
          <div key={asg.id} className="bg-white p-5 rounded-xl border border-brd shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-brand-blue">{asg.course_code}</span>
                  <h3 className="text-sm font-bold text-txt-primary mt-0.5">{asg.title}</h3>
                </div>
                <Badge variant="accent">{asg.category}</Badge>
              </div>
              <p className="text-xs text-txt-secondary mt-2 line-clamp-3">{asg.description}</p>
              <div className="mt-4 pt-3 border-t border-brd flex items-center justify-between text-[11px] text-txt-muted">
                <span>Due Date: {new Date(asg.due_date).toLocaleDateString()}</span>
                <span>Max Marks: {asg.max_marks}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between border-t border-brd-subtle">
              <span className="text-xs text-txt-secondary">
                Submissions tracked in active cohort
              </span>
              <button
                onClick={() => handleOpenSubmissions(asg)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-highlight border border-brd hover:border-brand-blue text-txt-primary transition-colors flex items-center space-x-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-brand-blue" />
                <span>Review Submissions</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE ASSIGNMENT MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Course Assignment">
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Course</label>
            <select
              required
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Assignment Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Balanced Tree Deletion & Complexity Proofs"
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="Homework">Homework</option>
                <option value="Project">Project</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Max Marks</label>
              <input
                type="number"
                required
                min={1}
                value={newMaxMarks}
                onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Due Date</label>
              <input
                type="date"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Instructions & Guidelines</label>
            <textarea
              rows={4}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Specify requirements, submission format, and rubric..."
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-brd">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-brd text-txt-secondary hover:bg-bg-highlight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Publishing...' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SUBMISSIONS MODAL */}
      <Modal
        isOpen={submissionsModalOpen}
        onClose={() => setSubmissionsModalOpen(false)}
        title={selectedAssignment ? `Submissions: ${selectedAssignment.title}` : ''}
        subtitle={selectedAssignment ? `Max Marks: ${selectedAssignment.max_marks}` : ''}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {submissionsLoading ? (
            <div className="p-6 text-center text-xs text-txt-muted animate-pulse">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="p-6 text-center text-xs text-txt-muted">
              No submissions recorded yet for this assignment.
            </div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="p-4 rounded-xl bg-bg-highlight border border-brd space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-txt-primary">{sub.student_name}</h4>
                    <span className="text-[11px] text-txt-muted">{sub.roll_number} • Submitted: {new Date(sub.submitted_at).toLocaleString()}</span>
                  </div>
                  <Badge variant={sub.status === 'graded' ? 'success' : 'warning'}>
                    {sub.status === 'graded' ? `Score: ${sub.marks_obtained}/${selectedAssignment.max_marks}` : 'Needs Grading'}
                  </Badge>
                </div>

                <div className="p-3 bg-white rounded-lg border border-brd text-xs text-txt-secondary">
                  <p className="font-semibold text-txt-primary mb-1">Submission Content:</p>
                  <p className="whitespace-pre-wrap">{sub.content}</p>
                </div>

                {/* Grading Form Drawer */}
                {gradingSubId === sub.id ? (
                  <div className="p-3 bg-white rounded-lg border border-brand-blue space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-txt-primary mb-1">
                          Marks Obtained (Max: {selectedAssignment.max_marks})
                        </label>
                        <input
                          type="number"
                          max={selectedAssignment.max_marks}
                          min={0}
                          value={gradeMarks}
                          onChange={(e) => setGradeMarks(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-brd rounded bg-bg-main"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-txt-primary mb-1">
                          Feedback / Observations
                        </label>
                        <input
                          type="text"
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                          placeholder="e.g. Well reasoned balance cases."
                          className="w-full text-xs p-2 border border-brd rounded bg-bg-main"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setGradingSubId(null)}
                        className="px-2.5 py-1 text-xs border border-brd rounded text-txt-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveGrade(sub.id)}
                        disabled={savingGrade}
                        className="px-3 py-1 text-xs bg-navy-900 text-white rounded font-medium disabled:opacity-50"
                      >
                        {savingGrade ? 'Saving...' : 'Save Grade'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-2">
                    {sub.feedback && (
                      <span className="text-[11px] text-txt-muted italic">Feedback: "{sub.feedback}"</span>
                    )}
                    <button
                      onClick={() => {
                        setGradingSubId(sub.id);
                        setGradeMarks(sub.marks_obtained || 0);
                        setGradeFeedback(sub.feedback || '');
                      }}
                      className="ml-auto px-3 py-1 text-xs font-medium rounded bg-navy-900 text-white hover:bg-navy-800"
                    >
                      {sub.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
