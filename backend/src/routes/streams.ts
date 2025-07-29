import { Elysia, t } from 'elysia';
import { Stream, User } from '../models';
import { authMiddleware } from '../middleware/auth';

export const streamRoutes = new Elysia({ prefix: '/streams' })
  .get('/', async ({ query }) => {
    try {
      const { category, page = 1, limit = 20, live_only } = query;
      
      const filter: any = {};
      
      if (category) {
        filter.category = category;
      }
      
      if (live_only === 'true') {
        filter.isLive = true;
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const streams = await Stream.find(filter)
        .populate('streamerId', 'username displayName avatar')
        .sort({ isLive: -1, viewerCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Stream.countDocuments(filter);

      return {
        success: true,
        data: {
          streams,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      };
    } catch (error) {
      console.error('Get streams error:', error);
      return {
        success: false,
        error: 'Failed to fetch streams'
      };
    }
  }, {
    query: t.Object({
      category: t.Optional(t.String()),
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      live_only: t.Optional(t.String())
    })
  })
  
  .get('/:id', async ({ params }) => {
    try {
      const stream = await Stream.findById(params.id)
        .populate('streamerId', 'username displayName avatar bio followers');

      if (!stream) {
        return {
          success: false,
          error: 'Stream not found'
        };
      }

      return {
        success: true,
        data: { stream }
      };
    } catch (error) {
      console.error('Get stream error:', error);
      return {
        success: false,
        error: 'Failed to fetch stream'
      };
    }
  })
  
  .post('/', async (context) => {
    const authResult = await authMiddleware(context);
    
    if (!authResult.success) {
      context.set.status = 401;
      return authResult;
    }

    try {
      const { title, description, category, tags } = context.body;
      
      const user = await User.findById(authResult.user!.id);
      
      if (!user || !user.streamKey) {
        return {
          success: false,
          error: 'Stream key required. Generate one first.'
        };
      }

      const existingStream = await Stream.findOne({ 
        streamerId: authResult.user!.id,
        isLive: true 
      });

      if (existingStream) {
        return {
          success: false,
          error: 'You already have an active stream'
        };
      }

      const stream = new Stream({
        streamerId: authResult.user!.id,
        title,
        description,
        category,
        tags: tags || [],
        streamKey: user.streamKey
      });

      await stream.save();

      return {
        success: true,
        data: { stream }
      };
    } catch (error) {
      console.error('Create stream error:', error);
      return {
        success: false,
        error: 'Failed to create stream'
      };
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 100 }),
      description: t.Optional(t.String({ maxLength: 500 })),
      category: t.String(),
      tags: t.Optional(t.Array(t.String()))
    })
  })
  
  .put('/:id/live', async (context) => {
    const authResult = await authMiddleware(context);
    
    if (!authResult.success) {
      context.set.status = 401;
      return authResult;
    }

    try {
      const { isLive } = context.body;
      
      const stream = await Stream.findOne({
        _id: context.params.id,
        streamerId: authResult.user!.id
      });

      if (!stream) {
        return {
          success: false,
          error: 'Stream not found'
        };
      }

      stream.isLive = isLive;
      
      if (isLive) {
        stream.startedAt = new Date();
        await User.findByIdAndUpdate(authResult.user!.id, { isLive: true });
      } else {
        stream.endedAt = new Date();
        stream.viewerCount = 0;
        await User.findByIdAndUpdate(authResult.user!.id, { isLive: false });
      }

      await stream.save();

      return {
        success: true,
        data: { stream }
      };
    } catch (error) {
      console.error('Update stream status error:', error);
      return {
        success: false,
        error: 'Failed to update stream status'
      };
    }
  }, {
    body: t.Object({
      isLive: t.Boolean()
    })
  });