/**
 * Preset administrative regions (centers for distance sort / map focus).
 * Not exhaustive; extend the RAW list as needed.
 */

export type PresetRegion = {
  id: string;
  label: string;
  /** Grouping label (province / metro level for UI) */
  sido: string;
  lat: number;
  lng: number;
};

/** 하단·모달 섹션 순서 */
export const SIDO_ORDER: readonly string[] = [
  "\uc11c\uc6b8",
  "\ubd80\uc0b0",
  "\ub300\uad6c",
  "\uc778\ucc9c",
  "\uad11\uc8fc",
  "\ub300\uc804",
  "\uc6b8\uc0b0",
  "\uc138\uc885",
  "\uacbd\uae30",
  "\uac15\uc6d0",
  "\ucda9\uccad\ubcf8",
  "\ucda9\uccad\ub0a8",
  "\uc804\ub77c\ubd81",
  "\uc804\ub77c\ub0a8",
  "\uacbd\uc0c1\ubd81",
  "\uacbd\uc0c1\ub0a8",
  "\uc81c\uc8fc",
];

function sidoRank(sido: string): number {
  const i = SIDO_ORDER.indexOf(sido);
  return i === -1 ? 999 : i;
}

export function groupPresetRegionsBySido(
  regions: readonly PresetRegion[]
): { sido: string; items: PresetRegion[] }[] {
  const map = new Map<string, PresetRegion[]>();
  for (const r of regions) {
    const list = map.get(r.sido);
    if (list) list.push(r);
    else map.set(r.sido, [r]);
  }
  return [...map.entries()]
    .sort((a, b) => sidoRank(a[0]) - sidoRank(b[0]))
    .map(([sido, items]) => ({
      sido,
      items: [...items].sort((x, y) => x.label.localeCompare(y.label, "ko")),
    }));
}

export function filterPresetRegionsByQuery(
  regions: readonly PresetRegion[],
  query: string
): readonly PresetRegion[] {
  const q = query.trim().replace(/\s+/g, "");
  if (!q) return regions;
  return regions.filter((r) => {
    const compact = r.label.replace(/\s+/g, "");
    return compact.includes(q) || r.sido.replace(/\s+/g, "").includes(q);
  });
}

const SL = "\uc11c\uc6b8\ud2b9\ubcc4\uc2dc";
const GG = "\uacbd\uae30";
const IC = "\uc778\ucc9c\uad11\uc5ed\uc2dc";
const BS = "\ubd80\uc0b0\uad11\uc5ed\uc2dc";
const DG = "\ub300\uad6c\uad11\uc5ed\uc2dc";
const GJ = "\uad11\uc8fc\uad11\uc5ed\uc2dc";
const DJ = "\ub300\uc804\uad11\uc5ed\uc2dc";
const US = "\uc6b8\uc0b0\uad11\uc5ed\uc2dc";
const SJ = "\uc138\uc885\ud2b9\ubcc4\uc790\uce58\uc2dc";
const GW = "\uac15\uc6d0\ud2b9\ubcc4\uc790\uce58\ub3c4";
const CB = "\ucda9\uccad\ubcf8\ub3c4";
const CN = "\ucda9\uccad\ub0a8\ub3c4";
const JB = "\uc804\ub77c\ubd81\ub3c4";
const JN = "\uc804\ub77c\ub0a8\ub3c4";
const GB = "\uacbd\uc0c1\ubd81\ub3c4";
const GN = "\uacbd\uc0c1\ub0a8\ub3c4";
const JJ = "\uc81c\uc8fc\ud2b9\ubcc4\uc790\uce58\ub3c4";

/**
 * Full administrative prefix in `label` (e.g. "서울특별시 ", "경기 ") — strip for drill-down UI.
 */
export function stripProvincePrefix(label: string, sido: string): string {
  const map: Record<string, string> = {
    "\uc11c\uc6b8": `${SL} `,
    "\uacbd\uae30": `${GG} `,
    "\uc778\ucc9c": `${IC} `,
    "\ubd80\uc0b0": `${BS} `,
    "\ub300\uad6c": `${DG} `,
    "\uad11\uc8fc": `${GJ} `,
    "\ub300\uc804": `${DJ} `,
    "\uc6b8\uc0b0": `${US} `,
    "\uac15\uc6d0": `${GW} `,
    "\ucda9\uccad\ubcf8": `${CB} `,
    "\ucda9\uccad\ub0a8": `${CN} `,
    "\uc804\ub77c\ubd81": `${JB} `,
    "\uc804\ub77c\ub0a8": `${JN} `,
    "\uacbd\uc0c1\ubd81": `${GB} `,
    "\uacbd\uc0c1\ub0a8": `${GN} `,
    "\uc81c\uc8fc": `${JJ} `,
  };
  if (sido === "\uc138\uc885") {
    if (label === SJ) return "";
    return label.startsWith(`${SJ} `)
      ? label.slice(SJ.length + 1).trim()
      : label;
  }
  const prefix = map[sido];
  if (!prefix) return label;
  if (label.startsWith(prefix)) return label.slice(prefix.length).trim();
  return label;
}

type T = [string, string, string, number, number];

const RAW: T[] = [
  ["ansan-danwon", `${GG} \uc548\uc0b0\uc2dc \ub2e8\uc6d0\uad6c`, GG, 37.3194, 126.8223],
  ["ansan-sangnok", `${GG} \uc548\uc0b0\uc2dc \uc0c1\ub85d\uad6c`, GG, 37.3015, 126.846],
  ["siheung", `${GG} \uc2dc\ud765\uc2dc`, GG, 37.38, 126.8029],
  ["gwacheon", `${GG} \uacfc\ucc9c\uc2dc`, GG, 37.4292, 126.9879],

  ["seoul-jongno", `${SL} \uc885\ub85c\uad6c`, "\uc11c\uc6b8", 37.5735, 126.9788],
  ["seoul-jung", `${SL} \uc911\uad6c`, "\uc11c\uc6b8", 37.564, 126.9979],
  ["seoul-yongsan", `${SL} \uc6a9\uc0b0\uad6c`, "\uc11c\uc6b8", 37.5326, 126.99],
  ["seoul-seongdong", `${SL} \uc131\ub3d9\uad6c`, "\uc11c\uc6b8", 37.5633, 127.0369],
  ["seoul-gwangjin", `${SL} \uad11\uc9c4\uad6c`, "\uc11c\uc6b8", 37.5384, 127.0822],
  ["seoul-dongdaemun", `${SL} \ub3d9\ub300\ubb38\uad6c`, "\uc11c\uc6b8", 37.5744, 127.0395],
  ["seoul-jungnang", `${SL} \uc911\ub791\uad6c`, "\uc11c\uc6b8", 37.606, 127.0926],
  ["seoul-seongbuk", `${SL} \uc131\ubd81\uad6c`, "\uc11c\uc6b8", 37.5894, 127.0167],
  ["seoul-gangbuk", `${SL} \uac15\ubd81\uad6c`, "\uc11c\uc6b8", 37.6396, 127.0255],
  ["seoul-dobong", `${SL} \ub3c4\ubd09\uad6c`, "\uc11c\uc6b8", 37.6688, 127.0471],
  ["seoul-nowon", `${SL} \ub178\uc6d0\uad6c`, "\uc11c\uc6b8", 37.6542, 127.0568],
  ["seoul-eunpyeong", `${SL} \uc740\ud3c9\uad6c`, "\uc11c\uc6b8", 37.6028, 126.9291],
  ["seoul-seodaemun", `${SL} \uc11c\ub300\ubb38\uad6c`, "\uc11c\uc6b8", 37.5791, 126.9368],
  ["seoul-mapo", `${SL} \ub9c8\ud3ec\uad6c`, "\uc11c\uc6b8", 37.5663, 126.9019],
  ["seoul-yangcheon", `${SL} \uc591\ucc9c\uad6c`, "\uc11c\uc6b8", 37.517, 126.8664],
  ["seoul-gangseo", `${SL} \uac15\uc11c\uad6c`, "\uc11c\uc6b8", 37.5509, 126.8495],
  ["seoul-guro", `${SL} \uad6c\ub85c\uad6c`, "\uc11c\uc6b8", 37.4954, 126.8874],
  ["seoul-geumcheon", `${SL} \uae08\ucc9c\uad6c`, "\uc11c\uc6b8", 37.4519, 126.8959],
  ["seoul-yeongdeungpo", `${SL} \uc601\ub4f1\ud3ec\uad6c`, "\uc11c\uc6b8", 37.5264, 126.8962],
  ["seoul-dongjak", `${SL} \ub3d9\uc791\uad6c`, "\uc11c\uc6b8", 37.5124, 126.9393],
  ["seoul-gwanak", `${SL} \uad00\uc545\uad6c`, "\uc11c\uc6b8", 37.4784, 126.9516],
  ["seoul-seocho", `${SL} \uc11c\ucd08\uad6c`, "\uc11c\uc6b8", 37.4837, 127.0324],
  ["seoul-gangnam", `${SL} \uac15\ub0a8\uad6c`, "\uc11c\uc6b8", 37.5172, 127.0473],
  ["seoul-songpa", `${SL} \uc1a1\ud30c\uad6c`, "\uc11c\uc6b8", 37.5145, 127.1058],
  ["seoul-gangdong", `${SL} \uac15\ub3d9\uad6c`, "\uc11c\uc6b8", 37.5301, 127.1238],

  ["gg-suwon-jangan", `${GG} \uc218\uc6d0\uc2dc \uc7a5\uc548\uad6c`, GG, 37.304, 127.01],
  ["gg-suwon-gwonseon", `${GG} \uc218\uc6d0\uc2dc \uad8c\uc120\uad6c`, GG, 37.2571, 127.028],
  ["gg-suwon-paldal", `${GG} \uc218\uc6d0\uc2dc \ud314\ub2ec\uad6c`, GG, 37.2911, 127.008],
  ["gg-suwon-yeongtong", `${GG} \uc218\uc6d0\uc2dc \uc601\ud1b5\uad6c`, GG, 37.2596, 127.046],
  ["gg-seongnam-sujeong", `${GG} \uc131\ub0a8\uc2dc \uc218\uc815\uad6c`, GG, 37.4449, 127.138],
  ["gg-seongnam-jungwon", `${GG} \uc131\ub0a8\uc2dc \uc911\uc6d0\uad6c`, GG, 37.4304, 127.137],
  ["gg-seongnam-bundang", `${GG} \uc131\ub0a8\uc2dc \ubd84\ub2f9\uad6c`, GG, 37.3826, 127.118],
  ["gg-uijeongbu", `${GG} \uc758\uc815\ubd80\uc2dc`, GG, 37.7381, 127.0337],
  ["gg-anyang-manan", `${GG} \uc548\uc591\uc2dc \ub9cc\uc548\uad6c`, GG, 37.3894, 126.922],
  ["gg-anyang-dongan", `${GG} \uc548\uc591\uc2dc \ub3d9\uc548\uad6c`, GG, 37.4016, 126.976],
  ["gg-bucheon-wonmi", `${GG} \ubd80\ucc9c\uc2dc \uc6d0\ubbf8\uad6c`, GG, 37.4989, 126.783],
  ["gg-bucheon-sosa", `${GG} \ubd80\ucc9c\uc2dc \uc18c\uc0ac\uad6c`, GG, 37.4793, 126.795],
  ["gg-bucheon-oejung", `${GG} \ubd80\ucc9c\uc2dc \uc624\uc815\uad6c`, GG, 37.5145, 126.776],
  ["gg-gwangmyeong", `${GG} \uad11\uba85\uc2dc`, GG, 37.4787, 126.8646],
  ["gg-pyeongtaek", `${GG} \ud3c9\ud0dd\uc2dc`, GG, 36.9906, 127.085],
  ["gg-dongducheon", `${GG} \ub3d9\ub450\ucc9c\uc2dc`, GG, 37.9034, 127.0606],
  ["gg-anseong", `${GG} \uc548\uc131\uc2dc`, GG, 37.0052, 127.279],
  ["gg-goyang-deogyang", `${GG} \uace0\uc591\uc2dc \ub355\uc591\uad6c`, GG, 37.6294, 126.831],
  ["gg-goyang-ilsanseo", `${GG} \uace0\uc591\uc2dc \uc77c\uc0b0\uc11c\uad6c`, GG, 37.6801, 126.747],
  ["gg-goyang-ilsandong", `${GG} \uace0\uc591\uc2dc \uc77c\uc0b0\ub3d9\uad6c`, GG, 37.6589, 126.776],
  ["gg-yongin-cheoin", `${GG} \uc6a9\uc778\uc2dc \ucc98\uc778\uad6c`, GG, 37.2343, 127.203],
  ["gg-yongin-giheung", `${GG} \uc6a9\uc778\uc2dc \uae30\ud765\uad6c`, GG, 37.274, 127.115],
  ["gg-yongin-suji", `${GG} \uc6a9\uc778\uc2dc \uc218\uc9c0\uad6c`, GG, 37.3225, 127.094],
  ["gg-paju", `${GG} \ud30c\uc8fc\uc2dc`, GG, 37.7599, 126.779],
  ["gg-icheon", `${GG} \uc774\ucc9c\uc2dc`, GG, 37.272, 127.435],
  ["gg-yangju", `${GG} \uc591\uc8fc\uc2dc`, GG, 37.7844, 127.0457],
  ["gg-guri", `${GG} \uad6c\ub9ac\uc2dc`, GG, 37.5944, 127.1296],
  ["gg-namyangju", `${GG} \ub0a8\uc591\uc8fc\uc2dc`, GG, 37.6356, 127.2165],
  ["gg-osan", `${GG} \uc624\uc0b0\uc2dc`, GG, 37.1498, 127.077],
  ["gg-uiwang", `${GG} \uc758\uc655\uc2dc`, GG, 37.3446, 126.968],
  ["gg-hanam", `${GG} \ud558\ub0a8\uc2dc`, GG, 37.5393, 127.214],
  ["gg-gimpo", `${GG} \uae40\ud3ec\uc2dc`, GG, 37.6153, 126.715],
  ["gg-hwaseong", `${GG} \ud654\uc131\uc2dc`, GG, 37.1996, 126.831],
  ["gg-gwangju-gg", `${GG} \uad11\uc8fc\uc2dc`, GG, 37.4292, 127.255],
  ["gg-yeoncheon", `${GG} \uc5f0\ucc9c\uad70`, GG, 38.0965, 127.074],
  ["gg-yeoju", `${GG} \uc5ec\uc8fc\uc2dc`, GG, 37.298, 127.637],
  ["gg-pocheon", `${GG} \ud3ec\ucc9c\uc2dc`, GG, 37.8949, 127.2007],
  ["gg-yangpyeong", `${GG} \uc591\ud3c9\uad70`, GG, 37.4912, 127.487],
  ["gg-gapyeong", `${GG} \uac00\ud3c9\uad70`, GG, 37.8314, 127.5105],

  ["incheon-jung", `${IC} \uc911\uad6c`, "\uc778\ucc9c", 37.4739, 126.6218],
  ["incheon-dong", `${IC} \ub3d9\uad6c`, "\uc778\ucc9c", 37.4739, 126.6432],
  ["incheon-michuhol", `${IC} \ubbf8\ucd94\ud640\uad6c`, "\uc778\ucc9c", 37.4636, 126.65],
  ["incheon-yeonsu", `${IC} \uc5f0\uc218\uad6c`, "\uc778\ucc9c", 37.4101, 126.6784],
  ["incheon-namdong", `${IC} \ub0a8\ub3d9\uad6c`, "\uc778\ucc9c", 37.4482, 126.7317],
  ["incheon-bupyeong", `${IC} \ubd80\ud3c9\uad6c`, "\uc778\ucc9c", 37.507, 126.7219],
  ["incheon-gyeyang", `${IC} \uacc4\uc591\uad6c`, "\uc778\ucc9c", 37.5374, 126.7377],
  ["incheon-seo", `${IC} \uc11c\uad6c`, "\uc778\ucc9c", 37.5453, 126.6758],
  ["incheon-ganghwa", `${IC} \uac15\ud654\uad70`, "\uc778\ucc9c", 37.7471, 126.485],
  ["incheon-ongjin", `${IC} \uc639\uc9c4\uad70`, "\uc778\ucc9c", 37.4467, 126.636],

  ["busan-jung", `${BS} \uc911\uad6c`, "\ubd80\uc0b0", 35.1064, 129.0324],
  ["busan-seo", `${BS} \uc11c\uad6c`, "\ubd80\uc0b0", 35.0975, 129.0245],
  ["busan-dong", `${BS} \ub3d9\uad6c`, "\ubd80\uc0b0", 35.1293, 129.0454],
  ["busan-yeongdo", `${BS} \uc601\ub3c4\uad6c`, "\ubd80\uc0b0", 35.0917, 129.0688],
  ["busan-busanjin", `${BS} \ubd80\uc0b0\uc9c4\uad6c`, "\ubd80\uc0b0", 35.1632, 129.0533],
  ["busan-dongnae", `${BS} \ub3d9\ub798\uad6c`, "\ubd80\uc0b0", 35.202, 129.0839],
  ["busan-nam", `${BS} \ub0a8\uad6c`, "\ubd80\uc0b0", 35.1366, 129.085],
  ["busan-buk", `${BS} \ubd81\uad6c`, "\ubd80\uc0b0", 35.1971, 128.9902],
  ["busan-haeundae", `${BS} \ud574\uc6b4\ub300\uad6c`, "\ubd80\uc0b0", 35.1631, 129.1636],
  ["busan-saha", `${BS} \uc0ac\ud558\uad6c`, "\ubd80\uc0b0", 35.1046, 128.9743],
  ["busan-geumjeong", `${BS} \uae08\uc815\uad6c`, "\ubd80\uc0b0", 35.2431, 129.092],
  ["busan-gangseo", `${BS} \uac15\uc11c\uad6c`, "\ubd80\uc0b0", 35.2121, 128.9819],
  ["busan-yeonje", `${BS} \uc5f0\uc81c\uad6c`, "\ubd80\uc0b0", 35.176, 129.0794],
  ["busan-suyeong", `${BS} \uc218\uc601\uad6c`, "\ubd80\uc0b0", 35.1453, 129.1134],
  ["busan-sasang", `${BS} \uc0ac\uc0c1\uad6c`, "\ubd80\uc0b0", 35.1527, 128.9907],
  ["busan-gijang", `${BS} \uae30\uc7a5\uad70`, "\ubd80\uc0b0", 35.2443, 129.2225],

  ["daegu-jung", `${DG} \uc911\uad6c`, "\ub300\uad6c", 35.8694, 128.6064],
  ["daegu-dong", `${DG} \ub3d9\uad6c`, "\ub300\uad6c", 35.8869, 128.6358],
  ["daegu-seo", `${DG} \uc11c\uad6c`, "\ub300\uad6c", 35.8719, 128.5591],
  ["daegu-nam", `${DG} \ub0a8\uad6c`, "\ub300\uad6c", 35.846, 128.5973],
  ["daegu-buk", `${DG} \ubd81\uad6c`, "\ub300\uad6c", 35.8857, 128.5828],
  ["daegu-suseong", `${DG} \uc218\uc131\uad6c`, "\ub300\uad6c", 35.8581, 128.6311],
  ["daegu-dalseo", `${DG} \ub2ec\uc11c\uad6c`, "\ub300\uad6c", 35.8294, 128.5324],
  ["daegu-dalseong", `${DG} \ub2ec\uc131\uad70`, "\ub300\uad6c", 35.7746, 128.4311],

  ["gwangju-dong", `${GJ} \ub3d9\uad6c`, "\uad11\uc8fc", 35.1462, 126.9232],
  ["gwangju-seo", `${GJ} \uc11c\uad6c`, "\uad11\uc8fc", 35.152, 126.8895],
  ["gwangju-nam", `${GJ} \ub0a8\uad6c`, "\uad11\uc8fc", 35.1329, 126.9024],
  ["gwangju-buk", `${GJ} \ubd81\uad6c`, "\uad11\uc8fc", 35.1741, 126.912],
  ["gwangju-gwangsan", `${GJ} \uad11\uc0b0\uad6c`, "\uad11\uc8fc", 35.1396, 126.7936],

  ["daejeon-dong", `${DJ} \ub3d9\uad6c`, "\ub300\uc804", 36.3512, 127.3846],
  ["daejeon-jung", `${DJ} \uc911\uad6c`, "\ub300\uc804", 36.3254, 127.422],
  ["daejeon-seo", `${DJ} \uc11c\uad6c`, "\ub300\uc804", 36.3552, 127.3838],
  ["daejeon-yuseong", `${DJ} \uc720\uc131\uad6c`, "\ub300\uc804", 36.3623, 127.344],
  ["daejeon-daedeok", `${DJ} \ub300\ub355\uad6c`, "\ub300\uc804", 36.3527, 127.4158],

  ["ulsan-jung", `${US} \uc911\uad6c`, "\uc6b8\uc0b0", 35.5684, 129.3323],
  ["ulsan-nam", `${US} \ub0a8\uad6c`, "\uc6b8\uc0b0", 35.5384, 129.3293],
  ["ulsan-dong", `${US} \ub3d9\uad6c`, "\uc6b8\uc0b0", 35.5044, 129.4166],
  ["ulsan-buk", `${US} \ubd81\uad6c`, "\uc6b8\uc0b0", 35.5827, 129.3611],
  ["ulsan-ulju", `${US} \uc6b8\uc8fc\uad70`, "\uc6b8\uc0b0", 35.5623, 129.1269],

  ["sejong", SJ, "\uc138\uc885", 36.48, 127.289],

  ["gw-chuncheon", `${GW} \ucd98\ucc9c\uc2dc`, "\uac15\uc6d0", 37.8813, 127.7298],
  ["gw-wonju", `${GW} \uc6d0\uc8fc\uc2dc`, "\uac15\uc6d0", 37.3422, 127.9202],
  ["gw-gangneung", `${GW} \uac15\ub989\uc2dc`, "\uac15\uc6d0", 37.7519, 128.8761],
  ["gw-donghae", `${GW} \ub3d9\ud574\uc2dc`, "\uac15\uc6d0", 37.5245, 129.1142],
  ["gw-sokcho", `${GW} \uc18d\ucd08\uc2dc`, "\uac15\uc6d0", 38.207, 128.5918],
  ["gw-samcheok", `${GW} \uc0bc\ucc99\uc2dc`, "\uac15\uc6d0", 37.4499, 129.1653],

  ["cb-cheongju-sangdang", `${CB} \uccad\uc8fc\uc2dc \uc0c1\ub2f9\uad6c`, CB, 36.6372, 127.4897],
  ["cb-cheongju-heungdeok", `${CB} \uccad\uc8fc\uc2dc \ud765\ub355\uad6c`, CB, 36.6372, 127.425],
  ["cb-chungju", `${CB} \ucda9\uc8fc\uc2dc`, CB, 36.9707, 127.951],
  ["cb-jecheon", `${CB} \uc81c\ucc9c\uc2dc`, CB, 37.1326, 128.1998],

  ["cn-cheonan", `${CN} \ucc9c\uc548\uc2dc`, CN, 36.8151, 127.1139],
  ["cn-gongju", `${CN} \uacf5\uc8fc\uc2dc`, CN, 36.4556, 127.1248],
  ["cn-boryeong", `${CN} \ubcf4\ub839\uc2dc`, CN, 36.3333, 126.6125],
  ["cn-asan", `${CN} \uc544\uc0b0\uc2dc`, CN, 36.7898, 127.0045],

  ["jb-jeonju-wansan", `${JB} \uc804\uc8fc\uc2dc \uc644\uc0b0\uad6c`, JB, 35.812, 127.116],
  ["jb-jeonju-deokjin", `${JB} \uc804\uc8fc\uc2dc \ub355\uc9c4\uad6c`, JB, 35.84, 127.13],
  ["jb-gunsan", `${JB} \uad70\uc0b0\uc2dc`, JB, 35.9676, 126.7369],
  ["jb-iksan", `${JB} \uc775\uc0b0\uc2dc`, JB, 35.9438, 126.9544],

  ["jn-mokpo", `${JN} \ubaa9\ud3ec\uc2dc`, JN, 34.8118, 126.3922],
  ["jn-yeosu", `${JN} \uc5ec\uc218\uc2dc`, JN, 34.7604, 127.6622],
  ["jn-suncheon", `${JN} \uc21c\ucc9c\uc2dc`, JN, 34.9507, 127.4872],
  ["jn-gwangyang", `${JN} \uad11\uc591\uc2dc`, JN, 34.9404, 127.6957],

  ["gb-pohang-nam", `${GB} \ud3ec\ud56d\uc2dc \ub0a8\uad6c`, GB, 35.9972, 129.378],
  ["gb-pohang-buk", `${GB} \ud3ec\ud56d\uc2dc \ubd81\uad6c`, GB, 36.0392, 129.365],
  ["gb-gyeongju", `${GB} \uacbd\uc8fc\uc2dc`, GB, 35.8562, 129.2247],
  ["gb-gumi", `${GB} \uad6c\ubbf8\uc2dc`, GB, 36.1195, 128.3446],
  ["gb-gyeongsan", `${GB} \uacbd\uc0b0\uc2dc`, GB, 35.8251, 128.7415],
  ["gb-andong", `${GB} \uc548\ub3d9\uc2dc`, GB, 36.5684, 128.7294],

  ["gn-changwon-uichang", `${GN} \ucc3d\uc6d0\uc2dc \uc758\ucc3d\uad6c`, GN, 35.254, 128.64],
  ["gn-changwon-seongsan", `${GN} \ucc3d\uc6d0\uc2dc \uc131\uc0b0\uad6c`, GN, 35.215, 128.712],
  ["gn-changwon-masanhappo", `${GN} \ucc3d\uc6d0\uc2dc \ub9c8\uc0b0\ud569\ud3ec\uad6c`, GN, 35.15, 128.57],
  ["gn-changwon-masanhoewon", `${GN} \ucc3d\uc6d0\uc2dc \ub9c8\uc0b0\ud68c\uc6d0\uad6c`, GN, 35.21, 128.58],
  ["gn-changwon-jinhae", `${GN} \ucc3d\uc6d0\uc2dc \uc9c4\ud574\uad6c`, GN, 35.133, 128.71],
  ["gn-jinju", `${GN} \uc9c4\uc8fc\uc2dc`, GN, 35.1803, 128.1076],
  ["gn-tongyeong", `${GN} \ud1b5\uc601\uc2dc`, GN, 34.8554, 128.4371],
  ["gn-geoje", `${GN} \uac70\uc81c\uc2dc`, GN, 34.8806, 128.6211],
  ["gn-yangsan", `${GN} \uc591\uc0b0\uc2dc`, GN, 35.335, 129.037],
  ["gn-gimhae", `${GN} \uae40\ud574\uc2dc`, GN, 35.2285, 128.889],

  ["jj-jeju", `${JJ} \uc81c\uc8fc\uc2dc`, "\uc81c\uc8fc", 33.4996, 126.5312],
  ["jj-seogwipo", `${JJ} \uc11c\uadc0\ud3ec\uc2dc`, "\uc81c\uc8fc", 33.2541, 126.56],
];

function dedupe(rows: T[]): PresetRegion[] {
  const seen = new Set<string>();
  const out: PresetRegion[] = [];
  for (const [id, label, sido, lat, lng] of rows) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, sido, lat, lng });
  }
  return out;
}

export const PRESET_REGIONS: readonly PresetRegion[] = dedupe(RAW);

export function presetRegionById(
  id: string | null | undefined
): PresetRegion | null {
  if (!id) return null;
  return PRESET_REGIONS.find((r) => r.id === id) ?? null;
}
