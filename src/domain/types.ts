export type AssessmentType = 'pre' | 'quiz' | 'post';
export type StageId = 'pre' | 'lessons' | 'quiz' | 'calculator' | 'post';
export interface Identity { name: string; school: string; date: string }
export interface Option { id: string; text: string }
export interface Question { id: string; version: number; text: string; type: 'single' | 'multiple'; options: Option[]; correct?: string[]; published?: boolean; order?: number }
export interface Answer { value: string[]; savedAt: string }
export interface Attempt { id: string; type: AssessmentType; number: number; questions: Question[]; answers: Record<string, Answer>; submittedAt?: string; score?: number; results?: { questionId: string; correct: boolean; correctOptions: string[] }[] }
export interface Section { id: string; title: string; body: string }
export interface Lesson { id: string; version: number; title: string; description: string; order: number; published: boolean; sections: Section[]; openedAt?: string; completedAt?: string; visited: string[] }
export interface Measurement { weight: number; height: number; bmi: number; createdAt: string }
export interface Student { id: string; identity: Identity; lessons: Lesson[]; attempts: Partial<Record<AssessmentType, Attempt>>; measurement?: Measurement; createdAt: string }
export interface Teacher { name: string; email: string }
export interface Config { brand: string; program: string; mode: 'development' | 'production' }
export interface Bootstrap { config: Config; student: Student | null; teacher: Teacher | null }
export interface StudentResult extends Student { progress: number; stage: string }
export interface ContentData { lessons: Lesson[]; banks: { paired: Question[]; quiz: Question[] } }
