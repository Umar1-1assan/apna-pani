import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../contexts/LanguageContext";

export function TermsPage() {
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
          {language === "ur" ? "شرائط و ضوابط" : "Terms & Conditions"}
        </h1>
        
        <p className="text-[#414755] text-sm mb-4">
          Last Updated: June 2026
        </p>

        <div className="space-y-8 text-[#414755] text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the AquaFlow platform, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">2. Service Scope and Accounts</h2>
            <p>
              AquaFlow is a multi-tenant platform facilitating water delivery management. Users must register an account with valid information (such as active phone numbers) to sign in. Each tenant is responsible for managing their internal user permissions and client details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">3. Billing and Transactions</h2>
            <p>
              Water suppliers set pricing, log deliveries, and generate monthly customer invoices. AquaFlow provides automation tools but is not a party to financial transactions between suppliers, riders, and customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">4. Intellectual Property</h2>
            <p>
              All software codebase, design systems, illustrations, trademarks, and interfaces of the AquaFlow platform are protected by intellectual property rights owned by AquaFlow Systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1a1c1e] mb-3">5. Disclaimer of Liability</h2>
            <p>
              AquaFlow is provided "as is" without warranties of any kind. We are not liable for operational errors, delivery delays, routing miscalculations, or SMS/WhatsApp gateway communication issues.
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
