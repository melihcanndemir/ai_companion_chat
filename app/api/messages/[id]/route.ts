import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await req.json();
    const message = await prisma.message.update({
      where: { id: params.id },
      data: { content }
    });
    return NextResponse.json(message);
  } catch (error) {
    console.error('Mesaj güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Mesaj güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 