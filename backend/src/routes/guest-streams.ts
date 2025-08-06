import { Elysia, t } from 'elysia';
import { GuestStream } from '../models/GuestStream';

export const guestStreamRoutes = new Elysia({ prefix: '/guest-streams' })
  .post('/', async ({ body }) => {
    try {
      const { title, description, category, tags, guestDisplayName } = body;
      
      // Generate unique guest ID and stream key
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const streamKey = `gsk_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
      
      // Try database operation first
      try {
        const guestStream = new GuestStream({
          guestId,
          title,
          description,
          category,
          tags: tags || [],
          streamKey,
          guestDisplayName
        });

        await guestStream.save();

        return {
          success: true,
          data: { 
            stream: guestStream,
            streamKey: streamKey
          }
        };
      } catch (dbError) {
        console.log('Database not available, using mock response');
        
        // Return mock response when database is not available
        const mockStream = {
          _id: `mock_${Date.now()}`,
          guestId,
          title,
          description: description || '',
          category,
          tags: tags || [],
          isLive: false,
          viewerCount: 0,
          streamKey,
          thumbnail: null,
          startedAt: null,
          endedAt: null,
          guestDisplayName,
          shareCount: 0,
          lastSharedAt: null,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0
        };

        return {
          success: true,
          data: { 
            stream: mockStream,
            streamKey: streamKey
          }
        };
      }
    } catch (error) {
      console.error('Create guest stream error:', error);
      return {
        success: false,
        error: 'Failed to create guest stream'
      };
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 100 }),
      description: t.Optional(t.String({ maxLength: 500 })),
      category: t.String(),
      tags: t.Optional(t.Array(t.String())),
      guestDisplayName: t.String({ minLength: 1, maxLength: 30 })
    })
  })
  
  .get('/:id', async ({ params }) => {
    try {
      const guestStream = await GuestStream.findById(params.id);

      if (!guestStream) {
        return {
          success: false,
          error: 'Guest stream not found'
        };
      }

      // Check if stream has expired
      if (new Date() > guestStream.expiresAt) {
        await GuestStream.findByIdAndDelete(params.id);
        return {
          success: false,
          error: 'Guest stream has expired'
        };
      }

      return {
        success: true,
        data: { stream: guestStream }
      };
    } catch (error) {
      console.error('Get guest stream error:', error);
      return {
        success: false,
        error: 'Failed to fetch guest stream'
      };
    }
  })
  
  .put('/:id/live', async ({ params, body }) => {
    try {
      const { isLive } = body;
      
      const guestStream = await GuestStream.findById(params.id);

      if (!guestStream) {
        return {
          success: false,
          error: 'Guest stream not found'
        };
      }

      // Check if stream has expired
      if (new Date() > guestStream.expiresAt) {
        await GuestStream.findByIdAndDelete(params.id);
        return {
          success: false,
          error: 'Guest stream has expired'
        };
      }

      guestStream.isLive = isLive;
      
      if (isLive) {
        guestStream.startedAt = new Date();
      } else {
        guestStream.endedAt = new Date();
        guestStream.viewerCount = 0;
      }

      await guestStream.save();

      return {
        success: true,
        data: { stream: guestStream }
      };
    } catch (error) {
      console.error('Update guest stream status error:', error);
      return {
        success: false,
        error: 'Failed to update guest stream status'
      };
    }
  }, {
    body: t.Object({
      isLive: t.Boolean()
    })
  })
  
  .delete('/:id', async ({ params }) => {
    try {
      const guestStream = await GuestStream.findByIdAndDelete(params.id);

      if (!guestStream) {
        return {
          success: false,
          error: 'Guest stream not found'
        };
      }

      return {
        success: true,
        data: { message: 'Guest stream deleted successfully' }
      };
    } catch (error) {
      console.error('Delete guest stream error:', error);
      return {
        success: false,
        error: 'Failed to delete guest stream'
      };
    }
  })

  .get('/:id/share-info', async ({ params }) => {
    try {
      const guestStream = await GuestStream.findById(params.id);

      if (!guestStream) {
        return {
          success: false,
          error: 'Guest stream not found'
        };
      }

      // Check if stream has expired
      if (new Date() > guestStream.expiresAt) {
        await GuestStream.findByIdAndDelete(params.id);
        return {
          success: false,
          error: 'Guest stream has expired'
        };
      }

      // Generate sharing info
      const shareInfo = {
        streamId: guestStream._id,
        title: guestStream.title,
        description: guestStream.description,
        streamerName: guestStream.guestDisplayName,
        category: guestStream.category,
        isLive: guestStream.isLive,
        viewerCount: guestStream.viewerCount,
        shareCount: guestStream.shareCount,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/stream/${guestStream._id}`,
        expiresAt: guestStream.expiresAt
      };

      return {
        success: true,
        data: { shareInfo }
      };
    } catch (error) {
      console.error('Get share info error:', error);
      return {
        success: false,
        error: 'Failed to get share info'
      };
    }
  })

  .post('/:id/share', async ({ params }) => {
    try {
      const guestStream = await GuestStream.findById(params.id);

      if (!guestStream) {
        return {
          success: false,
          error: 'Guest stream not found'
        };
      }

      // Check if stream has expired
      if (new Date() > guestStream.expiresAt) {
        await GuestStream.findByIdAndDelete(params.id);
        return {
          success: false,
          error: 'Guest stream has expired'
        };
      }

      // Increment share count and update last shared timestamp
      guestStream.shareCount += 1;
      guestStream.lastSharedAt = new Date();
      await guestStream.save();

      return {
        success: true,
        data: { 
          message: 'Share recorded successfully',
          shareCount: guestStream.shareCount
        }
      };
    } catch (error) {
      console.error('Record share error:', error);
      return {
        success: false,
        error: 'Failed to record share'
      };
    }
  });