import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
}

async function getUserFromToken(request: NextRequest): Promise<{ id: number } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    return { id: decoded.userId };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let query = db.select().from(categories).where(eq(categories.userId, user.id));

    if (search) {
      query = query.where(
        and(
          eq(categories.userId, user.id),
          like(categories.name, `%${search}%`)
        )
      );
    }

    const results = await query
      .orderBy(desc(categories.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET categories error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { name, color } = requestBody;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: "Name is required and cannot be empty",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!color || typeof color !== 'string') {
      return NextResponse.json({ 
        error: "Color is required",
        code: "MISSING_COLOR" 
      }, { status: 400 });
    }

    // Validate hex color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(color)) {
      return NextResponse.json({ 
        error: "Color must be in hex format (#rrggbb)",
        code: "INVALID_COLOR_FORMAT" 
      }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check for duplicate category name per user
    const existingCategory = await db.select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, user.id),
          eq(categories.name, trimmedName)
        )
      )
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json({ 
        error: "Category name already exists",
        code: "DUPLICATE_CATEGORY_NAME" 
      }, { status: 409 });
    }

    // Create new category
    const newCategory = await db.insert(categories)
      .values({
        userId: user.id,
        name: trimmedName,
        color: color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    console.error('POST categories error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}