from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

def calculate_student_success_score(
    academic_pct: Optional[float],
    attendance_pct: Optional[float],
    lms_activity_pct: Optional[float] = None,
    extracurricular_pct: Optional[float] = None,
    placement_readiness_pct: Optional[float] = None,
    skills_feedback_pct: Optional[float] = None,
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Calculates explainable student success score (0 - 100).
    Properly handles missing data by renormalizing weights across available components
    rather than treating missing fields as zero.
    """
    if weights is None:
        weights = {
            "academic": 0.30,
            "attendance": 0.20,
            "lms": 0.10,
            "extracurricular": 0.10,
            "placement": 0.20,
            "skills": 0.10
        }

    components = {
        "academic": academic_pct,
        "attendance": attendance_pct,
        "lms": lms_activity_pct,
        "extracurricular": extracurricular_pct,
        "placement": placement_readiness_pct,
        "skills": skills_feedback_pct
    }

    available_components: Dict[str, float] = {}
    missing_components: List[str] = []
    total_configured_weight = sum(weights.values())
    available_weight_sum = 0.0

    for key, value in components.items():
        if value is not None and not (isinstance(value, float) and value != value): # check not NaN
            # Clamp between 0 and 100
            clamped = max(0.0, min(100.0, float(value)))
            available_components[key] = clamped
            available_weight_sum += weights.get(key, 0.0)
        else:
            missing_components.append(key)

    data_completeness = round((available_weight_sum / total_configured_weight) * 100, 1) if total_configured_weight > 0 else 0.0
    is_provisional = len(missing_components) > 0 or data_completeness < 100.0

    if not available_components or available_weight_sum == 0.0:
        return {
            "overall_score": 0.0,
            "data_completeness": 0.0,
            "is_provisional": True,
            "components": {k: None for k in components},
            "missing_components": list(components.keys()),
            "positive_factors": [],
            "negative_factors": ["Insufficient institutional data to calculate valid score."],
            "recommendations": ["Submit academic and attendance records to generate success assessment."],
            "methodology_version": "v1.0",
            "calculated_at": datetime.now(timezone.utc).isoformat()
        }

    # Renormalize weights across available components
    weighted_sum = 0.0
    for key, value in available_components.items():
        renormalized_weight = weights[key] / available_weight_sum
        weighted_sum += value * renormalized_weight

    overall_score = round(weighted_sum, 1)

    positive_factors: List[str] = []
    negative_factors: List[str] = []
    recommendations: List[str] = []

    # Academic factor evaluation
    if "academic" in available_components:
        val = available_components["academic"]
        if val >= 80:
            positive_factors.append(f"Strong academic performance (Average {val}%).")
        elif val < 60:
            negative_factors.append(f"Academic average is below benchmark ({val}%).")
            recommendations.append("Schedule peer tutoring or faculty office hours for challenging subjects.")

    # Attendance factor evaluation
    if "attendance" in available_components:
        val = available_components["attendance"]
        if val >= 85:
            positive_factors.append(f"Consistent class attendance ({val}%).")
        elif val < 75:
            negative_factors.append(f"Attendance is below institutional minimum threshold ({val}% vs 75% required).")
            recommendations.append("Prioritize attending all scheduled lectures to prevent examination disqualification.")

    # Placement readiness factor evaluation
    if "placement" in available_components:
        val = available_components["placement"]
        if val >= 75:
            positive_factors.append(f"High career and placement preparedness ({val}%).")
        elif val < 50:
            negative_factors.append(f"Placement preparation metrics need attention ({val}%).")
            recommendations.append("Engage in mock technical interviews and resume review workshops.")

    # Extracurricular & Skills
    if "extracurricular" in available_components and available_components["extracurricular"] >= 75:
        positive_factors.append("Active extracurricular and leadership involvement.")
    if "skills" in available_components and available_components["skills"] < 60:
        recommendations.append("Enroll in technical skill micro-credentials to boost practical competency.")

    if is_provisional:
        recommendations.append(f"Score is provisional due to missing records in: {', '.join(missing_components)}.")

    return {
        "overall_score": overall_score,
        "data_completeness": data_completeness,
        "is_provisional": is_provisional,
        "components": {
            "academic": available_components.get("academic"),
            "attendance": available_components.get("attendance"),
            "lms": available_components.get("lms"),
            "extracurricular": available_components.get("extracurricular"),
            "placement": available_components.get("placement"),
            "skills": available_components.get("skills")
        },
        "missing_components": missing_components,
        "positive_factors": positive_factors,
        "negative_factors": negative_factors,
        "recommendations": recommendations,
        "methodology_version": "v1.0",
        "calculated_at": datetime.now(timezone.utc).isoformat()
    }
