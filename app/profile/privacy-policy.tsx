import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

const SECTIONS = [
  {
    title: "1. Toplanan Veriler",
    icon: "document-text-outline" as const,
    body: `Uygulamamız aşağıdaki kişisel verileri toplar:\n\n• Ad ve doğum tarihi\n• E-posta adresi\n• Profil fotoğrafları\n• Konum bilgisi (şehir düzeyinde)\n• İlgi alanları ve biyografi\n• Etkileşim geçmişi (beğeniler, mesajlar)\n\nBu veriler yalnızca platformumuzun işlevselliği için kullanılır.`,
  },
  {
    title: "2. Verilerin Kullanımı",
    icon: "analytics-outline" as const,
    body: `Topladığımız verileri şu amaçlarla kullanırız:\n\n• Profil eşleştirme algoritmamızı geliştirmek\n• Güvenli ve kişiselleştirilmiş deneyim sunmak\n• Sahte hesap ve kötüye kullanımı önlemek\n• Uygulama performansını analiz etmek\n\nVerileriniz hiçbir koşulda üçüncü taraflarla satılmaz.`,
  },
  {
    title: "3. Güvenlik",
    icon: "shield-checkmark-outline" as const,
    body: `Verilerinizin güvenliği birincil önceliğimizdir:\n\n• Tüm veriler end-to-end şifreleme ile korunur\n• Firebase güvenli altyapısı kullanılır\n• Düzenli güvenlik denetimleri yapılır\n• İki faktörlü doğrulama desteklenir\n• Şüpheli aktivitelerde hesap otomatik kilitlenir`,
  },
  {
    title: "4. Çerezler ve İzleme",
    icon: "eye-off-outline" as const,
    body: `Uygulamamız:\n\n• Yalnızca oturum çerezleri kullanır\n• Üçüncü taraf reklam izleme araçları kullanmaz\n• Konum verisi yalnızca şehir düzeyinde alınır\n• Hassas konum bilgisi (GPS) hiçbir zaman saklanmaz`,
  },
  {
    title: "5. Haklarınız",
    icon: "person-outline" as const,
    body: `KVKK kapsamında aşağıdaki haklara sahipsiniz:\n\n• Kişisel verilerinize erişim hakkı\n• Verilerin düzeltilmesini talep etme hakkı\n• Hesabınızın ve tüm verilerinizin silinmesini isteme hakkı\n• Veri işlemeye itiraz etme hakkı\n• Veri taşınabilirliği hakkı\n\nBu haklarınızı kullanmak için destek@eslesbulus.com adresine e-posta gönderebilirsiniz.`,
  },
  {
    title: "6. Üçüncü Taraf Hizmetler",
    icon: "globe-outline" as const,
    body: `Uygulamamız aşağıdaki güvenilir hizmetleri kullanır:\n\n• Google Firebase (kimlik doğrulama ve veritabanı)\n• Google Sign-In (isteğe bağlı giriş yöntemi)\n• Expo (uygulama altyapısı)\n\nBu hizmetlerin kendi gizlilik politikaları geçerlidir.`,
  },
  {
    title: "7. İletişim",
    icon: "mail-outline" as const,
    body: `Gizlilik politikamız veya veri güvenliğiniz hakkında sorularınız için:\n\nE-posta: destek@eslesbulus.com\nAdres: Türkiye\n\nBu politika 19 Mayıs 2026 tarihinde güncellenmiştir.`,
  },
];

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Gizlilik ve Güvenlik</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: `${c.primary}12`, borderColor: `${c.primary}30` }]}>
          <Ionicons name="shield-checkmark" size={36} color={c.primary} />
          <Text style={[styles.heroTitle, { color: c.text }]}>Verileriniz Güvende</Text>
          <Text style={[styles.heroDesc, { color: c.textMuted }]}>
            Gizliliğiniz bizim için en büyük önceliktir. Aşağıda kişisel verilerinizi nasıl
            işlediğimizi şeffaf biçimde açıklıyoruz.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View
            key={section.title}
            style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${c.primary}15` }]}>
                <Ionicons name={section.icon} size={20} color={c.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: c.text }]}>{section.title}</Text>
            </View>
            <Text style={[styles.sectionBody, { color: c.textMuted }]}>{section.body}</Text>
          </View>
        ))}

        <Text style={[styles.version, { color: c.textMuted }]}>
          Sürüm 1.0 · 19 Mayıs 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },

  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  heroDesc: { fontSize: 14, textAlign: "center", lineHeight: 21 },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  sectionBody: { fontSize: 14, lineHeight: 22 },

  version: { fontSize: 12, textAlign: "center", marginTop: 12 },
});
