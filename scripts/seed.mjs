// Builds data/shop.db with deterministic, invented data (fixed seed).
import { DatabaseSync } from "node:sqlite";
import { rmSync } from "node:fs";

const path = new URL("../data/shop.db", import.meta.url).pathname;
rmSync(path, { force: true });
const db = new DatabaseSync(path);
let s = 42;
const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];

db.exec(`
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, city TEXT NOT NULL, country TEXT NOT NULL, signup_date TEXT NOT NULL);
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price REAL NOT NULL, stock INTEGER NOT NULL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), order_date TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('pending','shipped','delivered','cancelled')));
CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL, unit_price REAL NOT NULL);
`);

const first = ["Ana","Bruno","Carla","David","Eva","Filipe","Gina","Hugo","Ines","Joao","Lara","Marco","Nina","Oscar","Paula","Rui","Sara","Tiago","Vera","Xavier"];
const last = ["Silva","Costa","Martin","Smith","Garcia","Rossi","Müller","Dubois","Novak","Jensen"];
const places = [["Lisbon","Portugal"],["Porto","Portugal"],["Madrid","Spain"],["Barcelona","Spain"],["Paris","France"],["Berlin","Germany"],["Rome","Italy"],["Amsterdam","Netherlands"]];
const insC = db.prepare("INSERT INTO customers VALUES (?,?,?,?,?,?)");
for (let i = 1; i <= 60; i++) {
  const n = `${pick(first)} ${pick(last)}`;
  const [city, country] = pick(places);
  const d = new Date(Date.UTC(2025, 0, 1) + Math.floor(rnd() * 600) * 86400000).toISOString().slice(0, 10);
  insC.run(i, n, `customer${i}@example.com`, city, country, d);
}
const products = [
  ["Wireless Mouse","Electronics",24.9],["Mechanical Keyboard","Electronics",89],["USB-C Hub","Electronics",39.5],["27in Monitor","Electronics",229],["Webcam HD","Electronics",54],
  ["Noise-cancelling Headphones","Electronics",149],["Desk Lamp","Home",29.9],["Office Chair","Home",199],["Standing Desk","Home",349],["Coffee Mug","Home",9.5],
  ["Notebook A5","Stationery",4.5],["Gel Pens (10)","Stationery",7.9],["Backpack","Accessories",59],["Laptop Sleeve","Accessories",24],["Water Bottle","Accessories",15],
  ["Phone Stand","Accessories",12.5],["Plant Pot","Home",18],["Sticky Notes","Stationery",3.2],["Bluetooth Speaker","Electronics",69],["Cable Organizer","Accessories",8.9],
];
const insP = db.prepare("INSERT INTO products VALUES (?,?,?,?,?)");
products.forEach(([n, c, p], i) => insP.run(i + 1, n, c, p, Math.floor(rnd() * 200)));
const insO = db.prepare("INSERT INTO orders VALUES (?,?,?,?)");
const insI = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?,?,?,?)");
const statuses = ["delivered","delivered","delivered","shipped","pending","cancelled"];
for (let o = 1; o <= 150; o++) {
  const d = new Date(Date.UTC(2026, 0, 1) + Math.floor(rnd() * 300) * 86400000).toISOString().slice(0, 10);
  insO.run(o, 1 + Math.floor(rnd() * 60), d, pick(statuses));
  const k = 1 + Math.floor(rnd() * 3);
  for (let j = 0; j < k; j++) {
    const pid = 1 + Math.floor(rnd() * products.length);
    insI.run(o, pid, 1 + Math.floor(rnd() * 4), products[pid - 1][2]);
  }
}
db.exec("VACUUM");
db.close();
console.log("wrote", path);
