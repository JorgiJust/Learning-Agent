import { useRef, useState } from 'react';
import '../../components/exams/ExamForm.css';
import '../../components/shared/Toast.css';
import { ExamForm } from '../../components/exams/ExamForm.tsx';
import { Toast, useToast } from '../../components/shared/Toast';
import { readJSON } from '../../services/storage/localStorage';
import { generateQuestions } from '../../services/exams.service';
import PageTemplate from '../../components/PageTemplate';
import './ExamCreatePage.css';

export default function ExamsCreatePage() {
  const { toasts, pushToast, removeToast } = useToast();
  const formRef = useRef<{ getSnapshot: () => any } | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiHtml, setAiHtml] = useState<string>('');

  const escapeHtml = (s: string) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);

  const handleAIPropose = async () => {
    const snap = formRef.current?.getSnapshot?.();
    const draft = readJSON('exam:draft');
    const data = snap?.values?.subject ? snap.values : draft;

    if (!data) {
      pushToast('Completa y guarda el formulario primero.', 'warn');
      return;
    }

    const total = Number(data.totalQuestions || 0);
    const sum = ['multipleChoice', 'trueFalse', 'analysis', 'openEnded']
      .map(k => Number((data as any)[k] || 0))
      .reduce((a, b) => a + b, 0);

    if (total <= 0) {
      pushToast('Total de preguntas debe ser > 0.', 'error');
      return;
    }
    if (sum !== total) {
      pushToast('La suma de la distribución debe ser igual a Total de preguntas.', 'error');
      return;
    }

    setAiOpen(true);
    setAiHtml('<p>Generando preguntas…</p>');

    try {
      const res = await generateQuestions(data);
      if (!res?.ok) {
        setAiHtml('');
        pushToast('No se pudieron generar preguntas. Revisa el backend y tu API key.', 'error');
        return;
      }

      const qs = res.data?.questions || {};
      const renderList = (title: string, arr: any[] = []) =>
        `<h4 class="ai-title">${escapeHtml(title)} <small>(${arr.length})</small></h4>
         <ol class="ai-list">
           ${arr.map((q: any) =>
            `<li>
                ${escapeHtml(q.text || '')}
                ${q.options?.length ? `<ul class="ai-options">${q.options.map((o: string) => `<li>${escapeHtml(o)}</li>`).join('')}</ul>` : ''}
              </li>`
          ).join('')}
         </ol>`;

      const html = [
        renderList('Opción múltiple', qs.multiple_choice),
        renderList('Verdadero/Falso', qs.true_false),
        renderList('Análisis abierto', qs.open_analysis),
        renderList('Ejercicio abierto', qs.open_exercise),
      ].join('');

      setAiHtml(html);
    } catch (e) {
      setAiHtml('');
      pushToast('Error inesperado generando preguntas.', 'error');
    }
  };

  return (
    <PageTemplate
      title="Exámenes"
      subtitle="Creador de exámenes"
      user={{
        name: "Nora Watson",
        role: "Sales Manager",
        avatarUrl: "https://i.pravatar.cc/128?img=5",
      }}
      actions={
        <div className="flex gap-2">
          <button className="btn btn-secondary" data-action="add">Añadir</button>
          <button
            className="btn btn-primary"
            data-action="ai"
            onClick={() => setAiOpen(true)}
          >
            Generar examen IA uwu
          </button>
        </div>
      }
      alwaysShowActions={true}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Exámenes", href: "/exam" },
        { label: "Crear", href: "/exams/create" },
      ]}
    >
      <div
        className="pantalla-scroll w-full lg:max-w-6xl lg:mx-auto space-y-4 sm:space-y-6"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 24px",
        }}
      >
  <section className="card">
          <h2>Crear nuevo examen</h2>
          <ExamForm ref={formRef} onToast={pushToast} />
        </section>

        {aiOpen && (
          <section className="card">
            <h2>Generador IA (Sprint 2)</h2>
            <p>
              🚧 En construcción 🚧 <br />
              El DevTeam estará estresado por esto en el Sprint 2.
            </p>
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <button className="btn btn-primary" onClick={handleAIPropose}>Generar</button>
              <button className="btn btn-outline" onClick={() => setAiOpen(true)}>👀 Previsualizar IA</button>
              <button
                className="btn btn-secondary"
                onClick={() => { setAiOpen(false); setAiHtml(''); }}
              >
                Cerrar
              </button>
            </div>
            <div className="ai-results" dangerouslySetInnerHTML={{ __html: aiHtml }} />
          </section>
        )}

        {toasts.map(t => (
          <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </PageTemplate>
  );
}
