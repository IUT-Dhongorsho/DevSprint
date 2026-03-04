import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

// Test configuration
export const options = {
  stages: [
    { duration: '20s', target: 100 }, // Extremely fast ramp-up
    { duration: '10m', target: 500 }, // Stay at 500 users for 10 mins (manual stop required)
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], 
    http_req_failed: ['rate<0.01'],   
  },
};

// Generate 500 test users (run once, shared across VUs)
const testUsers = new SharedArray("users", function () {
  const users = [];
  for (let i = 1; i <= 500; i++) {
    users.push({
      email: `testuser${i}@iut.edu`,
      password: "password123",
      studentId: `2024${String(i).padStart(3, "0")}`,
      name: `Test User ${i}`,
    });
  }
  return users;
});

// Base URL - adjust based on your environment
const BASE_URL = __ENV.API_URL || "http://gateway:4001";

export default function () {
  // Each VU gets a unique user index
  const userIndex = (__VU - 1) % testUsers.length;
  const user = testUsers[userIndex];

  let token = null;
  const today = new Date().toISOString().split("T")[0];

  // Step 1: Register user (only if not already registered)
  const registerPayload = JSON.stringify({
    email: user.email,
    password: user.password,
    confirmPassword: user.password,
    studentId: user.studentId,
    name: user.name,
  });

  let registerRes = http.post(
    `${BASE_URL}/api/identity/auth/register`,
    registerPayload,
    { headers: { "Content-Type": "application/json" } },
  );

  // If registration fails (user might already exist), try login
  if (registerRes.status !== 201) {
    console.log(`User ${user.studentId} may already exist, trying login...`);
  }

  // Step 2: Login to get token
  const loginPayload = JSON.stringify({
    studentId: user.studentId,
    password: user.password,
  });

  const loginRes = http.post(
    `${BASE_URL}/api/identity/auth/login`,
    loginPayload,
    { headers: { "Content-Type": "application/json" } },
  );

  const loginSuccess = check(loginRes, {
    "login successful": (r) => r.status === 200,
    "token received": (r) => r.json("token") !== undefined,
  });

  if (!loginSuccess) {
    console.error(
      `Login failed for user ${user.studentId}: ${loginRes.status}`,
    );
    sleep(1);
    return;
  }

  token = loginRes.json("token");

  // Step 3: Check available stock for today
  const stockRes = http.get(`${BASE_URL}/api/inventory/stock/date/${today}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(stockRes, {
    "stock check successful": (r) => r.status === 200,
  });

  if (stockRes.status !== 200) {
    console.log(`Stock check failed for ${today}`);
    sleep(1);
    return;
  }

  const stocks = stockRes.json();

  // Find available stock
  const availableStock = Array.isArray(stocks)
    ? stocks.find((s) => s.status === "Available")
    : null;

  if (!availableStock) {
    console.log(`No available stock for ${today}`);
    sleep(1);
    return;
  }

  // Step 4: Place order (only once per user)
  const orderRes = http.post(
    `${BASE_URL}/api/inventory/order`,
    null, // Body not needed as userId comes from token
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const orderSuccess = check(orderRes, {
    "order placed successfully": (r) => r.status === 201 || r.status === 200,
    "order confirmation received": (r) => r.json("id") !== undefined,
  });

  if (orderSuccess) {
    console.log(`✓ User ${user.studentId} placed order successfully`);
  } else {
    // Check if user already ordered today
    if (orderRes.status === 409 || orderRes.status === 400) {
      console.log(`User ${user.studentId} may have already ordered today`);
    } else {
      console.error(
        `Order failed for user ${user.studentId}: ${orderRes.status}`,
      );
    }
  }

  // Step 5: Verify order via notification stream? (optional)
  // This would require SSE connection which k6 doesn't support well

  // Random think time between requests (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

// Setup function - runs once before test
export function setup() {
  console.log("=== Starting Iftar Rush Load Test ===");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Users: 500, Stocks: 500, Duration: 22 minutes`);

  // Optional: Pre-create stock for today
  const adminToken = __ENV.ADMIN_TOKEN; // You'd need to provide this

  if (adminToken) {
    const today = new Date().toISOString().split("T")[0];
    const stockPayload = JSON.stringify({
      quantity: 500,
      forDate: today,
    });

    http.post(`${BASE_URL}/api/inventory/stock`, stockPayload, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Created 500 stocks for ${today}`);
  }

  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once after test
export function teardown(data) {
  console.log("=== Load Test Completed ===");
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}
