import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        error: "Name is required",
        code: "MISSING_NAME"
      }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({
        error: "Email is required",
        code: "MISSING_EMAIL"
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({
        error: "Password is required",
        code: "MISSING_PASSWORD"
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: "Invalid email format",
        code: "INVALID_EMAIL"
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({
        error: "Password must be at least 6 characters long",
        code: "PASSWORD_TOO_SHORT"
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({
        error: "Email already exists",
        code: "EMAIL_EXISTS"
      }, { status: 409 });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const currentTime = new Date().toISOString();
    const newUser = await db.insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        createdAt: currentTime,
        updatedAt: currentTime
      })
      .returning();

    if (newUser.length === 0) {
      return NextResponse.json({
        error: "Failed to create user",
        code: "USER_CREATION_FAILED"
      }, { status: 500 });
    }

    const createdUser = newUser[0];

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json({
        error: "Internal server error",
        code: "JWT_SECRET_MISSING"
      }, { status: 500 });
    }

    const token = jwt.sign(
      {
        id: createdUser.id,
        email: createdUser.email
      },
      jwtSecret,
      {
        expiresIn: '7d'
      }
    );

    // Return user data without password
    const userResponse = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt
    };

    return NextResponse.json({
      user: userResponse,
      token: token
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/signup error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}