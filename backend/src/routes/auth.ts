import { Elysia, t } from 'elysia';
import { User } from '../models';
import { generateTokens, authMiddleware } from '../middleware/auth';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/register', async ({ body }) => {
    try {
      const { username, email, password, displayName } = body;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return {
          success: false,
          error: existingUser.email === email ? 'Email already exists' : 'Username already exists'
        };
      }

      const user = new User({
        username,
        email,
        password,
        displayName
      });

      await user.save();

      const tokens = generateTokens(user);

      return {
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            avatar: user.avatar
          },
          ...tokens
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }, {
    body: t.Object({
      username: t.String({ minLength: 3, maxLength: 30 }),
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 }),
      displayName: t.String({ minLength: 1, maxLength: 50 })
    })
  })
  
  .post('/login', async ({ body }) => {
    try {
      const { email, password } = body;

      const user = await User.findOne({ email });

      if (!user || !(await user.comparePassword(password))) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const tokens = generateTokens(user);

      return {
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            avatar: user.avatar,
            isLive: user.isLive
          },
          ...tokens
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 1 })
    })
  })
  
  .get('/me', async (context) => {
    const authResult = await authMiddleware(context);
    
    if (!authResult.success) {
      context.set.status = 401;
      return authResult;
    }

    return {
      success: true,
      data: { user: authResult.user }
    };
  })
  
  .post('/stream-key', async (context) => {
    const authResult = await authMiddleware(context);
    
    if (!authResult.success) {
      context.set.status = 401;
      return authResult;
    }

    try {
      const user = await User.findById(authResult.user!.id);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const streamKey = user.generateStreamKey();
      await user.save();

      return {
        success: true,
        data: { streamKey }
      };
    } catch (error) {
      console.error('Stream key generation error:', error);
      return {
        success: false,
        error: 'Failed to generate stream key'
      };
    }
  });