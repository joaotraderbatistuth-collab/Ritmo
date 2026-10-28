// Gerador do "Roteiro de metas" de um ciclo de foco.
// Função PURA (sem banco, sem IA): monta marcos sugeridos a partir da duração, da meta principal,
// das metas secundárias e do nível de rotina. O usuário pode editar, adicionar e apagar depois.

export type RoadmapDuration = 7 | 21 | 40 | 90;
export type RoadmapLevel = 'leve' | 'equilibrado' | 'intensivo';

export interface RoadmapStepDraft {
  title: string;
  description: string;
  targetDay: number; // 1..duração
}

// Dias em que cada marco cai, conforme a duração do ciclo.
const STEP_DAYS: Record<RoadmapDuration, number[]> = {
  7: [1, 3, 5, 7],
  21: [1, 7, 14, 21],
  40: [1, 8, 15, 24, 32, 40],
  90: [1, 14, 30, 45, 60, 75, 90],
};

// Sugestão de dedicação diária à meta (tempo de trabalho focado), só como ponto de partida.
const DAILY_TIME: Record<RoadmapLevel, string> = {
  leve: '15 a 25 minutos por dia',
  equilibrado: '30 a 45 minutos por dia',
  intensivo: '60 a 90 minutos por dia',
};

function phaseFor(day: number, total: number): { name: string; hint: string } {
  const p = day / total;
  if (p <= 0.25) return { name: 'Criar o ritmo', hint: 'foque em repetir o básico todo dia, mesmo que pouco' };
  if (p <= 0.5) return { name: 'Ganhar consistência', hint: 'proteja seus horários e registre o que funcionou' };
  if (p <= 0.75) return { name: 'Subir o nível', hint: 'aumente um pouco a exigência onde estiver confortável' };
  return { name: 'Reta final', hint: 'priorize o que mais aproxima você da meta' };
}

export function isRoadmapDuration(n: number): n is RoadmapDuration {
  return n === 7 || n === 21 || n === 40 || n === 90;
}

export function generateRoadmap(params: {
  mainGoal: string;
  secondaryGoals?: string[];
  durationDays: number;
  routineLevel?: RoadmapLevel;
}): RoadmapStepDraft[] {
  const total = isRoadmapDuration(params.durationDays) ? params.durationDays : (7 as RoadmapDuration);
  const days = STEP_DAYS[isRoadmapDuration(params.durationDays) ? params.durationDays : 7];
  const goal = (params.mainGoal || 'sua meta').trim();
  const level = params.routineLevel || 'equilibrado';
  const secondary = (params.secondaryGoals || []).map((g) => g.trim()).filter(Boolean);

  const last = days.length - 1;
  const middleCount = Math.max(1, days.length - 2);

  return days.map((day, i) => {
    if (i === 0) {
      return {
        title: 'Começar: definir o primeiro passo',
        description: `Escreva o que significa concluir "${goal}", escolha o primeiro passo pequeno e reserve ${DAILY_TIME[level]} para ele.`,
        targetDay: day,
      };
    }
    if (i === last) {
      return {
        title: 'Revisão final do ciclo',
        description: `Compare onde você começou com onde está. O que funcionou? O que muda no próximo ciclo? Defina a próxima meta a partir de "${goal}".`,
        targetDay: day,
      };
    }
    const phase = phaseFor(day, total);
    let description = `Fase "${phase.name}": ${phase.hint}. Avalie seu avanço em "${goal}" e ajuste o plano se a rotina real estiver diferente do previsto.`;
    const attached = secondary.filter((_, j) => j % middleCount === i - 1);
    if (attached.length > 0) description += ` Também avance em: ${attached.join('; ')}.`;
    return { title: `Marco ${i}: ${phase.name}`, description, targetDay: day };
  });
}

export interface RoadmapProgress {
  done: number;
  total: number;
  percent: number;
}

export function roadmapProgress(steps: { done: boolean }[]): RoadmapProgress {
  const total = steps.length;
  const done = steps.filter((s) => s.done).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

// Situação de um marco em relação ao dia atual do ciclo — linguagem sem culpa.
export function stepStatus(step: { done: boolean; targetDay: number }, currentDay: number): 'concluido' | 'hoje' | 'ajustar' | 'proximo' {
  if (step.done) return 'concluido';
  if (step.targetDay === currentDay) return 'hoje';
  if (step.targetDay < currentDay) return 'ajustar';
  return 'proximo';
}
