import type { AppNotification } from '../types';

const TITLE_EN_TO_MR: Record<string, string> = {
  'Payment Due Soon': 'देयक देण्याची वेळ जवळ आली आहे',
  'Payment Overdue': 'थकबाकी देयकाची मुदत संपली',
  'Payment Received': 'रक्कम प्राप्त झाली',
  'Low Stock Alert': 'कमी साठा सूचना',
  'Out of Stock Alert': 'स्टॉक संपला सूचना',
  'New Order Created': 'नवीन ऑर्डर तयार केली',
  'Order Status Updated': 'ऑर्डर स्थिती अपडेट झाली',
  'Stock Restocked': 'साठा भरला',
  'AgriBiz Alert': 'AgriBiz चाचणी सूचना',
  'Business Alert': 'व्यवसाय सूचना',
};

const TITLE_MR_TO_EN: Record<string, string> = {
  'देयक देण्याची वेळ जवळ आली आहे': 'Payment Due Soon',
  'थकबाकी देयकाची मुदत संपली': 'Payment Overdue',
  'रक्कम प्राप्त झाली': 'Payment Received',
  'कमी साठा सूचना': 'Low Stock Alert',
  'स्टॉक संपला सूचना': 'Out of Stock Alert',
  'नवीन ऑर्डर तयार केली': 'New Order Created',
  'ऑर्डर स्थिती अपडेट झाली': 'Order Status Updated',
  'साठा भरला': 'Stock Restocked',
  'AgriBiz चाचणी सूचना': 'AgriBiz Alert',
  'व्यवसाय सूचना': 'Business Alert',
};

/**
 * Localizes a single notification based on target language ('en' | 'mr').
 * Works seamlessly with bilingual fields, structured data, or legacy translated strings.
 */
export function getLocalizedNotification(
  notif: AppNotification,
  lang: 'en' | 'mr' = 'en'
): { title: string; body: string } {
  if (!notif) {
    return { title: '', body: '' };
  }

  const isMr = lang === 'mr';

  // 1. Check direct bilingual fields on the notification or within its data payload
  const explicitTitleMr = notif.titleMr || notif.data?.titleMr;
  const explicitBodyMr = notif.bodyMr || notif.data?.bodyMr;
  const explicitTitleEn = notif.titleEn || notif.data?.titleEn;
  const explicitBodyEn = notif.bodyEn || notif.data?.bodyEn;

  if (isMr && explicitTitleMr && explicitBodyMr) {
    return { title: explicitTitleMr, body: explicitBodyMr };
  }
  if (!isMr && explicitTitleEn && explicitBodyEn) {
    return { title: explicitTitleEn, body: explicitBodyEn };
  }

  // 2. Resolve Title
  let resolvedTitle = notif.title || '';
  if (isMr) {
    if (explicitTitleMr) {
      resolvedTitle = explicitTitleMr;
    } else if (TITLE_EN_TO_MR[resolvedTitle]) {
      resolvedTitle = TITLE_EN_TO_MR[resolvedTitle];
    } else if (notif.type) {
      switch (notif.type) {
        case 'DUE_REMINDER':
          resolvedTitle = 'देयक देण्याची वेळ जवळ आली आहे';
          break;
        case 'OVERDUE_PAYMENT':
          resolvedTitle = 'थकबाकी देयकाची मुदत संपली';
          break;
        case 'PAYMENT_RECEIVED':
          resolvedTitle = 'रक्कम प्राप्त झाली';
          break;
        case 'LOW_STOCK':
          resolvedTitle = 'कमी साठा सूचना';
          break;
        case 'OUT_OF_STOCK':
          resolvedTitle = 'स्टॉक संपला सूचना';
          break;
        case 'STOCK_RECOVERY':
          resolvedTitle = 'साठा भरला';
          break;
        case 'NEW_ORDER':
          resolvedTitle = 'नवीन ऑर्डर तयार केली';
          break;
        case 'ORDER_STATUS':
          resolvedTitle = 'ऑर्डर स्थिती अपडेट झाली';
          break;
        case 'BUSINESS_ALERT':
          resolvedTitle = 'AgriBiz चाचणी सूचना';
          break;
      }
    }
  } else {
    // English Target
    if (explicitTitleEn) {
      resolvedTitle = explicitTitleEn;
    } else if (TITLE_MR_TO_EN[resolvedTitle]) {
      resolvedTitle = TITLE_MR_TO_EN[resolvedTitle];
    } else if (notif.type) {
      switch (notif.type) {
        case 'DUE_REMINDER':
          resolvedTitle = 'Payment Due Soon';
          break;
        case 'OVERDUE_PAYMENT':
          resolvedTitle = 'Payment Overdue';
          break;
        case 'PAYMENT_RECEIVED':
          resolvedTitle = 'Payment Received';
          break;
        case 'LOW_STOCK':
          resolvedTitle = 'Low Stock Alert';
          break;
        case 'OUT_OF_STOCK':
          resolvedTitle = 'Out of Stock Alert';
          break;
        case 'STOCK_RECOVERY':
          resolvedTitle = 'Stock Restocked';
          break;
        case 'NEW_ORDER':
          resolvedTitle = 'New Order Created';
          break;
        case 'ORDER_STATUS':
          resolvedTitle = 'Order Status Updated';
          break;
        case 'BUSINESS_ALERT':
          resolvedTitle = 'AgriBiz Alert';
          break;
      }
    }
  }

  // 3. Resolve Body from structured data if available
  const data = notif.data;
  if (data) {
    const formattedAmount = (amt?: number) =>
      `₹${Number(amt || 0).toLocaleString('en-IN')}`;

    if (notif.type === 'DUE_REMINDER' && data.customerName && data.balanceDue !== undefined) {
      return {
        title: resolvedTitle,
        body: isMr
          ? `${data.customerName} यांची ${formattedAmount(data.balanceDue)} ची थकबाकी देण्याची तारीख ${data.dueDate || ''} आहे.`
          : `${data.customerName} has an upcoming balance of ${formattedAmount(data.balanceDue)} due on ${data.dueDate || ''}.`,
      };
    }

    if (notif.type === 'OVERDUE_PAYMENT' && data.customerName && data.balanceDue !== undefined) {
      return {
        title: resolvedTitle,
        body: isMr
          ? `${data.customerName} यांचे चलन ${data.invoiceNumber || ''} साठीचे ${formattedAmount(data.balanceDue)} देयक थकीत झाले आहे.`
          : `${data.customerName} has an overdue balance of ${formattedAmount(data.balanceDue)} for invoice ${data.invoiceNumber || ''}.`,
      };
    }

    if (notif.type === 'PAYMENT_RECEIVED' && data.amount !== undefined) {
      const cust = data.customerName || (isMr ? 'ग्राहक' : 'Customer');
      const method = data.paymentMethod || 'UPI';
      const invSuffixMr = data.invoiceNumber ? ` (चलन ${data.invoiceNumber})` : '';
      const invSuffixEn = data.invoiceNumber ? ` (Invoice ${data.invoiceNumber})` : '';

      return {
        title: resolvedTitle,
        body: isMr
          ? `${cust} यांच्याकडून ${method} द्वारे ${formattedAmount(data.amount)} रक्कम प्राप्त झाली.${invSuffixMr}`
          : `Payment of ${formattedAmount(data.amount)} received from ${cust} via ${method}.${invSuffixEn}`,
      };
    }

    if (notif.type === 'LOW_STOCK' && data.productName) {
      return {
        title: resolvedTitle,
        body: isMr
          ? `${data.productName} चा साठा कमी झाला आहे: फक्त ${data.stock ?? ''} शिल्लक (किमान मर्यादा: ${data.minStock ?? ''}).`
          : `${data.productName} has reached low stock: only ${data.stock ?? ''} units remaining (Minimum threshold: ${data.minStock ?? ''}).`,
      };
    }

    if (notif.type === 'OUT_OF_STOCK' && data.productName) {
      return {
        title: resolvedTitle,
        body: isMr
          ? `${data.productName} चा साठा पूर्णपणे संपला आहे (० नग शिल्लक).`
          : `${data.productName} is completely out of stock (0 units remaining).`,
      };
    }

    if (notif.type === 'NEW_ORDER' && data.invoiceNumber) {
      const cust = data.customerName || (isMr ? 'ग्राहक' : 'Customer');
      return {
        title: resolvedTitle,
        body: isMr
          ? `${cust} यांच्यासाठी ${formattedAmount(data.grandTotal)} चे चलन ${data.invoiceNumber} तयार केले.`
          : `Invoice ${data.invoiceNumber} issued to ${cust} for ${formattedAmount(data.grandTotal)}.`,
      };
    }

    if (notif.type === 'ORDER_STATUS' && data.invoiceNumber) {
      const cust = data.customerName || (isMr ? 'ग्राहक' : 'Customer');
      return {
        title: resolvedTitle,
        body: isMr
          ? `${cust} यांची ऑर्डर ${data.invoiceNumber} आता ${data.status || ''} आहे.`
          : `Order ${data.invoiceNumber} for ${cust} is now ${data.status || ''}.`,
      };
    }
  }

  // 4. Fallback: Parse & translate existing string body via regular expressions
  let resolvedBody = notif.body || '';

  if (isMr) {
    if (explicitBodyMr) {
      resolvedBody = explicitBodyMr;
    } else {
      resolvedBody = resolvedBody
        .replace(
          /(.+) has reached low stock: only (\d+) units remaining \(Minimum threshold: (\d+)\)\.?/i,
          '$1 चा साठा कमी झाला आहे: फक्त $2 शिल्लक (किमान मर्यादा: $3).'
        )
        .replace(
          /(.+) is completely out of stock \(0 units remaining\)\.?/i,
          '$1 चा साठा पूर्णपणे संपला आहे (० नग शिल्लक).'
        )
        .replace(
          /(.+) has an upcoming balance of (.+) due on (.+?)\.?$/i,
          '$1 यांची $2 ची थकबाकी देण्याची तारीख $3 आहे.'
        )
        .replace(
          /(.+) has an overdue balance of (.+) for invoice (.+?)\.?$/i,
          '$1 यांचे चलन $3 साठीचे $2 देयक थकीत झाले आहे.'
        )
        .replace(
          /Payment of (.+) received from (.+) via (.+?)(?:\s*\(Invoice (.+)\))?\.?$/i,
          (_m, amt, cust, method, inv) =>
            `${cust} यांच्याकडून ${method} द्वारे ${amt} रक्कम प्राप्त झाली${inv ? ` (चलन ${inv})` : ''}.`
        )
        .replace(
          /Invoice (.+) issued to (.+) for (.+)\.?/i,
          '$2 यांच्यासाठी $3 चे चलन $1 तयार केले.'
        )
        .replace(
          /Order (.+) for (.+) is now (.+)\.?/i,
          '$2 यांची ऑर्डर $1 आता $3 आहे.'
        )
        .replace(
          /Mobile push notifications are working properly on your phone!/i,
          'तुमच्या फोनवर मोबाइल पुश सूचना व्यवस्थित काम करत आहेत!'
        )
        .replace(
          /Invoice (.+) has an upcoming payment due on (.+)\. Tap to view details\.?/i,
          'चलन $1 चे देयक $2 रोजी देय आहे. तपशील पाहण्यासाठी टॅप करा.'
        )
        .replace(
          /Invoice (.+) is past its payment due date\. Tap to review customer dues\.?/i,
          'चलन $1 ची देय तारीख उलटून गेली आहे. थकबाकी पाहण्यासाठी टॅप करा.'
        )
        .replace(
          /Customer payment received via (.+)\. Tap to view ledger entry\.?/i,
          '$1 द्वारे रक्कम प्राप्त झाली. तपशील पाहण्यासाठी टॅप करा.'
        )
        .replace(
          /(.+) is completely out of stock\.?/i,
          '$1 चा साठा पूर्णपणे संपला आहे.'
        )
        .replace(
          /(.+) has fallen below safety limit \((\d+) remaining\)\.?/i,
          '$1 साठा सुरक्षा मर्यादेपेक्षा कमी झाला आहे ($2 शिल्लक).'
        )
        .replace(
          /Invoice (.+) has been issued\. Tap to view order details\.?/i,
          'चलन $1 जारी केले आहे. ऑर्डर पाहण्यासाठी टॅप करा.'
        );
    }
  } else {
    // English Target
    if (explicitBodyEn) {
      resolvedBody = explicitBodyEn;
    } else {
      resolvedBody = resolvedBody
        .replace(
          /(.+) चा साठा कमी झाला आहे: फक्त (\d+) शिल्लक \(किमान मर्यादा: (\d+)\)\.?/,
          '$1 has reached low stock: only $2 units remaining (Minimum threshold: $3).'
        )
        .replace(
          /(.+) चा साठा पूर्णपणे संपला आहे \(० नग शिल्लक\)\.?/,
          '$1 is completely out of stock (0 units remaining).'
        )
        .replace(
          /(.+) यांची (.+) ची थकबाकी देण्याची तारीख (.+?)\.?$/,
          '$1 has an upcoming balance of $2 due on $3.'
        )
        .replace(
          /(.+) यांचे चलन (.+) साठीचे (.+) देयक थकीत झाले आहे\.?/,
          '$1 has an overdue balance of $3 for invoice $2.'
        )
        .replace(
          /(.+) यांच्याकडून (.+) द्वारे (.+) रक्कम प्राप्त झाली(?:\s*\(चलन (.+)\))?\.?$/,
          (_m, cust, method, amt, inv) =>
            `Payment of ${amt} received from ${cust} via ${method}${inv ? ` (Invoice ${inv})` : ''}.`
        )
        .replace(
          /(.+) यांच्यासाठी (.+) चे चलन (.+) तयार केले\.?/,
          'Invoice $3 issued to $1 for $2.'
        )
        .replace(
          /(.+) यांची ऑर्डर (.+) आता (.+) आहे\.?/,
          'Order $2 for $1 is now $3.'
        )
        .replace(
          /तुमच्या फोनवर मोबाइल पुश सूचना व्यवस्थित काम करत आहेत!/,
          'Mobile push notifications are working properly on your phone!'
        )
        .replace(
          /चलन (.+) चे देयक (.+) रोजी देय आहे\. तपशील पाहण्यासाठी टॅप करा\.?/,
          'Invoice $1 has an upcoming payment due on $2. Tap to view details.'
        )
        .replace(
          /चलन (.+) ची देय तारीख उलटून गेली आहे\. थकबाकी पाहण्यासाठी टॅप करा\.?/,
          'Invoice $1 is past its payment due date. Tap to review customer dues.'
        )
        .replace(
          /(.+) द्वारे रक्कम प्राप्त झाली\. तपशील पाहण्यासाठी टॅप करा\.?/,
          'Customer payment received via $1. Tap to view ledger entry.'
        )
        .replace(
          /(.+) चा साठा पूर्णपणे संपला आहे\.?/,
          '$1 is completely out of stock.'
        )
        .replace(
          /(.+) साठा सुरक्षा मर्यादेपेक्षा कमी झाला आहे \((\d+) शिल्लक\)\.?/,
          '$1 has fallen below safety limit ($2 remaining).'
        )
        .replace(
          /चलन (.+) जारी केले आहे\. ऑर्डर पाहण्यासाठी टॅप करा\.?/,
          'Invoice $1 has been issued. Tap to view order details.'
        );
    }
  }

  return {
    title: resolvedTitle,
    body: resolvedBody,
  };
}

/**
 * Format relative timestamp with localization support
 */
export function formatNotificationTime(isoString?: string, lang: 'en' | 'mr' = 'en'): string {
  const isMr = lang === 'mr';
  if (!isoString) return isMr ? 'आत्ताच' : 'Just now';

  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isMr ? 'आत्ताच' : 'Just now';
    if (mins < 60) return isMr ? `${mins} मिनिटांपूर्वी` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isMr ? `${hours} तासांपूर्वी` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return isMr ? `${days} दिवसांपूर्वी` : `${days}d ago`;

    return new Date(isoString).toLocaleDateString(isMr ? 'mr-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return isMr ? 'अलीकडेच' : 'Recently';
  }
}
