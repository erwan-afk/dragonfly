/**
 * Sends an invitation email to a newly created user by triggering
 * Better Auth's forget-password flow. The sendResetPassword callback
 * in auth.ts detects new users (createdAt < 5 min) and sends the
 * appropriate invitation wording instead of the standard reset email.
 */
export async function sendInvitationEmail(email: string): Promise<void> {
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  try {
    await fetch(`${baseUrl}/api/auth/forget-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        redirectTo: `${baseUrl}/reset-password`
      })
    });
  } catch (error) {
    console.error(`Failed to send invitation email to ${email}:`, error);
  }
}
