import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

async function verifyToken(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const categoryId = parseInt(id);
    const requestBody = await request.json();
    const { name, color } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if category exists and belongs to user
    const existingCategory = await db.select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, user.userId)))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ 
          error: "Category name is required and must be a non-empty string",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }

      // Check for duplicate name (excluding current category)
      const duplicateCategory = await db.select()
        .from(categories)
        .where(and(
          eq(categories.userId, user.userId),
          eq(categories.name, name.trim()),
          ne(categories.id, categoryId)
        ))
        .limit(1);

      if (duplicateCategory.length > 0) {
        return NextResponse.json({ 
          error: "Category name already exists",
          code: "DUPLICATE_NAME" 
        }, { status: 409 });
      }
    }

    // Validate color if provided
    if (color !== undefined) {
      if (typeof color !== 'string' || !isValidHexColor(color)) {
        return NextResponse.json({ 
          error: "Color must be a valid hex format #rrggbb",
          code: "INVALID_COLOR" 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    // Update category
    const updated = await db.update(categories)
      .set(updateData)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, user.userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const categoryId = parseInt(id);

    // Check if category exists and belongs to user
    const existingCategory = await db.select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, user.userId)))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Delete category
    const deleted = await db.delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, user.userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Category deleted successfully',
      deletedCategory: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}