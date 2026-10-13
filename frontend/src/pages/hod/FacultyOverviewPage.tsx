import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Users, Mail, Building, BookOpen, Award } from 'lucide-react';

export const FacultyOverviewPage: React.FC = () => {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [facList, crsList] = await Promise.all([
          api.users.getFaculty(),
          api.academics.getCourses(),
        ]);
        setFaculty(facList);
        setCourses(crsList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading faculty overview...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-txt-primary">Department Faculty & Teaching Workload</h1>
        <p className="text-xs text-txt-secondary mt-1">
          Faculty profiles, course allocation, office allocations, and academic specializations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {faculty.map((f) => (
          <div key={f.id} className="bg-white p-5 rounded-xl border border-brd shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-txt-primary">{f.full_name}</h3>
                  <p className="text-xs text-brand-blue font-medium mt-0.5">{f.designation}</p>
                </div>
                <Badge variant="neutral">{f.employee_id}</Badge>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-txt-secondary">
                <p className="flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-2 text-txt-muted" />
                  {f.email}
                </p>
                <p className="flex items-center">
                  <Building className="w-3.5 h-3.5 mr-2 text-txt-muted" />
                  Office: {f.office_room || 'Block B'}
                </p>
                <p className="flex items-center">
                  <Award className="w-3.5 h-3.5 mr-2 text-txt-muted" />
                  Specialization: {f.specialization || 'Computer Science'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-brd">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-txt-muted block mb-1.5">
                Active Assigned Courses
              </span>
              <div className="flex flex-wrap gap-1.5">
                {courses.slice(0, 2).map((c) => (
                  <Badge key={c.id} variant="accent">
                    {c.code}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
