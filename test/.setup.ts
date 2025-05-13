// test/.setup.js
// Import tsx to enable TypeScript import resolution
import('tsx/esm').catch(e => {
  console.error('Failed to import tsx:', e);
});

// Configure Node.js to use the experimental specifier resolution
process.env.NODE_OPTIONS = '--experimental-specifier-resolution=node';