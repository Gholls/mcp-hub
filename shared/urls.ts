export function getToolEmbedUrl(id: string, origin = window.location.origin): string {
  return `${origin}/embed/${id}`
}

export function buildResourceUri(id: string, origin = window.location.origin): string {
  return `${origin}/embed/${id}`
}
