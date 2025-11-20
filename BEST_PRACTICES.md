# 🏆 Protolab Development Best Practices

## Code Style & Standards

### TypeScript Best Practices

#### 1. Type Safety
```typescript
// ✅ Good: Explicit types
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

const getUser = (id: string): Promise<User> => {
  // ...
};

// ❌ Bad: Using 'any'
const getUser = (id: any): any => {
  // ...
};
```

#### 2. Error Handling
```typescript
// ✅ Good: Custom error types
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

try {
  const user = await User.findById(id);
  if (!user) throw new ValidationError('User not found');
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  }
}

// ❌ Bad: Generic error handling
try {
  // ...
} catch (error) {
  console.log('Error occurred');
}
```

#### 3. Null Safety
```typescript
// ✅ Good: Check for null/undefined
const getUserEmail = (user: User | null): string => {
  return user?.email ?? 'unknown@example.com';
};

// ✅ Good: Non-null assertion when sure
const email: string = user!.email;

// ❌ Bad: Unsafe access
const email = user.email; // Might throw if user is null
```

---

## Frontend Best Practices

### React Components

#### 1. Functional Components with Hooks
```typescript
// ✅ Good: Using hooks
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const data = await getUser(userId);
      setUser(data);
      setLoading(false);
    };
    fetchUser();
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (!user) return <NotFound />;

  return <div>{user.name}</div>;
};

// ❌ Bad: Class components (outdated)
class UserProfile extends React.Component {
  // ...
}
```

#### 2. Component Memoization
```typescript
// ✅ Good: Memo for expensive components
const UserList = React.memo(({ users }: Props) => {
  return users.map(user => <UserItem key={user.id} user={user} />);
});

// ✅ Good: useCallback for stable functions
const handleDelete = useCallback((id: string) => {
  deleteUser(id);
}, []);

// ✅ Good: useMemo for expensive calculations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);
```

#### 3. Custom Hooks
```typescript
// ✅ Good: Extract logic to hooks
const useFetch = <T,>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        setData(await response.json());
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  return { data, error, loading };
};

// Usage
const { data: users, loading } = useFetch<User[]>('/api/users');
```

#### 4. PropTypes or TypeScript
```typescript
// ✅ Good: TypeScript interfaces
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => {
  return <button onClick={onClick}>{children}</button>;
};

// ❌ Bad: Prop drilling
// Pass data through many levels instead of using Context
```

---

## Backend Best Practices

### Express.js Patterns

#### 1. Middleware Order
```typescript
// ✅ Good: Proper middleware order
app.use(express.json()); // Parse JSON
app.use(requestLogger);  // Logging first
app.use(cors());         // CORS
app.use(rateLimiter);    // Rate limiting
app.use(authMiddleware); // Authentication
app.use(routes);         // Routes
app.use(errorHandler);   // Error handler last
```

#### 2. Async Error Handling
```typescript
// ✅ Good: Wrapper for async route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
}));

// ❌ Bad: Unhandled promise rejections
router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id); // Error not caught
  res.json(user);
});
```

#### 3. Validation Middleware
```typescript
// ✅ Good: Validate input
const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  next();
};

router.post('/register', validateUser, register);
```

#### 4. Database Queries
```typescript
// ✅ Good: Use proper queries
const user = await User.findById(id).select('name email role');

const users = await User.find({ role: 'admin' })
  .sort({ createdAt: -1 })
  .limit(10);

// ✅ Good: Use lean for read-only
const users = await User.find().lean();

// ❌ Bad: Fetch all data
const users = await User.find(); // No filtering
```

---

## Database Best Practices

### MongoDB/Mongoose

#### 1. Schema Design
```typescript
// ✅ Good: Proper schema with indexes
interface IUser {
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
```

#### 2. Connection Management
```typescript
// ✅ Good: Proper connection with pooling
await mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  w: 'majority'
});

// ✅ Good: Connection event handlers
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
```

#### 3. Query Optimization
```typescript
// ✅ Good: Use aggregation pipeline
const stats = await Order.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$userId', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } },
  { $limit: 10 }
]);

// ✅ Good: Populate relationships efficiently
const user = await User.findById(id).populate({
  path: 'orders',
  select: 'id amount status',
  options: { limit: 10 }
});

// ❌ Bad: N+1 problem
for (const user of users) {
  const orders = await Order.find({ userId: user._id });
}
```

---

## Git & Version Control

### Commit Messages
```bash
# ✅ Good: Descriptive commit messages
git commit -m "feat: add user authentication with JWT"
git commit -m "fix: resolve MongoDB connection timeout issue"
git commit -m "docs: add installation instructions"
git commit -m "refactor: extract database logic to service layer"
git commit -m "test: add unit tests for auth controller"

# ❌ Bad: Vague messages
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

### Branch Naming
```bash
# ✅ Good
feature/user-authentication
fix/mongodb-connection
docs/api-documentation
refactor/controller-optimization

# ❌ Bad
feature1
fix-bug
my-changes
temp
```

---

## Testing Best Practices

### Unit Tests
```typescript
describe('AuthService', () => {
  // ✅ Good: Clear test descriptions
  it('should register a new user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    const result = await authService.register(userData);

    expect(result.user.email).toBe(userData.email);
    expect(result.tokens).toBeDefined();
  });

  // ✅ Good: Test error cases
  it('should throw error for duplicate email', async () => {
    const userData = {
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'password123'
    };

    await expect(authService.register(userData))
      .rejects
      .toThrow('User already exists');
  });
});
```

---

## Security Best Practices

#### 1. Password Handling
```typescript
// ✅ Good: Hash passwords
const passwordHash = await bcrypt.hash(password, 10);

// ✅ Good: Never log passwords
logger.info(`User logged in: ${email}`); // Not the password!

// ❌ Bad: Store plain text
const user = await User.create({ email, password }); // NEVER!
```

#### 2. Token Management
```typescript
// ✅ Good: Set token expiry
const tokens = jwt.sign(payload, secret, { expiresIn: '15m' });

// ✅ Good: Use refresh tokens
const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

// ❌ Bad: Tokens that don't expire
const token = jwt.sign(payload, secret);
```

#### 3. Input Validation
```typescript
// ✅ Good: Validate and sanitize input
const email = req.body.email?.trim().toLowerCase();
if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
  throw new ValidationError('Invalid email');
}

// ❌ Bad: Use user input directly
const email = req.body.email;
await User.findOne({ email }); // Could be SQL injection vector
```

---

## Performance Best Practices

#### 1. Database Queries
```typescript
// ✅ Good: Pagination
const page = parseInt(req.query.page) || 1;
const limit = 20;
const skip = (page - 1) * limit;

const users = await User.find()
  .skip(skip)
  .limit(limit)
  .lean();

// ✅ Good: Field selection
const user = await User.findById(id).select('name email role -passwordHash');

// ❌ Bad: Fetching all data
const users = await User.find(); // No pagination, returns all
```

#### 2. Caching
```typescript
// ✅ Good: Cache frequently accessed data
const getCachedUser = async (id: string) => {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await User.findById(id);
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
};
```

#### 3. API Response Time
```typescript
// ✅ Good: Return only needed fields
res.json({
  id: user._id,
  name: user.name,
  email: user.email
  // Not: user (which includes passwordHash, etc.)
});
```

---

## Development Workflow

### Daily Practices
1. ✅ Write tests before code (TDD)
2. ✅ Commit frequently with descriptive messages
3. ✅ Review code before pushing
4. ✅ Keep dependencies updated
5. ✅ Run linter and type checker
6. ✅ Document API changes

### Before Deployment
1. ✅ Run full test suite
2. ✅ Check code coverage
3. ✅ Perform security audit
4. ✅ Load test with realistic data
5. ✅ Backup database
6. ✅ Plan rollback strategy

---

## Tools & Extensions

### Recommended VS Code Extensions
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **TypeScript Vue Plugin** - Vue support
- **Thunder Client** - API testing
- **MongoDB for VS Code** - Database management
- **GitLens** - Git integration

### Recommended Tools
- **Postman** - API testing
- **MongoDB Compass** - Database GUI
- **Redux DevTools** - State debugging
- **Chrome DevTools** - Frontend debugging
- **Insomnia** - API documentation

---

## Resources

### Learning
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Express Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Clean Code](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)

### Code Quality
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Checklist

### Before Submitting Code
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No console.log statements (use logger)
- [ ] Types are properly defined
- [ ] Comments explain "why", not "what"
- [ ] No hardcoded values
- [ ] Security best practices followed
- [ ] Performance optimized

### Code Review
- [ ] Clear variable names
- [ ] No dead code
- [ ] DRY principle followed
- [ ] Proper error handling
- [ ] Tests cover edge cases
- [ ] Documentation updated

---

**Follow these best practices to maintain code quality and team productivity! 🚀**

---

*Last Updated: November 20, 2025*
