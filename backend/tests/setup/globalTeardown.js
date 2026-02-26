/**
 * Global Test Teardown
 * Runs once after all test suites
 */
export default async function globalTeardown() {
  if (globalThis.__MONGOD__) {
    await globalThis.__MONGOD__.stop();
    console.log("\n🧪 Test MongoDB stopped\n");
  }
}
