/** Presentation models retain the existing Editorial Campus components; wire DTOs live in services/dto. */
import type { Admin, Progress } from '../services/dto';
export type AssessmentType='pre'|'quiz'|'post';
export type StageId='pre'|'lessons'|'quiz'|'calculator'|'post';
export interface Identity {name:string;school:string;date:string}
export interface Option {id:string;text:string}
export interface Question {id:string;text:string;type:'single'|'multiple';required?:boolean;options:Option[];questionVersionId?:string}
export interface Answer {value:string[];savedAt:string;revision:number}
export interface Attempt {id:string;type:AssessmentType;number:number;questions:Question[];answers:Record<string,Answer>;submittedAt?:string;score?:number|null}
export interface Section {id:string;title:string;body:string;required?:boolean}
export interface Lesson {id:string;title:string;description:string;order:number;sections:Section[];openedAt?:string;completedAt?:string;visited:string[];versionId?:string}
export interface Measurement {id:string;weight:number;height:number;bmi:number;bmiDisplay:string;createdAt:string}
export interface Student {id:string;enrollmentId:string;identity:Identity;lessons:Lesson[];attempts:Partial<Record<AssessmentType,Attempt>>;measurement?:Measurement;measurements:Measurement[];createdAt:string;serverProgress:Progress}
export type Teacher=Admin;
export interface Config {brand:string;program:string;mode:'development'|'production'}
export interface Bootstrap {config:Config;student:Student|null;teacher:Teacher|null}
