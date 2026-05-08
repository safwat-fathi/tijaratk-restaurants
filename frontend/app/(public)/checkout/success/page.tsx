import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type CheckoutSuccessPageProps = {
	searchParams: Promise<{
		orderId?: string;
		mobile?: string;
		branchId?: string;
		deliveryServiceCode?: string;
	}>;
};

const trackingSteps = [
	{ label: "تم استلام الطلب", status: "مكتمل" },
	{ label: "جاري تجهيز الطلب", status: "قيد التنفيذ" },
	{ label: "خرج للتوصيل", status: "قريباً" },
	{ label: "تم التوصيل", status: "قريباً" },
] as const;

export const metadata = {
	title: "تم استلام الطلب",
	description: "تأكيد استلام طلبك ومتابعة حالة الطلب.",
};

export default async function CheckoutSuccessPage({
	searchParams,
}: CheckoutSuccessPageProps) {
	const params = await searchParams;
	const orderId = params.orderId || "سيظهر قريباً";
	const mobile = params.mobile || "غير متوفر";
	const menuHref =
		params.branchId && params.deliveryServiceCode
			? `/menu?branchId=${params.branchId}&deliveryServiceCode=${params.deliveryServiceCode}`
			: "/";

	return (
		<main className="min-h-screen bg-[#fff8f5] px-4 py-8">
			<section className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-3xl border border-[#e9e1dc] bg-white p-6 text-center shadow-sm sm:p-8">
				<CheckCircle2 className="mb-5 h-20 w-20 text-green-600" />
				<p className="font-tajawal text-sm font-bold text-green-700">
					تم إرسال الطلب بنجاح
				</p>
				<h1 className="mt-2 font-aref-ruqaa text-4xl text-[#1e1b18]">
					تم استلام طلبك
				</h1>
				<p className="mt-3 max-w-md font-tajawal text-base leading-7 text-[#55423e]">
					هذه بيانات تتبع مؤقتة حتى يتم ربط صفحة النجاح بتفاصيل الطلب الحقيقية.
				</p>

				<div className="mt-6 grid w-full gap-3 rounded-2xl bg-[#fff8f5] p-4 text-start font-tajawal text-sm text-[#55423e] sm:grid-cols-2">
					<div>
						<span className="block text-xs text-[#8a746c]">رقم الطلب</span>
						<strong className="text-[#1e1b18]">{orderId}</strong>
					</div>
					<div>
						<span className="block text-xs text-[#8a746c]">رقم الهاتف</span>
						<strong className="text-[#1e1b18]" dir="ltr">
							{mobile}
						</strong>
					</div>
				</div>

				<div className="mt-6 w-full space-y-3 text-start">
					{trackingSteps.map((step, index) => (
						<div
							key={step.label}
							className="flex items-center gap-3 rounded-2xl border border-[#e9e1dc] bg-white p-4"
						>
							<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#812f1d] font-noto-sans-arabic text-sm font-bold text-white">
								{index + 1}
							</span>
							<div className="flex-1 font-tajawal">
								<p className="font-bold text-[#1e1b18]">{step.label}</p>
								<p className="text-sm text-[#8a746c]">{step.status}</p>
							</div>
						</div>
					))}
				</div>

				<div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
					<Link
						href={menuHref}
						className="flex-1 rounded-[4px] border border-[#dcc1bb] bg-white px-5 py-3 font-aref-ruqaa text-xl text-[#812f1d] transition-colors hover:bg-[#f5ece7]"
					>
						العودة للقائمة
					</Link>
					<Link
						href="/"
						className="flex-1 rounded-[4px] bg-[#812f1d] px-5 py-3 font-aref-ruqaa text-xl text-white shadow-md transition-colors hover:bg-[#a04632]"
					>
						الصفحة الرئيسية
					</Link>
				</div>
			</section>
		</main>
	);
}
