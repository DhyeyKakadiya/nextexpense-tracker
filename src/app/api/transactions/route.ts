import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  [key: string]: any;
}

async function authenticateRequest(request: NextRequest): Promise<{ userId: number } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = jwt.verify(token, secret) as JWTPayload;
    return { userId: payload.userId };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sort = searchParams.get('sort') || 'date';
    const order = searchParams.get('order') || 'desc';

    let query = db.select().from(transactions);

    // Build where conditions
    const conditions = [eq(transactions.userId, auth.userId)];

    if (search) {
      conditions.push(like(transactions.title, `%${search}%`));
    }

    if (type && (type === 'income' || type === 'expense')) {
      conditions.push(eq(transactions.type, type));
    }

    if (category) {
      conditions.push(eq(transactions.category, category));
    }

    if (startDate) {
      conditions.push(gte(transactions.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(transactions.date, endDate));
    }

    query = query.where(and(...conditions));

    // Apply sorting
    if (sort === 'date') {
      query = query.orderBy(order === 'asc' ? asc(transactions.date) : desc(transactions.date));
    } else if (sort === 'amount') {
      query = query.orderBy(order === 'asc' ? asc(transactions.amount) : desc(transactions.amount));
    } else if (sort === 'title') {
      query = query.orderBy(order === 'asc' ? asc(transactions.title) : desc(transactions.title));
    } else if (sort === 'createdAt') {
      query = query.orderBy(order === 'asc' ? asc(transactions.createdAt) : desc(transactions.createdAt));
    } else {
      query = query.orderBy(desc(transactions.date));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { title, amount, type, category, date } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ 
        error: "Title is required and must be a non-empty string",
        code: "INVALID_TITLE" 
      }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        error: "Amount is required and must be a positive number",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    if (!type || (type !== 'income' && type !== 'expense')) {
      return NextResponse.json({ 
        error: "Type is required and must be either 'income' or 'expense'",
        code: "INVALID_TYPE" 
      }, { status: 400 });
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json({ 
        error: "Category is required and must be a non-empty string",
        code: "INVALID_CATEGORY" 
      }, { status: 400 });
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ 
        error: "Date is required and must be a valid date string",
        code: "INVALID_DATE" 
      }, { status: 400 });
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ 
        error: "Date must be a valid date format",
        code: "INVALID_DATE_FORMAT" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const insertData = {
      userId: auth.userId,
      title: title.trim(),
      amount: parseFloat(amount.toString()),
      type,
      category: category.trim(),
      date,
      createdAt: now,
      updatedAt: now
    };

    const newTransaction = await db.insert(transactions)
      .values(insertData)
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}