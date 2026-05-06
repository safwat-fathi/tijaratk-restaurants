import StorefrontNavbar from "@/components/shared/StorefrontNavbar";
import StorefrontFooter from "@/components/shared/StorefrontFooter";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fff8f5] flex flex-col font-tajawal text-[#1e1b18] overflow-x-hidden">
      <StorefrontNavbar />
      <main className="grow w-full overflow-x-hidden">
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
}
