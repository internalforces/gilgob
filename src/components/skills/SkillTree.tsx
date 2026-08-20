/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import type {
  SkillField,
  SkillNode,
  SkillProgress,
  SkillStatus,
} from '../../lib/skills/tree';
import { calculateFieldProgress } from '../../lib/skills/progress';

export interface RelatedSkillDocument {
  id: string;
  title: string;
  href: string;
}

interface SkillTreeProps {
  fields: SkillField[];
  progress: SkillProgress;
  relatedDocuments: Record<string, RelatedSkillDocument>;
}

const STATUS_LABELS: Record<SkillStatus, string> = {
  mastered: '습득',
  learning: '학습 중',
  planned: '예정',
};

export default function SkillTree({ fields, progress, relatedDocuments }: SkillTreeProps) {
  return (
    <section class="skill-tree" aria-labelledby="skill-tree-title">
      <div class="skill-tree__summary">
        <div>
          <h2 id="skill-tree-title">전체 진척</h2>
          <p>글의 수가 아니라 각 기술에 명시한 현재 상태를 반영합니다.</p>
        </div>
        <ProgressMeter progress={progress} label="전체 스킬 진척도" prominent />
      </div>

      <dl class="skill-tree__legend" aria-label="스킬 상태 요약">
        <div><dt>습득</dt><dd>{progress.mastered}</dd></div>
        <div><dt>학습 중</dt><dd>{progress.learning}</dd></div>
        <div><dt>예정</dt><dd>{progress.planned}</dd></div>
      </dl>

      <ul class="skill-tree__root">
        {fields.map((field) => (
          <FieldItem
            key={field.id}
            field={field}
            relatedDocuments={relatedDocuments}
            level={0}
          />
        ))}
      </ul>
    </section>
  );
}

interface FieldItemProps {
  field: SkillField;
  relatedDocuments: Record<string, RelatedSkillDocument>;
  level: number;
}

function FieldItem({ field, relatedDocuments, level }: FieldItemProps) {
  const [expanded, setExpanded] = useState(true);
  const progress = calculateFieldProgress(field);
  const childId = `skill-field-${field.id}`;

  return (
    <li class={`skill-field skill-field--level-${level}`}>
      <div class="skill-field__header">
        <button
          class="skill-field__disclosure"
          type="button"
          aria-expanded={expanded}
          aria-controls={childId}
          aria-label={`${field.label} 분야 ${expanded ? '접기' : '펼치기'}`}
          onClick={() => setExpanded((current) => !current)}
        >
          <span class="skill-field__marker" aria-hidden="true"></span>
          <span class="skill-field__label">{field.label}</span>
          <span class="skill-field__count">{progress.mastered + progress.learning + progress.planned}개 기술</span>
          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
            <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <ProgressMeter progress={progress} label={`${field.label} 분야 진척도`} />
      </div>

      <ul id={childId} class="skill-field__children" hidden={!expanded}>
        {field.children.map((child) => (
          'children' in child ? (
            <FieldItem
              key={child.id}
              field={child}
              relatedDocuments={relatedDocuments}
              level={level + 1}
            />
          ) : (
            <SkillItem key={child.id} skill={child} relatedDocuments={relatedDocuments} />
          )
        ))}
      </ul>
    </li>
  );
}

function SkillItem({
  skill,
  relatedDocuments,
}: {
  skill: SkillNode;
  relatedDocuments: Record<string, RelatedSkillDocument>;
}) {
  return (
    <li class="skill-node">
      <div class="skill-node__line">
        <span class="skill-node__label">{skill.label}</span>
        <span class={`skill-node__status skill-node__status--${skill.status}`}>
          <span aria-hidden="true"></span>
          {STATUS_LABELS[skill.status]}
        </span>
      </div>
      {skill.related.length > 0 && (
        <ul class="skill-node__related" aria-label={`${skill.label} 관련 지식`}>
          {skill.related.map((relatedId) => {
            const document = relatedDocuments[relatedId];
            return (
              <li key={relatedId}>
                <a href={document.href}>{document.title}</a>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function ProgressMeter({
  progress,
  label,
  prominent = false,
}: {
  progress: SkillProgress;
  label: string;
  prominent?: boolean;
}) {
  return (
    <div class={`skill-progress${prominent ? ' skill-progress--prominent' : ''}`}>
      <span class="skill-progress__value" aria-hidden="true">{progress.percent}%</span>
      <div
        class="skill-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
      >
        <span style={{ '--skill-progress': `${progress.percent}%` }}></span>
      </div>
    </div>
  );
}
