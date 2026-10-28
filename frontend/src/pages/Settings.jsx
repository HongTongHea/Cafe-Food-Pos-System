import { useEffect, useState } from "react";
import { Languages, Store, Upload, Save } from "lucide-react";

import PageHeader from "../components/ui/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const DEFAULT_SHOP_NAME = "Caffee & Food";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function Settings() {
    const { language, setLanguage, t } = useLanguage();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const { shopName, logoUrl, refreshSettings } = useSettings();

    const [name, setName] = useState(shopName || DEFAULT_SHOP_NAME);
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    // Keep the name field in sync with the database value from the context
    useEffect(() => {
        setName(shopName || DEFAULT_SHOP_NAME);
    }, [shopName]);

    // Temporary preview for the newly selected file
    useEffect(() => {
        if (!logoFile) {
            setPreviewUrl("");
            return undefined;
        }

        const objectUrl = URL.createObjectURL(logoFile);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [logoFile]);

    const showMessage = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);
    };

    const clearFileInput = () => {
        const input = document.getElementById("shopLogo");
        if (input) input.value = "";
    };

    const handleLogoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setMessage("");

        if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
            showMessage("Please select a PNG, JPG, or WEBP image.", "error");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_LOGO_SIZE) {
            showMessage("Logo must be 2 MB or smaller.", "error");
            event.target.value = "";
            return;
        }

        setLogoFile(file);
    };

    const handleCancelNewLogo = () => {
        setLogoFile(null);
        setMessage("");
        clearFileInput();
    };

    const handleSaveShop = async (event) => {
        event.preventDefault();
        if (saving) return;

        const trimmedName = name.trim();

        if (!trimmedName) {
            showMessage("Shop name is required.", "error");
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            // Only send logoUrl when a new file was uploaded.
            // If it is missing, the server keeps the current logo.
            const payload = {
                shopName: trimmedName,
            };

            // STEP 1: upload the new logo file
            if (logoFile) {
                const body = new FormData();
                body.append("logo", logoFile);

                const uploadResponse = await api.post(
                    "/settings/logo",
                    body
                );

                const uploadedUrl =
                    uploadResponse.data?.data?.logoUrl;

                if (!uploadedUrl) {
                    throw new Error("The server did not return the logo path.");
                }

                payload.logoUrl = uploadedUrl;
            }

            // STEP 2: save name (+ new logo path) in the database
            const saveResponse = await api.put("/settings", payload);

            if (saveResponse.data?.success === false) {
                throw new Error(
                    saveResponse.data?.message || "The server could not save the settings.",
                );
            }

            // STEP 3: reload from the database so the sidebar updates immediately
            await api.put("/settings", payload);
            await refreshSettings();

            // STEP 4: clear the selected file (the context updates the preview)
            setLogoFile(null);
            clearFileInput();

            showMessage("Shop settings saved successfully.");
        } catch (error) {
            console.error("Save shop settings error:", error);

            showMessage(
                error.response?.data?.message ||
                error.message ||
                "Failed to save shop settings.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    const shownLogo = previewUrl || logoUrl;

    return (
        <div className="min-h-full bg-stone-50 p-4 md:p-8">
            <div className="mx-auto max-w-12xl">
                <PageHeader title={t("settings")} subtitle={t("manageSettings")} />

                {isAdmin && (
                    <section className="mb-5 rounded-2xl border border-stone-200 bg-white p-5">
                        <div className="mb-5 flex items-center gap-3">
                            <Store className="size-5 text-brand-600" />

                            <div>
                                <h2 className="font-bold">{t("shop_info")}</h2>
                                <p className="text-sm text-stone-500">
                                    {t("shop_note")}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveShop} className="max-w-lg space-y-5">
                            <div>
                                <label
                                    htmlFor="shopName"
                                    className="mb-1 block text-sm font-semibold"
                                >
                                    {t("shop_name")}
                                </label>

                                <input
                                    id="shopName"
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    required
                                    maxLength={255}
                                    placeholder="Enter shop name"
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
                                />
                            </div>

                            {/* Shop Logo */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold">
                                    {t("logo")}
                                </label>

                                {shownLogo && (
                                    <div className="mb-3">
                                        <img
                                            key={shownLogo}
                                            src={shownLogo}
                                            alt="Shop logo preview"
                                            className="h-24 w-24 rounded-xl border border-stone-200 bg-white object-contain p-2"
                                        />

                                        {logoFile && (
                                            <button
                                                type="button"
                                                onClick={handleCancelNewLogo}
                                                className="mt-2 block text-sm text-red-600 hover:underline"
                                            >
                                                Cancel new logo
                                            </button>
                                        )}
                                    </div>
                                )}

                                <label
                                    htmlFor="shopLogo"
                                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 px-4 py-5 text-sm hover:bg-stone-50"
                                >
                                    <Upload className="size-4" />
                                    <span>
                                        {logoFile ? logoFile.name : "Choose logo image"}
                                    </span>
                                </label>

                                <input
                                    id="shopLogo"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />

                                <p className="mt-1 text-xs text-stone-500">
                                    PNG, JPG, or WEBP. Maximum 2 MB.
                                </p>
                            </div>

                            {message && (
                                <p
                                    role="status"
                                    aria-live="polite"
                                    className={`text-sm ${messageType === "error"
                                        ? "text-red-600"
                                        : "text-green-600"
                                        }`}
                                >
                                    {message}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Save className="size-4" />
                                {saving ? "Saving..." : t("save_settings")}
                            </button>
                        </form>
                    </section>
                )}

                {/* Language Settings */}
                <section className="rounded-2xl border border-stone-200 bg-white p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <Languages className="size-5 text-brand-600" />

                        <div>
                            <h2 className="font-bold">{t("language")}</h2>
                            <p className="text-sm text-stone-500">{t("chooseLanguage")}</p>
                        </div>
                    </div>

                    <div className="grid max-w-sm gap-2 md:grid-cols-2">
                        {/* English */}
                        <button
                            type="button"
                            onClick={() => setLanguage("en")}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold transition ${language === "en"
                                ? "border-brand-500 bg-brand-50"
                                : "border-stone-200 hover:bg-stone-50"
                                }`}
                        >
                            <span>English</span>

                            <span
                                className={`flex h-4 w-4 items-center justify-center rounded border text-xs ${language === "en"
                                    ? "border-brand-500 bg-brand-500 text-white"
                                    : "border-stone-300 bg-white"
                                    }`}
                            >
                                {language === "en" && "✓"}
                            </span>
                        </button>

                        {/* Khmer */}
                        <button
                            type="button"
                            onClick={() => setLanguage("km")}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold font-kantumruy transition ${language === "km"
                                ? "border-brand-500 bg-brand-50"
                                : "border-stone-200 hover:bg-stone-50"
                                }`}
                        >
                            <span>ភាសាខ្មែរ</span>

                            <span
                                className={`flex h-4 w-4 items-center justify-center rounded border text-xs ${language === "km"
                                    ? "border-brand-500 bg-brand-500 text-white"
                                    : "border-stone-300 bg-white"
                                    }`}
                            >
                                {language === "km" && "✓"}
                            </span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}