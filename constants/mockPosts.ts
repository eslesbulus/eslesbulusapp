export type MockComment = {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: string;
};

export type MockPost = {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  userAge: number;
  userCity: string;
  verified: boolean;
  image?: string;
  text: string;
  likes: number;
  comments: MockComment[];
  createdAt: string;
};

const A = (n: number) => `https://i.pravatar.cc/400?img=${n}`;
const I = (n: number) =>
  `https://picsum.photos/seed/${n}/600/600`;

export const MOCK_POSTS: MockPost[] = [
  {
    id: "p1",
    userId: "u1",
    userName: "Elif",
    userPhoto: A(47),
    userAge: 24,
    userCity: "İstanbul",
    verified: true,
    image: I(10),
    text: "Boğaz'da sabah koşusu yapılır mı? Yapılır 🏃‍♀️☀️",
    likes: 142,
    createdAt: "2d",
    comments: [
      { id: "c1", userId: "u2", userName: "Mert", userPhoto: A(12), text: "Ben de katılmak isterdim 😄", createdAt: "1d" },
      { id: "c2", userId: "u3", userName: "Ayşe", userPhoto: A(45), text: "Çok güzel görünüyor!", createdAt: "20s" },
    ],
  },
  {
    id: "p2",
    userId: "u3",
    userName: "Ayşe",
    userPhoto: A(21),
    userAge: 26,
    userCity: "İzmir",
    verified: false,
    image: I(20),
    text: "Kordon'da akşam yürüyüşü. İzmir her zaman güzel 🌅",
    likes: 89,
    createdAt: "5s",
    comments: [
      { id: "c3", userId: "u1", userName: "Elif", userPhoto: A(47), text: "İzmir'i özledim 💙", createdAt: "3s" },
    ],
  },
  {
    id: "p3",
    userId: "u5",
    userName: "Zeynep",
    userPhoto: A(5),
    userAge: 27,
    userCity: "İstanbul",
    verified: true,
    text: "Bugün ilk kez yoga dersine gittim ve neden daha önce gitmedim diye kendime kızıyorum 🧘‍♀️ Tavsiye ederim!",
    likes: 56,
    createdAt: "8s",
    comments: [],
  },
  {
    id: "p4",
    userId: "u4",
    userName: "Can",
    userPhoto: A(33),
    userAge: 30,
    userCity: "Bursa",
    verified: false,
    image: I(42),
    text: "Hafta sonu doğa yürüyüşü. Uludağ'dan herkese selam 🏔️",
    likes: 203,
    createdAt: "1g",
    comments: [
      { id: "c4", userId: "u11", userName: "Naz", userPhoto: A(36), text: "Harika bir manzara 😍", createdAt: "23s" },
      { id: "c5", userId: "u12", userName: "Onur", userPhoto: A(14), text: "Kamp kuralım bir gün!", createdAt: "22s" },
      { id: "c6", userId: "u2", userName: "Mert", userPhoto: A(12), text: "Ben de gelmek istiyorum 🙋‍♂️", createdAt: "20s" },
    ],
  },
  {
    id: "p5",
    userId: "u11",
    userName: "Naz",
    userPhoto: A(36),
    userAge: 24,
    userCity: "Bodrum",
    verified: true,
    image: I(63),
    text: "Bodrum'un denizine doyum olmuyor ☀️🌊 Yaz bitmeyiversin",
    likes: 317,
    createdAt: "2g",
    comments: [
      { id: "c7", userId: "u3", userName: "Ayşe", userPhoto: A(21), text: "Çok özledim denizi 🏖️", createdAt: "1g" },
    ],
  },
  {
    id: "p6",
    userId: "u12",
    userName: "Onur",
    userPhoto: A(14),
    userAge: 26,
    userCity: "İstanbul",
    verified: true,
    image: I(71),
    text: "Dün geceki set harika geçti 🎧🔥 Müziği sevenler nerede?",
    likes: 445,
    createdAt: "3g",
    comments: [
      { id: "c8", userId: "u1", userName: "Elif", userPhoto: A(47), text: "Keşke orada olsaydım!", createdAt: "2g" },
      { id: "c9", userId: "u5", userName: "Zeynep", userPhoto: A(5), text: "Müthiş ses 🎶", createdAt: "2g" },
    ],
  },
];
