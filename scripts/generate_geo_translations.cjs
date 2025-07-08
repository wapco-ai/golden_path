const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const srcPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'data14040411.geojson'
);
const data = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

async function loadSubGroupMap() {
  const groupDataPath = path.join(__dirname, '..', 'src', 'components', 'groupData.js');
  const mod = await import(pathToFileURL(groupDataPath).href);
  const { subGroups } = mod;
  const map = {};
  Object.values(subGroups).forEach((arr) => {
    arr.forEach((sg) => {
      if (sg.label && sg.value) {
        const value = sg.value.trim();
        map[sg.label.trim()] = value;
        map[value] = value;
      }
    });
  });
  return map;
}

const nameTranslations = {
  "رواق": { en: "Riwaq", ar: "رواق", ur: "رواق" },
  "آبنما": { en: "Fountain", ar: "نافورة", ur: "فوارہ" },
  "باب الهادی": { en: "Bab al-Hadi", ar: "باب الهادي", ur: "باب الہادی" },
  "بابا الکاظم": { en: "Bab al-Kazem", ar: "باب الکاظم", ur: "باب الکاظم" },
  "بازار غدیر": { en: "Ghadir Bazaar", ar: "سوق الغدير", ur: "غدیر بازار" },
  "بازار کوثر": { en: "Kowsar Bazaar", ar: "سوق الكوثر", ur: "کوثر بازار" },
  "باغ رضوان": { en: "Rezvan Garden", ar: "حديقة الرضوان", ur: "رضوان باغ" },
  "بست": { en: "Bast", ar: "البست", ur: "بست" },
  "بست شهید نواب صفوی": { en: "Bast-e Shahid Navab Safavi", ar: "بست الشهيد نواب صفوي", ur: "بست شہید نواب صفوی" },
  "بست شیخ بهائی": { en: "Bast-e Sheikh Bahaei", ar: "بست الشيخ البهائي", ur: "بست شیخ بہائی" },
  "بست شیخ حرعاملی": { en: "Bast-e Sheikh Harr Ameli", ar: "بست الشيخ حر عاملي", ur: "بست شیخ حر عاملی" },
  "بست شیخ طبرسی": { en: "Bast-e Sheikh Tabarsi", ar: "بست الشيخ الطبرسي", ur: "بست شیخ طبرسی" },
  "بست شیخ طوسی": { en: "Bast-e Sheikh Tusi", ar: "بست الشيخ الطوسي", ur: "بست شیخ طوسی" },
  "بنیاد پژوهش ها و سازمان علمی فرهنگی": { en: "Research Foundation and Cultural Organization", ar: "مؤسسة البحوث والمنظمة العلمية الثقافية", ur: "بنیاد تحقیق اور ثقافتی علمی ادارہ" },
  "تالار قدس": { en: "Qods Hall", ar: "قاعة القدس", ur: "قدس ہال" },
  "حرم مطهر": { en: "Holy Shrine", ar: "الحرم المطهر", ur: "حرم مطہر" },
  "دارالتفسیر": { en: "Dar al-Tafsir", ar: "دار التفسير", ur: "دار التفسیر" },
  "دانشگاه علوم اسلامی و حوزه علمیه": { en: "Islamic Sciences University and Seminary", ar: "جامعة العلوم الإسلامية والحوزة العلمية", ur: "جامعہ علوم اسلامی و حوزہ علمیہ" },
  "رواق امام خمینی": { en: "Imam Khomeini Riwaq", ar: "رواق الإمام الخميني", ur: "رواق امام خمینی" },
  "روضه منوره": { en: "Holy Tomb", ar: "الروضة المنورة", ur: "روضہ منورہ" },
  "صحن آزادی": { en: "Azadi Courtyard", ar: "صحن الحرية", ur: "صحن آزادی" },
  "صحن امام حسن مجتبی": { en: "Imam Hasan Mujtaba Courtyard", ar: "صحن الإمام الحسن المجتبى", ur: "صحن امام حسن مجتبی" },
  "صحن انقلاب": { en: "Enqelab Courtyard", ar: "صحن الثورة", ur: "صحن انقلاب" },
  "صحن بعثت": { en: "Be'sat Courtyard", ar: "صحن البعثة", ur: "صحن بعثت" },
  "صحن جمهوری اسلامی": { en: "Islamic Republic Courtyard", ar: "صحن الجمهورية الإسلامية", ur: "صحن جمہوری اسلامی" },
  "صحن غدیر": { en: "Ghadir Courtyard", ar: "صحن الغدير", ur: "صحن غدیر" },
  "صحن قدس": { en: "Qods Courtyard", ar: "صحن القدس", ur: "صحن قدس" },
  "صحن مسجد گوهر شاد": { en: "Goharshad Mosque Courtyard", ar: "صحن مسجد گوهرشاد", ur: "صحن مسجد گوہرشاد" },
  "صحن پیامبر اعظم": { en: "Prophet Mohammad Courtyard", ar: "صحن النبي الأعظم", ur: "صحن پیغمبر اعظم" },
  "صحن کوثر": { en: "Kowsar Courtyard", ar: "صحن الكوثر", ur: "صحن کوثر" },
  "فرهنگی آموزشی": { en: "Cultural Educational", ar: "ثقافي تعليمي", ur: "ثقافتی تعلیمی" },
  "مهمانسرای حر عاملی": { en: "Har Ameli Guesthouse", ar: "ضيافة حر عاملي", ur: "مہمانسرائے حر عاملی" },
  "مهمانسرای غدیر": { en: "Ghadir Guesthouse", ar: "ضيافة الغدير", ur: "مہمانسرائے غدیر" },
  "موزه": { en: "Museum", ar: "متحف", ur: "میوزیم" },
  "موزه مردم شناسی": { en: "Anthropology Museum", ar: "متحف الأنثروبولوجيا", ur: "مردم شناسی میوزیم" },
  "نقطه اتصال": { en: "Connection Point", ar: "نقطة اتصال", ur: "نکتہ اتصال" },
  "نمایشگاه": { en: "Exhibition", ar: "معرض", ur: "نمائش" },
  "وردوی": { en: "Entrance", ar: "مدخل", ur: "داخلہ" },
  "وروئی": { en: "Entrance", ar: "مدخل", ur: "داخلہ" },
  "ورودی": { en: "Entrance", ar: "مدخل", ur: "داخلہ" },
  "ورودی مسقف": { en: "Covered Entrance", ar: "مدخل مسقوف", ur: "ڈھکا ہوا داخلہ" },
  "چایخانه حضرت": { en: "Shrine Teahouse", ar: "مقهى الشاي للحرم", ur: "چائے خانہ حضرت" },
  "کتابخانه": { en: "Library", ar: "مكتبة", ur: "کتب خانہ" }
};

const subGroupTranslations = {
  "امام خمینی": { en: "Imam Khomeini", ar: "الإمام الخميني", ur: "امام خمینی" },
  "بنیاد پژوهش‌های اسلامی": { en: "Islamic Research Foundation", ar: "مؤسسة البحوث الإسلامية", ur: "اسلامی تحقیقاتی بنیاد" },
  "دانشگاه علوم اسلامی رضوی": { en: "Razavi University of Islamic Sciences", ar: "جامعة العلوم الإسلامية الرضوية", ur: "جامعہ علوم اسلامی رضوی" },
  "سایر": { en: "Other", ar: "أخرى", ur: "دیگر" },
  "سیخ حر عاملی": { en: "Sheikh Hurr Ameli", ar: "الشيخ حر عاملي", ur: "شیخ حر عاملی" },
  "شیخ بهایی": { en: "Sheikh Bahaei", ar: "الشيخ البهائي", ur: "شیخ بہائی" },
  "شیخ طوسی": { en: "Sheikh Tusi", ar: "الشيخ الطوسي", ur: "شیخ طوسی" },
  "صحن آزادی": { en: "Azadi Courtyard", ar: "صحن الحرية", ur: "صحن آزادی" },
  "صحن امام حسن مجتبی": { en: "Imam Hasan Mujtaba Courtyard", ar: "صحن الإمام الحسن المجتبى", ur: "صحن امام حسن مجتبی" },
  "صحن انقلاب": { en: "Enqelab Courtyard", ar: "صحن الثورة", ur: "صحن انقلاب" },
  "صحن جمهوری اسلامی": { en: "Islamic Republic Courtyard", ar: "صحن الجمهورية الإسلامية", ur: "صحن جمہوری اسلامی" },
  "صحن غدیر": { en: "Ghadir Courtyard", ar: "صحن الغدير", ur: "صحن غدیر" },
  "صحن قدس": { en: "Qods Courtyard", ar: "صحن القدس", ur: "صحن قدس" },
  "صحن پیامبر اعظم": { en: "Prophet Mohammad Courtyard", ar: "صحن النبي الأعظم", ur: "صحن پیغمبر اعظم" },
  "صحن کوثر": { en: "Kowsar Courtyard", ar: "صحن الكوثر", ur: "صحن کوثر" },
  "مسجد گوهرشاد": { en: "Goharshad Mosque", ar: "مسجد گوهرشاد", ur: "مسجد گوہرشاد" },
  "مهمانسرا": { en: "Guesthouse", ar: "دار الضيافة", ur: "مہمانسرا" },
  "موزه مرکزی": { en: "Central Museum", ar: "المتحف المركزي", ur: "مرکزی میوزیم" },
  "چایخانه": { en: "Teahouse", ar: "مقهى الشاي", ur: "چائے خانہ" },
  "کتابخانه مرکزی": { en: "Central Library", ar: "المكتبة المركزية", ur: "مرکزی کتب خانہ" }
};

const orientationTranslations = {
  "شمالی": { en: "North", ar: "الشمالي", ur: "شمالی" },
  "جنوبی": { en: "South", ar: "الجنوبي", ur: "جنوبی" },
  "شرقی": { en: "East", ar: "الشرقي", ur: "مشرقی" },
  "غربی": { en: "West", ar: "الغربي", ur: "مغربی" }
};

function translateName(key, lang) {
  key = key.trim();
  const all = { ...nameTranslations, ...subGroupTranslations };
  const direct = all[key];
  if (direct && direct[lang]) return direct[lang];

  if (key.startsWith('ورودی')) {
    let rest = key.slice('ورودی'.length).trim();
    let covered = false;
    if (rest.startsWith('مسقف')) {
      covered = true;
      rest = rest.slice('مسقف'.length).trim();
    }

    let orientation;
    for (const o of Object.keys(orientationTranslations)) {
      if (rest.startsWith(o)) {
        orientation = o;
        rest = rest.slice(o.length).trim();
        break;
      }
    }

    const base = rest ? translateName(rest, lang) : '';
    const entrance = covered
      ? { en: 'Covered Entrance', ar: 'مدخل مسقوف', ur: 'ڈھکا ہوا داخلہ' }[lang]
      : { en: 'Entrance', ar: 'مدخل', ur: 'داخلہ' }[lang];
    const orientationPart = orientation ? orientationTranslations[orientation][lang] + ' ' : '';
    return base ? `${orientationPart}${entrance} ${base}`.trim() : `${orientationPart}${entrance}`.trim();
  }

  return key;
}

function translateFeature(feature, lang) {
  if (!feature.properties) return feature;
  const props = { ...feature.properties };
  if (props.name) {
    props.name = translateName(props.name, lang);
  }
  if (props.subGroup) {
    const key = props.subGroup.trim();
    const t = subGroupTranslations[key];
    if (t && t[lang]) props.subGroup = t[lang];
  }
  return { ...feature, properties: props };
}

async function main() {
  // Previously this script attempted to normalize the `subGroupValue`
  // for each feature based on the subGroup label. However, this step
  // overwrites any values that might already exist in the source file.
  // The updated requirement is to preserve `subGroupValue` exactly as
  // provided in `data14040411.geojson`, so we skip that normalization
  // entirely and simply read the existing data.


  // Do not rewrite the source geojson. We only generate translated copies
  // to keep the original data intact.

  ['en', 'ar', 'ur'].forEach((lang) => {
    const translated = {
      ...data,
      features: data.features.map((f) => translateFeature(f, lang))
    };
    const outPath = path.join(
      __dirname,
      '..',
      'public',
      'data',
      `data14040411_${lang}.geojson`
    );
    fs.writeFileSync(outPath, JSON.stringify(translated, null, 2), 'utf8');
  });

  console.log('Translated geojson files generated');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
