import { h } from 'preact';
import render from 'preact-render-to-string';
import { expect, it } from 'vitest';
import SkillTree from '../../src/components/skills/SkillTree';
import type { SkillField } from '../../src/lib/skills/schema';

it('renders one unique aria-controls target for every globally unique field ID', () => {
  const fields: SkillField[] = [
    {
      id: 'a-b',
      label: '첫 분야',
      children: [{
        id: 'c',
        label: '첫 하위 분야',
        children: [{ id: 'leaf-one', label: '첫 기술', status: 'planned', related: [] }],
      }],
    },
    {
      id: 'a',
      label: '둘째 분야',
      children: [{
        id: 'b-c',
        label: '둘째 하위 분야',
        children: [{ id: 'leaf-two', label: '둘째 기술', status: 'learning', related: [] }],
      }],
    },
  ];
  const html = render(h(SkillTree, {
    fields,
    progress: { mastered: 0, learning: 1, planned: 1, percent: 25 },
    relatedDocuments: {},
  }));
  const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1]);
  const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]));

  expect(new Set(controls).size).toBe(controls.length);
  expect(controls.every((control) => ids.has(control))).toBe(true);
});
