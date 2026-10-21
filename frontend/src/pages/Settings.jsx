import { useLanguage } from "../context/LanguageContext";
import { Languages } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";

export default function Settings() {
    const { language, setLanguage, t } = useLanguage();

    return (
        <div className="min-h-full bg-stone-50 p-4 md:p-8">
            <div className="mx-auto max-w-12xl">
                <PageHeader
                    title={t("settings")}
                    subtitle={t("manageSettings")}
                />
                <section className="rounded-2xl border border-stone-200 bg-white p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <Languages className="size-5 text-brand-600" />
                        <div>
                            <h2 className="font-bold">{t("language")}</h2>
                            <p className="text-sm text-stone-500">
                                {t("chooseLanguage")}
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-2 max-w-sm md:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => setLanguage("en")}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold transition ${language === "en"
                                ? "border-brand-500 bg-brand-50"
                                : "border-stone-200 hover:bg-stone-50"
                                }`}
                        >
                            <span>English</span>
                            <span className={`flex h-4 w-4 items-center justify-center rounded border text-xs ${language === "en"
                                ? "border-brand-500 bg-brand-500 text-white"
                                : "border-stone-300 bg-white"
                                }`}>
                                {language === "en" && "✓"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setLanguage("km")}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold font-kantumruy transition ${language === "km"
                                ? "border-brand-500 bg-brand-50"
                                : "border-stone-200 hover:bg-stone-50"
                                }`}
                        >
                            <span>ភាសាខ្មែរ</span>
                            <span className={`flex h-4 w-4 items-center justify-center rounded border text-xs ${language === "km"
                                ? "border-brand-500 bg-brand-500 text-white"
                                : "border-stone-300 bg-white"
                                }`}>
                                {language === "km" && "✓"}
                            </span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}