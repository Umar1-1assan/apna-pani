import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "../contexts/LanguageContext";
import { Logo } from "../components/Logo";
import { toast } from "react-hot-toast";

// Local translations matching the reference page contents
const localTranslations = {
  en: {
    features: "Features",
    getStarted: "Login / Register",
    badgeText: "HYDRO-LOGISTICS SOFTWARE FOR BOTTLED WATER DISTRIBUTORS",
    heroTitlePart1: "Scale Your Water",
    heroTitlePart2: "Delivery Business.",
    heroTitlePart3: "Effortlessly.",
    heroSubtitle: "The all-in-one logistics & billing platform designed specifically for bottled water suppliers. Streamline your daily operations, automate route planning for riders, and provide a premium live-tracking experience to your customers.",
    getStartedFree: "Start Now ",
    watchDemo: "Watch Demo",
    driverEnRoute: "Driver #42 En Route",
    etaMins: "ETA: 12 mins",
    ecosystemTitle: "Complete Delivery Operations, Unified",
    ecosystemSubtitle: "Manage your entire logistics chain from order placement to final cash collection. AquaFlow keeps your business running in perfect sync.",
    superAdmin: "Super Admin Control",
    superAdminDesc: "Global oversight across all suppliers. Monitor performance, manage subscriptions, and analyze system-wide analytics.",
    suppliers: "Supplier Hub",
    suppliersDesc: "Central control panel. Manage customer routes, track bottle inventory, reconcile daily cash, and view real-time growth reports.",
    riders: "Rider Efficiency",
    ridersDesc: "Empower drivers with turn-by-turn route optimization, digital delivery proof, and instant cash collection logs.",
    customers: "Customer Convenience",
    customersDesc: "Build long-term loyalty with live tracking maps, auto-delivered notifications, transparent billing, and seamless orders.",
    feature1Title: "Complete Order & Automated Delivery Management",
    feature1Desc: "Streamline your entire water distribution cycle. From initial order placement and recurring subscriptions to automated driver assignment and delivery tracking, keep your logistics running seamlessly.",
    feature1Bullet1: "Automated subscription and recurring delivery scheduling",
    feature1Bullet2: "Real-time order tracking and digital dispatch logs",
    feature1Bullet3: "Instant notifications for customer drop-offs",
    feature2Title: "Automated Billing & Invoicing",
    feature2Desc: "Eliminate manual data entry and human error. AquaFlow automatically generates transparent, accurate invoices based on delivered quantities and custom pricing tiers.",
    feature2Bullet1: "Auto-generated monthly statements",
    feature2Bullet2: "Instant SMS/WhatsApp billing alerts",
    feature2Bullet3: "Cash reconciliation reporting",
    feature2Btn: "See Billing Features",
    pricingTitle: "Simple, Growth-Focused Pricing",
    pricingSubtitle: "Choose the plan that matches your current business size. Upgrade or downgrade anytime.",
    monthly: "Monthly Billing",
    yearly: "Yearly (Save 20%)",
    popular: "Recommended",
    starter: "Basic Plan",
    starterPrice: "Free",
    starterPriceYearly: "Free",
    starterDesc: "Perfect for small local suppliers starting to digitize.",
    professional: "Standard Plan",
    professionalPrice: "Rs 7,500",
    professionalPriceYearly: "Rs 4,000",
    professionalDesc: "Ideal for established water delivery businesses with multiple riders.",
    enterprise: "Enterprise Plan",
    enterprisePrice: "Rs 15,000",
    enterprisePriceYearly: "Rs 12,000",
    enterpriseDesc: "For large-scale water networks, regional distributors, and municipalities.",
    choosePlan: "Get Started",
    contactSales: "Select Plan",
    perMonth: "/mo",
    featCustomers: "active customers limit",
    featRiders: "delivery rider accounts",
    featEmailSupport: "Standard Email Support",
    featEmailChatSupport: "Priority Email & Chat Support",
    featPrioritySupport: "24/7 Dedicated Priority Support",
    featWhatsappAlerts: "Automated WhatsApp Alerts",
    featWhatsappSmsAlerts: "WhatsApp & SMS notifications",
    featReports: "Analytics & billing reports",
    featGpsTracking: "Live driver GPS route tracking",
    featCustomBranding: "Custom Branding & Custom Domain",
    featApiAccess: "Full Developer API Access",
    featOptimizedRoutes: "Automated Order & Delivery Scheduler",
    unlimited: "Unlimited",
    metricWaterDeliveredVal: "150,000+",
    metricCustomersServed: "Litres Delivered",
    metricActiveSuppliersVal: "500+",
    metricActiveSuppliers: "Active Distributors",
    metricEfficiencyGainVal: "35%",
    metricEfficiencyGain: "Efficiency Gain",
    metricUptimeVal: "99.9%",
    metricUptime: "Service Uptime",
    howItWorksTitle: "Get Operational in 3 Simple Steps",
    howItWorksSubtitle: "Digitize your delivery logistics in less than 15 minutes.",
    step1Title: "Create Account",
    step1Desc: "Register your business, add your distribution zones, and define route boundaries.",
    step2Title: "Import & Assign",
    step2Desc: "Upload your customer list, assign routes to your riders, and schedule delivery cycles.",
    step3Title: "Track & Grow",
    step3Desc: "Monitor active deliveries, track cash collections in real-time, and download operational reports.",
    contactTitle: "Request a Demo",
    contactSubtitle: "Ready to streamline your water distribution? Fill out the form, and our logistics experts will activate your portal.",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    companyName: "Company Name",
    selectPlan: "Preferred Plan",
    message: "Describe Your Delivery Operation (Optional)",
    sendMessage: "Submit Request",
    sending: "Processing Request...",
    messageSuccess: "Thank you! Our onboarding team will call you shortly.",
    contactInfoTitle: "Logistics Office",
    officeAddress: "Headquarters",
    addressVal: "Office No 3 First Floor Islamabad Arcade, G-11 Markaz Islamabad",
    emailVal: "connect@ozoneltd.com",
    phoneVal: "+92 301 953 1648",
    hoursVal: "Mon - Sat: 9:00 AM - 6:00 PM",
    businessHours: "Office Hours",
    product: "Product",
    apiDoc: "Developer API",
    netStatus: "System Status",
    support: "Support",
    contactSupport: "Get Support",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    rightsReserved: "All rights reserved.",
    brandName: "AquaFlow",
    pricing: "Pricing Plans",
    contactUs: "Contact Us"
  },
  ur: {
    features: "خصوصیات",
    getStarted: "لاگ ان / رجسٹریشن",
    badgeText: "واٹر سپلائرز کے لیے لاجسٹکس سافٹ ویئر",
    heroTitlePart1: "پانی کے ڈلیوری بزنس کو",
    heroTitlePart2: "وسعت دیں۔",
    heroTitlePart3: "نہایت آسانی سے۔",
    heroSubtitle: "پانی کے سپلائرز کے لیے لاجسٹکس اور بلنگ کا خودکار سسٹم۔ آپریشنز کو آسان بنائیں، رائیڈرز کے روٹس خودکار کریں، اور صارفین کو لائیو ڈلیوری ٹریکنگ کی سہولت فراہم کریں۔",
    getStartedFree: "   مفت ٹرائل شروع کریں",
    watchDemo: "ڈیمو دیکھیں",
    driverEnRoute: "رائیڈر #42 راستے میں ہے",
    etaMins: "وقت: 12 منٹ",
    ecosystemTitle: "پانی کی تقسیم کا مربوط نظام",
    ecosystemSubtitle: "آرڈر بکنگ سے لے کر کیش وصولی تک، اپنے کاروبار کی لاجسٹکس کو ایک ہی جگہ سے مانیٹر کریں۔",
    superAdmin: "سپر ایڈمن کنٹرول",
    superAdminDesc: "تمام سپلائرز کی عالمی نگرانی۔ کارکردگی کو مانیٹر کریں، سبسکرپشنز کا انتظام کریں، اور سسٹم بھر کے تجزیات دیکھیں۔",
    suppliers: "سپلائر ہب",
    suppliersDesc: "آپ کا مرکزی کنٹرول ہب۔ گاہکوں کے روٹس بنائیں، کین/بوتلوں کی انوینٹری رکھیں، روزانہ کا کیش ریکارڈ کریں اور رپورٹیں حاصل کریں۔",
    riders: "رائیڈر کی کارکردگی",
    ridersDesc: "ڈرائیورز کے لیے موبائل پورٹل۔ خودکار روٹ پلاننگ، ڈلیوری کا ڈیجیٹل ثبوت، اور نقد وصولی کے فوری لاگز۔",
    customers: "صارفین کے لیے سہولت",
    customersDesc: "اپنے گاہکوں کا اعتماد جیتیں۔ لائیو رائیڈر ٹریکنگ، خودکار نوٹیفیکیشنز، شفاف بلنگ، اور آسان آرڈر اپ ڈیٹس۔",
    feature1Title: "آرڈر اور خودکار ڈلیوری کا مکمل انتظام",
    feature1Desc: "پانی کی تقسیم کے پورے سائیکل کو آسان بنائیں۔ نئے آرڈرز اور ماہانہ سبسکرپشنز سے لے کر رائیڈرز کو آرڈرز کی تقسیم اور ڈلیوری کی ٹریکنگ تک، ہر عمل کو خودکار بنائیں۔",
    feature1Bullet1: "ماہانہ سبسکرپشنز اور خودکار ڈلیوری شیڈولنگ",
    feature1Bullet2: "لائیو آرڈر ٹریکنگ اور ڈیجیٹل ڈسپیچ لاگز",
    feature1Bullet3: "آرڈرز کی ڈلیوری پر فوری الرٹس اور نوٹیفیکیشنز",
    feature2Title: "خودکار بلنگ اور کین/بوتلوں کا حساب",
    feature2Desc: "دستی ڈیٹا انٹری اور انسانی غلطی کو ختم کریں۔ ایکوافلو فراہم کردہ پانی کی مقدار اور کسٹم ریٹس کے مطابق خودکار طور پر شفاف بل تیار کرتا ہے۔",
    feature2Bullet1: "خودکار طور پر تیار کردہ ماہانہ بل",
    feature2Bullet2: "ایس ایم ایس اور واٹس ایپ بلنگ الرٹس",
    feature2Bullet3: "کیش ریکنسلیشن اور انوینٹری رپورٹنگ",
    feature2Btn: "بلنگ کی خصوصیات دیکھیں",
    pricingTitle: "کاروبار کے لیے آسان اور واضح پلانز",
    pricingSubtitle: "اپنے کاروبار کی گنجائش کے مطابق بہترین پلان کا انتخاب کریں۔ کسی بھی وقت تبدیل کریں۔",
    monthly: "ماہانہ بلنگ",
    yearly: "سالانہ (20% بچت)",
    popular: "تجویز کردہ",
    starter: "بیسک پلان",
    starterPrice: "مفت",
    starterPriceYearly: "مفت",
    starterDesc: "چھوٹے اور نئے واٹر سپلائرز کے لیے جو کاروبار ڈیجیٹل کرنا چاہتے ہیں۔",
    professional: "اسٹینڈرڈ پلان",
    professionalPrice: "Rs 7,500",
    professionalPriceYearly: "Rs 4,000",
    professionalDesc: "ایک سے زیادہ رائیڈرز رکھنے والے فعال واٹر ڈسٹری بیوٹرز کے لیے بہترین۔",
    enterprise: "انٹرپرائز پلان",
    enterprisePrice: "Rs 15,000",
    enterprisePriceYearly: "Rs 12,000",
    enterpriseDesc: "بڑے واٹر سپلائی نیٹ ورکس، علاقائی ڈسٹری بیوٹرز اور بلدیاتی اداروں کے لیے۔",
    choosePlan: "شروع کریں",
    contactSales: "انٹرپرائز پلان منتخب کریں",
    perMonth: "/ماہ",
    featCustomers: "صارفین کی حد",
    featRiders: "ڈلیوری رائیڈرز",
    featEmailSupport: "ای میل سپورٹ",
    featEmailChatSupport: "ترجیحی ای میل اور چیٹ سپورٹ",
    featPrioritySupport: "24/7 ترجیحی سپورٹ",
    featWhatsappAlerts: "خودکار واٹس ایپ نوٹیفیکیشنز",
    featWhatsappSmsAlerts: "واٹس ایپ اور ایس ایم ایس نوٹیفیکیشنز",
    featReports: "بلنگ اور آپریشنل رپورٹیں",
    featGpsTracking: "لائیو رائیڈر جی پی ایس ٹریکنگ",
    featCustomBranding: "کمپنی برانڈنگ اور ڈومین",
    featApiAccess: "مکمل ڈویلپر API رسائی",
    featOptimizedRoutes: "خودکار آرڈر اور ڈلیوری شیڈولر",
    unlimited: "لامحدود",
    metricWaterDeliveredVal: "150,000+",
    metricCustomersServed: "لیٹر پانی فراہم کیا",
    metricActiveSuppliersVal: "500+",
    metricActiveSuppliers: "فعال ڈسٹری بیوٹرز",
    metricEfficiencyGainVal: "35%",
    metricEfficiencyGain: "کارکردگی میں اضافہ",
    metricUptimeVal: "99.9%",
    metricUptime: "سروس اپ ٹائم",
    howItWorksTitle: "کاروبار آن لائن لانے کے 3 آسان مراحل",
    howItWorksSubtitle: "صرف 15 منٹ میں اپنے ڈلیوری لاجسٹکس کو ڈیجیٹل بنائیں۔",
    step1Title: "اکاؤنٹ بنائیں",
    step1Desc: "اپنا کاروبار رجسٹر کریں، ڈلیوری کے علاقے اور روٹس کی حدود طے کریں۔",
    step2Title: "گاہک شامل کریں",
    step2Desc: "اپنے کسٹمرز کا ڈیٹا اپ لوڈ کریں، رائیڈرز کو روٹس تفویض کریں اور ڈلیوری کے دن مقرر کریں۔",
    step3Title: "ٹریکنگ اور ترقی",
    step3Desc: "لائیو ڈلیوریز اور رائیڈرز مانیٹر کریں، نقد وصولی ٹریک کریں اور کارکردگی کی رپورٹیں حاصل کریں۔",
    contactTitle: "ڈیمو کی درخواست کریں",
    contactSubtitle: "اپنے پانی کی تقسیم کو آسان بنانے کے لیے تیار ہیں؟ فارم پُر کریں، ہماری ٹیم آپ کو پورٹل فراہم کرے گی۔",
    fullName: "پورا نام",
    email: "ای میل ایڈریس",
    phone: "فون نمبر",
    companyName: "کمپنی کا نام",
    selectPlan: "پسندیدہ پلان",
    message: "اپنے کاروبار کی تفصیل لکھیں (اختیاری)",
    sendMessage: "درخواست جمع کریں",
    sending: "درخواست پر عمل ہو رہا ہے...",
    messageSuccess: "شکریہ! ہماری آن بورڈنگ ٹیم جلد ہی آپ سے رابطہ کرے گی۔",
    contactInfoTitle: "ہیڈ آفس",
    officeAddress: "دفتر کا پتہ",
    addressVal: "آفس نمبر 3، فرسٹ فلور اسلام آباد آرکیڈ، جی-11 مرکز اسلام آباد",
    emailVal: "connect@ozoneltd.com",
    phoneVal: "+92 301 953 1648",
    hoursVal: "پیر تا ہفتہ: صبح 9:00 بجے سے شام 6:00 بجے تک",
    businessHours: "کام کے اوقات",
    product: "پروڈکٹ",
    apiDoc: "ڈویلپر API",
    netStatus: "سسٹم اسٹیٹس",
    support: "سپورٹ",
    contactSupport: "سپورٹ سے رابطہ",
    legal: "قانونی",
    privacy: "رازداری کی پالیسی",
    terms: "شرائط و ضوابط",
    rightsReserved: "جملہ حقوق محفوظ ہیں۔",
    brandName: "ایکوافلو",
    pricing: "پلانز",
    contactUs: "رابطہ کریں"
  }
};

export function LandingPage() {
  const token = useAuthStore((s) => s.accessToken);
  const { language, toggleLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState("monthly"); // monthly or yearly
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    selectedPlan: "professional",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load Material Symbols stylesheet dynamically for clean self-containment
  useEffect(() => {
    const linkId = "material-symbols-stylesheet";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const tLocal = (key) => {
    return localTranslations[language]?.[key] || localTranslations.en?.[key] || key;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error(language === "en" ? "Please fill in all required fields." : "براہ کرم تمام مطلوبہ فیلڈز پُر کریں۔");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      toast.success(language === "en" ? "Demo Request Sent!" : "ڈیمو کی درخواست موصول ہوگئی ہے!");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        companyName: "",
        selectedPlan: "professional",
        message: "",
      });
      // Clear success banner after 8 seconds
      setTimeout(() => setSubmitSuccess(false), 8000);
    }, 1200);
  };

  const selectPlanAndScroll = (planId) => {
    setFormData((prev) => ({ ...prev, selectedPlan: planId }));
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Authenticated users go straight to dashboard
  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="bg-[#f9f9fc] text-[#1a1c1e] antialiased font-sans overflow-x-hidden selection:bg-[#e8f8fb] selection:text-[#0a647a] min-h-screen flex flex-col">

      {/* ──── TopNavBar ──── */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#11a2c2]/10 shadow-sm">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center px-5 md:px-[64px] py-4">
          <div className="flex items-center gap-2.5">
            <Logo size={32} showText={false} />
            <span className="text-xl font-extrabold text-[#0a647a] tracking-tight">
              {tLocal("brandName")}
            </span>
          </div>

          <nav className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-sm font-semibold text-[#414755] hover:text-[#0a647a] transition-colors duration-150">
              {tLocal("features")}
            </a>
            <a href="#plans" className="text-sm font-semibold text-[#414755] hover:text-[#0a647a] transition-colors duration-150">
              {tLocal("pricing")}
            </a>
            <a href="#contact" className="text-sm font-semibold text-[#414755] hover:text-[#0a647a] transition-colors duration-150">
              {tLocal("contactUs")}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#11a2c2]/20 bg-[#11a2c2]/5 hover:bg-[#11a2c2]/10 text-xs font-semibold text-[#0a647a] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">globe</span>
              {language === "en" ? "اردو" : "English"}
            </button>

            <Link
              to="/login"
              className="hidden md:block text-sm font-semibold bg-[#0a647a] hover:bg-[#0c7a94] !text-white px-4 py-2 rounded-lg transition-colors active:scale-95 duration-150 shadow-sm"
            >
              {tLocal("getStarted")}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#0a647a]"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#11a2c2]/10 bg-[#f9f9fc] px-5 py-4 space-y-2.5">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#414755] hover:text-[#0a647a]"
            >
              {tLocal("features")}
            </a>
            <a
              href="#plans"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#414755] hover:text-[#0a647a]"
            >
              {tLocal("pricing")}
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#414755] hover:text-[#0a647a]"
            >
              {tLocal("contactUs")}
            </a>
            <Link
              to="/login"
              className="block text-center py-2.5 bg-[#0a647a] !text-white rounded-lg font-semibold shadow-sm"
            >
              {tLocal("getStarted")}
            </Link>
          </div>
        )}
      </header>

      <main className="flex-grow">

        {/* ──── Hero Section ──── */}
        <section className="px-5 md:px-[64px] py-12 md:py-24 max-w-[1280px] mx-auto relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-[350px] h-[350px] bg-[#11a2c2]/10 rounded-full blur-[80px] opacity-60 z-0 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-[250px] h-[250px] bg-[#e8f8fb] rounded-full blur-[60px] opacity-40 z-0 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

            {/* Left Column */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8f8fb] text-[#0a647a] w-fit font-semibold text-xs border border-[#11a2c2]/20">
                <span className="material-symbols-outlined text-[16px]">water_drop</span>
                <span className="uppercase tracking-wider">{tLocal("badgeText")}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1c1e] leading-tight">
                {tLocal("heroTitlePart1")} <br />
                <span className="bg-gradient-to-r from-[#11a2c2] to-[#0a647a] bg-clip-text text-transparent">
                  {tLocal("heroTitlePart2")}
                </span>{" "}
                {tLocal("heroTitlePart3")}
              </h1>

              <p className="text-base sm:text-lg text-[#414755] max-w-xl leading-relaxed font-medium">
                {tLocal("heroSubtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-3">
                <Link
                  to="/login"
                  className="font-semibold text-sm bg-[#0a647a] hover:bg-[#0c7a94] !text-white px-6 py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(17,162,194,0.15)] hover:shadow-[0_6px_24px_rgba(17,162,194,0.25)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {tLocal("getStartedFree")}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <a
                  href="#contact"
                  className="font-semibold text-sm bg-white text-[#0a647a] border border-[#11a2c2]/30 px-6 py-3.5 rounded-lg hover:bg-[#e8f8fb]/50 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer hydro-shadow-1"
                >
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  {tLocal("watchDemo")}
                </a>
              </div>
            </div>

            {/* Right Column (Hero Image Mockup) */}
            <div className="lg:col-span-6 relative mt-12 lg:mt-0">
              <div className="relative z-10 bg-white rounded-2xl shadow-[0_12px_32px_rgba(10,100,122,0.06)] border border-[#11a2c2]/15 overflow-hidden transform md:-rotate-1 hover:rotate-0 transition-transform duration-500">
                <img
                  src="/screen.png"
                  alt="AquaFlow Dashboard Interface"
                  className="w-full h-auto object-cover opacity-95"
                />

                {/* Floating UI Element */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(17,162,194,0.08)] p-3.5 flex items-center gap-3 border border-[#11a2c2]/20">
                  <div className="w-8 h-8 rounded-full bg-[#11a2c2]/10 flex items-center justify-center text-[#11a2c2]">
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#1a1c1e]">{tLocal("driverEnRoute")}</p>
                    <p className="text-[10px] text-[#414755] font-semibold">{tLocal("etaMins")}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ──── Professional Stats Section ──── */}
        <section className="bg-white border-y border-[#11a2c2]/10 py-12 relative overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col gap-1 items-center">
                <span className="material-symbols-outlined text-[#11a2c2] text-3xl mb-1">local_shipping</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1e]">{tLocal("metricWaterDeliveredVal")}</span>
                <span className="text-xs sm:text-sm text-[#414755] font-semibold">{tLocal("metricCustomersServed")}</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <span className="material-symbols-outlined text-[#0a647a] text-3xl mb-1">groups</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1e]">{tLocal("metricActiveSuppliersVal")}</span>
                <span className="text-xs sm:text-sm text-[#414755] font-semibold">{tLocal("metricActiveSuppliers")}</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <span className="material-symbols-outlined text-[#11a2c2] text-3xl mb-1">trending_up</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1e]">{tLocal("metricEfficiencyGainVal")}</span>
                <span className="text-xs sm:text-sm text-[#414755] font-semibold">{tLocal("metricEfficiencyGain")}</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                <span className="material-symbols-outlined text-green-600 text-3xl mb-1">cloud_done</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1e]">{tLocal("metricUptimeVal")}</span>
                <span className="text-xs sm:text-sm text-[#414755] font-semibold">{tLocal("metricUptime")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ──── The Ecosystem Section ──── */}
        <section className="bg-[#f0fafc] py-16 md:py-24 border-y border-[#11a2c2]/10">
          <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
            <div className="text-center mb-16 max-w-2xl mx-auto flex flex-col gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1e]">
                {tLocal("ecosystemTitle")}
              </h2>
              <p className="text-sm sm:text-base text-[#414755] font-semibold leading-relaxed">
                {tLocal("ecosystemSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">

              {/* Card 1: Super Admin */}
              {/* <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(17,162,194,0.03)] border border-[#11a2c2]/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-[#11a2c2]/10 flex items-center justify-center text-[#11a2c2]">
                  <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                </div>
                <h3 className="font-bold text-lg text-[#1a1c1e]">{tLocal("superAdmin")}</h3>
                <p className="text-xs sm:text-sm text-[#414755] leading-relaxed font-medium">{tLocal("superAdminDesc")}</p>
              </div> */}

              {/* Card 2: Suppliers */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(17,162,194,0.03)] border border-[#11a2c2]/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-[#e8f8fb] flex items-center justify-center text-[#0a647a]">
                  <span className="material-symbols-outlined text-[24px]">storefront</span>
                </div>
                <h3 className="font-bold text-lg text-[#1a1c1e]">{tLocal("suppliers")}</h3>
                <p className="text-xs sm:text-sm text-[#414755] leading-relaxed font-medium">{tLocal("suppliersDesc")}</p>
              </div>

              {/* Card 3: Riders */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(17,162,194,0.03)] border border-[#11a2c2]/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-[#e8f8fb] flex items-center justify-center text-[#54606a]">
                  <span className="material-symbols-outlined text-[24px]">two_wheeler</span>
                </div>
                <h3 className="font-bold text-lg text-[#1a1c1e]">{tLocal("riders")}</h3>
                <p className="text-xs sm:text-sm text-[#414755] leading-relaxed font-medium">{tLocal("ridersDesc")}</p>
              </div>

              {/* Card 4: Customers */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(17,162,194,0.03)] border border-[#11a2c2]/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-[#11a2c2]/10 flex items-center justify-center text-[#0a647a]">
                  <span className="material-symbols-outlined text-[24px]">person</span>
                </div>
                <h3 className="font-bold text-lg text-[#1a1c1e]">{tLocal("customers")}</h3>
                <p className="text-xs sm:text-sm text-[#414755] leading-relaxed font-medium">{tLocal("customersDesc")}</p>
              </div>

            </div>
          </div>
        </section>

        {/* ──── Key Features Section ──── */}
        <section id="features" className="scroll-mt-24 py-16 md:py-24 max-w-[1280px] mx-auto px-5 md:px-[64px] flex flex-col gap-16 md:gap-32">

          {/* Feature 1: Image Left, Text Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 relative">
              <div className="bg-white rounded-2xl shadow-[0_12px_32px_rgba(10,100,122,0.05)] border border-[#11a2c2]/10 p-2.5 relative z-10 overflow-hidden">
                <img
                  src="/order_management.png"
                  alt="Complete Order & Automated Delivery Management"
                  className="w-full h-auto rounded-xl"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#e8f8fb] rounded-full blur-[40px] z-0" />
            </div>

            <div className="lg:col-span-5 lg:col-start-8 flex flex-col gap-5">
              <div className="w-12 h-12 rounded-full bg-[#11a2c2]/10 flex items-center justify-center text-[#11a2c2]">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1a1c1e]">
                {tLocal("feature1Title")}
              </h3>
              <p className="text-sm sm:text-base text-[#414755] leading-relaxed">
                {tLocal("feature1Desc")}
              </p>
              <ul className="flex flex-col gap-3 font-semibold text-sm text-[#414755]">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#11a2c2] text-[20px]">check_circle</span>
                  {tLocal("feature1Bullet1")}
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#11a2c2] text-[20px]">check_circle</span>
                  {tLocal("feature1Bullet2")}
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#11a2c2] text-[20px]">check_circle</span>
                  {tLocal("feature1Bullet3")}
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2: Text Left, Image Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">
              <div className="w-12 h-12 rounded-full bg-[#e8f8fb] flex items-center justify-center text-[#0a647a]">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1a1c1e]">
                {tLocal("feature2Title")}
              </h3>
              <p className="text-sm sm:text-base text-[#414755] leading-relaxed">
                {tLocal("feature2Desc")}
              </p>
              <ul className="flex flex-col gap-3 font-semibold text-sm text-[#414755] mb-2">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0a647a] text-[20px]">check_circle</span>
                  {tLocal("feature2Bullet1")}
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0a647a] text-[20px]">check_circle</span>
                  {tLocal("feature2Bullet2")}
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0a647a] text-[20px]">check_circle</span>
                  {tLocal("feature2Bullet3")}
                </li>
              </ul>
              <Link
                to="/login"
                className="text-sm font-bold text-[#0a647a] hover:text-[#0c7a94] hover:underline flex items-center gap-1.5 w-fit"
              >
                {tLocal("feature2Btn")}{" "}
                <span className="material-symbols-outlined text-[16px] animate-pulse">arrow_forward</span>
              </Link>
            </div>

            <div className="lg:col-span-6 lg:col-start-7 relative order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-[0_12px_32px_rgba(10,100,122,0.05)] border border-[#11a2c2]/10 p-2.5 relative z-10 overflow-hidden">
                <img
                  src="/billing_invoice.png"
                  alt="Automated Billing & Invoicing Screen"
                  className="w-full h-auto rounded-xl"
                />
              </div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#11a2c2]/10 rounded-full blur-[40px] z-0" />
            </div>
          </div>

        </section>

        {/* ──── Pricing Plans Section ──── */}
        <section id="plans" className="scroll-mt-24 bg-[#f0fafc] py-16 md:py-24 border-t border-[#11a2c2]/10">
          <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
            <div className="text-center mb-12 flex flex-col items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1e]">
                {tLocal("pricingTitle")}
              </h2>
              <p className="text-sm sm:text-base text-[#414755] max-w-2xl font-medium">
                {tLocal("pricingSubtitle")}
              </p>

              {/* Monthly / Yearly Switcher Toggle */}
              {/* <div className="inline-flex bg-white rounded-full p-1.5 border border-[#11a2c2]/20 shadow-sm mt-4">
                <button
                  type="button"
                  onClick={() => setPricingPeriod("monthly")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${pricingPeriod === "monthly"
                    ? "bg-[#0a647a] text-white shadow-sm"
                    : "text-[#414755] hover:text-[#0a647a]"
                    }`}
                >
                  {tLocal("monthly")}
                </button>
                <button
                  type="button"
                  onClick={() => setPricingPeriod("yearly")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${pricingPeriod === "yearly"
                    ? "bg-[#0a647a] text-white shadow-sm"
                    : "text-[#414755] hover:text-[#0a647a]"
                    }`}
                >
                  {tLocal("yearly")}
                </button>
              </div> */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto mt-12">

              {/* Starter Plan */}
              <div className="bg-white rounded-2xl border border-[#11a2c2]/10 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="material-symbols-outlined text-[#11a2c2] text-3xl mb-2 block">water_drop</span>
                      <h3 className="text-xl font-bold text-[#1a1c1e]">{tLocal("starter")}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-[#414755] mb-6 font-medium leading-relaxed">{tLocal("starterDesc")}</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-[#1a1c1e]">
                      {pricingPeriod === "monthly" ? tLocal("starterPrice") : tLocal("starterPriceYearly")}
                    </span>
                    <span className="text-sm font-semibold text-[#414755]">{tLocal("perMonth")}</span>
                  </div>

                  <hr className="border-[#11a2c2]/10 my-6" />

                  <ul className="space-y-4">
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>20 {tLocal("featCustomers")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>3 {tLocal("featRiders")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("featEmailSupport")}</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => selectPlanAndScroll("starter")}
                  className="mt-8 w-full py-3 px-4 rounded-xl border border-[#11a2c2] text-[#0a647a] hover:bg-[#11a2c2]/5 font-bold text-sm transition-all text-center cursor-pointer animate-none"
                >
                  {tLocal("choosePlan")}
                </button>
              </div>

              {/* Professional Plan */}
              <div className="bg-white rounded-2xl border-2 border-[#11a2c2] p-8 shadow-md flex flex-col justify-between relative transform lg:-translate-y-2 hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#0a647a] text-white text-[10px] uppercase font-bold tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                  {tLocal("popular")}
                </div>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="material-symbols-outlined text-[#0a647a] text-3xl mb-2 block">opacity</span>
                      <h3 className="text-xl font-bold text-[#1a1c1e]">{tLocal("professional")}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-[#414755] mb-6 font-medium leading-relaxed">{tLocal("professionalDesc")}</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-[#1a1c1e]">
                      {pricingPeriod === "monthly" ? tLocal("professionalPrice") : tLocal("professionalPriceYearly")}
                    </span>
                    <span className="text-sm font-semibold text-[#414755]">{tLocal("perMonth")}</span>
                  </div>

                  <hr className="border-[#11a2c2]/10 my-6" />

                  <ul className="space-y-4">
                    <li className="flex items-center gap-2.5 text-sm text-[#1a1c1e] font-semibold">
                      <span className="material-symbols-outlined text-[#11a2c2] text-[18px]">done</span>
                      <span>200 {tLocal("featCustomers")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>10 {tLocal("featRiders")}</span>
                    </li>
                    {/* <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("featOptimizedRoutes")}</span>
                    </li> */}
                    {/* <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("featWhatsappAlerts")}</span>
                    </li> */}
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("featReports")}</span>
                    </li>
                    {/* <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("featGpsTracking")}</span>
                    </li> */}
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("featEmailChatSupport")}</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => selectPlanAndScroll("professional")}
                  className="mt-8 w-full py-3.5 px-4 rounded-xl bg-[#0a647a] hover:bg-[#0c7a94] !text-white font-bold text-sm transition-all text-center shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                >
                  {tLocal("choosePlan")}
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-2xl border border-[#11a2c2]/10 p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="material-symbols-outlined text-[#54606a] text-3xl mb-2 block">corporate_fare</span>
                      <h3 className="text-xl font-bold text-[#1a1c1e]">{tLocal("enterprise")}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-[#414755] mb-6 font-medium leading-relaxed">{tLocal("enterpriseDesc")}</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-[#1a1c1e]">
                      {pricingPeriod === "monthly" ? tLocal("enterprisePrice") : tLocal("enterprisePriceYearly")}
                    </span>
                    <span className="text-sm font-semibold text-[#414755]">{tLocal("perMonth")}</span>
                  </div>

                  <hr className="border-[#11a2c2]/10 my-6" />

                  <ul className="space-y-4">
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("unlimited")} {tLocal("featCustomers")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("unlimited")} {tLocal("featRiders")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("featCustomBranding")}</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-[#414755] font-medium">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
                      <span>{tLocal("featPrioritySupport")}</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => selectPlanAndScroll("enterprise")}
                  className="mt-8 w-full py-3 px-4 rounded-xl border border-[#11a2c2] text-[#0a647a] hover:bg-[#11a2c2]/5 font-bold text-sm transition-all text-center cursor-pointer"
                >
                  {tLocal("contactSales")}
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* ──── How It Works Section ──── */}
        <section className="bg-white py-16 md:py-24 border-t border-[#11a2c2]/10">
          <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
            <div className="text-center mb-16 flex flex-col gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1e]">
                {tLocal("howItWorksTitle")}
              </h2>
              <p className="text-sm sm:text-base text-[#414755] font-semibold">
                {tLocal("howItWorksSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
              {/* Connector line (desktop only) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-[#11a2c2]/15 z-0" />

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center relative z-10 gap-3">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-[#f9f9fc] shadow-[0_4px_20px_rgba(17,162,194,0.08)] flex items-center justify-center text-[#0a647a] mb-2 text-2xl font-bold">
                  1
                </div>
                <h3 className="font-bold text-lg text-[#1a1c1e]">{tLocal("step1Title")}</h3>
                <p className="text-xs sm:text-sm text-[#414755] max-w-xs leading-relaxed font-medium">{tLocal("step1Desc")}</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center relative z-10 gap-3">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-[#f9f9fc] shadow-[0_4px_20px_rgba(17,162,194,0.08)] flex items-center justify-center text-[#0a647a] mb-2 text-2xl font-bold">
                  2
                </div>
                <h3 className="font-bold text-lg text-[#1a1c1e]">{tLocal("step2Title")}</h3>
                <p className="text-xs sm:text-sm text-[#414755] max-w-xs leading-relaxed font-medium">{tLocal("step2Desc")}</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center relative z-10 gap-3">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-[#f9f9fc] shadow-[0_4px_20px_rgba(17,162,194,0.08)] flex items-center justify-center text-[#0a647a] mb-2 text-2xl font-bold">
                  3
                </div>
                <h3 className="font-bold text-lg text-[#1a1c1e]">{tLocal("step3Title")}</h3>
                <p className="text-xs sm:text-sm text-[#414755] max-w-xs leading-relaxed font-medium">{tLocal("step3Desc")}</p>
              </div>

            </div>
          </div>
        </section>

        {/* ──── Contact Us Section ──── */}
        <section id="contact" className="scroll-mt-24 py-16 md:py-24 max-w-[1280px] mx-auto px-5 md:px-[64px] border-t border-[#11a2c2]/10 bg-[#f0fafc]/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-6xl mx-auto">

            {/* Contact Info (Left) */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1e] mb-3">
                  {tLocal("contactTitle")}
                </h2>
                <p className="text-sm sm:text-base text-[#414755] leading-relaxed font-medium">
                  {tLocal("contactSubtitle")}
                </p>
              </div>

              {/* Office Details */}
              <div className="flex flex-col gap-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-[#11a2c2]/10 flex items-center justify-center text-[#0a647a] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">pin_drop</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1a1c1e]">{tLocal("officeAddress")}</h4>
                    <p className="text-xs sm:text-sm text-[#414755] mt-1 leading-relaxed font-medium">{tLocal("addressVal")}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-[#11a2c2]/10 flex items-center justify-center text-[#0a647a] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1a1c1e]">{tLocal("email")}</h4>
                    <a href={`mailto:${tLocal("emailVal")}`} className="text-xs sm:text-sm text-[#0a647a] hover:underline block mt-1 font-bold">
                      {tLocal("emailVal")}
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-[#11a2c2]/10 flex items-center justify-center text-[#0a647a] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1a1c1e]">{tLocal("phone")}</h4>
                    <a href={`tel:${tLocal("phoneVal")}`} className="text-xs sm:text-sm text-[#0a647a] hover:underline block mt-1 font-bold">
                      {tLocal("phoneVal")}
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-[#11a2c2]/10 flex items-center justify-center text-[#0a647a] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1a1c1e]">{tLocal("businessHours")}</h4>
                    <p className="text-xs sm:text-sm text-[#414755] mt-1 font-semibold">{tLocal("hoursVal")}</p>
                  </div>
                </div>
              </div>

              {/* Real Google Map iframe embed */}
              <div className="h-44 bg-white rounded-2xl border border-[#11a2c2]/15 relative overflow-hidden shadow-sm">
                <iframe
                  title="Google Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.467888126749!2d72.99978641151608!3d33.69229613697926!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dfbe6a42207b0b%3A0xe5566f10884df1c!2sG-11%20Markaz%20G%2011%20Markaz%20Islamabad%2C%20Islamabad%20Capital%20Territory%2C%20Pakistan!5e0!3m2!1sen!2s!4v1718220000000!5m2!1sen!2s"
                  className="w-full h-full border-0"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                <div className="absolute bottom-3 right-3 bg-white px-2.5 py-1 rounded-md border border-[#11a2c2]/15 shadow-sm text-[9px] font-bold text-[#414755] pointer-events-none">
                  {language === 'en' ? "G-11 MARKAZ" : "جی-11 مرکز"}
                </div>
              </div>
            </div>

            {/* Contact Form (Right) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#11a2c2]/10 p-6 sm:p-10 shadow-sm">
              <form onSubmit={handleContactSubmit} className="space-y-5">

                {submitSuccess && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    {tLocal("messageSuccess")}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fullName" className="text-xs font-bold text-[#1a1c1e]">{tLocal("fullName")} *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="px-4 py-3 rounded-lg border border-[#11a2c2]/20 text-sm focus:outline-none focus:border-[#11a2c2] focus:ring-1 focus:ring-[#11a2c2] bg-[#f9f9fc] text-[#1a1c1e] placeholder-gray-400 w-full transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-[#1a1c1e]">{tLocal("email")} *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="px-4 py-3 rounded-lg border border-[#11a2c2]/20 text-sm focus:outline-none focus:border-[#11a2c2] focus:ring-1 focus:ring-[#11a2c2] bg-[#f9f9fc] text-[#1a1c1e] placeholder-gray-400 w-full transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="text-xs font-bold text-[#1a1c1e]">{tLocal("phone")} *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="px-4 py-3 rounded-lg border border-[#11a2c2]/20 text-sm focus:outline-none focus:border-[#11a2c2] focus:ring-1 focus:ring-[#11a2c2] bg-[#f9f9fc] text-[#1a1c1e] placeholder-gray-400 w-full transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="companyName" className="text-xs font-bold text-[#1a1c1e]">{tLocal("companyName")}</label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="px-4 py-3 rounded-lg border border-[#11a2c2]/20 text-sm focus:outline-none focus:border-[#11a2c2] focus:ring-1 focus:ring-[#11a2c2] bg-[#f9f9fc] text-[#1a1c1e] placeholder-gray-400 w-full transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="selectedPlan" className="text-xs font-bold text-[#1a1c1e]">{tLocal("selectPlan")}</label>
                  <select
                    id="selectedPlan"
                    name="selectedPlan"
                    value={formData.selectedPlan}
                    onChange={handleInputChange}
                    className="px-4 py-3 rounded-lg border border-[#11a2c2]/20 text-sm focus:outline-none focus:border-[#11a2c2] focus:ring-1 focus:ring-[#11a2c2] bg-[#f9f9fc] text-[#1a1c1e] w-full cursor-pointer font-semibold"
                  >
                    <option value="starter">{tLocal("starter")} ({pricingPeriod === "monthly" ? tLocal("starterPrice") : tLocal("starterPriceYearly")}{tLocal("perMonth")})</option>
                    <option value="professional">{tLocal("professional")} ({pricingPeriod === "monthly" ? tLocal("professionalPrice") : tLocal("professionalPriceYearly")}{tLocal("perMonth")})</option>
                    <option value="enterprise">{tLocal("enterprise")} ({pricingPeriod === "monthly" ? tLocal("enterprisePrice") : tLocal("enterprisePriceYearly")}{tLocal("perMonth")})</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="message" className="text-xs font-bold text-[#1a1c1e]">{tLocal("message")}</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="px-4 py-3 rounded-lg border border-[#11a2c2]/20 text-sm focus:outline-none focus:border-[#11a2c2] focus:ring-1 focus:ring-[#11a2c2] bg-[#f9f9fc] text-[#1a1c1e] placeholder-gray-400 w-full resize-none transition-all"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#0a647a] hover:bg-[#0c7a94] !text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {tLocal("sending")}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      {tLocal("sendMessage")}
                    </>
                  )}
                </button>

              </form>
            </div>

          </div>
        </section>

      </main>

      {/* ──── Footer ──── */}
      <footer className="bg-white border-t border-[#11a2c2]/10 text-[#414755] py-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Logo size={24} showText={false} />
                <span className="text-lg font-bold text-[#0a647a]">{tLocal("brandName")}</span>
              </div>
              <p className="text-xs leading-relaxed font-semibold">
                © {new Date().getFullYear()} {tLocal("brandName")} Systems. <br />
                {tLocal("rightsReserved")}
              </p>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1c1e] mb-1">{tLocal("product")}</h4>
                <a href="#features" className="text-xs hover:underline decoration-[#11a2c2] font-semibold">{tLocal("features")}</a>
                <a href="#plans" className="text-xs hover:underline decoration-[#11a2c2] font-semibold">{tLocal("pricing")}</a>
                <a href="#" className="text-xs hover:underline decoration-[#11a2c2] font-semibold">{tLocal("apiDoc")}</a>
                <a href="#" className="text-xs hover:underline decoration-[#11a2c2] font-semibold">{tLocal("netStatus")}</a>
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1c1e] mb-1">{tLocal("support")}</h4>
                <a href="#contact" className="text-xs hover:underline decoration-[#11a2c2] font-semibold">{tLocal("contactUs")}</a>
                <a href="#" className="text-xs hover:underline decoration-[#11a2c2] font-semibold">{tLocal("contactSupport")}</a>
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1c1e] mb-1">{tLocal("legal")}</h4>
                <Link to="/privacy" className="text-xs hover:underline decoration-[#11a2c2] font-semibold">{tLocal("privacy")}</Link>
                <Link to="/terms" className="text-xs hover:underline decoration-[#11a2c2] font-semibold">{tLocal("terms")}</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
