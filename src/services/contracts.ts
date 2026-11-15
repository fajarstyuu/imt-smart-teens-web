import type { Bootstrap, Identity, Student, AssessmentType, Attempt, Teacher, StudentResult, ContentData, Lesson, Question } from '../domain/types';
export interface StudentRepository {
  register(identity: Identity): Promise<Student>;
  signOut(): Promise<void>;
  attempt(type: AssessmentType): Promise<Attempt>;
  saveAnswer(type: AssessmentType, questionId: string, version: number, value: string[]): Promise<Student>;
  submit(type: AssessmentType): Promise<Student>;
  visitLesson(id: string, sectionId?: string): Promise<Student>;
  completeLesson(id: string): Promise<Student>;
  recordMeasurement(weight: number, height: number): Promise<Student>;
}
export interface TeacherRepository {
  signIn(email: string, password: string): Promise<Teacher>;
  signOut(): Promise<void>;
  results(): Promise<StudentResult[]>;
  content(): Promise<ContentData>;
  saveLesson(lesson: Lesson): Promise<void>;
  saveQuestion(bank: 'paired' | 'quiz', question: Question): Promise<void>;
  archive(kind: 'lesson' | 'paired' | 'quiz', id: string): Promise<void>;
  reorder(ids: string[]): Promise<void>;
}
export interface AppServices { bootstrap(): Promise<Bootstrap>; student: StudentRepository; teacher: TeacherRepository }
