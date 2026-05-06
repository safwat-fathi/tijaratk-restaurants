'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { rejectOrderByTrackingAction } from '@/actions/order-tracking-actions';
import { formatCurrency } from '@/lib/utils/currency';
import {
  formatArabicQuantity,
  formatRtlQuantityLabel,
} from '@/lib/utils/number';
import { OrderStatus } from '@/types/enums';
import { OrderItem } from '@/types/models/order';

type TrackingOrderItemsCardProps = {
  token: string;
  initialOrderStatus: OrderStatus;
  initialItems: OrderItem[];
};

export default function TrackingOrderItemsCard({
  token,
  initialOrderStatus,
  initialItems,
}: TrackingOrderItemsCardProps) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(initialOrderStatus);
  const [orderRejectReason, setOrderRejectReason] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isDecisionWindow =
    orderStatus === OrderStatus.DRAFT || orderStatus === OrderStatus.CONFIRMED;

  const handleRejectOrder = () => {
    startTransition(async () => {
      const reason = orderRejectReason.trim();
      const response = await rejectOrderByTrackingAction(token, {
        reason: reason || undefined,
      });

      if (!response.success) {
        setFeedback(response.error || 'تعذر رفض الطلب');
        return;
      }

      setOrderStatus(OrderStatus.REJECTED_BY_CUSTOMER);
      router.refresh();
      setFeedback('تم رفض الطلب بالكامل');
    });
  };

  const resolveSelectionText = (item: OrderItem): string => {
    if (item.selection_mode === 'weight' && item.selection_grams) {
      return `${formatArabicQuantity(item.selection_grams) || item.selection_grams} جم`;
    }

    if (item.selection_mode === 'price' && item.selection_amount_egp) {
      const selectionAmount = Number(item.selection_amount_egp);
      return `${formatArabicQuantity(selectionAmount) || selectionAmount} جنيه`;
    }

    if (item.selection_mode === 'quantity' && item.selection_quantity) {
      return (
        formatArabicQuantity(item.selection_quantity) ||
        String(item.selection_quantity)
      );
    }

    return formatArabicQuantity(item.quantity) || item.quantity;
  };

  return (
    <>
      {isDecisionWindow && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">رفض الطلب بالكامل</p>
          <p className="mt-1 text-xs text-red-700">
            يمكنك رفض الطلب بالكامل طالما الطلب في حالة قيد المراجعة أو مؤكد.
          </p>
          <textarea
            value={orderRejectReason}
            onChange={(event) => setOrderRejectReason(event.target.value)}
            placeholder="سبب الرفض (اختياري)"
            rows={2}
            className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
          />
          <button
            type="button"
            onClick={handleRejectOrder}
            disabled={isPending}
            className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            رفض الطلب
          </button>
        </div>
      )}

      {feedback && (
        <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {feedback}
        </p>
      )}

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {initialItems && initialItems.length > 0 ? (
          initialItems.map((item) => {
            const displayName = item.name_snapshot;

            return (
              <li key={item.id} className="py-3 pl-3 pr-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="w-0 flex-1">
                    <span className="ml-2 block truncate font-medium">
                      {formatRtlQuantityLabel(
                        displayName,
                        resolveSelectionText(item),
                      )}
                    </span>
                  </div>
                  <div className="ml-4 shrink-0">
                    {item.total_price !== null && item.total_price !== undefined
                      ? formatCurrency(Number(item.total_price) || 0)
                      : 'يُحدد لاحقاً'}
                  </div>
                </div>
              </li>
            );
          })
        ) : (
          <li className="py-3 pl-3 pr-4 text-sm italic text-gray-700">
            لا يوجد عناصر
          </li>
        )}
      </ul>
    </>
  );
}
