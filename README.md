# The Arena — ওয়েবসাইট ওভারভিউ

> এই ফোল্ডারে একটি স্বতন্ত্র, inspired-by Next.js UI demo আছে। এটি কোনো Arena logo, artwork বা business content ব্যবহার করে না।

## Next.js scroll demo চালানো

নতুন Next.js + TypeScript implementation-এ scroll করার সঙ্গে সঙ্গে canvas portal expand/rotate হয় এবং তিনটি content panel transition করে।

```bash
npm install
npm run dev
```

তারপর browser-এ `http://localhost:3000` খুলুন। মূল files: `app/page.tsx`, `app/scroll-scene.tsx`, `app/globals.css`.

**সোর্স:** [enterthearena.com](https://enterthearena.com/)  
**পর্যবেক্ষণের তারিখ:** ৩০ সেপ্টেম্বর ২০২৬

## সাইটটি কী

`The Arena` হলো Arena SNK, Inc.-এর একটি ব্র্যান্ড/কমিউনিটি ল্যান্ডিং সাইট। সাইটের ভাষ্য অনুযায়ী এটি SNK-এর action IP—**King of Fighters, Fatal Fury, Metal Slug** এবং **Samurai Shodown**—কে ঘিরে gaming, anime, film/TV, comics, event এবং fan community-র একটি transmedia উদ্যোগ।

এটি প্রচলিত বহু-পেজের product website নয়। প্রধান উদ্দেশ্য হলো অল্প কনটেন্টে শক্তিশালী visual identity দেখানো এবং দর্শককে fan community-তে পাঠানো।

## ব্যবহারকারীর দেখা অভিজ্ঞতা

1. পুরো viewport জুড়ে কালো, grain/texture-যুক্ত একটি immersive screen দেখা যায়।
2. উপরে কেন্দ্র বরাবর `THE ARENA` logo থাকে।
3. মাঝখানে nested-rectangle/portal-এর মতো animated 3D visual আছে।
4. animation/load শেষ হলে **JOIN OUR FAN COUNCIL** CTA দেখা যায়।
5. CTA-টি নতুন ট্যাবে `thearenarising.com`-এর একটি hosted sign-up/survey link খোলে।
6. নিচে Instagram ও TikTok, এবং Privacy/Terms লিংক আছে; ডানপাশে copyright notice।

এই নকশাটি তথ্য পড়ার চেয়ে mood, fandom ও brand recall তৈরিতে বেশি মনোযোগী।

## পেজ ও লিংক

| গন্তব্য | কাজ |
| --- | --- |
| `/` | মূল interactive brand landing page |
| `/privacy-policy` | কোন ব্যক্তিগত তথ্য সংগ্রহ/ব্যবহার হতে পারে, cookies ও analytics সংক্রান্ত নীতি |
| `/terms` | ব্যবহার, মেধাস্বত্ব, user content ও দায়বদ্ধতার শর্ত |
| `thearenarising.com/...` | Fan Council join করার বাহিরের sign-up/survey flow |
| Instagram / TikTok / YouTube / Discord | fan-community ও social channel |

## কীভাবে তৈরি করা হয়েছে — যাচাইকৃত প্রযুক্তিগত পর্যবেক্ষণ

- পেজের HTML ও asset structure থেকে এটি **Next.js/React** application বলে বোঝা যায় (`/_next/static/...` assets এবং client-side rendering boundary)।
- মূল visual layer একটি full-screen HTML `<canvas>`; rendered page-এ `data-engine="three.js r184"` পাওয়া গেছে। অর্থাৎ 3D/WebGL animation-এর জন্য **Three.js r184** ব্যবহৃত হয়েছে।
- UI layer canvas-এর উপর fixed-positioned HTML দিয়ে রাখা: logo, CTA, social icon, legal links ও copyright text। ফলে animation এবং clickable interface আলাদা layer-এ কাজ করে।
- CSS class-গুলো (`fixed`, `inset-0`, `font-mono`, responsive utility class) দেখে **Tailwind CSS বা Tailwind-ধাঁচের utility CSS** ব্যবহারের জোরালো ইঙ্গিত আছে; এটি অনুমান, সরাসরি source repository দেখা হয়নি।
- পেজে একটি loading state এবং CTA-এর opacity/translate transition আছে; অর্থাৎ 3D resource load হওয়ার পর ধাপে ধাপে interface প্রকাশ করা হয়।
- Open Graph, Twitter Card, canonical URL এবং JSON-LD `Organization`/`WebSite` structured data যোগ করা আছে—social share preview ও SEO-র জন্য।
- Cloudflare Insights beacon পাওয়া গেছে, তাই visitor analytics ব্যবহারের ইঙ্গিত আছে। Privacy Policy-তেও cookies ও analytics provider ব্যবহারের কথা বলা হয়েছে।

## Content ও conversion strategy

- **Hero-first:** খুব কম text; logo ও motion দিয়ে প্রথম impression তৈরি।
- **একটি প্রধান action:** Fan Council CTA-তে মনোযোগ কেন্দ্রীভূত।
- **Owned community:** CTA-টি নিজের landing page-এর বদলে survey/sign-up platform-এ পাঠায়—সম্ভবত fan data ও feedback সংগ্রহের জন্য।
- **Social distribution:** footer-এ social channel রেখে চলমান community engagement-এ পাঠানো হয়।
- **Legal readiness:** Privacy ও Terms আলাদা পেজে আছে। Privacy Policy অনুযায়ী survey বা interaction-এর মাধ্যমে নাম, email এবং প্রাসঙ্গিক তথ্য নেওয়া হতে পারে।

## Accessibility ও সীমাবদ্ধতা

- Canvas-based presentation হওয়ায় 3D visual-এর অর্থ text হিসেবে সরাসরি পাওয়া যায় না। তবে একটি screen-reader-only section-এ The Arena-এর সংক্ষিপ্ত পরিচিতি দেওয়া আছে।
- মূল পেজে navigation বা বিস্তারিত content নেই—এটি সচেতনভাবে একটি campaign/brand gateway-এর মতো তৈরি।
- Fan Council formটি external domain-এ যায়; তার field, validation ও data flow এই সাইটের পেজ থেকে যাচাই করা হয়নি।

## এই ফোল্ডারে রাখা পর্যবেক্ষণ-ফাইল

এই README তৈরির সময় সংগৃহীত raw HTML, rendered DOM, screenshot এবং headers স্থানীয় `.firecrawl/` ফোল্ডারে রাখা হয়েছে। এগুলো reference/debugging-এর জন্য; deployable source code নয়।

## সংক্ষিপ্ত সিদ্ধান্ত

The Arena-এর সাইটটি একটি **high-impact WebGL brand intro**। এখানে Next.js/React-এর উপর Three.js-based 3D scene চালানো হয়েছে, আর সাধারণ HTML UI layer দিয়ে CTA ও আইনগত/social links রাখা হয়েছে। এর business goal হলো SNK-ভিত্তিক entertainment universe-এর আবহ তৈরি করে visitor-কে Fan Council ও social community-তে নেওয়া।
