import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and, gte, lte, sum, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

async function validateToken(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate JWT token
    const user = await validateToken(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build base query conditions
    let whereConditions = [eq(transactions.userId, user.userId)];

    // Add date filtering if provided
    if (startDate) {
      whereConditions.push(gte(transactions.date, startDate));
    }
    if (endDate) {
      whereConditions.push(lte(transactions.date, endDate));
    }

    // Calculate total income
    const incomeResult = await db
      .select({
        total: sum(transactions.amount)
      })
      .from(transactions)
      .where(and(
        ...whereConditions,
        eq(transactions.type, 'income')
      ));

    // Calculate total expenses
    const expenseResult = await db
      .select({
        total: sum(transactions.amount)
      })
      .from(transactions)
      .where(and(
        ...whereConditions,
        eq(transactions.type, 'expense')
      ));

    const totalIncome = Number(incomeResult[0]?.total || 0);
    const totalExpenses = Number(expenseResult[0]?.total || 0);
    const currentBalance = totalIncome - totalExpenses;

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      currentBalance
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}