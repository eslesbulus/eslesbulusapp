// Maps Firebase Auth error codes to Turkish user-friendly messages.
export function firebaseAuthErrorMessage(code?: string): string {
  if (!code) return "Bilinmeyen bir hata oluştu.";
  switch (code) {
    case "auth/email-already-in-use":
      return "Bu e-posta zaten kayıtlı. Giriş yap.";
    case "auth/invalid-email":
      return "Geçersiz e-posta adresi.";
    case "auth/weak-password":
      return "Şifre çok zayıf. En az 6 karakter olmalı.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-posta veya şifre hatalı.";
    case "auth/user-disabled":
      return "Bu hesap devre dışı bırakılmış.";
    case "auth/too-many-requests":
      return "Çok fazla deneme. Birkaç dakika bekle.";
    case "auth/network-request-failed":
      return "İnternet bağlantını kontrol et.";
    case "auth/operation-not-allowed":
      return "Bu giriş yöntemi şu an kapalı.";
    default:
      return "Bir hata oluştu. Tekrar dene.";
  }
}
