/**
 * 국내 휴대폰 번호 정규화 (로그인 식별자·DB 저장용: 11자리 01012345678)
 */
export function normalizeKoreanMobileLocalDigits(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("010")) {
    return d;
  }
  if (d.length === 10 && d.startsWith("10")) {
    return `0${d}`;
  }
  if (d.length >= 11 && d.startsWith("82")) {
    const rest = d.startsWith("82") ? d.slice(2) : d;
    if (rest.length === 10 && rest.startsWith("10")) {
      return `0${rest}`;
    }
  }
  return null;
}
