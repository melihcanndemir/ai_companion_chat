import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { Status } from '@prisma/client';

// Memory interface
interface Memory {
  type: string;
  category: string;
  content: string;
  importance: number;
  timestamp: Date;
  lastRecall: Date;
  recallCount: number;
  isActive: Status;
}

// Hafıza durumunu kontrol et
export async function GET() {
  try {
    const memories = await prisma.memory.findMany({
      where: { isActive: Status.ACTIVE },
      orderBy: { importance: 'desc' },
      take: 10
    });
    return NextResponse.json(memories);
  } catch (error) {
    console.error('Memory fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Yeni hafıza ekle
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate input
    if (!data.type || !data.category || !data.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const memory = await prisma.memory.create({
      data: {
        type: data.type,
        category: data.category,
        content: data.content,
        importance: data.importance || 1,
        timestamp: new Date(),
        lastRecall: new Date(),
        recallCount: 1,
        isActive: Status.ACTIVE
      }
    });
    
    return NextResponse.json(memory);
  } catch (error) {
    console.error('Memory creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create memory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Hafıza sıfırlama (soft delete)
export async function PUT(req: Request) {
  try {
    const { action } = await req.json();
    
    if (action === 'reset') {
      // Mevcut hafızaları devre dışı bırak
      await prisma.memory.updateMany({
        where: { isActive: Status.ACTIVE },
        data: { isActive: Status.INACTIVE }
      });
      
      // Temel hafızaları ekle
      const baseMemories: Omit<Memory, 'id'>[] = [
        {
          type: 'personality',
          category: 'core',
          content: 'name:Scarlet',
          importance: 5,
          timestamp: new Date(),
          lastRecall: new Date(),
          recallCount: 1,
          isActive: Status.ACTIVE
        },
        {
          type: 'personality',
          category: 'core',
          content: 'location:Los Angeles',
          importance: 4,
          timestamp: new Date(),
          lastRecall: new Date(),
          recallCount: 1,
          isActive: Status.ACTIVE
        }
      ];
      
      for (const memory of baseMemories) {
        await prisma.memory.create({
          data: {
            id: randomUUID(),
            ...memory
          }
        });
      }
      
      return NextResponse.json({ success: true, message: 'Memories reset successfully' });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Memory reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset memories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
