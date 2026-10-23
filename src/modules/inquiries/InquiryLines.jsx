"use client";
import { usePreferences } from "../../shared/i18n.jsx";
export default function InquiryLines({ inquiry }) {
  const { t, language } = usePreferences();
  if (!inquiry.items?.length) return null;
  return (
    <section className="detail-section">
      <h3>{t("Requested products")}</h3>
      <div className="inquiry-lines">
        {inquiry.items.map((x, index) => (
          <article key={x._id || x.product}>
            <span>{index + 1}</span>
            <b>
              {x.snapshot?.name?.[language] ||
                x.snapshot?.name?.en ||
                inquiry._labels?.product ||
                x.product}
            </b>
            <span>
              {x.quantity} {t(x.snapshot?.unit || "tonne")}
            </span>
          </article>
        ))}
      </div>
      <p>
        {t("Preferred payment method")}:{" "}
        {t(
          inquiry.preferredPayment === "VISA"
            ? "Visa / card via HesabPay"
            : "TT bank transfer",
        )}
      </p>
    </section>
  );
}
