import { useState } from 'react';
import { Alert, Button, Card, Modal, Radio, Skeleton, Space, Typography, theme } from 'antd';
import { ReloadOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import QuestionCard from '../../components/ai/QuestionCard';
import type { GeneratedQuestion } from '../../services/exams.service';
import { palette } from '../../theme';

const { Title, Text } = Typography;

export type AiResultsProps = {
  subject: string;
  difficulty: string;
  createdAt?: string;
  questions: GeneratedQuestion[];
  loading?: boolean;
  error?: string | null;
  onChange: (q: GeneratedQuestion) => void;
  onRegenerateAll: () => Promise<void> | void;
  onRegenerateOne?: (q: GeneratedQuestion) => Promise<void> | void;
  onAddManual: (type: GeneratedQuestion['type']) => void;
  onSave: () => Promise<void> | void;
};

export default function AiResults({
  subject,
  difficulty,
  createdAt,
  questions,
  loading,
  error,
  onChange,
  onRegenerateAll,
  onRegenerateOne,
  onAddManual,
  onSave,
}: AiResultsProps) {
  const { token } = theme.useToken();
  const [regenLoading, setRegenLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeChoice, setTypeChoice] = useState<GeneratedQuestion['type']>('multiple_choice');

  const total = questions.length;
  const selected = questions.filter(q => q.include).length;

  const mc = questions.filter(q => q.type === 'multiple_choice').length;
  const tf = questions.filter(q => q.type === 'true_false').length;
  const an = questions.filter(q => q.type === 'open_analysis').length;
  const ej = questions.filter(q => q.type === 'open_exercise').length;

  const examInfoStyle = {
    background: token.colorFillTertiary,
    borderLeft: `4px solid ${token.colorPrimary}`,
  } as const;

  const handleRegenerateAll = async () => {
    setRegenLoading(true);
    try {
      await onRegenerateAll();
    } finally {
      setRegenLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await onSave();
    } finally {
      setSaveLoading(false);
    }
  };

  const openTypeModal = () => {
    setTypeChoice('multiple_choice');
    setTypeModalOpen(true);
  };

  const confirmAddManual = () => {
    onAddManual(typeChoice);
    setTypeModalOpen(false);
  };

  return (
    <div className="ai-results-wrap">
      <div className="ai-results card-like">
        <Title level={3} className="!mb-4" style={{ color: token.colorPrimary }}>
          Revisar Examen: <span style={{ color: palette.P0 }}>{subject}</span>
        </Title>

        <div className="flex flex-wrap gap-6 p-4 rounded-md mb-4" style={examInfoStyle}>
          <div className="flex flex-col">
            <Text type="secondary">Materia</Text>
            <Text strong style={{ color: palette.P0 }}>{subject}</Text>
          </div>
          <div className="flex flex-col">
            <Text type="secondary">Total</Text>
            <Text strong>{total}</Text>
          </div>
          <div className="flex flex-col">
            <Text type="secondary">Dificultad</Text>
            <Text strong>{difficulty}</Text>
          </div>
          <div className="flex flex-col">
            <Text type="secondary">Seleccionadas</Text>
            <Text strong>{selected}</Text>
          </div>
          {createdAt && (
            <div className="flex flex-col">
              <Text type="secondary">Fecha de Creación</Text>
              <Text strong>{createdAt}</Text>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Card size="small"><Text strong>MC:</Text> <Text>{mc}</Text></Card>
          <Card size="small"><Text strong>VF:</Text> <Text>{tf}</Text></Card>
          <Card size="small"><Text strong>AN:</Text> <Text>{an}</Text></Card>
          <Card size="small"><Text strong>EJ:</Text> <Text>{ej}</Text></Card>
        </div>

        {error && <Alert type="error" showIcon className="mb-4" message={error} />}
        {loading ? (
          <Card><Skeleton active paragraph={{ rows: 4 }} /></Card>
        ) : (
          <Space direction="vertical" className="w-full">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                index={i}
                question={q}
                onChange={onChange}
                onRegenerate={onRegenerateOne}
              />
            ))}
          </Space>
        )}

        <div className="flex flex-col md:flex-row justify-between gap-3 mt-8">
          <div className="flex gap-2">
            <Button icon={<ReloadOutlined />} loading={regenLoading} onClick={handleRegenerateAll} aria-label="Regenerar Preguntas">
              Regenerar
            </Button>
            <Button icon={<PlusOutlined />} onClick={openTypeModal} aria-label="Añadir Pregunta Manual">
              Añadir manual
            </Button>
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saveLoading}
            onClick={handleSave}
            aria-label="Guardar y Finalizar"
          >
            Guardar y Finalizar
          </Button>
        </div>

        <Modal
          title="Añadir pregunta manual"
          open={typeModalOpen}
          onOk={confirmAddManual}
          onCancel={() => setTypeModalOpen(false)}
          okText="Añadir"
          cancelText="Cancelar"
        >
          <Radio.Group
            value={typeChoice}
            onChange={(e) => setTypeChoice(e.target.value)}
            className="flex flex-col gap-2"
          >
            <Radio value="multiple_choice">Selección múltiple</Radio>
            <Radio value="true_false">Verdadero/Falso</Radio>
            <Radio value="open_analysis">Análisis abierto</Radio>
            <Radio value="open_exercise">Ejercicio abierto</Radio>
          </Radio.Group>
        </Modal>
      </div>
    </div>
  );
}
