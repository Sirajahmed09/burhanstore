'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { invoicePayment } from '@/lib/orders/invoice';
import './order-invoice.css';

const money = value => `PKR ${Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderInvoice({ order, sender }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !order) return null;
  const customer = order.customer || {};
  const payment = invoicePayment(order);
  const date = new Date(order.createdAt);
  return createPortal(
    <article id="burhan-order-invoice" aria-label="Parcel invoice">
      <header className="invoice-header">
        <div className="invoice-brand">
          {/* Native image keeps the local brand asset available to the print renderer. */}
          <img src="/brand/icon-192.png" alt="BURHAN STORE logo" width="76" height="76" />
          <div><h1>BURHAN STORE</h1><p>burhanstore.com</p></div>
        </div>
        <div className="invoice-meta"><h2>PARCEL INVOICE</h2><strong>#{String(order.orderNumber || order._id).toUpperCase()}</strong><p>{Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric' })}</p><p>Status: {order.status}</p></div>
      </header>

      <section className="invoice-destination">
        <h2>DELIVER TO / RECEIVER</h2>
        <strong className="invoice-customer">{customer.name}</strong>
        <div className="invoice-address" dir="auto">{customer.address}</div>
        <div className="invoice-city">{[customer.city, customer.province, customer.postalCode].filter(Boolean).join(', ')}</div>
        <div>Pakistan</div>
        <p className="invoice-phone">Phone: <bdi>{customer.phone}</bdi>{customer.alternatePhone && <> · Alternate: <bdi>{customer.alternatePhone}</bdi></>}</p>
      </section>

      <div className="invoice-routing">
        <section><h2>FROM / SENDER & RETURN ADDRESS</h2><strong>{sender?.name}</strong><div className="invoice-address" dir="auto">{sender?.address || 'Full return address not configured'}</div><p>Phone: <bdi>{sender?.phone}</bdi></p></section>
        <section><h2>COURIER / DISPATCH</h2><p>Courier: <strong>{order.shipment?.courier || 'Not assigned'}</strong></p><p>Tracking / CN: <strong>{order.shipment?.trackingNumber || 'Not assigned'}</strong></p><p>Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : String(order.paymentMethod || 'Not recorded')}</p></section>
      </div>

      <table className="invoice-items"><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{(order.items || []).map((item, index) => <tr key={index}><td>{item.name}{item.color && <div><strong>Colour: {item.color}</strong></div>}</td><td>{item.quantity}</td><td>{money(item.price)}</td><td>{money(Number(item.price || 0) * Number(item.quantity || 0))}</td></tr>)}</tbody></table>
      <section className="invoice-totals"><p><span>Subtotal</span><strong>{money(order.subtotal)}</strong></p><p><span>Delivery charges</span><strong>{money(order.shipping)}</strong></p>{Number(order.discount) > 0 && <p><span>Discount</span><strong>−{money(order.discount)}</strong></p>}<p className="invoice-grand-total"><span>Invoice total</span><strong>{money(payment.total)}</strong></p></section>
      <section className="invoice-collection"><span>{payment.collect !== null ? 'CASH TO COLLECT ON DELIVERY' : payment.paid ? 'PAYMENT RECEIVED' : 'VERIFY PAYMENT BEFORE DISPATCH'}</span><strong>{payment.collect !== null ? money(payment.collect) : payment.paid ? 'PAID' : 'NOT COD'}</strong></section>
      <footer className="invoice-footer">Thank you for shopping with BURHAN STORE.<br />This invoice is not proof of payment or a courier booking label.</footer>
    </article>, document.body
  );
}
