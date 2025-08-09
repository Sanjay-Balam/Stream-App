import { Elysia } from 'elysia';
import searchService from '../services/searchResource';

interface ElysiaContext {
  body: any;
  store: { success: boolean };
  params: { database: string; tableName: string; id?: string };
  query: any;
}

export const dynamicRoutes = new Elysia({ prefix: '/api/dynamic' })
  // Create Resource
  .post("/mongodb/:database/createResource/:tableName", async ({ 
    body, 
    store = { success: true }, // For now, we'll allow all requests
    params 
  }: ElysiaContext) => {
    if (!store.success) {
      return { success: false, error: "Unauthorized" };
    }
    
    try {
      const result = await searchService.createResource(
        params.database as string, 
        params.tableName, 
        body
      );
      return result;
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to create resource" };
    }
  })

  // Search Resources with advanced filtering
  .post("/mongodb/:database/searchResources/:tableName", async ({ 
    body, 
    store = { success: true }, 
    params, 
    query 
  }: ElysiaContext) => {
    if (!store.success) {
      return { success: false, error: "Unauthorized" };
    }

    // Extract pagination and sort from query or body
    const { page, pageSize, ...filter } = body;

    // Call the updated service
    const result = await searchService.searchResource(
      params.database,
      params.tableName,
      filter,
      {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 20
      }
    );
    return result;
  })

  // Get Single Resource
  .get("/mongodb/:database/getResource/:tableName/:id", async ({
    store = { success: true }, 
    params 
  }: ElysiaContext) => {
    if (!store.success) {
      return { success: false, error: "Unauthorized" };
    }
    
    try {
      const result = await searchService.getResource(
        params.database as string, 
        params.tableName, 
        params
      );
      return result;
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to get resource" };
    }
  })

  // Delete Resource
  .delete("/mongodb/:database/deleteResource/:tableName/:id", async ({ 
    store = { success: true }, 
    params 
  }: ElysiaContext) => {
    if (!store.success) {
      return { success: false, error: "Unauthorized" };
    }
    
    try {
      const result = await searchService.deleteResource(
        params.database as string, 
        params.tableName, 
        params
      );
      return result;
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to delete resource" };
    }
  })

  // Update Resource
  .patch("/mongodb/:database/updateResource/:tableName/:id", async ({ 
    body, 
    store = { success: true }, 
    params 
  }: ElysiaContext) => {
    if (!store.success) {
      return { success: false, error: "Unauthorized" };
    }
    
    try {
      const result = await searchService.updateResource(
        params.database as string, 
        params.tableName, 
        params, 
        body
      );
      return result;
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to update resource" };
    }
  })

  // Remove Keys from Resource
  .put("/mongodb/:database/removeKeysFromBody/:tableName/:id", async ({ 
    body, 
    store = { success: true }, 
    params 
  }: ElysiaContext) => {
    if (!store.success) {
      return { success: false, error: "Unauthorized" };
    }
    
    try {
      const removeKeys = Object.fromEntries(
        (body.removeKeys).map((key: string) => [key, ""])
      );
      
      const result = await searchService.removeKeysFromBody(
        params.database as string, 
        params.tableName, 
        params, 
        removeKeys
      );
      return result;
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to remove keys from body" };
    }
  })

  // Direct Aggregation Pipeline
  .post("/mongodb/:database/directAggregation/:tableName", async ({ 
    body, 
    store = { success: true }, 
    params 
  }: ElysiaContext) => {
    if (!store.success) {
      return { success: false, error: "Unauthorized" };
    }
    
    try {
      if (!Array.isArray(body)) {
        return { success: false, error: "Pipeline must be an array of stages" };
      }
      
      const result = await searchService.directAggregation(
        params.database as string, 
        params.tableName,
        body
      );
      
      return result;
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to execute aggregation pipeline" };
    }
  })

  // Get all available collections/tables
  .get("/mongodb/:database/collections", async ({ 
    store = { success: true }, 
    params 
  }: ElysiaContext) => {
    if (!store.success) {
      return { success: false, error: "Unauthorized" };
    }
    
    try {
      // Return available collections for this streaming app
      const collections = [
        'Users',
        'Streams', 
        'ChatMessages',
        'ChatReactions',
        'Polls',
        'Gifts',
        'StreamAnalytics',
        'GuestStreams'
      ];
      
      return { 
        success: true, 
        data: collections.map(name => ({ name, collection: name }))
      };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to get collections" };
    }
  });