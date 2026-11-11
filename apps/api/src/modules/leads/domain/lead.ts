export type LeadStatus = 'NEW' | 'IN_REVIEW' | 'CONTACTED' | 'QUOTED' | 'CLOSED';

/** The public form has a hidden `website` field that real users never fill in. */
export function isHoneypotTriggered(website: string | undefined): boolean {
  return website !== undefined && website.trim() !== '';
}
