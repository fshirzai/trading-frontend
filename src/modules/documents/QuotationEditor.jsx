"use client";
import { usePreferences } from "../../shared/i18n.jsx";
export default function QuotationEditor({
  schema,
  values,
  renderFields,
  ...props
}) {
  const { t } = usePreferences();
  const pick = (keys, source = schema) => ({
    ...source,
    properties: Object.fromEntries(
      keys
        .filter((k) => source.properties?.[k])
        .map((k) => [k, source.properties[k]]),
    ),
    required: (source.required || []).filter((k) => keys.includes(k)),
  });
  const group = (title, keys) => (
    <section className="quote-editor-box" key={title}>
      <h3>{t(title)}</h3>
      {renderFields({
        ...props,
        schema: {
          type: "object",
          properties: {
            quotationDetails: pick(keys, schema.properties.quotationDetails),
          },
        },
        values,
      })}
    </section>
  );
  return (
    <div className="quotation-editor">
      <div className="quote-editor-heading">
        <span>{t("PROFORMA INVOICE")}</span>
        <p>
          {t(
            "Seller and bank details are taken from System settings when the quotation is saved.",
          )}
        </p>
      </div>
      <div className="quote-editor-panels">
        {group("Invoice details", ["reference", "issueDate", "validUntil"])}
        {group("Buyer details", [
          "buyerContact",
          "buyerRegistrationNo",
          "buyerTaxNo",
        ])}
        {group("Shipping and delivery", [
          "deliveryTerms",
          "loadingPlace",
          "transport",
          "deliveryAddress",
          "origin",
          "instructions",
        ])}
        {group("Payment and notes", ["paymentInstructions", "notes"])}
      </div>
      <section className="quote-editor-box">
        <h3>{t("Goods and packaging")}</h3>
        {renderFields({ ...props, schema: pick(["items"]), values })}
      </section>
      <section className="quote-editor-box">
        <h3>{t("Totals and agreement")}</h3>
        {renderFields({
          ...props,
          schema: pick([
            "productTotal",
            "deliveryFees",
            "border",
            "splitIncluded",
            "reason",
          ]),
          values,
        })}
      </section>
    </div>
  );
}
