import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

async function validateAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate user
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Validate ID
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid transaction ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { title, amount, type, category, date } = body;

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate optional fields
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json({ 
        error: 'Amount must be a positive number',
        code: 'INVALID_AMOUNT' 
      }, { status: 400 });
    }

    if (type !== undefined && type !== 'income' && type !== 'expense') {
      return NextResponse.json({ 
        error: 'Type must be either "income" or "expense"',
        code: 'INVALID_TYPE' 
      }, { status: 400 });
    }

    if (date !== undefined) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ 
          error: 'Date must be in valid format',
          code: 'INVALID_DATE' 
        }, { status: 400 });
      }
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await db.select()
      .from(transactions)
      .where(and(eq(transactions.id, parseInt(id)), eq(transactions.userId, user.userId)))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({ 
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (amount !== undefined) updateData.amount = amount;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category.trim();
    if (date !== undefined) updateData.date = date;

    // Update transaction
    const updated = await db.update(transactions)
      .set(updateData)
      .where(and(eq(transactions.id, parseInt(id)), eq(transactions.userId, user.userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate user
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Validate ID
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid transaction ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await db.select()
      .from(transactions)
      .where(and(eq(transactions.id, parseInt(id)), eq(transactions.userId, user.userId)))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({ 
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete transaction
    const deleted = await db.delete(transactions)
      .where(and(eq(transactions.id, parseInt(id)), eq(transactions.userId, user.userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Transaction deleted successfully',
      transaction: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}