/** Application-facing services. Cookie authorization always remains a server decision. */
import type { Bootstrap, Identity, Student, AssessmentType, Attempt, Teacher } from '../domain/types';
import type { SavedAnswer,PublicSchool,LessonQuizView,LessonQuizAnswerResult } from './dto';
import type { Page } from './http';
export interface StudentRepository {
 register(identity:Identity):Promise<Student>; signOut():Promise<void>; refresh():Promise<Student>;
 attempt(type:AssessmentType):Promise<Attempt>;
 saveAnswer(type:AssessmentType,questionId:string,revision:number,value:string[]):Promise<SavedAnswer>;
 submit(type:AssessmentType):Promise<Student>;
 loadLesson(id:string):Promise<Student>; visitLesson(id:string,sectionId?:string):Promise<Student>; completeLesson(id:string):Promise<Student>;
 lessonQuiz(id:string):Promise<LessonQuizView>; answerLessonQuiz(id:string,optionId:string,revision:number):Promise<LessonQuizAnswerResult>;
 recordMeasurement(weight:number,height:number):Promise<Student>;
 schools(q:string,offset?:number):Promise<Page<PublicSchool>>;
 pendingEnrollment():Identity|null; enrollmentBlocked():boolean;
}
export interface TeacherRepository {signIn(email:string,password:string):Promise<Teacher>;signOut():Promise<void>}
export interface AppServices {bootstrap():Promise<Bootstrap>;student:StudentRepository;teacher:TeacherRepository}
