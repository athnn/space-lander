// Internationalization (i18n) module for Space Lander
// Supports multiple languages with easy extensibility

const translations = {
  en: {
    // Page title
    pageTitle: "Space Lander",
    
    // HUD labels
    hudFuel: "Fuel",
    hudSpeed: "Speed",
    hudVertical: "Vertical",
    hudHorizontal: "Horizontal",
    hudAngle: "Angle",
    hudAltitude: "Altitude",
    hudTime: "Time",
    hudStatus: "Status",
    
    // HUD status values
    statusStandby: "Standby",
    statusInFlight: "In Flight",
    statusFinalApproach: "Final Approach",
    statusLanded: "Landed",
    statusCrashed: "Crashed",
    
    // Touch controls
    touchRotateLeft: "Rotate<br>Left",
    touchMainEngine: "Main<br>Engine",
    touchRotateRight: "Rotate<br>Right",
    touchLandingBurn: "Landing<br>Burn",
    
    // Tuning panel
    tuningThrustOutput: "Thrust Output",
    tuningVehicleMass: "Vehicle Mass",
    
    // Instructions overlay
    instructionsTitle: "Welcome Commander",
    instructionsIntro: "Your mission is to guide the Space Lander to a safe touchdown on a lit landing pad. Keep your velocity low, stay upright, and watch that fuel gauge. Use advanced landing systems to assist your approach.",
    
    // Flight controls section
    flightControlsTitle: "Flight Controls",
    flightControlMain: "Throttle the main engine",
    flightControlLeft: "Rotate left",
    flightControlRight: "Rotate right",
    flightControlDown: "Engage landing burn",
    flightControlAutopilot: "Autopilot stabilization",
    flightControlGoAround: "Go around (retry approach)",
    flightControlQuickRestart: "Quick restart during flight",
    
    // Landing systems section
    landingSystemsTitle: "Landing Systems",
    landingSystemApproach: "Approach Indicator:",
    landingSystemApproachDesc: "Yellow vector shows velocity direction",
    landingSystemImpact: "Impact Predictor:",
    landingSystemImpactDesc: "Red line shows predicted touchdown point",
    landingSystemLights: "Landing Lights:",
    landingSystemLightsDesc: "Auto-activate below 300ft",
    landingSystemBeacon: "Pad Beacon:",
    landingSystemBeaconDesc: "Pulsing glow guides you to safe zones",
    landingSystemHud: "HUD Warnings:",
    landingSystemHudDesc: "Display changes color when limits exceeded",
    landingSystemSlowMo: "Slow Motion:",
    landingSystemSlowMoDesc: "Time slows below 50ft for precision",
    
    // System check section
    systemCheckTitle: "System Check",
    systemCheckEngine: "Main engine",
    systemCheckLeft: "Rotate left",
    systemCheckRight: "Rotate right",
    systemCheckCombo: "Thrust + rotate",
    systemCheckTouch: "Touch: Tap center for thrust, sides for rotation",
    
    // Buttons
    buttonLaunchMission: "Launch Mission",
    buttonShowGuide: "Show Landing Guide",
    buttonHideGuide: "Hide Landing Guide",
    buttonRetry: "Retry",
    buttonShare: "Share",
    buttonCopyStats: "Copy Stats",
    buttonMainMenu: "Main Menu",
    
    // End overlay
    endTitleSuccess: "Touchdown Confirmed",
    endTitleFailure: "Vehicle Lost",
    endOutcomePoints: "mission points",
    endOutcomeSalvage: "salvage rating",
    endSubtitleSuccess: "Telemetry nominal. {pad} secured.",
    endSubtitleFailure: "Structural integrity failure recorded.",
    endSubtitleUnknownPad: "Unknown pad",
    
    // End stats labels
    endLabelTouchdownSpeed: "Touchdown Speed",
    endLabelTouchdownAngle: "Touchdown Angle",
    endLabelMissionTime: "Mission Time",
    endLabelFuelRemaining: "Fuel Remaining",
    endLabelMaxSpeed: "Max Speed",
    endLabelMaxAltitude: "Max Altitude",
    endLabelFlips: "Flips",
    endLabelLandingPad: "Landing Pad",
    endLabelNoPad: "No pad",
    
    // Toast messages
    toastStatsCopied: "Stats copied",
    toastClipboardUnavailable: "Clipboard unavailable",
    
    // Crash reasons
    crashImpact: "Impact detected",
    crashOutOfBounds: "Out of bounds",
    
    // Language selector
    languageLabel: "Language",
  },
  
  tr: {
    // Sayfa başlığı
    pageTitle: "Uzay İnişi",
    
    // HUD etiketleri
    hudFuel: "Yakıt",
    hudSpeed: "Hız",
    hudVertical: "Dikey",
    hudHorizontal: "Yatay",
    hudAngle: "Açı",
    hudAltitude: "İrtifa",
    hudTime: "Süre",
    hudStatus: "Durum",
    
    // HUD durum değerleri
    statusStandby: "Hazır",
    statusInFlight: "Uçuşta",
    statusFinalApproach: "Son Yaklaşma",
    statusLanded: "İniş Yapıldı",
    statusCrashed: "Çakıldı",
    
    // Dokunmatik kontroller
    touchRotateLeft: "Sola<br>Dön",
    touchMainEngine: "Ana<br>Motor",
    touchRotateRight: "Sağa<br>Dön",
    touchLandingBurn: "İniş<br>Yakması",
    
    // Ayar paneli
    tuningThrustOutput: "İtki Gücü",
    tuningVehicleMass: "Araç Kütlesi",
    
    // Talimatlar ekranı
    instructionsTitle: "Hoş Geldin Komutan",
    instructionsIntro: "Göreviniz, Uzay İniş Aracını aydınlatılmış bir iniş pistine güvenli bir şekilde indirmektir. Hızınızı düşük tutun, dik kalın ve yakıt göstergesini izleyin. Yaklaşmanıza yardımcı olmak için gelişmiş iniş sistemlerini kullanın.",
    
    // Uçuş kontrolleri bölümü
    flightControlsTitle: "Uçuş Kontrolleri",
    flightControlMain: "Ana motoru çalıştır",
    flightControlLeft: "Sola dön",
    flightControlRight: "Sağa dön",
    flightControlDown: "İniş yakmasını başlat",
    flightControlAutopilot: "Otopilot stabilizasyon",
    flightControlGoAround: "Tekrar dene (yaklaşmayı yenile)",
    flightControlQuickRestart: "Uçuş sırasında hızlı yeniden başlatma",
    
    // İniş sistemleri bölümü
    landingSystemsTitle: "İniş Sistemleri",
    landingSystemApproach: "Yaklaşma Göstergesi:",
    landingSystemApproachDesc: "Sarı vektör hız yönünü gösterir",
    landingSystemImpact: "Çarpma Tahmini:",
    landingSystemImpactDesc: "Kırmızı çizgi tahmin edilen iniş noktasını gösterir",
    landingSystemLights: "İniş Işıkları:",
    landingSystemLightsDesc: "300 fit altında otomatik etkinleşir",
    landingSystemBeacon: "Pist İşareti:",
    landingSystemBeaconDesc: "Yanıp sönen ışık sizi güvenli bölgelere yönlendirir",
    landingSystemHud: "HUD Uyarıları:",
    landingSystemHudDesc: "Limitler aşıldığında ekran rengi değişir",
    landingSystemSlowMo: "Yavaş Çekim:",
    landingSystemSlowMoDesc: "50 fit altında zaman yavaşlar",
    
    // Sistem kontrolü bölümü
    systemCheckTitle: "Sistem Kontrolü",
    systemCheckEngine: "Ana motor",
    systemCheckLeft: "Sola dön",
    systemCheckRight: "Sağa dön",
    systemCheckCombo: "İtki + dönüş",
    systemCheckTouch: "Dokunmatik: İtki için merkeze, dönüş için yanlara dokunun",
    
    // Düğmeler
    buttonLaunchMission: "Göreve Başla",
    buttonShowGuide: "İniş Kılavuzunu Göster",
    buttonHideGuide: "İniş Kılavuzunu Gizle",
    buttonRetry: "Tekrar Dene",
    buttonShare: "Paylaş",
    buttonCopyStats: "İstatistikleri Kopyala",
    buttonMainMenu: "Ana Menü",
    
    // Bitiş ekranı
    endTitleSuccess: "İniş Onaylandı",
    endTitleFailure: "Araç Kaybedildi",
    endOutcomePoints: "görev puanı",
    endOutcomeSalvage: "kurtarma değeri",
    endSubtitleSuccess: "Telemetri normal. {pad} güvence altına alındı.",
    endSubtitleFailure: "Yapısal bütünlük kaybı kaydedildi.",
    endSubtitleUnknownPad: "Bilinmeyen pist",
    
    // Bitiş istatistikleri etiketleri
    endLabelTouchdownSpeed: "İniş Hızı",
    endLabelTouchdownAngle: "İniş Açısı",
    endLabelMissionTime: "Görev Süresi",
    endLabelFuelRemaining: "Kalan Yakıt",
    endLabelMaxSpeed: "Maksimum Hız",
    endLabelMaxAltitude: "Maksimum İrtifa",
    endLabelFlips: "Takla Sayısı",
    endLabelLandingPad: "İniş Pisti",
    endLabelNoPad: "Pist yok",
    
    // Bildirim mesajları
    toastStatsCopied: "İstatistikler kopyalandı",
    toastClipboardUnavailable: "Pano kullanılamıyor",
    
    // Kaza nedenleri
    crashImpact: "Çarpma tespit edildi",
    crashOutOfBounds: "Sınırlar dışında",
    
    // Dil seçici
    languageLabel: "Dil",
  },
};

class I18n {
  constructor(defaultLang = "en") {
    this.currentLang = this.loadLanguage() || defaultLang;
    this.listeners = [];
  }

  loadLanguage() {
    try {
      return localStorage.getItem("spaceLanderLang");
    } catch (e) {
      return null;
    }
  }

  saveLanguage(lang) {
    try {
      localStorage.setItem("spaceLanderLang", lang);
    } catch (e) {
      // Ignore storage errors
    }
  }

  setLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`Language '${lang}' not found, falling back to English`);
      lang = "en";
    }
    this.currentLang = lang;
    this.saveLanguage(lang);
    this.notifyListeners();
  }

  getLanguage() {
    return this.currentLang;
  }

  t(key, params = {}) {
    const lang = translations[this.currentLang] || translations.en;
    let text = lang[key] || translations.en[key] || key;
    
    // Replace parameters in text (e.g., {pad} -> actual pad value)
    Object.keys(params).forEach((param) => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.currentLang));
  }

  getAvailableLanguages() {
    return [
      { code: "en", name: "English" },
      { code: "tr", name: "Türkçe" },
    ];
  }
}

export const i18n = new I18n();