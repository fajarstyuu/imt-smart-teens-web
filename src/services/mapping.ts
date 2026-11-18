/** Explicit public DTO -> existing visual models. No scoring or stage policy is computed here. */
import type {AttemptDto,MeasurementDto,Profile,Progress} from './dto';
import type {Attempt,AssessmentType,Measurement,Student} from '../domain/types';
export const kind={pre:'pre_test',quiz:'quiz',post:'post_test'} as const;
export const attemptModel=(a:AttemptDto,type:AssessmentType):Attempt=>({id:a.id,type,number:a.attempt_number,submittedAt:a.submitted_at??undefined,score:a.score,questions:a.questions.map(q=>({id:q.id,questionVersionId:q.question_version_id,text:q.text,type:q.type,required:q.required,options:q.options})),answers:Object.fromEntries(a.answers.map(x=>[x.snapshot_question_id,{value:x.option_ids,revision:x.revision,savedAt:x.saved_at??''}]))});
export const measurementModel=(m:MeasurementDto):Measurement=>({id:m.id,weight:m.weight_kg,height:m.height_cm,bmi:m.bmi,bmiDisplay:m.bmi_display,createdAt:m.created_at});
export function studentModel(profile:Profile,p:Progress,attempts:Student['attempts'],measurements:MeasurementDto[]):Student {
 return {id:profile.student.id,enrollmentId:profile.enrollment.id,identity:{name:profile.student.name,school:profile.enrollment.school_name_at_enrollment,date:profile.enrollment.form_date},createdAt:profile.enrollment.created_at,serverProgress:p,attempts,lessons:p.lessons.map(l=>({id:l.lesson_id,versionId:l.lesson_version_id,title:l.title,description:'',order:l.position,sections:[],visited:[],openedAt:l.opened_at??undefined,readingCompletedAt:l.reading_completed_at??undefined,completedAt:l.completed_at??undefined})),measurements:measurements.map(measurementModel),measurement:measurements[0]?measurementModel(measurements[0]):undefined};
}
