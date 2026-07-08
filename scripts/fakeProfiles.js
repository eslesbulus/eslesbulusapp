// Fake profil veri havuzu — her seferinde rastgele kombinasyon uretir

const names = [
  "Cansu", "Elif", "Zeynep", "Merve", "Ayşe", "Selin", "Deniz", "Büşra",
  "Esra", "Gizem", "Damla", "Yağmur", "İrem", "Pınar", "Duygu", "Melis",
  "Hazal", "Burcu", "Tuğçe", "Ceren", "Derya", "Ecem", "Aslı", "Betül",
  "Dilara", "Gamze", "Hande", "Işıl", "Kardelen", "Lale", "Naz", "Oya",
  "Sevgi", "Şeyma", "Tuba", "Ülkü", "Vildan", "Yasemin", "Zara", "Nehir",
  "Defne", "Beren", "Ece", "Fulya", "Gülay", "Hilal", "İlayda", "Jale",
  "Kübra", "Leyla", "Melisa", "Nilüfer", "Özge", "Pelin", "Rabia", "Sibel",
  "Tülay", "Ümran", "Yaprak", "Zülal", "Almina", "Beril", "Cemre", "Derin",
  "Ebru", "Feraye", "Gonca", "Hülya", "İpek", "Julide", "Kumsal", "Lara",
];

const surnames = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk",
  "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara",
  "Koç", "Kurt", "Özkan", "Şimşek", "Polat", "Korkmaz", "Yılmazer", "Aktaş",
  "Güneş", "Aksoy", "Barış", "Erdoğan", "Acar", "Bulut", "Tekin", "Güler",
  "Kaplan", "Tunç", "Başaran", "Erdem", "Uçar", "Sezer", "Özer", "Candan",
];

const cities = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya",
  "Gaziantep", "Mersin", "Kayseri", "Eskişehir", "Trabzon", "Samsun",
  "Denizli", "Malatya", "Diyarbakır", "Muğla", "Aydın", "Balıkesir",
  "Manisa", "Sakarya", "Kocaeli", "Hatay", "Tekirdağ", "Edirne",
];

const jobs = [
  "Öğretmen", "Hemşire", "Mühendis", "Avukat", "Doktor", "Eczacı", "Mimar",
  "Psikolog", "Diyetisyen", "Fizyoterapist", "Grafik Tasarımcı", "Yazılımcı",
  "Muhasebeci", "İç Mimar", "Sosyal Medya Uzmanı", "Pazarlama Uzmanı",
  "İnsan Kaynakları", "Bankacı", "Akademisyen", "Veteriner", "Gazeteci",
  "Editör", "Çevirmen", "Odyolog", "Dil Terapisti", "Fotoğrafçı",
  "Yoga Eğitmeni", "Pilates Eğitmeni", "Beslenme Uzmanı", "Sanat Yönetmeni",
  "Öğrenci", "Stajyer", "Serbest Çalışan", "Girişimci", "Blogger",
];

const bioTemplates = [
  "Hayatın tadını çıkarmayı seven biri 🌸",
  "Kitap kurdu, kahve bağımlısı ☕📚",
  "Seyahat etmeyi ve yeni yerler keşfetmeyi seviyorum ✈️",
  "Müzik ruhumun gıdası 🎵",
  "Doğa yürüyüşleri ve kamp hayatı 🏕️",
  "İyi sohbetin ve kahvenin peşindeyim",
  "Hayatı güzel kılan küçük şeyler ✨",
  "Pozitif enerji, güzel sohbet, samimi insanlar 💫",
  "Yemek yapmayı ve yeni tarifler denemeyi seviyorum 🍳",
  "Sanat ve tasarım tutkunu 🎨",
  "Spor ve sağlıklı yaşam 💪",
  "Film ve dizi maratoncusu 🎬",
  "Fotoğraf çekmeyi seviyorum 📷",
  "Deniz, kum, güneş ☀️🌊",
  "Hayvanları çok seviyorum 🐾",
  "Dans etmeyi seven biri 💃",
  "Minimalist yaşam ❤️",
  "Güzel günlerin peşinde...",
  "Hayatta en sevdiğim şey güzel anılar biriktirmek",
  "Samimi ve dürüst insanları seviyorum",
  "Gülümsemek en güzel aksesuar 😊",
  "Yazın deniz kışın dağ 🏔️🌊",
  "Teknoloji ve bilim meraklısı 🔬",
  "El sanatları ve DIY projeleri 🧶",
  "Yoga ve meditasyon ile iç huzur 🧘‍♀️",
  "Çiçekler ve bahçe işleri 🌺",
  "Kedilerin kraliçesi 🐱👑",
  "Her gün yeni bir macera 🌈",
  "Sessiz bir köşede kitap okumak...",
  "Müziksiz yapamam, kulaklık hep yanımda 🎧",
];

const interestsPool = [
  "Seyahat", "Müzik", "Sinema", "Kitap", "Yemek", "Spor", "Yoga", "Dans",
  "Fotoğrafçılık", "Doğa", "Kamp", "Yüzme", "Koşu", "Bisiklet", "Tenis",
  "Resim", "Tiyatro", "Konser", "Kahve", "Çay", "Şarap", "Mutfak",
  "Moda", "Tasarım", "Teknoloji", "Podcast", "Blog", "Kediler", "Köpekler",
  "Bahçecilik", "El işi", "Meditasyon", "Pilates", "Fitness", "Voleybol",
  "Basketbol", "Futbol", "Dağcılık", "Sörf", "Kayak", "Paten", "Anime",
  "Oyun", "Satranç", "Bulmaca", "Astroloji", "Tarih", "Felsefe", "Psikoloji",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, min, max) {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomAge(min = 20, max = 35) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomHeight(min = 155, max = 175) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomBirthDate(age) {
  const year = new Date().getFullYear() - age;
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generateProfile() {
  const age = randomAge();
  return {
    name: pick(names),
    surname: pick(surnames),
    gender: "Kadın",
    age,
    birthDate: randomBirthDate(age),
    city: pick(cities),
    job: pick(jobs),
    bio: pick(bioTemplates),
    height: randomHeight(),
    interests: pickN(interestsPool, 3, 7),
  };
}

function generateProfiles(count) {
  const profiles = [];
  const usedNames = new Set();
  for (let i = 0; i < count; i++) {
    let p;
    let fullName;
    let attempts = 0;
    do {
      p = generateProfile();
      fullName = `${p.name} ${p.surname}`;
      attempts++;
    } while (usedNames.has(fullName) && attempts < 50);
    usedNames.add(fullName);
    profiles.push(p);
  }
  return profiles;
}

module.exports = { generateProfile, generateProfiles };
