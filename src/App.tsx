import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useApp } from './hooks/useApp';
import { useNavigation } from './hooks/useNavigation';
import { LoginPage } from './pages/LoginPage';
import { StudentShell } from './components/StudentShell';
import { TeacherShell } from './components/TeacherShell';
import { AssessmentPage } from './pages/AssessmentPage';
import { LearningHome, LessonDetail } from './pages/LearningPages';
import { CalculatorPage } from './pages/CalculatorPage';
import { SummaryPage } from './pages/SummaryPage';
import { AdminSchoolsPage } from './pages/AdminSchoolsPage';
import { TeacherResultsPage } from './pages/TeacherResultsPage';
import { TeacherLessonsPage, TeacherQuestionsPage } from './pages/TeacherContentPages';
import {TeacherPublicationPage} from './pages/TeacherPublicationPage';
import { Brand, Button, ErrorState, LoadingState } from './components/ui';
import { LessonQuizPage } from './pages/LessonQuizPage';
import { currentStage, lessonUnlocked, stageComplete, stageUnlocked, stages } from './domain/learning';
import type { StageId } from './domain/types';

/** Renders a prerequisite message without mounting the protected page content. */
function LockedView({ navigate }: { navigate: (path: string) => void }) {
  const { data } = useApp();
  const stage = data.student ? currentStage(data.student) : null;
  return <div className="locked-view"><LockKeyhole className="od-icon"/><span className="eyebrow">TAHAP TERKUNCI</span><h1>Satu langkah dulu.</h1><p>Selesaikan {stage?.label.toLowerCase() || 'login'} sebelum membuka tahap ini.</p><Button forward onClick={() => navigate(stage?.path || '/')}>Kembali ke {stage?.label || 'halaman masuk'}</Button></div>;
}

/** Replaces legacy hash routes before they become bookmarks in BrowserRouter. */
function LegacyHashRedirect() {
  const hash = window.location.hash;
  if (hash.startsWith('#/')) return <Navigate to={`${hash.slice(1)}${window.location.search}`} replace/>;
  return null;
}

function LegacyAdminRedirect(){const location=useLocation();const suffix=location.pathname.slice('/guru'.length);const target=suffix.startsWith('/soal/')?'/admin/soal':`/admin${suffix||'/hasil'}`;return <Navigate replace to={`${target}${location.search}`}/>;}

type StudentPage = 'home' | 'pre' | 'lesson-list' | 'lesson' | 'lesson-quiz' | 'calculator' | 'post' | 'summary';

/** Enforces identity, assessment, lesson and stage access at the route boundary. */
function StudentRoute({ page }: { page: StudentPage }) {
  const { data } = useApp();
  const { navigate, path } = useNavigation();
  const { lessonId } = useParams();
  const student = data.student;

  if (!student) return <LoginPage navigate={navigate}/>;
  if (!stageComplete(student,'pre')) {
    if (page === 'home' || page === 'pre') return <AssessmentPage key="pre" type="pre" navigate={navigate}/>;
    return <StudentShell path={path} navigate={navigate}><LockedView navigate={navigate}/></StudentShell>;
  }

  const stage: StageId | null = page === 'lesson' || page === 'lesson-list' || page === 'lesson-quiz' ? 'lessons'
    : page === 'calculator' ? 'calculator'
      : page === 'post' ? 'post' : null;
  const locked = (stage !== null && !stageUnlocked(student, stage))
    || ((page === 'lesson' || page === 'lesson-quiz') && !!lessonId && !lessonUnlocked(student, lessonId))
    || (page === 'summary' && !stageComplete(student,'post'));

  if (locked) return <StudentShell path={path} navigate={navigate}><LockedView navigate={navigate}/></StudentShell>;

  const content = page === 'pre' ? <AssessmentPage key="pre" type="pre" navigate={navigate}/>
    : page === 'post' ? <AssessmentPage key="post" type="post" navigate={navigate}/>
        : page === 'calculator' ? <CalculatorPage navigate={navigate}/>
          : page === 'summary' ? <SummaryPage navigate={navigate}/>
            : page === 'lesson' && lessonId ? <LessonDetail key={lessonId} id={lessonId} navigate={navigate}/>
              : <LearningHome navigate={navigate}/>;
  return <StudentShell path={['home', 'lesson-list'].includes(page) ? '/beranda' : path} navigate={navigate}>{content}</StudentShell>;
}

type TeacherPage = 'results' | 'student' | 'lessons' | 'lesson-editor' | 'questions' | 'question-editor' | 'schools' | 'publication';

/** Requires an admin session before any CMS or student-result view can mount. */
function TeacherRoute({ page }: { page: TeacherPage }) {
  const { data } = useApp();
  const { navigate, path } = useNavigation();
  const params = useParams();
  if (!data.teacher) return <LoginPage navigate={navigate} teacher returnTo={path}/>;

  const content = page === 'publication' ? <TeacherPublicationPage navigate={navigate}/> : page === 'schools' ? <AdminSchoolsPage/> : page === 'lessons' || page === 'lesson-editor'
    ? <TeacherLessonsPage editId={page === 'lesson-editor' ? params.editId : undefined} navigate={navigate}/>
    : page === 'questions' || page === 'question-editor'
      ? <TeacherQuestionsPage editId={page === 'question-editor' ? params.editId : undefined} navigate={navigate}/>
      : <TeacherResultsPage selectedId={page === 'student' ? params.studentId : undefined} navigate={navigate}/>;
  return <TeacherShell path={path} navigate={navigate}>{content}</TeacherShell>;
}

/** Shows a clear page-level 404 for URLs outside the declared student and admin contracts. */
function NotFound() {
  const { navigate } = useNavigation();
  return <main className="connection-page"><Brand/><h1>Halaman tidak ditemukan.</h1><p>Alamat yang kamu buka tidak tersedia.</p><Button onClick={() => navigate('/')}>Kembali ke beranda</Button></main>;
}

/** Owns shared loading/error states and declares every supported browser route explicitly. */
export default function App() {
  const { data, loading, error, reload } = useApp();
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    document.title = `${path.startsWith('/admin') ? 'Ruang admin' : 'Pembelajaran siswa'} · ${data.config.brand}`;
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
      const heading = document.querySelector<HTMLElement>('main h1');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    });
    return () => cancelAnimationFrame(frame);
  }, [path, data.config.brand]);

  if (loading) return <div className="boot-screen"><Brand/><LoadingState label="Menyiapkan ruang belajarmu…"/></div>;
  if (error) return <div className="connection-page"><Brand/><h1>Ruang belajar belum terhubung.</h1><ErrorState message={error} retry={() => void reload()}/><p>Versi pengembangan memerlukan layanan data lokal. Jalankan aplikasi sesuai petunjuk README.</p></div>;

  return <>
    <LegacyHashRedirect/>
    <Routes>
      <Route path="/" element={<StudentRoute page="home"/>}/>
      <Route path="/beranda" element={<StudentRoute page="home"/>}/>
      <Route path="/pre-test" element={<StudentRoute page="pre"/>}/>
      <Route path="/materi" element={<StudentRoute page="lesson-list"/>}/>
      <Route path="/materi/:lessonId" element={<StudentRoute page="lesson"/>}/>
      <Route path="/quiz" element={<StudentRoute page="quiz"/>}/>
      <Route path="/kalkulator" element={<StudentRoute page="calculator"/>}/>
      <Route path="/post-test" element={<StudentRoute page="post"/>}/>
      <Route path="/ringkasan" element={<StudentRoute page="summary"/>}/>
      <Route path="/app.html" element={<Navigate to="/" replace/>}/>
      <Route path="/admin/masuk" element={<TeacherRoute page="results"/>}/>
      <Route path="/admin/publikasi" element={<TeacherRoute page="publication"/>}/>
      <Route path="/admin/hasil" element={<TeacherRoute page="results"/>}/>
      <Route path="/admin/hasil/:studentId" element={<TeacherRoute page="student"/>}/>
      <Route path="/admin/materi" element={<TeacherRoute page="lessons"/>}/>
      <Route path="/admin/materi/:editId" element={<TeacherRoute page="lesson-editor"/>}/>
      <Route path="/admin/soal" element={<TeacherRoute page="questions"/>}/>
      <Route path="/admin/soal/:bankId/:editId" element={<TeacherRoute page="question-editor"/>}/>
      <Route path="/admin/sekolah" element={<TeacherRoute page="schools"/>}/>
      <Route path="/guru/*" element={<LegacyAdminRedirect/>}/>
      <Route path="*" element={<NotFound/>}/>
    </Routes>
  </>;
}
