import { Elysia, t } from 'elysia';
import { Stream, User, GuestStream } from '../models';
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

      // Also get guest streams with same filters
      const guestStreams = await GuestStream.find(filter)
        .sort({ isLive: -1, viewerCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      // Transform guest streams to match regular stream format
      const transformedGuestStreams = guestStreams.map(guestStream => ({
        _id: guestStream._id,
        title: guestStream.title,
        description: guestStream.description,
        category: guestStream.category,
        tags: guestStream.tags,
        isLive: guestStream.isLive,
        viewerCount: guestStream.viewerCount,
        thumbnail: guestStream.thumbnail,
        startedAt: guestStream.startedAt,
        endedAt: guestStream.endedAt,
        createdAt: guestStream.createdAt,
        updatedAt: guestStream.updatedAt,
        isGuestStream: true,
        streamerId: {
          _id: guestStream.guestId,
          username: guestStream.guestDisplayName,
          displayName: guestStream.guestDisplayName,
          avatar: null
        }
      }));

      // Combine and sort all streams
      const allStreams = [...streams, ...transformedGuestStreams]
        .sort((a, b) => {
          if (a.isLive !== b.isLive) return b.isLive ? 1 : -1;
          if (a.viewerCount !== b.viewerCount) return b.viewerCount - a.viewerCount;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, Number(limit));

      const total = await Stream.countDocuments(filter) + await GuestStream.countDocuments(filter);

      return {
        success: true,
        data: {
          streams: allStreams,
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
      // First try to find regular stream
      let stream = await Stream.findById(params.id)
        .populate('streamerId', 'username displayName avatar bio followers');

      if (stream) {
        return {
          success: true,
          data: { stream }
        };
      }

      // If not found, try guest stream
      const guestStream = await GuestStream.findById(params.id);
      
      if (guestStream) {
        // Check if guest stream has expired
        if (new Date() > guestStream.expiresAt) {
          await GuestStream.findByIdAndDelete(params.id);
          return {
            success: false,
            error: 'Stream not found'
          };
        }

        // Transform guest stream to match regular stream format
        const transformedGuestStream = {
          _id: guestStream._id,
          title: guestStream.title,
          description: guestStream.description,
          category: guestStream.category,
          tags: guestStream.tags,
          isLive: guestStream.isLive,
          viewerCount: guestStream.viewerCount,
          thumbnail: guestStream.thumbnail,
          startedAt: guestStream.startedAt,
          endedAt: guestStream.endedAt,
          createdAt: guestStream.createdAt,
          updatedAt: guestStream.updatedAt,
          isGuestStream: true,
          streamerId: {
            _id: guestStream.guestId,
            username: guestStream.guestDisplayName,
            displayName: guestStream.guestDisplayName,
            avatar: null,
            bio: '',
            followers: []
          }
        };

        return {
          success: true,
          data: { stream: transformedGuestStream }
        };
      }

      return {
        success: false,
        error: 'Stream not found'
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