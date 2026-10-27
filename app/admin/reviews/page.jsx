'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const headers = () => { const token = localStorage.getItem('admin_token'); return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }; };
  async function load() {
    try {
      const response = await fetch('/api/admin/reviews', { credentials: 'include', headers: headers(), cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load reviews');
      setReviews(data.reviews || []);
    } catch (error) { setMessage(error.message); }
  }
  useEffect(() => { load(); }, []);
  async function moderate(id, status) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: 'PATCH', credentials: 'include', headers: headers(), body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update review');
      await load(); setMessage('Review updated.');
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <AdminLayout><h1 className="text-2xl font-bold mb-3">Customer Reviews</h1><p className="text-sm text-gray-600 mb-6">New feedback stays private until approved. Publish genuine feedback, including fair criticism. Buyer verification is checked separately.</p>{message && <p role="status" className="p-3 border rounded-xl mb-4">{message}</p>}<div className="space-y-4">{reviews.map(review => <article key={review._id} className="bg-white border rounded-xl p-5"><div className="flex justify-between gap-4"><strong>{review.name}</strong><span>{review.rating}/5 · {review.status || 'unreviewed'}</span></div><p className="text-xs text-gray-500 my-2">{review.productName || review.productId}</p><p className="text-sm whitespace-pre-wrap mb-4">{review.comment}</p><div className="flex gap-3"><button disabled={busy || review.status === 'approved'} onClick={() => moderate(review._id, 'approved')} className="rounded-lg px-4 py-2 bg-[#171A20] text-white disabled:opacity-40">Approve</button><button disabled={busy || review.status === 'hidden'} onClick={() => moderate(review._id, 'hidden')} className="rounded-lg px-4 py-2 border disabled:opacity-40">Hide</button></div></article>)}{!reviews.length && <p>No feedback to review yet.</p>}</div></AdminLayout>;
}
