import type { Metadata } from "next";
import { Tajawal, Aref_Ruqaa, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
	subsets: ["arabic"],
	variable: "--font-tajawal",
	weight: ["300", "400", "500", "700"],
	display: "swap",
});

const arefRuqaa = Aref_Ruqaa({
	subsets: ["arabic"],
	variable: "--font-aref-ruqaa",
	weight: ["400", "700"],
	display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
	subsets: ["arabic"],
	variable: "--font-noto-sans-arabic",
	display: "swap",
});

export const metadata: Metadata = {
	title: {
		default: "المخبز اللبناني | مخبز لبناني أصيل",
		template: "%s | المخبز اللبناني",
	},
	description: "المخبز اللبناني هو وجهتك لتجربة المخبوزات اللبنانية الأصيلة الطازجة يومياً.",
	keywords: [
		"المخبز اللبناني",
		"مخبوزات لبنانية",
		"معجنات",
		"أكل لبناني",
		"بيروت",
		"القاهرة",
	],
	authors: [{ name: "المخبز اللبناني" }],
	creator: "المخبز اللبناني",
	publisher: "المخبز اللبناني",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		type: "website",
		locale: "ar_SA",
		url: "https://thelebanesebakery.com",
		siteName: "المخبز اللبناني",
		title: "المخبز اللبناني | مخبز لبناني أصيل",
		description: "المخبز اللبناني هو وجهتك لتجربة المخبوزات اللبنانية الأصيلة الطازجة يومياً.",
		images: [
			{
				url: "/main-logo.png",
				width: 800,
				height: 600,
				alt: "المخبز اللبناني",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "المخبز اللبناني | مخبز لبناني أصيل",
		description: "المخبز اللبناني هو وجهتك لتجربة المخبوزات اللبنانية الأصيلة الطازجة يومياً.",
		images: ["/main-logo.png"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ar" dir="rtl" className="scroll-smooth">
			<body
				className={`${tajawal.variable} ${arefRuqaa.variable} ${notoSansArabic.variable} antialiased font-sans`}
			>
				{children}
			</body>
		</html>
	);
}
