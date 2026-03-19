import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service';

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messages = await chatService.getChatHistory(req.user.id);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
}

export async function saveMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userMessage, assistantMessage } = req.body as {
      userMessage: string;
      assistantMessage: string;
    };
    await chatService.saveChatMessages(req.user.id, userMessage, assistantMessage);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function clearHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatService.clearChatHistory(req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
