// End-to-end smoke test. Run the API first, then:  node scripts/smoke-test.mjs
// WARNING: it creates real orders/users in the database it is pointed at. Use a dev/test database.
const BASE = process.env.API_URL || "http://localhost:3000/api";
let passed = 0, failed = 0;

const ok = (cond, label, extra = "") => {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label} ${extra}`); }
};

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
}

const login = async (email, password) => (await call("POST", "/auth/login", { body: { email, password } }));

console.log("\nAuth");
const bad = await login("admin@cafe.com", "wrong");
ok(bad.status === 401, "wrong password is rejected");
const a = await login("admin@cafe.com", "admin123");
const c = await login("cashier@cafe.com", "cashier123");
ok(a.status === 200 && a.data.token, "admin can sign in");
ok(c.status === 200 && c.data.user.role === "cashier", "cashier can sign in");
ok(!("password" in a.data.user), "login response has no password");
const AT = a.data.token, CT = c.data.token;
ok((await call("GET", "/products")).status === 401, "no token -> 401");
ok((await call("GET", "/products", { token: "garbage" })).status === 401, "bad token -> 401");

console.log("\nPermissions");
ok((await call("GET", "/users", { token: CT })).status === 403, "cashier cannot list users");
ok((await call("POST", "/products", { token: CT, body: { product_name: "X", price: 1 } })).status === 403, "cashier cannot create products");
ok((await call("GET", "/reports/dashboard", { token: CT })).status === 403, "cashier cannot see reports");
const users = await call("GET", "/users", { token: AT });
ok(users.status === 200 && users.data.every((u) => !("password" in u)), "users list never exposes password hashes");

console.log("\nCheckout maths (10% tax configured, 10% discount)");
const prods = (await call("GET", "/products", { token: CT })).data;
const byName = (n) => prods.find((p) => p.product_name === n);
const capp = byName("Cappuccino"), croi = byName("Butter Croissant"), sand = byName("Cheese Sandwich");
const sandStart = sand.stock_quantity, croiStart = croi.stock_quantity;

const o1 = await call("POST", "/orders", { token: CT, body: {
  items: [{ product_id: capp.id, quantity: 2 }, { product_id: croi.id, quantity: 1 }, { product_id: sand.id, quantity: sandStart }],
  order_type: "dine_in", table_no: "5", payment_method: "cash", amount_paid: 50,
  discount_type: "percent", discount_value: 10,
}});
ok(o1.status === 201, "order created", JSON.stringify(o1.data));
const expSub = 2 * capp.price + croi.price + sandStart * sand.price;
const expDisc = Math.round(expSub * 100 * 0.10) / 100;
const expTax = Math.round((expSub * 100 - expDisc * 100) * 0.10) / 100;
const expTotal = Math.round((expSub - expDisc + expTax) * 100) / 100;
ok(Math.abs(o1.data.subtotal - expSub) < 0.001, `subtotal ${o1.data.subtotal} = ${expSub.toFixed(2)}`);
ok(Math.abs(o1.data.discount - expDisc) < 0.001, `discount ${o1.data.discount} = ${expDisc.toFixed(2)}`);
ok(Math.abs(o1.data.tax - expTax) < 0.001, `tax ${o1.data.tax} = ${expTax.toFixed(2)}`);
ok(Math.abs(o1.data.total - expTotal) < 0.001, `total ${o1.data.total} = ${expTotal.toFixed(2)}`);
ok(Math.abs(o1.data.change_amount - (50 - expTotal)) < 0.001, `change ${o1.data.change_amount}`);
ok(o1.data.items.length === 3 && /^#\d{5}$/.test(o1.data.order_no), "items + order number returned");

console.log("\nStock");
const after = (await call("GET", "/products", { token: CT })).data;
ok(after.find((p) => p.id === croi.id).stock_quantity === croiStart - 1, "croissant stock decreased by 1");
ok(after.find((p) => p.id === sand.id).stock_quantity === 0, "sandwich sold out");
const oos = await call("POST", "/orders", { token: CT, body: { items: [{ product_id: sand.id, quantity: 1 }], payment_method: "card" } });
ok(oos.status === 409, "cannot sell out-of-stock item", oos.data?.message);
const nostock = byName("Espresso");
const o2 = await call("POST", "/orders", { token: CT, body: { items: [{ product_id: nostock.id, quantity: 3 }], payment_method: "card" } });
ok(o2.status === 201 && o2.data.change_amount === 0 && o2.data.amount_paid === o2.data.total, "card payment: paid == total, no change");

console.log("\nValidation");
ok((await call("POST", "/orders", { token: CT, body: { items: [] } })).status === 400, "empty order rejected");
ok((await call("POST", "/orders", { token: CT, body: { items: [{ product_id: capp.id, quantity: 0 }] } })).status === 400, "quantity 0 rejected");
ok((await call("POST", "/orders", { token: CT, body: { items: [{ product_id: capp.id, quantity: 1 }], payment_method: "cash", amount_paid: 1 } })).status === 400, "cash less than total rejected");
ok((await call("POST", "/orders", { token: CT, body: { items: [{ product_id: 999999, quantity: 1 }], payment_method: "card" } })).status === 400, "unknown product rejected");
ok((await call("POST", "/orders", { token: CT, body: { items: [{ product_id: capp.id, quantity: 1 }], payment_method: "card", discount_type: "percent", discount_value: 150 } })).status === 400, "discount > 100% rejected");

console.log("\nOrder history + permissions");
const mine = await call("GET", "/orders?limit=50", { token: CT });
ok(mine.status === 200 && mine.data.some((o) => o.id === o1.data.id), "cashier sees own orders");
const adminOrder = await call("POST", "/orders", { token: AT, body: { items: [{ product_id: capp.id, quantity: 1 }], payment_method: "card" } });
ok(adminOrder.status === 201, "admin can also sell");
ok((await call("GET", `/orders/${adminOrder.data.id}`, { token: CT })).status === 403, "cashier cannot open another user's order");
ok(!(await call("GET", "/orders?limit=100", { token: CT })).data.some((o) => o.id === adminOrder.data.id), "cashier list excludes other users' orders");
ok((await call("GET", "/orders?limit=100", { token: AT })).data.some((o) => o.id === o1.data.id), "admin sees everyone's orders");

console.log("\nVoid");
ok((await call("POST", `/orders/${o1.data.id}/void`, { token: CT, body: { reason: "x" } })).status === 403, "cashier cannot void");
ok((await call("POST", `/orders/${o1.data.id}/void`, { token: AT, body: {} })).status === 400, "void needs a reason");
const v = await call("POST", `/orders/${o1.data.id}/void`, { token: AT, body: { reason: "Customer changed mind" } });
ok(v.status === 200 && v.data.status === "void", "admin can void");
const restored = (await call("GET", "/products", { token: CT })).data;
ok(restored.find((p) => p.id === sand.id).stock_quantity === sandStart, "voiding restores stock");
ok((await call("POST", `/orders/${o1.data.id}/void`, { token: AT, body: { reason: "again" } })).status === 400, "cannot void twice");

console.log("\nConcurrency (two cashiers buy the last item at the same time)");
const last = await call("POST", "/products", { token: AT, body: { product_name: `Last Slice ${Date.now()}`, price: 5, track_stock: true, stock_quantity: 1 } });
const race = await Promise.all([1, 2, 3, 4].map(() =>
  call("POST", "/orders", { token: CT, body: { items: [{ product_id: last.data.id, quantity: 1 }], payment_method: "card" } })));
const wins = race.filter((r) => r.status === 201).length;
ok(wins === 1, `exactly 1 of 4 simultaneous orders succeeded (got ${wins})`);
ok((await call("GET", `/products/${last.data.id}`, { token: AT })).data.stock_quantity === 0, "stock is 0, never negative");

console.log("\nDashboard");
const d = await call("GET", "/reports/dashboard?range=7d", { token: AT });
ok(d.status === 200, "dashboard loads");
ok(d.data.series.length === 7, "series has 7 days");
ok(d.data.kpis.orders.value >= 3, `orders KPI counts paid orders (${d.data.kpis.orders.value})`);
const todayRow = d.data.series.at(-1);
ok(todayRow.revenue > 0, `today's revenue appears on the last day (${todayRow.revenue})`);
ok(d.data.top_products.length > 0, "top products present");
ok(Array.isArray(d.data.low_stock), "low stock list present");
const voidedExcluded = d.data.kpis.revenue.value;
ok(Math.abs(voidedExcluded - d.data.series.reduce((s, x) => s + x.revenue, 0)) < 0.01, "KPI revenue == sum of chart days (voided orders excluded)");

console.log("\nUsers");
const email = `t${Date.now()}@cafe.com`;
const nu = await call("POST", "/users", { token: AT, body: { name: "Temp", email, password: "secret1", role: "cashier" } });
ok(nu.status === 201 && !("password" in nu.data), "create user");
ok((await call("POST", "/users", { token: AT, body: { name: "Temp", email, password: "secret1" } })).status === 409, "duplicate email rejected");
ok((await call("POST", "/users", { token: AT, body: { name: "T", email: "bad", password: "secret1" } })).status === 400, "invalid email rejected");
ok((await login(email, "secret1")).status === 200, "new user can sign in with hashed password");
const up = await call("PUT", `/users/${nu.data.id}`, { token: AT, body: { name: "Temp2", email, role: "cashier", status: "inactive" } });
ok(up.status === 200 && up.data.status === "inactive", "update user (no password change)");
ok((await login(email, "secret1")).status === 403, "disabled user cannot sign in");
ok((await call("DELETE", `/users/${a.data.user.id}`, { token: AT })).status === 400, "cannot delete yourself");
ok((await call("PUT", `/users/${a.data.user.id}`, { token: AT, body: { name: "Shop Owner", email: "admin@cafe.com", role: "cashier", status: "active" } })).status === 400, "cannot demote the last admin");
ok((await call("DELETE", `/users/${nu.data.id}`, { token: AT })).status === 200, "delete user");

console.log("\nProducts & categories");
const cat = await call("POST", "/categories", { token: AT, body: { name: `Test Cat ${Date.now()}` } });
ok(cat.status === 201, "create category");
const np = await call("POST", "/products", { token: AT, body: { product_name: `Test Product ${Date.now()}`, price: 9.99, category_id: cat.data.id } });
ok(np.status === 201 && np.data.category === cat.data.name, "create product in category");
ok((await call("POST", "/products", { token: AT, body: { product_name: np.data.product_name, price: 1 } })).status === 409, "duplicate product name rejected");
ok((await call("POST", "/products", { token: AT, body: { product_name: "Neg", price: -1 } })).status === 400, "negative price rejected");
const hide = await call("PUT", `/products/${np.data.id}`, { token: AT, body: { ...np.data, is_active: false } });
ok(hide.status === 200 && hide.data.is_active === 0, "deactivate product");
ok(!(await call("GET", "/products", { token: CT })).data.some((p) => p.id === np.data.id), "cashier no longer sees inactive product");
ok((await call("DELETE", `/products/${np.data.id}`, { token: AT })).status === 200, "delete product");
ok((await call("DELETE", `/categories/${cat.data.id}`, { token: AT })).status === 200, "delete category");

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
