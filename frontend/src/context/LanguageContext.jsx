
import { Quote } from "lucide-react";
import {
    createContext,
    useContext,
    useState,
    useEffect,
} from "react";

const LanguageContext = createContext(null);

const translations = {
    // ========================================
    // ENGLISH
    // ========================================
    en: {
        // Navigation
        dashboard: "Dashboard",
        user: "User",
        pos: "Point of Sale",
        point_of_sale: "Point of Sale",
        orders: "Orders",
        products: "Products",
        categories: "Categories",
        staff: "Staff",
        settings: "Settings",
        menu: "Menu",

        // Common fields
        name: "Name",
        full_name: "Full name",
        email: "Email",
        password: "Password",
        description: "Description",
        photo: "Photo",
        role: "Role",
        status: "Status",
        note: "Note",
        quantity: "Quantity",
        price: "Price",

        // Common actions
        add: "Add",
        save: "Save",
        saveChanges: "Save changes",
        cancel: "Cancel",
        delete: "Delete",
        deleteall: "Delete All",
        rename: "Rename",
        done: "Done",
        search: "Search",
        login: "Login",
        signOut: "Sign out",
        open_menu: "Open menu",
        close_Menu: "Close menu",
        close: "close",
        print: "Print",

        //Login Page
        welcome_back: "Welcome back",
        sign_in: "Sign In",
        sign_note: "Sign in to start taking orders.",
        slogan_shop1: "Run your café,",
        slogan_shop2: "one order at a time.",
        title1: "Fast checkout",
        text1: "Tap, charge, print. Built for saller",
        title2: "Live stock",
        text2: "Counts drop automatically with every sale.",
        title3: "Daily Data insights",
        text3: "Revenue, best sellers and low-stock alerts.",


        // Language
        language: "Language",
        chooseLanguage: "Choose your preferred language",
        english: "English",
        khmer: "Khmer",

        // Dashboard and reports
        today: "Today",
        totalSales: "Total sales",
        totalOrders: "Total orders",
        revenue: "Revenue",
        paidOrders: "Paid orders",
        voided: "Voided",
        avgOrder: "Average order",
        itemsSold: "Items sold",
        paymentMethods: "Payment methods",
        revenuePerDay: "Paid orders per day, last {days} days",
        shareOfRevenue: "Share of revenue",
        bestSellers: "Best sellers",
        byRevenue: "By revenue",
        recentOrders: "Recent orders",
        latestActivity: "Latest activity",
        everySaleAcrossTheShop: "Every sale across the shop",
        yourSales: "Your sales",
        no_prior_data: "no prior data",
        vs_previous: "vs previous",

        // Date ranges
        days: "days",
        perDay: "per day",
        last: "last",
        "7d": "7 days",
        "30d": "30 days",
        "90d": "90 days",
        date: "Date & time",
        all: "All time",
        time: "Time",

        // POS and checkout
        addProduct: "Add product",
        checkout: "Checkout",
        payment: "Payment",
        enterPrice: "Enter price",
        tapItemsToAddToOrder: "Tap items to add them to the order",
        searchMenu: "Search menu",
        type: "Type",
        total: "Total",
        items: "Items",
        stock: "Stock",
        tableNo: "Table number",
        currentOrder: "Current order",
        dineIn: "Dine in",
        takeaway: "Takeaway",
        Subtotal: "Subtotal",
        Discount: "Discount",
        none: "None",
        percent: "%",
        amount: "Amount",
        charge: "Charge",
        change: "Change",
        takepayment: "Take Payment",
        cash: "Cash",
        card: "Card",
        qr: "QR pay",
        cashReceived: "Cash received",
        complatepayment: "Complete payment",
        back: "Back",
        paymentnote: 'Let the customer scan your QR code, confirm it arrived, then tap Complete payment.',
        no_items: "No items yet",
        tap_add_items: "Tap a product to add it",

        //Receipt Payment
        receipt: "Receipt",
        thank_you_visit: "Thank You Visit",
        see_you_again: "See You Again",
        reason: "Reason",
        void_order: "Void Order",
        void: "Void",
        void_note: "The sale will be removed from revenue and stock will be returned. This can't be undone.",

        // Product management
        newProduct: "New product",
        newProductName: "Enter new product name",
        editProduct: "Edit product",
        deleteProduct: "Delete product",
        searchProduct: "Search Product",
        notedeleteProduct: 'This product will be removed from the menu. Past orders will keep their history. To hide it instead, switch off "Available".',
        addCategory: "Add category",
        editCategory: "Edit category",
        new_category_name: "New category name",
        no_categories_yet: "No categories yet",
        allCategories: "All categories",
        available: "Available",
        hidden: "Hidden",
        itemsOnMenu: "items on the menu",
        track_stock: "Track stock for this item",
        available_for_sale: "Available for sale",
        quantity_in_stock: "Quantity in stock",

        // Staff management
        addStaff: "Add staff",
        newStaff: "New staff",
        editStaff: "Edit staff",
        deleteStaff: "Delete staff",
        allStatuses: "All statuses",
        whoCanSignInToThePOS: "Who can sign in to the POS",
        createAccount: "Create account",
        updateAccount: "Update account",
        deleteAccount: "Delete account",
        confirmDeleteAccount: "Are you sure you want to delete this account? This action cannot be undone.",
        notedeleteStaff: "This staff member will no longer be able to sign in. Past orders will remain in the history. To keep the account but block access, set it to Disabled instead.",

        // Form placeholders
        enterPassword: "Enter password",
        newPassword: "New password (leave blank to keep current)",
        enterFullName: "Enter full name",
        enterEmail: "Enter email",
        percentoff: "Percent off (0–100)",
        amountoff: "Amount off",

        // Settings
        manageSettings: "Manage settings system and preferences",
        logo: "Logo",
        shop_name: "Shop Name",
        shop_info: "Shop Information",
        shop_note: "Change your shop name and logo.",
        save_settings: "Save Settings",

        // Confirmation dialogs
        signOutQuestion: "Are you sure you want to sign out?",
        signOutMessage: "You will need to log in again to access the system.",

        // General messages
        loading: "Loading...",
        note:
            "Cashiers can sell and view their own orders. Admins can also manage products, staff, and reports.",
    },

    // ========================================
    // KHMER
    // ========================================
    km: {
        // Navigation
        dashboard: "ផ្ទាំងគ្រប់គ្រង",
        user: "អ្នកប្រើប្រាស់",
        pos: "ប្រព័ន្ធលក់",
        point_of_sale: "ប្រព័ន្ធលក់",
        orders: "ការបញ្ជាទិញ",
        products: "ផលិតផល",
        categories: "ប្រភេទ",
        staff: "បុគ្គលិក",
        settings: "ការកំណត់",
        menu: "ម៉ឺនុយ",

        // Common fields
        name: "ឈ្មោះ",
        full_name: "ឈ្មោះពេញ",
        email: "អ៊ីមែល",
        password: "ពាក្យសម្ងាត់",
        description: "ការពិពណ៌នា",
        photo: "រូបភាព",
        role: "តួនាទី",
        status: "ស្ថានភាព",
        quantity: "ចំនួន",
        price: "តម្លៃ",
        note: "ចំណាំ",

        // Common actions
        add: "បន្ថែម",
        save: "រក្សាទុក",
        save_changes: "រក្សាទុកការផ្លាស់ប្តូរ",
        cancel: "បោះបង់",
        delete: "លុប",
        rename: "ប្តូរឈ្មោះ",
        done: "រួចរាល់",
        search: "ស្វែងរក",
        login: "ចូលប្រើ",
        signOut: "ចាកចេញ",
        open_menu: "បើកម៉ឺនុយ",
        close_menu: "បិទម៉ឺនុយ",
        deleteall: "លុបទាំងអស់",
        back: "ថយក្រោយ",
        close: "បិទ",
        print: "ព្រិន",
        voidorder: "លុបការបញ្ជាទិញ",

        //Login Page
        welcome_back: "សូមស្វាគមន៍ត្រឡប់មកវិញ",
        placeholder_login: "",
        sign_in: "ចូលគណនី",
        sign_note: "ចូលទៅកាន់គណនីដើម្បីចាប់ផ្តើមទទួលការបញ្ជាទិញ។",
        slogan_shop1: "ដំណើរការហាងកាហ្វេរបស់អ្នក,",
        slogan_shop2: "ដោយផ្តោតលើការបញ្ជាទិញម្តងមួយៗ។",
        title1: "ការទូទាត់ប្រាក់រហ័ស",
        text1: "ចុច, គិតតំម្លៃ, បោះពុម្ព។ បង្កើតឡើងសម្រាប់ការលក់៕",
        title2: "ស្តុកជាក់ស្តែង",
        text2: "ចំនួននឹងធ្លាក់ចុះដោយស្វ័យប្រវត្តិជាមួយនឹងការលក់នីមួយៗ។",
        title3: "ដឹងទិន្នន័យជាប្រចាំថ្ងៃ",
        text3: "ប្រាក់ចំណូល ការលក់ដាច់បំផុត និងការជូនដំណឹងអំពីស្តុក។",

        // Language
        language: "ភាសា",
        chooseLanguage: "ជ្រើសរើសភាសាដែលអ្នកចូលចិត្ត",
        english: "អង់គ្លេស",
        khmer: "ខ្មែរ",

        // Dashboard and reports
        today: "ថ្ងៃនេះ",
        totalSales: "ការលក់សរុប",
        totalOrders: "ការបញ្ជាទិញសរុប",
        revenue: "ប្រាក់ចំណូល",
        paidOrders: "ការបញ្ជាទិញដែលបានទូទាត់ប្រាក់",
        voided: "បានលុបការបញ្ជាទិញ",
        avgOrder: "ការបញ្ជាទិញជាមធ្យម",
        itemsSold: "ទំនិញដែលបានលក់",
        paymentMethods: "វិធីសាស្ត្រទូទាត់ប្រាក់",
        revenuePerDay: "ប្រាក់ចំណូលក្នុងមួយថ្ងៃ ក្នុងរយៈពេល {days} ថ្ងៃចុងក្រោយ",
        shareOfRevenue: "ចំណែកនៃប្រាក់ចំណូល",
        bestSellers: "ទំនិញលក់ដាច់បំផុត",
        byRevenue: "តាមប្រាក់ចំណូល",
        recentOrders: "ការបញ្ជាទិញថ្មីៗ",
        latestActivity: "សកម្មភាពថ្មីៗ",
        everySaleAcrossTheShop: "ការលក់ទាំងអស់ក្នុងហាង",
        yourSales: "ការលក់របស់អ្នក",
        no_prior_data: "គ្មានទិន្នន័យពីមុន",
        vs_previous: "ធៀបនឹងមុន",

        // Date ranges
        days: "ថ្ងៃ",
        perDay: "ក្នុងមួយថ្ងៃ",
        last: "ចុងក្រោយ",
        "7d": "៧ ថ្ងៃ",
        "30d": "៣០ ថ្ងៃ",
        "90d": "៩០ ថ្ងៃ",
        date: "កាលបរិច្ឆេទ & ម៉ោង",
        all: "គ្រប់ពេល",
        time: "ម៉ោង",

        // POS and checkout
        addProduct: "បន្ថែមផលិតផល",
        checkout: "ទូទាត់ប្រាក់",
        payment: "ការទូទាត់ប្រាក់",
        enterPrice: "បញ្ចូលតម្លៃ",
        tapItemsToAddToOrder: "ចុចលើទំនិញដើម្បីបន្ថែមទៅក្នុងការបញ្ជាទិញ",
        searchMenu: "ស្វែងរកម៉ឺនុយ",
        items: "ទំនិញ",
        type: "ប្រភេទ",
        total: "តំម្លៃសរុប",
        stock: "ស្តុក",
        allStatuses: "ស្ថានភាពទាំងអស់",
        tableNo: "លេខតុ",
        currentOrder: "ការបញ្ជាទិញបច្ចុប្បន្ន",
        dineIn: "អង្គុយក្នុងហាង",
        takeaway: "វេចខ្ចប់",
        Subtotal: "សរុប",
        Discount: "បញ្ចុះតម្លៃ",
        Tax: "ពន្ធ",
        none: "គ្មាន",
        amount: "ចំនួន",
        percent: "ភាគរយ",
        charge: "ទូទាត់",
        change: "លុយអាប់",
        takepayment: "ទទួលការទូទាត់",
        cash: "សាច់ប្រាក់",
        card: "កាត",
        qr: "QR pay",
        cashReceived: "ទទួលសាច់ប្រាក់",
        complatepayment: "ទូទាត់សាច់ប្រាក់",
        paymentnote: 'អនុញ្ញាតឱ្យអតិថិជនស្កេនកូដ QR របស់អ្នក បញ្ជាក់ថាបានទទួលហើយ រួចចុច «បញ្ចប់ការទូទាត់»។',
        no_items: "គ្មានទំនិញទេ",
        tap_add_items: "ចុចលើទំនិញដើម្បីបន្ថែម",

        //Receipt Payment
        receipt: "វិក្កយបត្រ",
        thank_you_visit: "សូមអគុណសម្រាប់ការបញ្ជាទិញ",
        see_you_again: "ជួបគ្នាម្ដងទៀត",
        reason: "ហេតុផល",
        void_order: "លុបការបញ្ជាទិញ",
        void: "លុបចោលការបញ្ជាទិញ",
        void_note: "ការលក់នេះនឹងត្រូវបានដកចេញពីចំណូល ហើយទំនិញនឹងត្រូវបញ្ចូលត្រឡប់ចូលស្តុកវិញ។ សកម្មភាពនេះមិនអាចលុបចោល ឬកែប្រែឡើងវិញបានទេ។",


        // Product management
        newProduct: "ផលិតផលថ្មី",
        newProductName: "បញ្ចូលឈ្មោះផលិតផលថ្មី",
        editProduct: "កែប្រែផលិតផល",
        deleteProduct: "លុបផលិតផល",
        searchProduct: "ស្វែងរកទំនិញ",
        notedeleteProduct: 'ផលិតផលនេះនឹងត្រូវបានលុបចេញពីម៉ឺនុយ។ ការបញ្ជាទិញចាស់ៗនឹងរក្សាប្រវត្តិដដែល។ ប្រសិនបើអ្នកគ្រាន់តែចង់លាក់វា សូមបិទជម្រើស "មានលក់"។',
        addCategory: "បន្ថែមប្រភេទ",
        editCategory: "កែប្រែប្រភេទ",
        new_category_name: "ឈ្មោះប្រភេទថ្មី",
        no_categories_yet: "មិនទាន់មានប្រភេទទេ",
        allCategories: "ប្រភេទទាំងអស់",
        available: "មានលក់",
        hidden: "បានលាក់",
        itemsOnMenu: "មុខទំនិញក្នុងម៉ឺនុយ",
        track_stock: "តាមដានស្តុកសម្រាប់ទំនិញនេះ",
        available_for_sale: "មានលក់",
        quantity_in_stock: "ចំនួននៅក្នុងស្តុក",

        // Staff management
        addStaff: "បន្ថែមបុគ្គលិក",
        newStaff: "បន្ថែមបុគ្គលិកថ្មី",
        editStaff: "កែប្រែបុគ្គលិក",
        deleteStaff: "លុបបុគ្គលិក",
        allStatuses: "ស្ថានភាពទាំងអស់",
        cashiers: "អ្នកលក់",
        whoCanSignInToThePOS: "អ្នកដែលអាចចូលប្រើប្រព័ន្ធគ្រប់គ្រង",
        createAccount: "បង្កើតគណនី",
        updateAccount: "កែប្រែគណនី",
        deleteAccount: "លុបគណនី",
        confirmDeleteAccount: "តើអ្នកប្រាកដថាចង់លុបគណនីនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
        notedeleteStaff: 'បុគ្គលិកនេះនឹងមិនអាចចូលប្រើប្រព័ន្ធបានទៀតទេ។ ប្រវត្តិនៃការបញ្ជាទិញចាស់ៗនឹងនៅដដែល។ ប្រសិនបើអ្នកចង់រក្សាគណនី ប៉ុន្តែបិទការចូលប្រើ សូមកំណត់ស្ថានភាពជា "Disabled"។',

        // Form placeholders
        enterPassword: "បញ្ចូលពាក្យសម្ងាត់",
        newPassword: "ពាក្យសម្ងាត់ថ្មី (ទុកទទេដើម្បីរក្សាពាក្យសម្ងាត់បច្ចុប្បន្ន)",
        enterFullName: "បញ្ចូលឈ្មោះពេញ",
        enterEmail: "បញ្ចូលអ៊ីមែល",
        percentoff: "បញ្ចុះតម្លៃភាគរយ (0–100)",
        amountoff: "បញ្ចុះតម្លៃចំនួន",

        // Settings
        manageSettings: "គ្រប់គ្រងការកំណត់សរបស់ប្រព័ន្ធគ្រប់គ្រង",
        logo: "ឡូហ្គោ",
        shop_name: "ឈ្មោះហាង",
        shop_info: "ព័ត៌មានអំពីហាង",
        shop_note: "ផ្លាស់ប្ដូរឈ្មោះហាង និងឡូហ្គោរបស់អ្នក។",
        save_settings: "រក្សាទុកការកំណត់",

        // Confirmation dialogs
        signOutQuestion: "តើអ្នកប្រាកដថាចង់ចាកចេញមែនទេ?",
        signOutMessage: "អ្នកត្រូវចូលប្រើម្តងទៀតដើម្បីប្រើប្រាស់ប្រព័ន្ធ។",

        // General messages
        loading: "កំពុងផ្ទុក...",
        note: "អ្នកលក់អាចលក់ និងមើលការបញ្ជាទិញរបស់ខ្លួន។ អ្នកគ្រប់គ្រងក៏អាចគ្រប់គ្រងផលិតផល បុគ្គលិក និងរបាយការណ៍បានដែរ។",
    },
};
export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(
        () => localStorage.getItem("app-language") || "en"
    );

    useEffect(() => {
        localStorage.setItem("app-language", language);
        document.documentElement.lang = language;
        document.documentElement.dataset.language = language;
    }, [language]);

    const t = (key) =>
        translations[language]?.[key] ??
        translations.en[key] ??
        key;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error(
            "useLanguage must be used inside LanguageProvider"
        );
    }

    return context;
}
