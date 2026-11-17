/** Snap to the stop nearest the viewport anchor; never sit between stops. */
export function timelineOffset(stopCentres: readonly number[], viewportAnchor: number): number {
  const first = stopCentres[0];
  if (first === undefined) return 0;
  let nearest = first;
  for (const centre of stopCentres) {
    if (Math.abs(centre - viewportAnchor) < Math.abs(nearest - viewportAnchor)) nearest = centre;
  }
  return nearest - first;
}
