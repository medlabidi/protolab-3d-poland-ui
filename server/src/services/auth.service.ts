import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// Register new user
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  // Check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = new User({
    email,
    password: hashedPassword,
    name,
  });

  await user.save();

  // Generate token
  const token = jwt.sign(
    { userId: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
  };
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const user = await User.findOne({ email });
  if (!user || !user.password) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
  };
}

// Find or create Google user
export async function findOrCreateGoogleUser(
  googleId: string,
  email: string,
  name: string
): Promise<AuthResponse> {
  let user = await User.findOne({ googleId });

  if (!user) {
    // Create new user if doesn't exist
    user = new User({
      googleId,
      email,
      name,
      password: null,
    });
    await user.save();
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
  };
}

// Verify JWT token
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (err) {
    return null;
  }
}
