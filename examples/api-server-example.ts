/**
 * Example of creating a REST API server using the Task Master API
 * This demonstrates how to expose Task Master functionality as a web service
 * 
 * Note: This is a standalone example and requires express to be installed:
 * npm install express cors body-parser
 */

// This would be an actual import in a real application
// import express from 'express';
// import cors from 'cors';
// import bodyParser from 'body-parser';
// Import these using require() since this is just an example
const express = () => console.log('Express would be initialized here');
const cors = () => console.log('CORS middleware would be initialized here');
const bodyParser = { json: () => console.log('JSON body parser would be initialized here') };

import { ApiRouter } from '../core/api/index.ts';

/**
 * Example implementation of a REST API server for Task Master
 * In a real application, this would use actual express and middleware
 */
function createApiServer() {
  console.log('Creating Task Master API server...');
  
  // Initialize express 
  const app = express();
  
  // Add middleware
  app.use(cors());
  app.use(bodyParser.json());
  
  // Create API router
  const apiRouter = new ApiRouter('./db/taskmaster.db');
  
  // Define routes
  const router = {
    get: (path: string, handler: Function) => {
      console.log(`Registered GET route: ${path}`);
    },
    post: (path: string, handler: Function) => {
      console.log(`Registered POST route: ${path}`);
    },
    put: (path: string, handler: Function) => {
      console.log(`Registered PUT route: ${path}`);
    },
    delete: (path: string, handler: Function) => {
      console.log(`Registered DELETE route: ${path}`);
    }
  };
  
  // GET /api/tasks - Get all tasks
  router.get('/api/tasks', async (req: any, res: any) => {
    try {
      const tasks = await apiRouter.handleGetAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/tasks/:id - Get a specific task
  router.get('/api/tasks/:id', async (req: any, res: any) => {
    try {
      const task = await apiRouter.handleGetTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/tasks - Create a new task
  router.post('/api/tasks', async (req: any, res: any) => {
    try {
      const result = await apiRouter.handleExecute({
        type: 'add',
        data: req.body
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // PUT /api/tasks/:id - Update a task
  router.put('/api/tasks/:id', async (req: any, res: any) => {
    try {
      const result = await apiRouter.handleExecute({
        type: 'update',
        data: {
          id: req.params.id,
          ...req.body
        }
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // DELETE /api/tasks/:id - Delete a task
  router.delete('/api/tasks/:id', async (req: any, res: any) => {
    try {
      const result = await apiRouter.handleExecute({
        type: 'delete',
        data: {
          id: req.params.id
        }
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/search - Search for tasks
  router.post('/api/search', async (req: any, res: any) => {
    try {
      const result = await apiRouter.handleSearch(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/export - Export tasks
  router.get('/api/export', async (req: any, res: any) => {
    try {
      const format = req.query.format || 'json';
      const filter = req.query.filter;
      const result = await apiRouter.handleExport(format, filter);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/import - Import tasks
  router.post('/api/import', async (req: any, res: any) => {
    try {
      const tasks = req.body.tasks;
      const dryRun = req.query.dryRun === 'true';
      const result = await apiRouter.handleImport(tasks, dryRun);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/batch - Execute batch operations
  router.post('/api/batch', async (req: any, res: any) => {
    try {
      const dryRun = req.query.dryRun === 'true';
      const result = await apiRouter.handleBatch(req.body, dryRun);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/hierarchy - Get task hierarchy
  router.get('/api/hierarchy', async (req: any, res: any) => {
    try {
      const format = req.query.format || 'json';
      const options = {
        textStyle: req.query.textStyle,
        jsonStyle: req.query.jsonStyle,
        colors: req.query.colors === 'true'
      };
      const result = await apiRouter.handleHierarchy(format, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  console.log('API routes have been registered');
  
  // In a real server, we would do:
  // app.use('/api', router);
  // app.listen(3000, () => {
  //   console.log('Task Master API server running on http://localhost:3000/api');
  // });
  
  return {
    start: () => {
      console.log('API server started at http://localhost:3000/api');
    },
    stop: () => {
      apiRouter.close();
      console.log('API server stopped');
    }
  };
}

// Only execute if run directly
if (require.main === module) {
  const server = createApiServer();
  server.start();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down API server...');
    server.stop();
    process.exit(0);
  });
}