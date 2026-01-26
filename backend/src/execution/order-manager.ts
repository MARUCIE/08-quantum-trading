/**
 * Order Manager
 *
 * Manages order lifecycle and state synchronization.
 */

import type {
  OrderRequest,
  Order,
  OrderStatus,
  Fill,
  VenueAdapter,
} from '../types/execution';
import type { RiskCheckResult } from '../types/risk';

type OrderCallback = (order: Order) => void;

export class OrderManager {
  private orders: Map<string, Order> = new Map();
  private ordersByClient: Map<string, string> = new Map(); // clientOrderId -> orderId
  private adapter: VenueAdapter | null = null;
  private callbacks: Map<string, Set<OrderCallback>> = new Map();
  private orderIdCounter: number = 0;

  /**
   * Set venue adapter
   */
  setAdapter(adapter: VenueAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Submit order (with pre-trade risk check)
   */
  async submitOrder(
    request: OrderRequest,
    riskCheck?: RiskCheckResult
  ): Promise<Order> {
    // Check risk result if provided
    if (riskCheck && !riskCheck.passed) {
      const order = this.createRejectedOrder(request, 'Risk check failed: ' + riskCheck.blockers.join(', '));
      this.storeOrder(order);
      return order;
    }

    // Create pending order
    const order = this.createPendingOrder(request);
    this.storeOrder(order);
    this.notifySubscribers(order);

    // Submit to venue
    if (this.adapter) {
      try {
        const submittedOrder = await this.adapter.submitOrder(request);
        this.updateOrder(order.orderId, submittedOrder);
        return submittedOrder;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const rejectedOrder = this.rejectOrder(order.orderId, errorMessage);
        return rejectedOrder || order;
      }
    }

    // No adapter - order stays pending
    return order;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) return false;

    if (['filled', 'cancelled', 'rejected', 'expired'].includes(order.status)) {
      return false;
    }

    if (this.adapter) {
      const success = await this.adapter.cancelOrder(order.orderId);
      if (success) {
        this.updateOrderStatus(orderId, 'cancelled');
      }
      return success;
    }

    // No adapter - just mark as cancelled
    this.updateOrderStatus(orderId, 'cancelled');
    return true;
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(symbol?: string): Promise<number> {
    let cancelled = 0;

    for (const order of this.orders.values()) {
      if (symbol && order.symbol !== symbol) continue;
      if (['pending', 'submitted', 'partial'].includes(order.status)) {
        const success = await this.cancelOrder(order.orderId);
        if (success) cancelled++;
      }
    }

    return cancelled;
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Get order by client order ID
   */
  getOrderByClientId(clientOrderId: string): Order | undefined {
    const orderId = this.ordersByClient.get(clientOrderId);
    return orderId ? this.orders.get(orderId) : undefined;
  }

  /**
   * Get open orders
   */
  getOpenOrders(symbol?: string): Order[] {
    return Array.from(this.orders.values()).filter((o) => {
      if (symbol && o.symbol !== symbol) return false;
      return ['pending', 'submitted', 'partial'].includes(o.status);
    });
  }

  /**
   * Get all orders
   */
  getAllOrders(symbol?: string): Order[] {
    const orders = Array.from(this.orders.values());
    if (symbol) {
      return orders.filter((o) => o.symbol === symbol);
    }
    return orders;
  }

  /**
   * Subscribe to order updates
   */
  subscribe(orderId: string, callback: OrderCallback): void {
    if (!this.callbacks.has(orderId)) {
      this.callbacks.set(orderId, new Set());
    }
    this.callbacks.get(orderId)!.add(callback);
  }

  /**
   * Unsubscribe from order updates
   */
  unsubscribe(orderId: string, callback: OrderCallback): void {
    this.callbacks.get(orderId)?.delete(callback);
  }

  /**
   * Process fill
   */
  processFill(fill: Fill): void {
    const order = this.orders.get(fill.orderId);
    if (!order) return;

    order.fills.push(fill);
    order.filledQty += fill.quantity;
    order.commission += fill.commission;

    // Calculate average price
    const totalValue = order.fills.reduce((sum, f) => sum + f.price * f.quantity, 0);
    order.avgPrice = totalValue / order.filledQty;

    // Update status
    if (order.filledQty >= order.quantity) {
      order.status = 'filled';
    } else if (order.filledQty > 0) {
      order.status = 'partial';
    }

    order.updatedAt = Date.now();
    this.notifySubscribers(order);
  }

  /**
   * Sync orders from venue
   */
  async syncOrders(): Promise<void> {
    if (!this.adapter) return;

    const openOrders = await this.adapter.getOpenOrders();
    for (const order of openOrders) {
      this.updateOrder(order.orderId, order);
    }
  }

  private createPendingOrder(request: OrderRequest): Order {
    const orderId = `ord_${++this.orderIdCounter}_${Date.now()}`;
    return {
      ...request,
      orderId,
      status: 'pending',
      filledQty: 0,
      avgPrice: 0,
      commission: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fills: [],
    };
  }

  private createRejectedOrder(request: OrderRequest, reason: string): Order {
    const orderId = `ord_${++this.orderIdCounter}_${Date.now()}`;
    return {
      ...request,
      orderId,
      status: 'rejected',
      filledQty: 0,
      avgPrice: 0,
      commission: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fills: [],
      rejectReason: reason,
    };
  }

  private storeOrder(order: Order): void {
    this.orders.set(order.orderId, order);
    this.ordersByClient.set(order.clientOrderId, order.orderId);
  }

  private updateOrder(orderId: string, updates: Partial<Order>): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    Object.assign(order, updates, { updatedAt: Date.now() });
    this.notifySubscribers(order);
  }

  private updateOrderStatus(orderId: string, status: OrderStatus): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.status = status;
    order.updatedAt = Date.now();
    this.notifySubscribers(order);
  }

  private rejectOrder(orderId: string, reason: string): Order | undefined {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.status = 'rejected';
    order.rejectReason = reason;
    order.updatedAt = Date.now();
    this.notifySubscribers(order);
    return order;
  }

  private notifySubscribers(order: Order): void {
    const callbacks = this.callbacks.get(order.orderId);
    if (callbacks) {
      callbacks.forEach((cb) => cb(order));
    }
  }
}
