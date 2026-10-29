// The repository root is CommonJS; the server workspace is ESM.
// Importing the module is cached by Node, including its Express app and DB connector.
module.exports = async function handler(req, res) {
  const { default: handleRequest } = await import('../server/src/serverless.js');
  return handleRequest(req, res);
};
