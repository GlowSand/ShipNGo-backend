/*
* /ShipNGo/backend/routes/shipment.js
*/

const { sendJson } = require("../helpers");
const { readJsonBody } = require("../helpers");
const db = require("mysql2").createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

async function createShipment(req, res) {
  try {
    const body = await readJsonBody(req);
    const { sender_id, recipient_id, weight, dimensions, shipping_cost, delivery_date } = body;
    if (!sender_id || !recipient_id || !weight || !dimensions || !shipping_cost || !delivery_date) {
      sendJson(res, 400, { error: "All fields are required." });
      return;
    }
    const sql = `
      INSERT INTO shipments (sender_id, recipient_id, weight, dimensions, shipping_cost, delivery_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [sender_id, recipient_id, weight, dimensions, shipping_cost, delivery_date]);
    sendJson(res, 200, { message: "Shipment created successfully!", shipmentId: result.insertId });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

async function getShipments(req, res) {
  try {
    const sql = "SELECT * FROM shipments";
    const [results] = await db.query(sql);
    sendJson(res, 200, results);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

async function getShipmentById(req, res, id) {
  try {
    const sql = "SELECT * FROM shipments WHERE shipment_id = ?";
    const [result] = await db.query(sql, [id]);
    if (!result || result.length === 0) {
      sendJson(res, 404, { message: "Shipment not found" });
      return;
    }
    sendJson(res, 200, result[0]);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

module.exports = {
  createShipment,
  getShipments,
  getShipmentById
};