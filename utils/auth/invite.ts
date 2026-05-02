// Module-level set shared across requests in the same Node.js process.
// Flagging an email here before calling forget-password lets sendResetPassword
// in auth.ts detect it's an invitation (not a user-initiated reset) reliably,
// without depending on a time window.
const pendingInvitations = new Set<string>();

export function isInvitation(email: string): boolean {
  return pendingInvitations.has(email.toLowerCase());
}

export async function sendInvitationEmail(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  pendingInvitations.add(normalized);
  // Clean up after 60s — well beyond the time needed for the HTTP round-trip
  setTimeout(() => pendingInvitations.delete(normalized), 60_000);

  try {
    await fetch(`${baseUrl}/api/auth/forget-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalized,
        redirectTo: `${baseUrl}/reset-password`
      })
    });
  } catch (error) {
    console.error(`Failed to send invitation email to ${normalized}:`, error);
    pendingInvitations.delete(normalized);
  }
}
