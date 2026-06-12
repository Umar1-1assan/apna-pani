import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../contexts/LanguageContext";

export function PrivacyPolicyPage() {
  const { language } = useTranslation();

  useEffect(() => {
    // Ensure page starts at top
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#f9f9fc] text-[#1a1c1e] antialiased font-sans min-h-screen flex flex-col">
      {/* Mini Header */}
      <header className="bg-white border-b border-[#11a2c2]/10 py-4">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] flex justify-between items-center">
          <Link to="/" className="text-xl font-extrabold text-[#0a647a] tracking-tight">
            {language === "ur" ? "ایکوافلو" : "AquaFlow"}
          </Link>
          <Link to="/" className="text-sm font-semibold text-[#0a647a] hover:text-[#0c7a94] hover:underline">
            {language === "ur" ? "ہوم پیج پر واپس جائیں" : "Back to Home"}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-[800px] mx-auto px-5 py-12 md:py-20">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1c1e] mb-6">
          {language === "ur" ? "رازداری کی پالیسی" : "Privacy Policy"}
        </h1>
        
        <p className="text-[#414755] text-sm mb-4">
          Last Updated: June 2026
        </p>

        <div className="space-y-8 text-[#414755] text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">1. Information We Collect</h2>
            <p>
              We collect information to provide better services to all our users. This includes account details such as names, phone numbers, delivery addresses, and operational logs generated during water deliveries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">2. How We Use Information</h2>
            <p>
              We use the collected information to route deliveries efficiently, process automated invoices, facilitate rider communication, and send transactional notifications (such as WhatsApp receipt updates) via official APIs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">3. Data Isolation and Multi-Tenancy</h2>
            <p>
              As a multi-tenant platform, your database workspace is fully isolated. We enforce strict access controls to ensure that customer lists, billing agreements, and delivery logs are confidential and private to each specific water supplier tenant.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">4. Cookies and Web Storage</h2>
            <p>
              We use browser local storage and cookies to save configuration preferences (such as language settings) and secure authentication states (login tokens).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact our system administrator support channel.
            </p>
          </section>
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="bg-white border-t border-[#11a2c2]/10 py-6 text-center text-xs text-[#414755] font-semibold">
        © {new Date().getFullYear()} {language === "ur" ? "ایکوافلو" : "AquaFlow"} Systems. All rights reserved.
      </footer>
    </div>
  );
}
