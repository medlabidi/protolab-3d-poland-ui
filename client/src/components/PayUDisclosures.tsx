import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PayUDisclosuresProps {
  lang?: 'en' | 'pl';
}

const DISCLOSURES = {
  en: {
    paymentTerms: {
      text: 'By paying you accept',
      link: 'PayU Payment Terms',
      url: 'https://poland.payu.com/en/payment-terms/',
    },
    privacyStatement: `The controller of your personal data is PayU S.A. with its registered office in Poznan (60-166), at Grunwaldzka Street 186 ("PayU"). Your personal data will be processed for purposes of processing payment transaction, notifying you about the status of this payment, dealing with complaints and also in order to fulfill the legal obligations imposed on PayU.

You have the right to access, rectify, restrict, or object to the processing of your personal data, as well as the right to data portability and erasure of your personal data. Providing personal data is voluntary however necessary for processing the payment and failure to provide the data may result in the rejection of the payment.`,
    privacyPolicyLink: {
      text: 'For more information on how PayU processes your personal data, please visit',
      linkText: 'PayU Privacy Statement',
      url: 'https://poland.payu.com/en/privacy-policy/',
    },
  },
  pl: {
    paymentOrder: {
      title: 'Zlecenie realizacji płatności:',
      items: [
        'Zlecenie wykonuje PayU SA;',
        'Dane odbiorcy, tytuł oraz kwota płatności dostarczane są PayU SA przez odbiorcę;',
        'Zlecenie jest przekazywane do realizacji po otrzymaniu przez PayU SA Państwa wpłaty. Płatność udostępniana jest odbiorcy w ciągu 1 godziny, nie później niż do końca następnego dnia roboczego;',
        'PayU SA nie pobiera opłaty od realizacji usługi.',
      ],
    },
    paymentTerms: {
      text: 'Akceptuję',
      link: '"Regulamin pojedynczej transakcji płatniczej PayU"',
      url: 'https://poland.payu.com/regulamin-platnosci/',
    },
    privacyStatement: `Administratorem Twoich danych osobowych jest PayU S.A. z siedzibą w Poznaniu (60-166), przy ul. Grunwaldzkiej 186 ("PayU"). Twoje dane osobowe będą przetwarzane w celu realizacji transakcji płatniczej, powiadamiania Cię o statusie realizacji Twojej płatności, rozpatrywania reklamacji, a także w celu wypełnienia obowiązków prawnych ciążących na PayU.

Masz prawo do dostępu, poprawiania, ograniczenia lub sprzeciwu wobec przetwarzania Twoich danych osobowych, a także prawo do przenoszenia danych i ich usunięcia. Podanie danych jest dobrowolne jednak niezbędne do realizacji płatności, a brak podania danych może skutkować odrzuceniem płatności.`,
    privacyPolicyLink: {
      text: 'Więcej informacji o zasadach przetwarzania Twoich danych osobowych przez PayU znajdziesz w',
      linkText: 'Polityce prywatności',
      url: 'https://poland.payu.com/polityka-prywatnosci/',
    },
  },
};

export function PayUDisclosures({ lang = 'pl' }: PayUDisclosuresProps) {
  const [showPaymentOrder, setShowPaymentOrder] = useState(false);
  const disclosure = DISCLOSURES[lang];

  if (lang === 'en') {
    return (
      <div className="text-xs text-muted-foreground space-y-3 border-t pt-4">
        {/* Payment Terms */}
        <div>
          {disclosure.paymentTerms.text}{' '}
          <a 
            href={disclosure.paymentTerms.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {disclosure.paymentTerms.link}
          </a>.
        </div>

        {/* Privacy Statement */}
        <div>
          <p className="mb-2">{disclosure.privacyStatement}</p>
          <p>
            {disclosure.privacyPolicyLink.text}{' '}
            <a 
              href={disclosure.privacyPolicyLink.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {disclosure.privacyPolicyLink.linkText}
            </a>.
          </p>
        </div>
      </div>
    );
  }

  // Polish version with collapsible payment order
  const plDisclosure = disclosure as typeof DISCLOSURES.pl;
  
  return (
    <div className="text-xs text-muted-foreground space-y-3 border-t pt-4">
      {/* Payment Order (Collapsible) */}
      <div>
        <div className="font-semibold mb-1">
          {plDisclosure.paymentOrder.title}
        </div>
        <div className="pl-4">
          <p>{plDisclosure.paymentOrder.items[0]}</p>
          
          {showPaymentOrder && (
            <div className="mt-1 space-y-1">
              {plDisclosure.paymentOrder.items.slice(1).map((item: string, index: number) => (
                <p key={index}>{item}</p>
              ))}
            </div>
          )}
          
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowPaymentOrder(!showPaymentOrder)}
            className="h-auto p-0 text-xs text-primary"
          >
            {showPaymentOrder ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Zwiń
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Czytaj więcej
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Payment Terms */}
      <div>
        {disclosure.paymentTerms.text}{' '}
        <a 
          href={disclosure.paymentTerms.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {disclosure.paymentTerms.link}
        </a>.
      </div>

      {/* Privacy Statement */}
      <div>
        <p className="mb-2">{disclosure.privacyStatement}</p>
        <p>
          {disclosure.privacyPolicyLink.text}{' '}
          <a 
            href={disclosure.privacyPolicyLink.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {disclosure.privacyPolicyLink.linkText}
          </a>.
        </p>
      </div>
    </div>
  );
}
