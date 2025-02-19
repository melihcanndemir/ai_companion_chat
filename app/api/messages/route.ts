import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Tüm mesajları getir
export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      where: {
        isDeleted: false
      },
      orderBy: { timestamp: 'asc' }
    });
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// Yeni mesaj ekle
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const message = await prisma.message.create({
      data: {
        role: data.role,
        content: data.content,
        timestamp: new Date(),
        isDeleted: false,
        isStarred: false
      }
    });
    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

// Mesaj sil
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.message.update({
      where: { id },
      data: { isDeleted: true }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

// Tüm mesajları sil
export async function PUT() {
  try {
    await prisma.message.deleteMany({});
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete all messages' },
      { status: 500 }
    );
  }
}