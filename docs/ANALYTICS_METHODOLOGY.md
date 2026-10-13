# Explainable Analytics & Risk Methodology

## 1. Student Success Score (0 – 100)

### Configurable Component Weights
The score calculates a composite institutional support index initially weighted across 6 components:
- **Academic Performance**: 30% (`weight_academic = 0.30`)
- **Attendance Record**: 20% (`weight_attendance = 0.20`)
- **LMS & Learning Activity**: 10% (`weight_lms = 0.10`)
- **Extracurricular Engagement**: 10% (`weight_extracurricular = 0.10`)
- **Placement Readiness**: 20% (`weight_placement = 0.20`)
- **Skills & Faculty Feedback**: 10% (`weight_skills = 0.10`)
- **Total**: 100% (1.00)

### Missing-Data Handling Philosophy
**Critical Rule**: Missing records never automatically count as zero.

When one or more components are not recorded, the scoring engine dynamically renormalizes the available weights:
$$\text{Weight}_{\text{norm}, i} = \frac{\text{Configured Weight}_i}{\sum_{j \in \text{Available}} \text{Configured Weight}_j}$$

$$\text{Overall Score} = \sum_{i \in \text{Available}} \text{Component Score}_i \times \text{Weight}_{\text{norm}, i}$$

- **Data Completeness**:
  $$\text{Completeness} = \frac{\sum_{j \in \text{Available}} \text{Configured Weight}_j}{\sum_{\text{All}} \text{Configured Weight}_k} \times 100\%$$
- If completeness is below 100%, the score is marked `is_provisional = True`.
- Missing fields are explicitly cataloged in `missing_components` and surfaced to the student with recommendations to record required metrics.

## 2. Explainable At-Risk Detection

The at-risk engine evaluates clear, transparent indicators without black-box inference:

1. **Attendance Deficiencies**:
   - `attendance_pct < 65%`: Flagged as `High` risk (`severe_attendance_drop`).
   - `attendance_pct < 75%`: Flagged as `Medium` risk (`attendance_shortage`).
   - `consecutive_absences >= 3`: Flagged as `High` risk priority.
2. **Missing Course Assignments**:
   - `missing_assignments_count >= 3`: Flagged as `Medium` / `High` risk (`assignment_delinquency`).
3. **Academic Assessment Performance**:
   - `recent_average < 50%`: Flagged as `Critical` / `High` risk (`academic_decline`).
   - `recent_average < 60%`: Flagged as `Medium` risk (`academic_improvement_needed`).

### Intervention Lifecycle
$$\text{DATA} \longrightarrow \text{INDICATORS} \longrightarrow \text{RISK ALERT} \longrightarrow \text{STAFF REVIEW} \longrightarrow \text{INTERVENTION} \longrightarrow \text{FOLLOW-UP} \longrightarrow \text{OUTCOME TRACKING}$$

Faculty and academic coordinators record actions taken (e.g. peer tutoring, office hours) and track observed progress (`improved`, `moderate_progress`, `unresponsive`) with full audit history.
