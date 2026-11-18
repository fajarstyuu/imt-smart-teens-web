/** Explicit Rust v1 wire DTOs. Editor keys never enter student projections. */
export type AssessmentKind='pre_test'|'quiz'|'post_test';
export type JourneyStage='pre_test'|'lessons'|'calculator'|'post_test'|'completed';
export interface LessonQuizView {lesson_id:string;lesson_version_id:string;question:string;options:{id:string;text:string}[];first_answer_option_id:string|null;attempt_count:number;revision:number;mastered:boolean}
export interface LessonQuizAnswerResult {lesson_id:string;lesson_version_id:string;selected_option_id:string;correct:boolean;feedback:string|null;first_answer_option_id:string;attempt_count:number;revision:number;mastered:boolean;progress:Progress}

export interface Profile {student:{id:string;name:string};enrollment:Enrollment}
export interface Enrollment {id:string;school_id:string;school_name_at_enrollment:string;form_date:string;path_version_id:string;created_at:string;completed_at:string|null}
export interface Admin {id:string;name:string;email:string;can_manage_schools:boolean;can_manage_content:boolean;school_ids:string[]}
export interface PublicSchool {id:string;name:string}
export interface School extends PublicSchool {status:'active'|'archived';revision:number;created_at:string;updated_at:string;archived_at:string|null}
export interface LessonMeta {lesson_id:string;lesson_version_id:string;title:string;position:number;opened_at:string|null;reading_completed_at:string|null;completed_at:string|null}
export interface Progress {enrollment_id:string;path_version_id:string;current_stage:JourneyStage;stages:{id:JourneyStage;status:'locked'|'in_progress'|'completed';locked_reason:string|null}[];lessons:(LessonMeta&{status:'locked'|'not_started'|'in_progress'|'completed'})[];active_attempt_ids:Partial<Record<AssessmentKind,string>>;latest_measurement_id:string|null}
export interface LessonBody extends LessonMeta {description:string;sections:{id:string;title:string;body:string;required:boolean;position:number}[];visited_section_ids:string[]}
export interface SavedAnswer {snapshot_question_id:string;option_ids:string[];revision:number;saved_at:string|null}
export interface AttemptDto {id:string;assessment_type:AssessmentKind;attempt_number:number;status:'in_progress'|'submitted';snapshot_id:string;submitted_at:string|null;score:number|null;questions:{id:string;question_id:string;question_version_id:string;position:number;text:string;type:'single'|'multiple';required:boolean;options:{id:string;text:string}[]}[];answers:SavedAnswer[]}
export interface MeasurementDto {id:string;weight_kg:number;height_cm:number;bmi:number;bmi_display:string;calculation_rule_version:string;created_at:string}
export interface Version {id:string;version:number;published_at:string}
export interface SectionDraft {id:string;title:string;body:string;required:boolean}
export interface LessonQuizDraft {text:string;options:{id:string;text:string}[];correct_option_id:string|null}
export interface LessonDraft {title:string;description:string;sections:SectionDraft[];quiz?:LessonQuizDraft|null}
export interface LessonEditor {id:string;state:'draft'|'published'|'archived';revision:number;position:number|null;draft:LessonDraft;versions:Version[]}
export interface QuestionDraft {text:string;type:'single'|'multiple';options:{id:string;text:string}[];correct_option_ids:string[];required:true}
export interface QuestionEditor {id:string;bank_id:string;state:'draft'|'published'|'archived';revision:number;position:number;draft:QuestionDraft;versions:Version[]}
export interface BankEditor {id:string;kind:'paired'|'quiz';state:'draft'|'published'|'archived';revision:number;versions:Version[]}
export interface PathEditor {id:string;revision:number;lesson_ids:string[];paired_bank_id:string;quiz_bank_id:string|null;versions:Version[];published:{id:string;version:number;paired_bank_version_id:string;quiz_bank_version_id:string|null;lessons:{lesson_id:string;lesson_version_id:string;position:number}[]}|null}
export interface StudentSummary {pre_test_score:number|null;post_test_score:number|null;latest_activity_at:string;student_id:string;name:string;enrollment_id:string;school_id:string;school_name_at_enrollment:string;form_date:string;path_version_id:string;created_at:string;completed_at:string|null;current_stage:JourneyStage;latest_submitted_at:string|null}
export interface AttemptSummary {id:string;snapshot_id:string;assessment_type:AssessmentKind;attempt_number:number;status:'in_progress'|'submitted';created_at:string;submitted_at:string|null;earned_points:number|null;max_points:number|null;score_percent:number|null}
export interface LessonQuizReport {lesson_id:string;lesson_version_id:string;lesson_title:string;question:string;options:{id:string;text:string}[];first_answer:{id:string;text:string}|null;attempt_count:number;status:'not_started'|'retry_required'|'mastered'}
export interface StudentResults extends Profile {current_stage:JourneyStage;latest_submitted_at:string|null;attempts:AttemptSummary[];lessons:LessonMeta[];lesson_quizzes:LessonQuizReport[];measurements:MeasurementDto[]}
export interface QuestionAnswer {student_id:string;student_name:string;enrollment_id:string;school_id:string;school_name_at_enrollment:string;bank_id:string;bank_version_id:string;snapshot_id:string;snapshot_question_id:string;question_id:string;question_version_id:string;position:number;text:string;type:'single'|'multiple';assessment_type:AssessmentKind;attempt_id:string|null;attempt_number:number|null;attempt_status:'in_progress'|'submitted'|null;answer_revision:number|null;saved_at:string|null;submitted_at:string|null;options:{id:string;text:string}[];selected_option_ids:string[];selected_options:{id:string;text:string}[];answer_state:'not_started'|'unanswered'|'answered'|'incorrect'|'correct';correctness:boolean|null;earned_points:number|null;max_points:number}
