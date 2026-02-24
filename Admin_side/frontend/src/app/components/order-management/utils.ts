import { Order } from './types';
import { SMART_NOTE_KEYWORDS } from './constants';

export const generateOrderDisplayId = (orderId: string, orderNumber?: string) => {
  // Prefer orderNumber from backend if available
  if (orderNumber) return orderNumber;
  if (!orderId) return '#UNKNOWN';
  const parts = orderId.split('-');
  const hash = parts[parts.length - 1] || orderId;
  return '#' + hash.slice(0, 6).toUpperCase();
};

export const getOrderTypeBadge = (type: Order['type']) => {
  return type === 'dine-in' ? 'Dine-In' : type === 'takeaway' ? 'Takeaway' : 'Delivery';
};

export const getOrderAge = (order: Order) => {
  const statusTime = order.statusUpdatedAt || order.createdAt;
  const ageInMinutes = Math.floor((Date.now() - new Date(statusTime).getTime()) / 60000);
  return ageInMinutes;
};

export const getDelayLevel = (ageInMinutes: number, status: Order['status']) => {
  if (status === 'served' || status === 'completed' || status === 'cancelled') return null;
  
  if (status === 'preparing' && ageInMinutes > 20) return 'bottleneck';
  if (ageInMinutes > 30) return 'critical';
  if (ageInMinutes > 15) return 'warning';
  return null;
};

export const getOrderPriority = (order: Order) => {
  const ageInMinutes = getOrderAge(order);
  const hasPriorityTag = order.tags?.includes('Priority');
  const isVIP = order.notes?.toLowerCase().includes('vip');
  const isUrgent = order.notes?.toLowerCase().includes('urgent');

  if (hasPriorityTag || isVIP || isUrgent || ageInMinutes > 30) {
    return { level: 'high', badge: '🔴 Urgent', color: 'bg-red-500 text-white' };
  } else if (ageInMinutes > 15) {
    return { level: 'medium', badge: '🟡 Normal', color: 'bg-yellow-500 text-white' };
  }
  return { level: 'low', badge: '🟢 Low', color: 'bg-green-500 text-white' };
};

export const parseSmartNotes = (notes?: string) => {
  if (!notes) return null;

  const highlights: Array<{ text: string; keyword: string }> = [];
  const lowerNotes = notes.toLowerCase();

  Object.keys(SMART_NOTE_KEYWORDS).forEach(keyword => {
    if (lowerNotes.includes(keyword)) {
      highlights.push({ text: keyword, keyword });
    }
  });

  return highlights;
};

export const getKitchenLoad = (activeOrders: number) => {
  if (activeOrders === 0) return { level: 'low', label: 'Low', color: 'text-green-600', bgColor: 'bg-green-100', percentage: 0 };
  if (activeOrders <= 5) return { level: 'low', label: 'Low', color: 'text-green-600', bgColor: 'bg-green-100', percentage: 33 };
  if (activeOrders <= 10) return { level: 'medium', label: 'Medium', color: 'text-orange-600', bgColor: 'bg-orange-100', percentage: 66 };
  return { level: 'high', label: 'High', color: 'text-red-600', bgColor: 'bg-red-100', percentage: 100 };
};
