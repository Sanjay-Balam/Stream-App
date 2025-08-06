import { Elysia, t } from 'elysia';
import { User } from '../models';
import { generateTokens, authMiddleware } from '../middleware/auth';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/register', async ({ body }) => {
    try {
      const { username, email, password, displayName } = body;
      console.log('Registration attempt for email:', email, 'username:', username);

      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        console.log('User already exists:', existingUser.email === email ? 'email' : 'username');
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
      console.log('User registered successfully:', user.email);

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
      console.log('Login attempt for email:', email);

      const user = await User.findOne({ email });
      console.log('User found:', user ? 'Yes' : 'No');

      if (!user) {
        console.log('User not found for email:', email);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const isPasswordValid = await user.comparePassword(password);
      console.log('Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('Password comparison failed');
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      console.log('Generating tokens...');
      const tokens = generateTokens(user);
      console.log('Tokens generated successfully:', !!tokens.accessToken, !!tokens.refreshToken);
      console.log('Login successful for user:', user.email);

      const response = {
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
      
      console.log('Sending response:', JSON.stringify(response, null, 2));
      return response;
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