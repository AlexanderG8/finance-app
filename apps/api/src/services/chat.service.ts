import { prisma } from '../lib/prisma';

export async function getChatHistory(userId: string, limit = 50) {
  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  return messages;
}

export async function saveChatMessages(
  userId: string,
  userContent: string,
  assistantContent: string
): Promise<void> {
  await prisma.$transaction([
    prisma.chatMessage.create({
      data: { userId, role: 'user', content: userContent },
    }),
    prisma.chatMessage.create({
      data: { userId, role: 'assistant', content: assistantContent },
    }),
  ]);
}

export async function clearChatHistory(userId: string): Promise<void> {
  await prisma.chatMessage.deleteMany({ where: { userId } });
}
