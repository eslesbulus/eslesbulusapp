export type HiMessage = { id: string; emoji: string; textTr: string; textEn: string };

export const HI_MESSAGES: HiMessage[] = [
  { id: "1", emoji: "👋", textTr: "Selam! Profilin çok ilgi çekici.", textEn: "Hi! Your profile is really interesting." },
  { id: "2", emoji: "😊", textTr: "Merhaba, nasılsın bugün?", textEn: "Hello, how are you today?" },
  { id: "3", emoji: "✨", textTr: "Profilindeki enerji harika!", textEn: "The energy in your profile is amazing!" },
  { id: "4", emoji: "🌹", textTr: "Tanışmak isterim, bir şeyler içelim mi?", textEn: "I'd love to meet you, wanna grab a drink?" },
  { id: "5", emoji: "☕", textTr: "Kahve içmek ister misin?", textEn: "Would you like to grab a coffee?" },
  { id: "6", emoji: "🎵", textTr: "Müzik zevkimiz benziyor olabilir mi?", textEn: "Do we have similar taste in music?" },
  { id: "7", emoji: "🌟", textTr: "Gülüşün çok güzel!", textEn: "Your smile is beautiful!" },
  { id: "8", emoji: "📸", textTr: "Fotoğrafların gerçekten etkileyici.", textEn: "Your photos are really impressive." },
  { id: "9", emoji: "🍷", textTr: "Bu akşam müsait misin?", textEn: "Are you free tonight?" },
  { id: "10", emoji: "🌙", textTr: "İyi geceler, tatlı rüyalar.", textEn: "Good night, sweet dreams." },
  { id: "11", emoji: "🔥", textTr: "Eşleştiğimize sevindim!", textEn: "Happy we matched!" },
  { id: "12", emoji: "🎬", textTr: "Birlikte film izlemeye ne dersin?", textEn: "How about watching a movie together?" },
  { id: "13", emoji: "🏖️", textTr: "Bu hafta sonu planın var mı?", textEn: "Do you have plans this weekend?" },
  { id: "14", emoji: "💬", textTr: "Seninle konuşmak isterim.", textEn: "I'd love to chat with you." },
  { id: "15", emoji: "🍕", textTr: "Yemek için bir öneri ister misin?", textEn: "Want a food recommendation?" },
  { id: "16", emoji: "🌸", textTr: "Günün nasıl geçiyor?", textEn: "How's your day going?" },
  { id: "17", emoji: "🚀", textTr: "Hadi bir kahve içip tanışalım!", textEn: "Let's grab a coffee and get to know each other!" },
  { id: "18", emoji: "📚", textTr: "İlgi alanlarımız çok benziyor.", textEn: "Our interests are very similar." },
  { id: "19", emoji: "🎯", textTr: "Profilin dikkatimi çekti, merhaba!", textEn: "Your profile caught my eye, hello!" },
  { id: "20", emoji: "💫", textTr: "Tanışmak için doğru zaman gibi.", textEn: "Seems like the right time to meet." },
];

export function getHiText(msg: HiMessage, lang: string): string {
  return lang === "en" ? msg.textEn : msg.textTr;
}
