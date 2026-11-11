/** Orders, kept in .data/orders.json (see store.ts for what production needs instead). */
import type { Order } from "../orders";
import { collection } from "./store";

const orders = collection<Order>("orders");

export const listOrders = orders.list;
export const getOrder = orders.get;
export const createOrder = orders.create;
export const updateOrder = orders.update;
