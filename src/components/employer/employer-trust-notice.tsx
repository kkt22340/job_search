import { FileText } from "lucide-react";

/**
 * 사업자 유무와 관계없이 근로계약서 사용을 권장하는 신뢰·법무 안내
 */
export function EmployerTrustNotice() {
  return (
    <div
      role="note"
      className="rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-4 text-[15px] leading-snug text-amber-950 shadow-sm"
    >
      <div className="flex gap-3">
        <FileText
          className="mt-0.5 h-6 w-6 shrink-0 text-amber-800"
          strokeWidth={2}
          aria-hidden
        />
        <div>
          <p className="font-semibold text-amber-950">
            사업자 없어도 고용은 가능하지만,
          </p>
          <p className="mt-1 font-semibold text-amber-950">
            근로계약서는 저희 앱에서 꼭 쓰세요!
          </p>
          <p className="mt-3 text-[15px] font-normal leading-relaxed text-amber-950/90">
            백구는 직업 정보를 연결해 드리는 서비스예요. 고용이 이루어질 때는
            분쟁 예방을 위해 앱에서 제공하는 근로계약서 양식을 활용해 주시면
            사장님과 일하시는 분 모두에게 도움이 됩니다. (상세는 추후 앱 내
            안내·법무 검토 예정)
          </p>
        </div>
      </div>
    </div>
  );
}
