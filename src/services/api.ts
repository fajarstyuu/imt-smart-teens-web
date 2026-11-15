import type { AppServices } from './contracts';
import type { Bootstrap, Student, Teacher } from '../domain/types';
import { request, token } from './http';
export const api: AppServices = {
  async bootstrap() { const data = await request<Bootstrap>('/bootstrap'); if(token.get('teacher')) { try { data.teacher = await request<Teacher>('/teacher/me','GET',undefined,'teacher'); } catch { token.set('teacher',''); } } return data; },
  student: {
    async register(identity) { const data = await request<{token:string;student:Student}>('/students', 'POST', identity); token.set('student',data.token); return data.student; },
    async signOut() { try { await request('/logout','POST'); } finally {token.set('student','');} },
    attempt: type => request(`/attempts/${type}`, 'POST'),
    saveAnswer: (type, questionId, version, value) => request(`/attempts/${type}/answers`,'PUT',{questionId,version,value}),
    submit: type => request(`/attempts/${type}/submit`,'POST'),
    visitLesson: (id, sectionId) => request(`/lessons/${id}/visit`,'POST',{sectionId}),
    completeLesson: id => request(`/lessons/${id}/complete`,'POST'),
    recordMeasurement: (weight,height) => request('/measurement','POST',{weight,height})
  },
  teacher: {
    async signIn(email,password) { const data = await request<{token:string;teacher:Teacher}>('/teacher/login','POST',{email,password},'teacher'); token.set('teacher',data.token); return data.teacher; },
    async signOut() { try { await request('/logout','POST',undefined,'teacher'); } finally {token.set('teacher','');} },
    results: () => request('/teacher/results','GET',undefined,'teacher'),
    content: () => request('/teacher/content','GET',undefined,'teacher'),
    saveLesson: lesson => request('/teacher/lessons','PUT',lesson,'teacher'),
    saveQuestion: (bank,question) => request(`/teacher/questions/${bank}`,'PUT',question,'teacher'),
    archive: (kind,id) => request(`/teacher/archive`,'POST',{kind,id},'teacher'),
    reorder: ids => request('/teacher/order','PUT',{ids},'teacher')
  }
};
