import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page, question, answer, comment } = body;

    if (!page || !question || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await prisma.survey_response.create({
      data: {
        page: String(page).slice(0, 255),
        question: String(question).slice(0, 500),
        answer: String(answer).slice(0, 100),
        comment: comment ? String(comment).slice(0, 1000) : null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Survey API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
