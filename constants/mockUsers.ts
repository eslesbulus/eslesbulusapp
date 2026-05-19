// Test verisi — Firebase'e bağlanana kadar Keşfet ekranı bunu gösterir.
export type Gender = "kadın" | "erkek";

export type MockUser = {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  city: string;
  photo: string;
  photos: string[];
  online: boolean;
  lastActive?: string;
  vip: boolean;
  verified: boolean;
  hasStory: boolean;
  bio: string;
  job?: string;
  height?: number;
  interests: string[];
};

export const POPULAR_CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Eskişehir",
  "Bodrum",
];

const P = (seed: number) => `https://i.pravatar.cc/800?img=${seed}`;

function build(
  id: string,
  name: string,
  age: number,
  gender: Gender,
  city: string,
  mainSeed: number,
  extraSeeds: number[],
  opts: Partial<MockUser> = {}
): MockUser {
  return {
    id,
    name,
    age,
    gender,
    city,
    photo: P(mainSeed),
    photos: [P(mainSeed), ...extraSeeds.map(P)],
    online: opts.online ?? false,
    lastActive: opts.lastActive,
    vip: opts.vip ?? false,
    verified: opts.verified ?? false,
    hasStory: opts.hasStory ?? false,
    bio: opts.bio ?? "",
    job: opts.job,
    height: opts.height,
    interests: opts.interests ?? [],
  };
}

export const MOCK_USERS: MockUser[] = [
  build("u1", "Elif", 24, "kadın", "İstanbul", 47, [5, 9, 16], {
    online: true, vip: true, verified: true, hasStory: true,
    bio: "Kahve, kitap, kedi. Hafta sonları dağ yürüyüşü.",
    job: "Grafik Tasarımcı", height: 168,
    interests: ["Kahve", "Kitap", "Yürüyüş", "Fotoğraf", "Müzik"],
  }),
  build("u2", "Mert", 28, "erkek", "Ankara", 12, [3, 8, 60], {
    online: true, hasStory: true, verified: true,
    bio: "Dağcı, gitarist, hafta içi yazılımcı.",
    job: "Yazılım Geliştirici", height: 182,
    interests: ["Dağcılık", "Müzik", "Kod", "Bisiklet"],
  }),
  build("u3", "Ayşe", 26, "kadın", "İzmir", 45, [21, 32, 41], {
    lastActive: "10 dk önce", vip: true, verified: true, hasStory: true,
    bio: "Yoga eğitmeni. Doğa, plaj, sağlıklı yaşam.",
    job: "Yoga Eğitmeni", height: 165,
    interests: ["Yoga", "Plaj", "Beslenme", "Meditasyon"],
  }),
  build("u4", "Can", 30, "erkek", "Bursa", 33, [13, 50, 65], {
    online: true,
    bio: "Mühendis. Motorsiklet, kamp, kalabalıktan uzak.",
    job: "Makine Mühendisi", height: 178,
    interests: ["Motor", "Kamp", "Sinema"],
  }),
  build("u5", "Zeynep", 23, "kadın", "İstanbul", 49, [25, 38, 19], {
    lastActive: "1 sa önce", hasStory: true, verified: true,
    bio: "Mimari öğrenci. Espresso bağımlısı.",
    job: "Öğrenci", height: 170,
    interests: ["Mimari", "Sanat", "Kahve", "Müze"],
  }),
  build("u6", "Burak", 27, "erkek", "Antalya", 15, [52, 53, 64], {
    online: true, vip: true, verified: true,
    bio: "Dalış eğitmeni. Yaz hep yaz olsun.",
    job: "Dalış Eğitmeni", height: 185,
    interests: ["Dalış", "Surf", "Seyahat"],
  }),
  build("u7", "Selin", 25, "kadın", "İstanbul", 48, [26, 36, 24], {
    online: true, hasStory: true,
    bio: "PR uzmanı. Şehir gezgini, brunch sever.",
    job: "PR Uzmanı", height: 167,
    interests: ["Brunch", "Yoga", "Müzik", "Festival"],
  }),
  build("u8", "Emre", 29, "erkek", "İzmir", 11, [60, 56, 14], {
    lastActive: "3 sa önce",
    bio: "Şef. Hafta sonu özel menü hazırlamak en büyük zevkim.",
    job: "Şef", height: 180,
    interests: ["Yemek", "Şarap", "Seyahat"],
  }),
  build("u9", "Defne", 22, "kadın", "Eskişehir", 44, [20, 23, 30], {
    online: true, vip: true, verified: true, hasStory: true,
    bio: "Müzik öğrencisi. Konser bağımlısı.",
    job: "Konservatuvar Öğrencisi", height: 172,
    interests: ["Piyano", "Klasik Müzik", "Konser"],
  }),
  build("u10", "Kerem", 31, "erkek", "Ankara", 13, [54, 51, 58], {
    lastActive: "dün",
    bio: "Hukukçu. Koşu ve kitap.",
    job: "Avukat", height: 184,
    interests: ["Koşu", "Kitap", "Tenis"],
  }),
  build("u11", "Naz", 24, "kadın", "Bodrum", 36, [29, 39, 42], {
    online: true, hasStory: true, verified: true,
    bio: "İçerik üreticisi. Deniz, güneş, kamera.",
    job: "İçerik Üreticisi", height: 169,
    interests: ["Fotoğraf", "Seyahat", "Plaj", "Moda"],
  }),
  build("u12", "Onur", 26, "erkek", "İstanbul", 14, [57, 59, 61], {
    online: true, verified: true,
    bio: "DJ ve müzik prodüktörü.",
    job: "DJ / Prodüktör", height: 179,
    interests: ["Müzik", "Elektronik", "Festival"],
  }),
];

export const STORY_USERS = MOCK_USERS.filter((u) => u.hasStory);
export const VIP_USERS = MOCK_USERS.filter((u) => u.vip);

export function getUserById(id: string): MockUser | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
