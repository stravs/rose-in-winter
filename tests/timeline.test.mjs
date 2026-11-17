import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { timelineOffset } from '../src/domain/timeline.ts';

test('dot stays at Rose in Winter before the timeline reaches the scroll anchor', () => {
  assert.equal(timelineOffset([800, 900, 1100, 1300], 500), 0);
});

test('dot snaps to actual stops rather than moving between them', () => {
  const stops = [100, 180, 300, 390, 550, 620, 800];
  assert.equal(timelineOffset(stops, 220), 80);
  assert.equal(timelineOffset(stops, 245), 200);
  assert.equal(timelineOffset(stops, 500), 450);
  assert.equal(timelineOffset(stops, 1000), 700);
  for (let anchor = 0; anchor <= 1000; anchor++) {
    assert.ok(stops.includes(stops[0] + timelineOffset(stops, anchor)));
  }
});

test('mobile wrapping uses uneven stop spacing and keeps the earlier stop at a tie', () => {
  assert.equal(timelineOffset([100, 210, 420, 580, 810], 440), 320);
  assert.equal(timelineOffset([100, 210, 420, 580, 810], 500), 320);
  assert.equal(timelineOffset([100, 210, 420, 580, 810], 501), 480);
});

test('scrolling upward reverses the jumps; empty and single-stop tracks stay still', () => {
  const offsets = [100, 250, 400, 550, 700].map(first => timelineOffset([first, first + 150, first + 300], 500));
  assert.deepEqual(offsets, [300, 300, 150, 0, 0]);
  assert.equal(timelineOffset([], 500), 0);
  assert.equal(timelineOffset([100], 500), 0);
});

test('each language renders one decorative moving dot and ends at Pokljuka', () => {
  const property = JSON.parse(readFileSync('.data/property.json', 'utf8'));
  for (const prefix of ['', 'sl/', 'de/', 'it/']) {
    const html = readFileSync(`dist/${prefix}index.html`, 'utf8');
    const timeline = html.split('<ol data-location-timeline')[1].split('</ol>')[0];
    assert.equal((timeline.match(/data-timeline-dot/g) ?? []).length, 1);
    assert.equal((timeline.match(/data-timeline-stop/g) ?? []).length, property.nearby.length + 1);
    assert.match(timeline, /data-timeline-dot aria-hidden="true"/);
    const last = timeline.split('<li ').at(-1);
    assert.ok(last.includes('Pokljuka'));
  }
});
