// .tsxrc.js - TSX configuration file
export default {
  // Override the default module resolution to handle .ts extensions directly in imports
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    // Enable TypeScript resolution for .ts files in imports
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.jsx': ['.tsx', '.jsx']
    }
  }
}