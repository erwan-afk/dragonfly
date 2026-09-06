import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/utils/prisma/client';
import MessagesClient from '@/components/ui/Messages/MessagesClient';

export const dynamic = 'force-dynamic';

export default async function MessagesConversationPage({
  params
}: {
  params: { conversationId: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect(
      `/signin/password_signin?callbackUrl=/messages/${params.conversationId}`
    );
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.conversationId,
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }]
    },
    select: { id: true }
  });

  if (!conversation) {
    notFound();
  }

  return (
    <MessagesClient
      currentUserId={session.user.id}
      initialConversationId={params.conversationId}
    />
  );
}
