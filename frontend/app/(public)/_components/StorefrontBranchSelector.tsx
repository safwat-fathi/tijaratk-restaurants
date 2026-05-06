"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Clock, MapPin, Truck } from "lucide-react";

import { Branch } from "@/types/models/branch";

type StorefrontBranchSelectorProps = {
  branches: Branch[];
  hasBranchesError: boolean;
};

export default function StorefrontBranchSelector({
  branches,
  hasBranchesError,
}: StorefrontBranchSelectorProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const hasBranches = branches.length > 0;
  const isSelectorDisabled = !hasBranches;
  const emptyMessage = hasBranchesError
    ? "تعذر تحميل الفروع حالياً. أعد المحاولة بعد قليل"
    : "لا توجد فروع متاحة حالياً";

  return (
    <div className="space-y-6 max-w-xl mx-auto w-full">
      <div className="relative group">
        <label className="sr-only">اختر الفرع</label>
        <select
          className="w-full appearance-none bg-white border border-[#dcc1bb] hover:border-[#89726d] text-[#1e1b18] rounded-[4px] py-4 pl-4 pr-12 font-noto-sans-arabic focus:outline-none focus:ring-1 focus:ring-[#812f1d] focus:border-[#812f1d] transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:bg-[#f5ece7] disabled:text-[#89726d]"
          value={selectedBranch || ""}
          onChange={(event) => setSelectedBranch(event.target.value)}
          disabled={isSelectorDisabled}
        >
          <option value="" disabled>
            اختر الفرع
          </option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-[#89726d] group-hover:text-[#812f1d] transition-colors">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#89726d]">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      <div className="w-full bg-[#fbf2ed] border border-[#dcc1bb] rounded-[4px] min-h-[120px] flex items-center justify-center p-6 shadow-sm relative overflow-hidden transition-all duration-300">
        {!selectedBranch ? (
          <div className="text-center w-full z-10 relative animate-fade-in">
            <p className="font-noto-sans-arabic text-[#55423e] text-sm md:text-base">
              {hasBranches ? "ستظهر تفاصيل الفرع هنا بعد اختياره" : emptyMessage}
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-y-4 gap-x-2 z-10 relative animate-slide-up">
            <div className="flex items-center justify-center gap-2">
              <div className="relative flex h-3 w-3 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5c6236]"></span>
              </div>
              <span className="font-noto-sans-arabic text-[#1e1b18] font-semibold text-sm">
                مفتوح الآن
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-[#55423e]">
              <Truck className="w-4 h-4 text-[#812f1d]" />
              <span className="font-noto-sans-arabic text-sm font-medium">
                متاح: توصيل، استلام
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-[#55423e]">
              <Clock className="w-4 h-4 text-[#812f1d]" />
              <span className="font-noto-sans-arabic text-sm font-medium">
                التوصيل: ٣٠-٤٥ دقيقة
              </span>
            </div>
          </div>
        )}
      </div>

      {selectedBranch ? (
        <Link
          href={`/menu?branchId=${selectedBranch}`}
          className="w-full py-4 px-8 rounded-[4px] font-aref-ruqaa text-3xl flex items-center justify-center gap-3 transition-all duration-300 shadow-sm bg-[#812f1d] text-white hover:bg-[#a04632] hover:shadow-md hover:-translate-y-0.5 cursor-pointer border border-transparent"
        >
          <span>ابدأ الطلب</span>
        </Link>
      ) : (
        <button
          disabled
          className="w-full py-4 px-8 rounded-[4px] font-aref-ruqaa text-3xl flex items-center justify-center gap-3 transition-all duration-300 shadow-sm bg-[#f5ece7] text-[#89726d] cursor-not-allowed border border-[#dcc1bb]"
        >
          <span>ابدأ الطلب</span>
        </button>
      )}
    </div>
  );
}
