/** Returns a deterministic pastel background + dark text color pair from any string (e.g. UserID). */
export function getAvatarColor(id: string): { backgroundColor: string; color: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    backgroundColor: `hsl(${hue}, 55%, 82%)`,
    color: `hsl(${hue}, 55%, 25%)`,
  };
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
