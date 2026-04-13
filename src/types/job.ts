/** 지도·목록용 신뢰 표시(서버에서 employer 기준으로 병합) */
export type JobPinTrust = {
  /** 사업자 인증 테이블 기준 */
  businessVerified: boolean;
  /** profiles.identity_verified_at 존재 */
  identityVerified: boolean;
};

export type JobPin = {
  id: string;
  title: string;
  company: string;
  wageLabel: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  /** Supabase 연동 시에만 채움 · MOCK은 샘플용 */
  trust?: JobPinTrust;
};
