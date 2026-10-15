/**
 * Number to Words converter for Indian Currency (INR).
 * Supports both Marathi (मराठी) and English with Indian numbering system (Crores, Lakhs, Thousands, Hundreds).
 */

const ONES_MR: Record<number, string> = {
  0: 'शून्य',
  1: 'एक',
  2: 'दोन',
  3: 'तीन',
  4: 'चार',
  5: 'पाच',
  6: 'सहा',
  7: 'सात',
  8: 'आठ',
  9: 'नऊ',
  10: 'दहा',
  11: 'अकरा',
  12: 'बारा',
  13: 'तेरा',
  14: 'चौदा',
  15: 'पंधरा',
  16: 'सोळा',
  17: 'सतरा',
  18: 'आठरा',
  19: 'एकोणीस',
  20: 'वीस',
  21: 'एकवीस',
  22: 'बावीस',
  23: 'तेवीस',
  24: 'चोवीस',
  25: 'पंचवीस',
  26: 'सव्वीस',
  27: 'सत्तावीस',
  28: 'अठ्ठावीस',
  29: 'एकोणतीस',
  30: 'तीस',
  31: 'एकतीस',
  32: 'बत्तीस',
  33: 'तेहतीस',
  34: 'चौतीस',
  35: 'पस्तीस',
  36: 'छत्तीस',
  37: 'सदतीस',
  38: 'अडतीस',
  39: 'एकोणचाळीस',
  40: 'चाळीस',
  41: 'एक्केचाळीस',
  42: 'बेचाळीस',
  43: 'त्रेचाळीस',
  44: 'चव्वेचाळीस',
  45: 'पंचेचाळीस',
  46: 'शेहेचाळीस',
  47: 'सत्तेचाळीस',
  48: 'अठ्ठेचाळीस',
  49: 'एकोणपन्नास',
  50: 'पन्नास',
  51: 'एकावन्न',
  52: 'बावन्न',
  53: 'त्रेपन्न',
  54: 'चौपन्न',
  55: 'पंचावन्न',
  56: 'छप्पन्न',
  57: 'सत्तावन्न',
  58: 'अठ्ठावन्न',
  59: 'एकोणसाठ',
  60: 'साठ',
  61: 'एकसष्ठ',
  62: 'बासष्ठ',
  63: 'त्रेसष्ठ',
  64: 'चौसष्ठ',
  65: 'पासष्ठ',
  66: 'सहासष्ठ',
  67: 'सदुसष्ठ',
  68: 'अडुसष्ठ',
  69: 'एकोणसत्तर',
  70: 'सत्तर',
  71: 'एकाहत्तर',
  72: 'बहात्तर',
  73: 'त्र्याहत्तर',
  74: 'चौऱ्याहत्तर',
  75: 'पंच्याहत्तर',
  76: 'शहात्तर',
  77: 'सत्याहत्तर',
  78: 'अठ्ठ्याहत्तर',
  79: 'एकोणऐंशी',
  80: 'ऐंशी',
  81: 'एक्याऐंशी',
  82: 'ब्याऐंशी',
  83: 'त्र्याऐंशी',
  84: 'चौऱ्याऐंशी',
  85: 'पंच्याऐंशी',
  86: 'शहाऐंशी',
  87: 'सत्याऐंशी',
  88: 'अठ्ठ्याऐंशी',
  89: 'एकोणनव्वद',
  90: 'नव्वद',
  91: 'एक्याण्णव',
  92: 'ब्याण्णव',
  93: 'त्र्याण्णव',
  94: 'चौऱ्याण्णव',
  95: 'पंच्याण्णव',
  96: 'शहाण्णव',
  97: 'सत्याण्णव',
  98: 'अठ्ठ्याण्णव',
  99: 'नव्व्याण्णव',
};

const HUNDREDS_MR: Record<number, string> = {
  1: 'एकशे',
  2: 'दोनशे',
  3: 'तीनशे',
  4: 'चारशे',
  5: 'पाचशे',
  6: 'सहाशे',
  7: 'सातशे',
  8: 'आठशे',
  9: 'नऊशे',
};

const ONES_EN = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS_EN = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertTwoDigitsMarathi(n: number): string {
  if (n <= 0) return '';
  return ONES_MR[n] || '';
}

function convertThreeDigitsMarathi(n: number): string {
  if (n <= 0) return '';
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  const parts: string[] = [];

  if (hundred > 0) {
    if (hundred === 1 && remainder === 0) {
      parts.push('शंभर');
    } else {
      parts.push(HUNDREDS_MR[hundred] || `${ONES_MR[hundred]} शे`);
    }
  }

  if (remainder > 0) {
    parts.push(convertTwoDigitsMarathi(remainder));
  }

  return parts.join(' ');
}

export function amountToWordsMarathi(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '';
  const rounded = Math.round(num * 100) / 100;
  const wholePart = Math.floor(Math.abs(rounded));
  const paise = Math.round((Math.abs(rounded) - wholePart) * 100);

  if (wholePart === 0 && paise === 0) {
    return 'रुपये शून्य फक्त';
  }

  const parts: string[] = [];

  if (wholePart > 0) {
    const crore = Math.floor(wholePart / 10000000);
    const afterCrore = wholePart % 10000000;
    const lakh = Math.floor(afterCrore / 100000);
    const afterLakh = afterCrore % 100000;
    const thousand = Math.floor(afterLakh / 1000);
    const remainder = afterLakh % 1000;

    if (crore > 0) {
      parts.push(`${convertTwoDigitsMarathi(crore)} कोटी`);
    }
    if (lakh > 0) {
      parts.push(`${convertTwoDigitsMarathi(lakh)} लाख`);
    }
    if (thousand > 0) {
      parts.push(`${convertTwoDigitsMarathi(thousand)} हजार`);
    }
    if (remainder > 0) {
      parts.push(convertThreeDigitsMarathi(remainder));
    }
  }

  let result = `रुपये ${parts.join(' ').trim()}`;

  if (paise > 0) {
    const paiseText = convertTwoDigitsMarathi(paise);
    if (wholePart > 0) {
      result += ` आणि ${paiseText} पैसे`;
    } else {
      result = `${paiseText} पैसे`;
    }
  }

  return `${result} फक्त`;
}

function convertThreeDigitsEnglish(n: number): string {
  if (n <= 0) return '';
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  const parts: string[] = [];

  if (hundred > 0) {
    parts.push(`${ONES_EN[hundred]} Hundred`);
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES_EN[remainder]);
    } else {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      parts.push(`${TENS_EN[ten]}${unit > 0 ? ` ${ONES_EN[unit]}` : ''}`);
    }
  }

  return parts.join(' ');
}

export function amountToWordsEnglish(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '';
  const rounded = Math.round(num * 100) / 100;
  const wholePart = Math.floor(Math.abs(rounded));
  const paise = Math.round((Math.abs(rounded) - wholePart) * 100);

  if (wholePart === 0 && paise === 0) {
    return 'Rupees Zero Only';
  }

  const parts: string[] = [];

  if (wholePart > 0) {
    const crore = Math.floor(wholePart / 10000000);
    const afterCrore = wholePart % 10000000;
    const lakh = Math.floor(afterCrore / 100000);
    const afterLakh = afterCrore % 100000;
    const thousand = Math.floor(afterLakh / 1000);
    const remainder = afterLakh % 1000;

    if (crore > 0) {
      parts.push(`${convertThreeDigitsEnglish(crore)} Crore`);
    }
    if (lakh > 0) {
      parts.push(`${convertThreeDigitsEnglish(lakh)} Lakh`);
    }
    if (thousand > 0) {
      parts.push(`${convertThreeDigitsEnglish(thousand)} Thousand`);
    }
    if (remainder > 0) {
      parts.push(convertThreeDigitsEnglish(remainder));
    }
  }

  let result = `Rupees ${parts.join(' ').trim()}`;

  if (paise > 0) {
    const paiseText = convertThreeDigitsEnglish(paise);
    if (wholePart > 0) {
      result += ` and ${paiseText} Paise`;
    } else {
      result = `${paiseText} Paise`;
    }
  }

  return `${result} Only`;
}

export function amountToWords(amount: number, language: 'mr' | 'en' = 'mr'): string {
  return language === 'mr' ? amountToWordsMarathi(amount) : amountToWordsEnglish(amount);
}
