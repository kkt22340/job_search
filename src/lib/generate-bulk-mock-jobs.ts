import "server-only";

import { faker } from "@faker-js/faker";

import type { JobPin } from "@/types/job";

const TITLES = [
  "편의점 계산·진열",
  "아파트 단지 순찰",
  "주차장 요금 안내",
  "배달 물품 분류",
  "시험 감독 보조",
  "전시 안내 도슨트",
  "등하교 안전 도우미",
  "행정 서류 정리",
  "데이터 라벨링",
  "카페 홀·설거지",
  "경비실 안내",
  "무거운 물품 옮기기",
] as const;

const COMPANIES = [
  "행복마트",
  "한강힐스",
  "시청협력",
  "샘물학교",
  "테크파트너스",
  "느린걸음",
  "국립박물관",
  "서울시 대행",
] as const;

const DISTRICTS = [
  "종로구",
  "중구",
  "용산구",
  "마포구",
  "성동구",
  "광진구",
] as const;

const CATEGORIES = [
  "생활 서비스",
  "전문/교육",
  "공공/돌봄",
  "디지털/신규",
] as const;

/**
 * PRD §14.3 — 지도·필터 성능 검증용 가짜 핀.
 * 서버에서만 호출할 것(번들에 Faker가 클라이언트로 새지 않도록).
 */
export function generateBulkMockJobPins(count: number, seed: number): JobPin[] {
  faker.seed(seed);
  const baseLat = 37.5665;
  const baseLng = 126.978;
  const pins: JobPin[] = [];
  for (let i = 0; i < count; i++) {
    const lat = baseLat + faker.number.float({ min: -0.11, max: 0.11 });
    const lng = baseLng + faker.number.float({ min: -0.14, max: 0.14 });
    const titleBase = faker.helpers.arrayElement([...TITLES]);
    const title =
      i % 11 === 0 ? `${titleBase} (야간·교대)` : `${titleBase} 모집`;
    const hourly = faker.number.int({ min: 9860, max: 15000 });
    const trustRoll = faker.number.int({ min: 0, max: 9 });
    const pin: JobPin = {
      id: `dev-${seed}-${i}`,
      title,
      company: `${faker.helpers.arrayElement([...COMPANIES])} ${faker.number.int({ min: 1, max: 9 })}호점`,
      wageLabel: `시급 ${hourly.toLocaleString("ko-KR")}원`,
      address: `서울 ${faker.helpers.arrayElement([...DISTRICTS])} 데모길 ${faker.number.int({ min: 1, max: 120 })}`,
      lat,
      lng,
      category: faker.helpers.arrayElement([...CATEGORIES]),
    };
    if (trustRoll < 3) {
      pin.trust = {
        businessVerified: trustRoll !== 1,
        identityVerified: trustRoll !== 2,
      };
    }
    pins.push(pin);
  }
  return pins;
}
