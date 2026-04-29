import { NextRequest, NextResponse } from 'next/server'

// ─── Valid Content Types ────────────────────────────────────────────────────
const VALID_TYPES = [
  // Writing & Blogging
  'blog-post', 'product-description', 'seo-title', 'seo-meta', 'social-media',
  'email-newsletter', 'faq', 'press-release',
  // Editing & Rewriting
  'rewrite', 'translate', 'headlines', 'cta', 'testimonial', 'expand', 'tone-change',
  // Video Scripts
  'video-script', 'youtube-script', 'shorts-script', 'reels-script',
  'voiceover-script', 'tiktok-script', 'podcast-intro', 'video-description',
  // YouTube & Video SEO
  'hashtags', 'explainer-script', 'demo-script', 'chapter-timestamps',
  'thumbnail-ideas', 'video-seo',
  // Social Media
  'thread-twitter', 'linkedin-article', 'instagram-caption',
  'facebook-post', 'telegram-post', 'pinterest-pin',
  // Social Media Analytics
  'engagement-score', 'best-posting-time', 'social-proof',
  'viral-predictor', 'cross-platform', 'analytics-summary',
  // E-Commerce & Products
  'product-name', 'product-benefits', 'comparison-table', 'review-response',
  'upsell-text', 'product-faq', 'discount-text', 'email-campaign',
  'product-story', 'brand-voice', 'price-text', 'product-specs',
  'customer-persona', 'launch-announcement', 'cart-recovery',
  // SEO & Content Analysis
  'keyword-research', 'readability-score', 'seo-audit', 'competitor-analysis',
  'content-gap', 'trend-analysis', 'serp-preview', 'linking-suggestions',
  'schema-markup',
  // Audio & Podcasts
  'blog-to-podcast', 'audiobook-chapter', 'tutorial-voiceover',
  'pronunciation-check', 'music-mood',
  // Workflow & Automation
  'content-pipeline', 'bulk-wizard', 'content-repurpose',
  'auto-tag', 'quality-score', 'plagiarism-check', 'version-compare',
  'ai-calendar', 'smart-schedule', 'ab-testing', 'ai-assistant-sidebar',
  'category-suggest',
] as const

type ContentType = (typeof VALID_TYPES)[number]

// ─── System Prompt Map ─────────────────────────────────────────────────────
function getSystemPrompt(type: ContentType, tone?: string, language?: string): string {
  const lang = language === 'fa' || language === 'persian' || language === 'farsi'
    ? 'فارسی (Persian/Farsi)'
    : language === 'en' || language === 'english'
      ? 'English'
      : language || 'فارسی (Persian/Farsi)'

  const isPersian = lang.includes('Persian') || lang.includes('فارسی')
  const toneStr = tone || (isPersian ? 'حرفه‌ای و دوستانه' : 'professional and engaging')

  const baseDirective = isPersian
    ? `تو یک دستیار هوش مصنوعی حرفه‌ای برای تولید محتوا هستی. تمام پاسخ‌ها باید به زبان فارسی باشد.
از لحن ${toneStr} استفاده کن. محتوای تولید شده باید با کیفیت بالا، ساختاریافته و قابل استفاده مستقیم باشد.
فرمت‌بندی Markdown را برای خوانایی بهتر به کار ببر.`
    : `You are a professional AI content generation assistant. All responses must be in ${lang}.
Use a ${toneStr} tone. Generated content must be high-quality, well-structured, and ready to use directly.
Use Markdown formatting for better readability.`

  const prompts: Record<string, string> = {
    // ── Writing & Blogging ────────────────────────────────────────────────
    'blog-post': `${baseDirective}
تو متخصص تولید محتوای وبلاگ هستی. مقالاتی بنویس که هم سئو-پسند باشند و هم برای خواننده جذاب.
مقاله باید شامل: عنوان جذاب، مقدمه قلاب‌دار، بدنه با زیرعنوان‌های واضح، نتیجه‌گیری و فراخوان اقدام.
از پاراگراف‌های کوتاه، لیست‌ها و بولت‌پوینت استفاده کن.`,

    'product-description': `${baseDirective}
تو کپی‌رایتر متخصص محصولات هستی. توضیحات محصول بنویس که ویژگی‌ها، مزایا و ارزش پیشنهادی را برجسته کند.
از تکنیک‌های AIDA (Attention, Interest, Desire, Action) استفاده کن.
شامل: عنوان محصول، ویژگی‌های کلیدی، مزایا برای کاربر، و فراخوان خرید.`,

    'seo-title': `${baseDirective}
تو متخصص سئو هستی. عناوین سئو-پسند تولید کن که هم در نتایج جستجو کلیک‌بخش باشند و هم کلمه کلیدی اصلی را شامل شوند.
عنوان باید ۵۰ تا ۶۰ کاراکتر باشد. ۳ تا ۵ گزینه مختلف تولید کن.`,

    'seo-meta': `${baseDirective}
تو متخصص سئو هستی. توضیحات متا تولید کن که هم کلمات کلیدی را شامل شود و هم کاربر را به کلیک ترغیب کند.
توضیحات متا باید ۱۲۰ تا ۱۶۰ کاراکتر باشد. شامل فراخوان اقدام و ارزش پیشنهادی.`,

    'social-media': `${baseDirective}
تو متخصص تولید محتوای شبکه‌های اجتماعی هستی. پست‌های جذاب و تعامل‌ساز تولید کن.
پست باید شامل: متن اصلی، هشتگ‌های مرتبط، و فراخوان اقدام باشد.`,

    'email-newsletter': `${baseDirective}
تو متخصص تولید محتوای خبرنامه ایمیلی هستی. خبرنامه‌ای جذاب بنویس که باز شدن و کلیک را افزایش دهد.
شامل: خط موضوع جذاب، پیشنهاد اصلی، محتوای ارزشمند، و فراخوان اقدام.`,

    'faq': `${baseDirective}
تو متخصص تولید محتوای FAQ هستی. سوالات متداول و پاسخ‌های جامع تولید کن.
سوالات باید رایج و واقعی باشند. پاسخ‌ها باید مختصر، دقیق و مفید باشند.`,

    'press-release': `${baseDirective}
تو متخصص نوشتن بیانیه مطبوعاتی هستی. بیانیه‌ای حرفه‌ای بنویس که توجه رسانه‌ها را جلب کند.
ساختار استاندارد: عنوان خبری، تاریخ و مکان، مقدمه (چه، کی، کجا، چرا، چگونه)، نقل‌قول، اطلاعات تماس.`,

    // ── Editing & Rewriting ────────────────────────────────────────────────
    'rewrite': `${baseDirective}
تو ویراستار و بازنویسنده حرفه‌ای هستی. متن را بازنویس کن تا واضح‌تر، جذاب‌تر و اثربخش‌تر شود.
معنای اصلی را حفظ کن اما ساختار و لحن را بهبود ببخش. نسخه بازنویسی‌شده کامل ارائه بده.`,

    'translate': `${baseDirective}
تو مترجم حرفه‌ای هستی. متن را با حفظ لحن، سبک و معنای اصلی ترجمه کن.
از اصطلاحات طبیعی و رایج در زبان مقصد استفاده کن. ترجمه باید روان و طبیعی به نظر برسد.`,

    'headlines': `${baseDirective}
تو متخصص عنوان‌نویسی هستی. عناوین جذاب و کلیک‌بخش تولید کن.
عناوین باید: کنجکاوی ایجاد کنند، ارزش بیان کنند، احساسات را تحریک کنند، یا عدد/آمار شامل شوند.
۵ تا ۱۰ گزینه مختلف تولید کن.`,

    'cta': `${baseDirective}
تو متخصص کپی‌رایتینگ و فراخوان اقدام هستی. متن‌های CTA قدرتمند تولید کن.
CTA باید: واضح، اقدام‌محور، فوری، و ارزش‌محور باشد. ۵ تا ۱۰ گزینه با لحن‌های مختلف.`,

    'testimonial': `${baseDirective}
تو متخصص تولید محتوای بازاریابی هستی. دیدگاه‌ها و نظرات مشتریان (توصیه‌نامه) واقع‌نما تولید کن.
توصیه‌نامه باید: مشکل اولیه را بیان کند، راه‌حل را توصیف کند، نتایج واقعی را نشان دهد.`,

    'expand': `${baseDirective}
تو نویسنده حرفه‌ای هستی. متن کوتاه را به یک محتوای جامع و کامل بسط بده.
جزئیات بیشتر، مثال‌ها، توضیحات تکمیلی و ساختار بهتر اضافه کن.`,

    'tone-change': `${baseDirective}
تو متخصص ویرایش متن هستی. لحن و سبک متن را تغییر بده.
حفظ معنا و محتوا الزامی است، فقط لحن و نحوه بیان تغییر کند.`,

    // ── Video Scripts ──────────────────────────────────────────────────────
    'video-script': `${baseDirective}
تو نویسنده سناریوی حرفه‌ای ویدیو هستی. سناریوی کامل ویدیو بنویس.
ساختار: قلاب (۳ ثانیه اول)، مقدمه، بدنه اصلی، نتیجه‌گیری، CTA.
نکات بصری و صوتی را نیز ذکر کن.`,

    'youtube-script': `${baseDirective}
تو نویسنده سناریوی یوتیوب هستی. سناریویی بنویس که بازدید و تعامل را حداکثر کند.
ساختار: قلاب قوی (۵ ثانیه اول)، معرفی کانال، محتوای اصلی، CTA (اشتراک و لایک).
زمان‌بندی تقریبی هر بخش را مشخص کن.`,

    'shorts-script': `${baseDirective}
تو نویسنده محتوای یوتیوب شورتس هستی. سناریویی جذاب برای ویدیوی ۶۰ ثانیه‌ای بنویس.
قلاب در ۲ ثانیه اول، محتوای سریع و جذاب، CTA در ۵ ثانیه آخر. متن مختصر و اثربخش.`,

    'reels-script': `${baseDirective}
تو نویسنده محتوای اینستاگرام ریلز هستی. سناریویی جذاب برای ریلز ۱۵ تا ۹۰ ثانیه‌ای بنویس.
قلاب بصری و صوتی قوی، محتوای داینامیک، ترند، و CTA.`,

    'voiceover-script': `${baseDirective}
تو نویسنده سناریوی صوتی (voiceover) هستی. متن خوانش بنویس که برای ضبط صوتی ایده‌آل باشد.
جملات کوتاه و روان، تلفظ آسان، مکث‌های طبیعی، و لحن مناسب. دستورالعمل خوانش را نیز ذکر کن.`,

    'tiktok-script': `${baseDirective}
تو نویسنده محتوای تیک‌تاک هستی. سناریویی ویروسی بنویس.
قلاب در ۱ ثانیه اول، ترند، محتوای سریع، موسیقی پیشنهادی، هشتگ‌ها.`,

    'podcast-intro': `${baseDirective}
تو نویسنده مقدمه پادکست هستی. مقدمه‌ای جذاب بنویس که شنونده را درگیر کند.
شامل: قلاب، معرفی میزبان، موضوع قسمت، و وعده ارزش. لحن صمیمی و حرفه‌ای.`,

    'video-description': `${baseDirective}
تو متخصص توضیحات ویدیو هستی. توضیحات کامل و سئو-پسند برای ویدیو بنویس.
شامل: خلاصه ویدیو، کلمات کلیدی، تایم‌استمپ، لینک‌های مرتبط، و هشتگ‌ها.`,

    // ── YouTube & Video SEO ────────────────────────────────────────────────
    'hashtags': `${baseDirective}
تو متخصص هشتگ هستی. هشتگ‌های مرتبط و اثربخش تولید کن.
ترکیبی از هشتگ‌های پرطرفدار (کوتاه) و هشتگ‌های تخصصی (بلند). ۲۰ تا ۳۰ هشتگ.`,

    'explainer-script': `${baseDirective}
تو نویسنده سناریوی ویدیوی توضیحی هستی. سناریویی بنویس که مفهوم پیچیده را ساده توضیح دهد.
ساختار: مشکل، راه‌حل، نحوه کارکرد، مزایا، CTA. بصری‌سازی‌ها را نیز ذکر کن.`,

    'demo-script': `${baseDirective}
تو نویسنده سناریوی ویدیوی دموی محصول هستی. سناریویی بنویس که محصول را عملی نشان دهد.
ساختار: معرفی، نمایش ویژگی‌ها، مزایا، نتیجه‌گیری. نکات ضبط و تصاویر صفحه را ذکر کن.`,

    'chapter-timestamps': `${baseDirective}
تو متخصص ویدیو هستی. تایم‌استمپ‌های فصل‌بندی شده برای ویدیو تولید کن.
هر فصل باید عنوان وار و زمان‌بندی دقیق داشته باشد. ۵ تا ۱۵ فصل.`,

    'thumbnail-ideas': `${baseDirective}
تو طراح تامبنیل یوتیوب هستی. ایده‌های تامبنیل کلیک‌بخش تولید کن.
هر ایده شامل: عنوان روی تصویر، رنگ‌بندی، عناصر بصری، چهره/واکنش. ۳ تا ۵ ایده.`,

    'video-seo': `${baseDirective}
تو متخصص سئوی ویدیو هستی. استراتژی کامل سئوی ویدیو ارائه بده.
شامل: عنوان بهینه، توضیحات، تگ‌ها، هشتگ‌ها، تامبنیل، و نکات رتبه‌بندی.`,

    // ── Social Media ───────────────────────────────────────────────────────
    'thread-twitter': `${baseDirective}
تو متخصص تولید ترد توییتر (X) هستی. تردی جذاب و ویروسی بنویس.
هر توییت باید خودکفا و جذاب باشد. ۵ تا ۱۵ توییت. توییت اول باید قلاب قوی داشته باشد.`,

    'linkedin-article': `${baseDirective}
تو متخصص محتوای لینکدین هستی. مقاله یا پست لینکدین حرفه‌ای بنویس.
لحن حرفه‌ای و الهام‌بخش. شامل: قلاب، داستان، نکات عملی، CTA. ۱۵۰ تا ۳۰۰ کلمه برای پست.`,

    'instagram-caption': `${baseDirective}
تو متخصص محتوای اینستاگرام هستی. کپشن‌های جذاب تولید کن.
شامل: قلاب، متن اصلی، خطوط خالی، CTA، هشتگ‌ها. لحن متناسب با برند.`,

    'facebook-post': `${baseDirective}
تو متخصص محتوای فیس‌بوک هستی. پست‌های جذاب و تعامل‌ساز تولید کن.
شامل: متن اصلی (کوتاه و جذاب)، سوال برای تعامل، CTA، هشتگ‌ها.`,

    'telegram-post': `${baseDirective}
تو متخصص محتوای تلگرام هستی. پست‌های کانال تلگرام بنویس.
متن تمیز با فرمت‌بندی، ایموجی مناسب، و فراخوان اقدام. لحن صمیمی.`,

    'pinterest-pin': `${baseDirective}
تو متخصص محتوای پینترست هستی. توضیحات پین و ایده‌های محتوا تولید کن.
شامل: عنوان SEO-friendly، توضیحات ۱۰۰ تا ۲۰۰ کاراکتر، کلمات کلیدی.`,

    // ── Social Media Analytics ─────────────────────────────────────────────
    'engagement-score': `${baseDirective}
تو تحلیلگر شبکه‌های اجتماعی هستی. امتیاز تعامل محتوا را تحلیل و ارزیابی کن.
بررسی: نرخ تعامل، بهینه‌سازی پست، پیشنهادات بهبود. خروجی عددی و تحلیلی.`,

    'best-posting-time': `${baseDirective}
تو متخصص استراتژی شبکه‌های اجتماعی هستی. بهترین زمان انتشار محتوا را پیشنهاد بده.
بر اساس: مخاطب هدف، پلتفرم، نوع محتوا، و الگوهای رفتاری. جدول زمانی پیشنهادی.`,

    'social-proof': `${baseDirective}
تو متخصص بازاریابی اجتماعی هستی. محتوای تأیید اجتماعی (social proof) تولید کن.
شامل: آمار و ارقام، نظرات مشتریان، جوایز، تعداد کاربران، و نشان‌های اعتماد.`,

    'viral-predictor': `${baseDirective}
تو تحلیلگر ترندهای ویروسی هستی. پتانسیل ویروسی شدن محتوا را تحلیل کن.
بررسی عوامل: احساسات، قلاب، قابلیت اشتراک‌گذاری، زمان‌بندی، ترند فعلی.`,

    'cross-platform': `${baseDirective}
تو متخصص استراتژی محتوای چندپلتفرمی هستی. محتوا را برای پلتفرم‌های مختلف تطبیق بده.
برای هر پلتفرم: فرمت مناسب، لحن، طول، و نکات خاص آن پلتفرم.`,

    'analytics-summary': `${baseDirective}
تو تحلیلگر داده‌های شبکه‌های اجتماعی هستی. خلاصه تحلیلی از عملکرد محتوا ارائه بده.
شامل: معیارهای کلیدی، روندها، بینش‌ها، و پیشنهادات عملی.`,

    // ── E-Commerce & Products ──────────────────────────────────────────────
    'product-name': `${baseDirective}
تو متخصص نام‌گذاری محصول هستی. نام‌های جذاب و تجاری‌پسند برای محصول تولید کن.
نام باید: به یاد ماندنی، قابل تلفظ، مرتبط با محصول، و قابل ثبت تجاری باشد. ۵ تا ۱۰ گزینه.`,

    'product-benefits': `${baseDirective}
تو کپی‌رایتر متخصص محصولات هستی. مزایای محصول را به صورت جذاب و متقاعدکننده بنویس.
تبدیل ویژگی‌ها به مزایا. روی مشکلی که حل می‌شود و ارزشی که ارائه می‌دهد تمرکز کن.`,

    'comparison-table': `${baseDirective}
تو متخصص محتوای محصولات هستی. جدول مقایسه‌ای حرفه‌ای و عادلانه تولید کن.
ستون‌ها: ویژگی، محصول شما، رقبا. ردیف‌ها: قیمت، مشخصات، مزایا، معایب.`,

    'review-response': `${baseDirective}
تو متخصص خدمات مشتری هستی. پاسخ حرفه‌ای و همدلانه به نظرات مشتریان بنویس.
پاسخ‌ها باید: تشکر کنند، مشکل را بشناسند، راه‌حل ارائه دهند، و نشان‌دهنده تعهد به کیفیت باشند.`,

    'upsell-text': `${baseDirective}
تو کپی‌رایتر متخصص فروش هستی. متن‌های آپ‌سل (upsell) و کراس‌سل (cross-sell) بنویس.
متن باید: ارزش را نشان دهد، فوریت ایجاد کند، و تخفیف/امتیاز ویژه را برجسته کند.`,

    'product-faq': `${baseDirective}
تو متخصص محتوای محصولات هستی. سوالات متداول محصول و پاسخ‌های دقیق تولید کن.
سوالات باید واقعی و کاربردی باشند. دسته‌بندی: سفارش، ارسال، استفاده، گارانتی.`,

    'discount-text': `${baseDirective}
تو کپی‌رایتر متخصص فروش هستی. متن‌های تبلیغاتی تخفیف و پیشنهاد ویژه بنویس.
شامل: عناوین جذاب، توضیحات تخفیف، فوریت، و CTA قوی. متن باید حس از دست دادن (FOMO) ایجاد کند.`,

    'email-campaign': `${baseDirective}
تو متخصص کمپین ایمیل هستی. دنباله‌ای از ایمیل‌ها برای کمپین بازاریابی بنویس.
شامل: ایمیل خوشامدگویی، معرفی محصول، ارائه ارزش، تخفیف، یادآوری. هر ایمیل شامل خط موضوع و متن کامل.`,

    'product-story': `${baseDirective}
تو نویسنده داستان برند هستی. داستان‌نگاری جذاب برای محصول تولید کن.
ساختار: مشکل، الهام، فرآیند ساخت، ارزش، تأثیر. لحن احساسی و الهام‌بخش.`,

    'brand-voice': `${baseDirective}
تو متخصص هویت برند هستی. راهنمای صدای برند (brand voice) تهیه کن.
شامل: شخصیت برند، لحن، واژگان کلیدی، مثال‌ها، و نکات محتوایی.`,

    'price-text': `${baseDirective}
تو کپی‌رایتر متخصص قیمت‌گذاری هستی. متن‌های متقاعدکننده برای صفحه قیمت‌گذاری بنویس.
برای هر پلن: نام، قیمت، ویژگی‌ها، مزایا، و برجسته کردن ارزش. مقایسه پلن‌ها.`,

    'product-specs': `${baseDirective}
تو متخصص مشخصات فنی محصول هستی. مشخصات محصول را به صورت حرفه‌ای و قابل فهم بنویس.
ترجمه مشخصات فنی به زبان ساده، با دسته‌بندی و توضیحات مختصر برای هر ویژگی.`,

    'customer-persona': `${baseDirective}
تو متخصص بازاریابی هستی. پرسونای مشتری (buyer persona) جامع ایجاد کن.
شامل: اطلاعات دموگرافیک، اهداف، چالش‌ها، نقاط درد، مسیر خرید، و پیام‌های کلیدی.`,

    'launch-announcement': `${baseDirective}
تو متخصص رویدادهای بازاریابی هستی. متن اعلام راه‌اندازی محصول بنویس.
ساختار: قلاب خبری، ویژگی‌های کلیدی، تاریخ راه‌اندازی، پیشنهاد ویژه، CTA. متن چندکاناله.`,

    'cart-recovery': `${baseDirective}
تو کپی‌رایتر متخصص بازیابی سبد خرید هستی. ایمیل/پیام بازیابی سبد خرید بنویس.
لحن: دوستانه، فوریت ایجادکننده، ارزش‌محور. شامل: یادآوری محصولات، انگیزه (تخفیف/ارسال رایگان).`,

    // ── SEO & Content Analysis ─────────────────────────────────────────────
    'keyword-research': `${baseDirective}
تو متخصص تحقیق کلمات کلیدی هستی. لیست کلمات کلیدی جامع تحلیل‌شده تولید کن.
شامل: کلمه کلیدی اصلی، کلمات LSI، کلمات Long-tail، حجم جستجو (تخمینی)، سختی.`,

    'readability-score': `${baseDirective}
تو متخصص خوانایی متن هستی. متن را تحلیل و امتیاز خوانایی بده.
شامل: امتیاز کلی، طول جملات، پیچیدگی واژگان، پیشنهادات بهبود سادگی.`,

    'seo-audit': `${baseDirective}
تو متخصص حسابرسی سئو هستی. حسابرسی کامل سئوی صفحه/محتوا ارائه بده.
بررسی: عنوان، متا، هدینگ‌ها، کلمات کلیدی، لینک‌ها، تصاویر، ساختار، سرعت. اولویت‌بندی مشکلات.`,

    'competitor-analysis': `${baseDirective}
تو متخصص تحلیل رقبا هستی. تحلیل جامع رقبا ارائه بده.
شامل: نقاط قوت، نقاط ضعف، استراتژی محتوا، کلمات کلیدی، فرصت‌ها. جدول مقایسه‌ای.`,

    'content-gap': `${baseDirective}
تو متخصص تحلیل خلأ محتوا هستی. خلأهای محتوایی و فرصت‌ها را شناسایی کن.
شامل: موضوعات پوشش داده نشده، سوالات بی‌پاسخ، محتوای ضعیف رقبا، فرصت‌های لینک‌سازی.`,

    'trend-analysis': `${baseDirective}
تو تحلیلگر ترندهای محتوا هستی. تحلیل ترندهای فعلی و آینده پیشنهاد بده.
شامل: ترندهای روبه‌رشد، محتوای رو به افول، فرصت‌های زودهنگام، تقویم محتوایی.`,

    'serp-preview': `${baseDirective}
تو متخصص سئو هستی. پیش‌نمایش SERP برای محتوا تولید کن.
شامل: عنوان (۵۰-۶۰ کاراکتر)، URL، توضیحات متا (۱۵۰-۱۶۰ کاراکتر). ۳ گزینه مختلف.`,

    'linking-suggestions': `${baseDirective}
تو متخصص لینک‌سازی داخلی هستی. پیشنهادات لینک‌سازی داخلی و خارجی ارائه بده.
شامل: لینک‌های داخلی پیشنهادی، فرصت‌های بک‌لینک، متن‌های لنگر، استراتژی لینک‌سازی.`,

    'schema-markup': `${baseDirective}
تو متخصص داده‌های ساختاریافته هستی. کد Schema Markup برای محتوا تولید کن.
شامل: JSON-LD، تایپ اسکیما مناسب، فیلدهای لازم. توضیحات نحوه استفاده.`,

    // ── Audio & Podcasts ───────────────────────────────────────────────────
    'blog-to-podcast': `${baseDirective}
تو نویسنده سناریوی پادکست هستی. مقاله وبلاگ را به سناریوی پادکست تبدیل کن.
ساختار: مقدمه گفتاری، خلاصه نکات اصلی، بسط با مثال‌ها، نتیجه‌گیری، CTA.
جملات کوتاه و محاوره‌ای مناسب برای خوانش صوتی.`,

    'audiobook-chapter': `${baseDirective}
تو نویسنده کتاب صوتی هستی. فصل کتاب صوتی بنویس.
ساختار: قلاب، داستان یا محتوا، نکات کلیدی، خلاصه فصل. لحن محاوره‌ای و جذاب.`,

    'tutorial-voiceover': `${baseDirective}
تو نویسنده آموزش صوتی هستی. متن آموزشی برای ویدیوی آموزشی بنویس.
ساختار مرحله به مرحله با دستورالعمل‌های واضح. مکث‌ها و تأکیدات را مشخص کن.`,

    'pronunciation-check': `${baseDirective}
تو متخصص زبان هستی. راهنمای تلفظ کلمات دشوار ارائه بده.
شامل: تلفظ фонتی، معادل آوایی، نکات تلفظ، و تمرین‌های پیشنهادی.`,

    'music-mood': `${baseDirective}
تو متخصص موسیقی هستی. توصیه‌های موسیقی و صدای پس‌زمینه برای محتوا ارائه بده.
شامل: سبک موسیقی، تمپو، حال و هوا، لینک‌های پیشنهادی. متناسب با نوع محتوا.`,

    // ── Workflow & Automation ──────────────────────────────────────────────
    'content-pipeline': `${baseDirective}
تو متخصص مدیریت محتوا هستی. پایپلاین تولید محتوا طراحی کن.
شامل: مراحل تولید (ایده، تحقیق، نوشتن، ویرایش، انتشار)، مسئولین، ابزارها، زمان‌بندی.`,

    'bulk-wizard': `${baseDirective}
تو متخصص تولید انبوه محتوا هستی. طرح تولید انبوه محتوا تهیه کن.
شامل: لیست محتواها، قالب‌ها، اولویت‌بندی، زمان‌بندی، و منابع مورد نیاز.`,

    'content-repurpose': `${baseDirective}
تو متخصص بازیافت محتوا هستی. یک محتوا را به فرمت‌های مختلف تبدیل کن.
برای هر فرمت: عنوان، ساختار، و نکات خاص آن فرمت. حداقل ۵ فرمت مختلف.`,

    'auto-tag': `${baseDirective}
تو متخصص دسته‌بندی محتوا هستی. برچسب‌ها، دسته‌ها و کلمات کلیدی پیشنهادی برای محتوا تولید کن.
شامل: برچسب‌های اصلی، فرعی، کلمات کلیدی، و دسته‌بندی پیشنهادی.`,

    'quality-score': `${baseDirective}
تو ویراستار ارشد هستی. کیفیت محتوا را ارزیابی و امتیاز بده.
معیارها: ساختار، خوانایی، سئو، دقت، جذابیت، اثربخش. امتیاز ۱ تا ۱۰ با توضیحات.`,

    'plagiarism-check': `${baseDirective}
تو متخصص بررسی اصالت محتوا هستی. متن را از نظر اصالت و تکراری بودن تحلیل کن.
نکات: شباهت‌های احتمالی، بخش‌های نیاز به بازنویسی، و پیشنهادات اصالت‌بخشی.`,

    'version-compare': `${baseDirective}
تو ویراستار متخصص هستی. دو نسخه از محتوا را مقایسه و تحلیل کن.
شامل: تفاوت‌های کلیدی، بهبودها/افت‌ها، پیشنهاد نسخه نهایی.`,

    'ai-calendar': `${baseDirective}
تو متخصص تقویم محتوایی هستی. تقویم انتشار محتوا طراحی کن.
شامل: موضوعات روزانه/هفتگی، پلتفرم‌ها، نوع محتوا، و زمان انتشار. جدول زمانی.`,

    'smart-schedule': `${baseDirective}
تو متخصص زمان‌بندی هوشمند محتوا هستی. زمان‌بندی انتشار بهینه ارائه بده.
بر اساس: تحلیل مخاطب، الگوهای تعامل، ترندها، و پلتفرم. جدول زمانی هفتگی.`,

    'ab-testing': `${baseDirective}
تو متخصص تست A/B هستی. طرح تست A/B برای محتوا تهیه کن.
شامل: متغیرها، نسخه A و B، معیارهای سنجش، حجم نمونه پیشنهادی، و تفسیر نتایج.`,

    'ai-assistant-sidebar': `${baseDirective}
تو طراح تجربه کاربری هستی. راهنمای طراحی دستیار AI سایدبار تهیه کن.
شامل: ویژگی‌های کلیدی، پیشنهادات محتوایی، رابط کاربری، و نکات بهبود.`,

    'category-suggest': `${baseDirective}
تو متخصص دسته‌بندی سایت هستی. ساختار دسته‌بندی بهینه پیشنهاد بده.
شامل: دسته‌های اصلی، زیردسته‌ها، توضیحات هر دسته، و سلسله‌مراتب.`,
  }

  return prompts[type] || `${baseDirective}
تو دستیار هوش مصنوعی تولید محتوا هستی. محتوای با کیفیت و ساختاریافته تولید کن.
نوع محتوا: ${type}. لحن: ${toneStr}. زبان: ${lang}.`
}

// ─── Build User Prompt ─────────────────────────────────────────────────────
function buildUserPrompt(
  type: ContentType,
  title?: string,
  content?: string,
  context?: string,
  tone?: string,
  language?: string,
): string {
  const parts: string[] = []

  parts.push(`**نوع محتوا**: ${type}`)

  if (title) parts.push(`**عنوان/موضوع**: ${title}`)
  if (tone) parts.push(`**لحن مورد نظر**: ${tone}`)
  if (language) parts.push(`**زبان**: ${language}`)

  if (content) {
    parts.push(`**محتوای مرجع/ورودی**:\n${content}`)
  }

  if (context) {
    parts.push(`**زمینه و اطلاعات اضافی**:\n${context}`)
  }

  parts.push(`
**دستورالعمل**:
- محتوا را با بالاترین کیفیت تولید کن
- از فرمت‌بندی Markdown (هدینگ‌ها، لیست‌ها، بولت‌پوینت) استفاده کن
- محتوا باید قابل استفاده مستقیم باشد (بدون نیاز به ویرایش زیاد)
- اگر زبان فارسی است، از فارسی روان و طبیعی استفاده کن
- اگر زبان دیگری مشخص شده، به همان زبان تولید کن`)

  return parts.join('\n\n')
}

// ─── POST Handler ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, content, context, tone, language } = body

    if (!type || !VALID_TYPES.includes(type as ContentType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid content type. Supported types: ${VALID_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const client = await ZAI.create()

    const contentType = type as ContentType
    const systemPrompt = getSystemPrompt(contentType, tone, language)
    const userPrompt = buildUserPrompt(contentType, title, content, context, tone, language)

    const result = await client.chat.completions.create({
      model: 'GLM-5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const generatedContent = result.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json(
        { success: false, error: 'No content was generated by the AI model' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      content: generatedContent,
      metadata: {
        type: contentType,
        title: title || null,
        tone: tone || null,
        language: language || null,
        generatedAt: new Date().toISOString(),
        tokens: result.usage || null,
      },
    })
  } catch (error) {
    console.error('POST /api/ai/generate-content error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate content'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
