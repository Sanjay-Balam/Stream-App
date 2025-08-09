import mongoose from "mongoose";
import { User, Stream, ChatMessage, ChatReaction, Poll, Gift, StreamAnalytics, GuestStream } from "../models";

// Model Map for the streaming app
const modelMap: { [key: string]: mongoose.Model<any> } = {
  Users: User,
  Streams: Stream,
  ChatMessages: ChatMessage,
  ChatReactions: ChatReaction,
  Polls: Poll,
  Gifts: Gift,
  StreamAnalytics: StreamAnalytics,
  GuestStreams: GuestStream,
};

// Custom Error Classes
class NotFoundError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
  }
}

class ValidationError extends Error {
  status: number;
  details: any;
  constructor(message: string, details?: any) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
    this.details = details;
  }
}

// Cache for database connections
const dbConnections: { [dbName: string]: mongoose.Connection } = {};

// Helper to get or create a connection for a database
export async function getDbConnection(dbName: string): Promise<mongoose.Connection> {
  if (dbConnections[dbName]) return dbConnections[dbName];
  
  const uri = process.env.MONGODB_URL || "";
  
  // Connect to the main server, then useDb for the specific database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  
  const conn = mongoose.connection.useDb(dbName, { useCache: true });
  dbConnections[dbName] = conn;
  return conn;
}

// Helper to get a model for a specific connection
export function getModel(conn: mongoose.Connection, tableName: string) {
  const schema = modelMap[tableName]?.schema;
  if (!schema) throw new NotFoundError(`No schema for table: ${tableName}`);
  
  // Register model on this connection if not already
  return conn.models[tableName] || conn.model(tableName, schema, tableName);
}

function convertStringsToObjectIdsAndDates(obj: any, schema: mongoose.Schema<any>) {
  if (!obj || typeof obj !== "object") return obj;

  for (const key of Object.keys(obj)) {
    const schemaType = schema.path(key);

    // Handle _id field specially
    if (key === "_id") {
      if (typeof obj[key] === "string" && mongoose.Types.ObjectId.isValid(obj[key])) {
        obj[key] = new mongoose.Types.ObjectId(obj[key]);
      }
      if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map((v: any) =>
          typeof v === "string" && mongoose.Types.ObjectId.isValid(v)
            ? new mongoose.Types.ObjectId(v)
            : v
        );
      }
      // Handle $in, $all, $nin operators for _id field
      if (obj[key] && typeof obj[key] === "object") {
        for (const op of ["$in", "$all", "$nin", "$or", "$and"]) {
          if (obj[key][op] && Array.isArray(obj[key][op])) {
            obj[key][op] = obj[key][op].map((v: any) =>
              typeof v === "string" && mongoose.Types.ObjectId.isValid(v)
                ? new mongoose.Types.ObjectId(v)
                : v
            );
          }
        }
      }
    }
    // Handle direct ObjectId fields
    else if (
      schemaType &&
      (schemaType.instance === "ObjectID" || schemaType.instance === "ObjectId")
    ) {
      if (typeof obj[key] === "string" && mongoose.Types.ObjectId.isValid(obj[key])) {
        obj[key] = new mongoose.Types.ObjectId(obj[key]);
      }
      if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map((v: any) =>
          typeof v === "string" && mongoose.Types.ObjectId.isValid(v)
            ? new mongoose.Types.ObjectId(v)
            : v
        );
      }
    }
    // Handle arrays of ObjectIds
    else if (
      schemaType &&
      schemaType.instance === "Array" &&
      // @ts-ignore
      schemaType.caster &&
      // @ts-ignore
      (schemaType.caster.instance === "ObjectID" || schemaType.caster.instance === "ObjectId")
    ) {
      if (obj[key] && typeof obj[key] === "object") {
        for (const op of ["$in", "$all", "$nin", "$or", "$and"]) {
          if (obj[key][op] && Array.isArray(obj[key][op])) {
            obj[key][op] = obj[key][op].map((v: any) =>
              typeof v === "string" && mongoose.Types.ObjectId.isValid(v)
                ? new mongoose.Types.ObjectId(v)
                : v
            );
          }
        }
      }
    }
    // Handle Date fields
    else if (schemaType && schemaType.instance === "Date") {
      // If the value is a string, convert to Date
      if (typeof obj[key] === "string") {
        obj[key] = new Date(obj[key]);
      }
      // If the value is an object with $gte/$lte/$gt/$lt, convert those
      if (typeof obj[key] === "object" && obj[key] !== null) {
        for (const op of ["$gte", "$lte", "$gt", "$lt", "$eq", "$ne"]) {
          if (obj[key][op] && typeof obj[key][op] === "string") {
            obj[key][op] = new Date(obj[key][op]);
          }
        }
      }
    }
    // Recursively handle nested objects
    else if (typeof obj[key] === "object" && obj[key] !== null) {
      obj[key] = convertStringsToObjectIdsAndDates(obj[key], schema);
    }
  }
  return obj;
}

const searchService = {
  createResource: async (database: string, tableName: string, body: any) => {
    try {
      const conn = await getDbConnection(database);
      const Model = getModel(conn, tableName);
      
      // Convert string ObjectIds to MongoDB ObjectIds before creating the document
      const convertedBody = convertStringsToObjectIdsAndDates(body, Model.schema);
      
      const doc = new Model(convertedBody);
      const result = await doc.save();
      return { success: true, data: result };
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return {
          success: false,
          error: "Validation failed",
          details: error.errors || error.message
        };
      }
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message, status: error.status };
      }
      return { success: false, error: error.message || "Failed to create resource" };
    }
  },

  searchResource: async (
    database: string,
    tableName: string,
    queryBody: any = {},
    options?: { page?: number; pageSize?: number }
  ) => {
    try {
      // 1. Get the connection and model
      const conn = await getDbConnection(database);
      const Model = getModel(conn, tableName);

      // 2. Extract options from queryBody or options param
      const {
        filter = {},
        sort = { _id: -1 },
        project,
        lookups,
        unwind,
        addFields,
        customStages,
        facet,
        ...rest
      } = queryBody;

      // Convert string ObjectIds in filter to real ObjectIds
      const convertedFilter = convertStringsToObjectIdsAndDates({ ...filter }, Model.schema);

      // Pagination
      const page = options?.page || rest.page || 1;
      const pageSize = options?.pageSize || rest.pageSize || 20;
      const skip = (page - 1) * pageSize;

      // 3. Build the aggregation pipeline dynamically
      const pipeline: any[] = [];

      // $match
      if (convertedFilter && Object.keys(convertedFilter).length > 0) {
        pipeline.push({ $match: convertedFilter });
      }

      // $addFields
      if (addFields) {
        pipeline.push({ $addFields: addFields });
      }

      // $lookup (array of lookups)
      if (Array.isArray(lookups)) {
        for (const lookup of lookups) {
          pipeline.push({ $lookup: lookup });
        }
      }

      // $unwind
      if (unwind) {
        if (Array.isArray(unwind)) {
          unwind.forEach(u => pipeline.push({ $unwind: u }));
        } else {
          pipeline.push({ $unwind: unwind });
        }
      }

      // $sort
      if (sort) {
        pipeline.push({ $sort: sort });
      }

      // $project
      if (project) {
        pipeline.push({ $project: project });
      }

      // Custom stages (for advanced users)
      if (Array.isArray(customStages)) {
        pipeline.push(...customStages);
      }

      // $facet for pagination and total count
      pipeline.push({
        $facet: {
          data: [
            { $skip: skip },
            { $limit: pageSize }
          ],
          total: [
            { $count: "count" }
          ]
        }
      });

      // 4. Run the aggregation
      const [result] = await Model.aggregate(pipeline);

      // 5. Extract results and total count
      const data = result.data;
      const total = result.total.length > 0 ? result.total[0].count : 0;
      const totalPages = Math.ceil(total / pageSize);

      // 6. Return paginated response
      return {
        success: true,
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message, status: error.status };
      }
      return { success: false, error: error.message || "Failed to search resource" };
    }
  },

  getResource: async (database: string, tableName: string, params: any) => {
    try {
      const conn = await getDbConnection(database);
      const Model = getModel(conn, tableName);
      const result = await Model.findById(params.id).lean();
      if (!result) throw new NotFoundError(`Resource not found with id: ${params.id}`);
      return { success: true, data: result };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message, status: error.status };
      }
      return { success: false, error: error.message || "Failed to get resource" };
    }
  },

  deleteResource: async (database: string, tableName: string, params: any) => {
    try {
      const conn = await getDbConnection(database);
      const Model = getModel(conn, tableName);
      const result = await Model.findByIdAndDelete(params.id);
      if (!result) throw new NotFoundError(`Resource not found with id: ${params.id}`);
      return { success: true, data: result };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message, status: error.status };
      }
      return { success: false, error: error.message || "Failed to delete resource" };
    }
  },

  updateResource: async (database: string, tableName: string, params: any, body: any) => {
    try {
      const conn = await getDbConnection(database);
      const Model = getModel(conn, tableName);
      
      // Check if body contains MongoDB operators like $addToSet, $pull, etc.
      const hasOperators = body && typeof body === 'object' && 
        Object.keys(body).some(key => key.startsWith('$'));
      
      let updateOperation;
      if (hasOperators) {
        // If body contains operators, use them directly
        updateOperation = body;
      } else {
        // Otherwise, wrap in $set as before
        updateOperation = { $set: body };
      }
      
      const result = await Model.findByIdAndUpdate(
        params?.id, 
        updateOperation, 
        { new: true, runValidators: true, optimisticConcurrency: true }
      );
      
      if (!result) throw new NotFoundError(`Resource not found with id: ${params.id}`);
      return { success: true, data: result };
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return {
          success: false,
          error: "Validation failed",
          details: error.errors || error.message
        };
      }
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message, status: error.status };
      }
      return { success: false, error: error.message || "Failed to update resource" };
    }
  },

  removeKeysFromBody: async (database: string, tableName: string, params: any, body: any) => {
    try {
      const conn = await getDbConnection(database);
      const Model = getModel(conn, tableName);
      const id = new mongoose.Types.ObjectId(params.id as string);
      const result = await Model.findByIdAndUpdate(id, { $unset: body }, { new: true });
      if (!result) throw new NotFoundError(`Resource not found with id: ${params.id}`);
      return { success: true, data: result };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message, status: error.status };
      }
      return { success: false, error: error.message || "Failed to remove keys from body" };
    }
  },

  directAggregation: async (database: string, tableName: string, pipelineBody: any[]) => {
    try {
      // 1. Get the connection and model
      const conn = await getDbConnection(database);
      const Model = getModel(conn, tableName);
      
      // 2. Process each pipeline stage to convert string ObjectIds to real ObjectIds
      const processedPipeline = pipelineBody.map(stage => {
        // Process each stage object
        const processedStage: any = {};
        for (const [key, value] of Object.entries(stage)) {
          processedStage[key] = convertStringsToObjectIdsAndDates(value, Model.schema);
        }
        return processedStage;
      });
      
      // 3. Run the aggregation directly with the processed pipeline
      const result = await Model.aggregate(processedPipeline);
      
      // 4. Return the raw result
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        return { success: false, error: error.message, status: error.status };
      }
      return { 
        success: false, 
        error: error.message || "Failed to execute direct aggregation",
        stack: error.stack
      };
    }
  }
};

export default searchService;