"use client";

import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
	subsets: ["arabic"],
	variable: "--font-tajawal",
	weight: ["300", "400", "500", "700"],
	display: "swap",
});

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="ar" dir="rtl" className="scroll-smooth">
			<body
				className={`${tajawal.variable} antialiased`}
				style={{
					fontFamily: "var(--font-tajawal), sans-serif",
					background: "hsl(var(--background))",
					color: "hsl(var(--foreground))",
					margin: 0,
					padding: 0,
				}}
			>
				<div
					style={{
						minHeight: "100svh",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: "1rem",
					}}
				>
					<div
						style={{
							width: "100%",
							maxWidth: "28rem",
							textAlign: "center",
							display: "flex",
							flexDirection: "column",
							gap: "2rem",
						}}
					>
						{/* Icon */}
						<div
							style={{
								margin: "0 auto",
								width: "5rem",
								height: "5rem",
								borderRadius: "9999px",
								background: "hsl(var(--destructive) / 0.08)",
								border: "2px solid hsl(var(--destructive) / 0.2)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								animation: "pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								style={{
									width: "2.5rem",
									height: "2.5rem",
									color: "hsl(var(--destructive))",
								}}
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="8" x2="12" y2="12" />
								<line x1="12" y1="16" x2="12.01" y2="16" />
							</svg>
						</div>

						{/* Content */}
						<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
							<h1
								style={{
									fontSize: "1.875rem",
									fontWeight: "700",
									letterSpacing: "-0.025em",
									color: "hsl(var(--foreground))",
									margin: 0,
								}}
							>
								حدث خطأ في النظام
							</h1>
							<p
								style={{
									color: "hsl(var(--muted-foreground))",
									margin: 0,
									lineHeight: "1.6",
								}}
							>
								نعتذر عن الإزعاج. حدث خطأ غير متوقع في التطبيق.
							</p>
						</div>

						{/* Error Details */}
						<div
							style={{
								width: "100%",
								background: "hsl(var(--muted))",
								borderRadius: "0.5rem",
								padding: "1rem",
								textAlign: "right",
								border: "1px solid hsl(var(--border))",
								overflow: "hidden",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									marginBottom: "0.5rem",
								}}
							>
								<span
									style={{
										width: "0.5rem",
										height: "0.5rem",
										borderRadius: "9999px",
										background: "hsl(var(--destructive))",
										flexShrink: 0,
									}}
								/>
								<span
									style={{
										fontSize: "0.75rem",
										fontWeight: "600",
										color: "hsl(var(--muted-foreground))",
										textTransform: "uppercase",
										letterSpacing: "0.05em",
									}}
								>
									تفاصيل الخطأ
								</span>
							</div>
							<p
								style={{
									fontSize: "0.875rem",
									fontFamily: "monospace",
									color: "hsl(var(--foreground))",
									wordBreak: "break-word",
									lineHeight: "1.6",
									margin: 0,
								}}
							>
								{error.message || "حدث خطأ غير متوقع"}
							</p>
							{error.digest && (
								<p
									style={{
										fontSize: "0.75rem",
										fontFamily: "monospace",
										color: "hsl(var(--muted-foreground))",
										marginTop: "0.5rem",
										paddingTop: "0.5rem",
										borderTop: "1px solid hsl(var(--border))",
										marginBottom: 0,
									}}
								>
									Digest ID: {error.digest}
								</p>
							)}
						</div>

						{/* Actions */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "0.75rem",
								paddingTop: "0.5rem",
							}}
						>
							{/* Primary — retry */}
							<button
								onClick={() => reset()}
								style={{
									flex: 1,
									borderRadius: "0.5rem",
									background: "hsl(var(--primary))",
									padding: "0.625rem 1rem",
									fontSize: "0.875rem",
									fontWeight: "600",
									color: "hsl(var(--primary-foreground))",
									border: "none",
									cursor: "pointer",
									transition: "opacity 0.15s, transform 0.1s",
									fontFamily: "var(--font-tajawal), sans-serif",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.opacity = "0.9")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.opacity = "1")
								}
								onMouseDown={(e) =>
									(e.currentTarget.style.transform = "scale(0.98)")
								}
								onMouseUp={(e) =>
									(e.currentTarget.style.transform = "scale(1)")
								}
							>
								حاول مرة أخرى
							</button>

							{/* Secondary — home */}
							<button
								onClick={() => (window.location.href = "/")}
								style={{
									flex: 1,
									borderRadius: "0.5rem",
									background: "transparent",
									padding: "0.625rem 1rem",
									fontSize: "0.875rem",
									fontWeight: "600",
									color: "hsl(var(--foreground))",
									border: "1px solid hsl(var(--border))",
									cursor: "pointer",
									transition: "background 0.15s, transform 0.1s",
									fontFamily: "var(--font-tajawal), sans-serif",
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.background = "hsl(var(--muted))")
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.background = "transparent")
								}
								onMouseDown={(e) =>
									(e.currentTarget.style.transform = "scale(0.98)")
								}
								onMouseUp={(e) =>
									(e.currentTarget.style.transform = "scale(1)")
								}
							>
								الصفحة الرئيسية
							</button>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
