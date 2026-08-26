import type { LocalizedList, LocalizedString } from '../types';

/**
 * Legal documents, transcribed from the counsel-supplied templates
 * (Website-Terms-and-Conditions-Services-ENG.docx, Privacy-Policy-ENG.docx).
 *
 * English is the authoritative text; Russian is a convenience translation
 * for the school's primarily Russian-speaking audience.
 *
 * Deviations from the source templates are marked ADAPTED and listed in
 * docs/LEGAL-REVIEW.md. They exist because the templates were written for
 * a different business (a parenting/teacher-training consultancy) and,
 * left unchanged, would have described services Inverted Forest does not
 * sell and excluded the minors it does teach. Every ADAPTED block needs
 * counsel sign-off before launch.
 *
 * Tokens substituted at render time: {entity}, {email}.
 */

export interface LegalBlock {
  heading?: LocalizedString;
  paragraphs?: LocalizedString[];
  bullets?: LocalizedList;
  /** Renders the block in an emphasised box (used for caps disclaimers). */
  emphasis?: boolean;
}

export interface LegalDocument {
  title: LocalizedString;
  intro: LocalizedString[];
  blocks: LegalBlock[];
  governingNote: LocalizedString;
}

const governingNote: LocalizedString = {
  ru: 'Настоящий документ представлен на русском языке для удобства пользователей. В случае расхождений между русской и английской версиями преимущественную силу имеет английская версия.',
  en: 'This document is also published in Russian for the convenience of our users. In the event of any discrepancy between the Russian and English versions, the English version shall prevail.'
};

/* ────────────────────────────── PRIVACY ────────────────────────────── */

export const privacyPolicy: LegalDocument = {
  title: { ru: 'Политика конфиденциальности', en: 'Privacy Policy' },
  intro: [
    {
      ru: 'Цель настоящей политики — разъяснить нашу практику в отношении конфиденциальности пользователей сайта, а также то, как Компания использует информацию, предоставленную ей пользователями или собранную ею в ходе использования сайта.',
      en: 'The purpose of the policy is to explain our practices regarding the privacy of users of the website, and how the Company uses the information provided to it by the users or collected by it when they using the websites.'
    }
  ],
  blocks: [
    {
      heading: { ru: 'Общие положения', en: 'General Provisions' },
      paragraphs: [
        {
          ru: 'Настоящая Политика конфиденциальности является неотъемлемой частью Условий использования Компании. Информация о вас собирается, когда вы используете сайт или его сервисы. Часть информации идентифицирует вас лично — например, ваше имя и адрес, приобретённые вами товары и услуги, использованные вами средства платежа и т. д. Это информация, которую вы предоставляете осознанно, например при регистрации на услуги на сайте. Часть информации не идентифицирует вас лично. Это статистические и агрегированные данные — например, реклама, которую вы просматривали на сайте, посещённые вами страницы, а также заинтересовавшие вас предложения и услуги.',
          en: 'This Privacy Policy is an integral part of the Company’s Terms and Conditions. Information about you is collected when you use the website or its services. Some of the information identifies you personally, i.e. your name and address, products and services you have purchased, the means of payment used by you, etc. This is the information you knowingly provide, for example when registering for services on the website. Some information does not personally identify you. This is statistical and aggregate information, for example, advertisements you read on the website, the pages you viewed and the offers and services that interested you.'
        },
        {
          ru: 'Некоторые технические данные и сетевые идентификаторы могут считаться «Персональной информацией» согласно применимому законодательству, включая IP-адрес, идентификаторы устройств, рекламные идентификаторы и идентификаторы, хранящиеся в файлах cookie или аналогичных технологиях, как описано ниже.',
          en: 'Certain technical data and online identifiers may be considered “Personal Information” under applicable law, including IP address, device identifiers, advertising identifiers, and identifiers stored in cookies or similar technologies, as described below.'
        },
        {
          ru: 'Настоящая Политика составлена в соответствии с применимым израильским законодательством о защите конфиденциальности и персональных данных, включая Закон о защите неприкосновенности частной жизни 5741-1981 (в том числе Поправку № 13) и Положения о защите неприкосновенности частной жизни (Безопасность данных) 5777-2017 с последующими изменениями. При передаче Персональной информации за пределы Израиля мы действуем в соответствии с Положениями о защите неприкосновенности частной жизни (Передача данных в базы данных за пределами государства) 5761-2001 и иными применимыми требованиями.',
          en: 'This Policy is intended to comply with applicable Israeli privacy and data protection laws, including the Protection of Privacy Law, 5741-1981 (including Amendment No. 13), and the Protection of Privacy Regulations (Data Security), 5777-2017, as may be amended from time to time. Where we transfer Personal Information outside Israel, we will do so in accordance with the Protection of Privacy Regulations (Transfer of Data to Databases Outside the State Borders), 5761-2001, and any other applicable requirements.'
        }
      ]
    },
    {
      heading: { ru: 'Регистрация на услуги', en: 'Registration for Services' },
      paragraphs: [
        {
          ru: 'В той мере, в какой персональная информация требуется при регистрации на услуги Компании или при приобретении у неё продуктов, Компания запрашивает у вас только ту информацию, которая непосредственно необходима для оказания услуг или приобретения продуктов.',
          en: 'To the extent that personal information is required when registering for services of the Company or when purchasing products from it, the Company will only ask you for the information that is directly necessary for the provision of the services or for the purchase of the products.'
        }
      ]
    },
    {
      heading: { ru: 'Использование информации', en: 'The Use of Information' },
      paragraphs: [
        {
          ru: 'Использование собранной информации осуществляется в соответствии с настоящей Политикой конфиденциальности либо в соответствии с положениями любого применимого закона, в целях:',
          en: 'The use of the information collected will be made in accordance with this Privacy Policy or in accordance with the provisions of any law, in order to:'
        }
      ],
      bullets: {
        ru: [
          'обеспечения возможности пользоваться различными услугами, которые предлагает Компания;',
          'улучшения предлагаемых услуг и содержания;',
          'мониторинга и статистики;',
          'изменения или прекращения существующих услуг и содержания;',
          'приобретения товаров и услуг на сайтах;',
          'адаптации отображаемой рекламы на основе вашего местоположения и посещённых вами сайтов.'
        ],
        en: [
          'Allow to use the various services that Company offers;',
          'Improve the services and content offered;',
          'For monitoring and statistic;',
          'Modify or cancel existing services and content;',
          'For the purpose of purchasing products and services on websites;',
          'To tailor the ads that will be displayed based on your location and websites you visited.'
        ]
      }
    },
    {
      heading: {
        ru: 'Передача информации третьим лицам',
        en: 'Providing Information to a Third Party'
      },
      paragraphs: [
        {
          ru: 'Компания не передаёт третьим лицам ваши персональные данные и информацию, собранную о вашей активности на сайте, за исключением перечисленных ниже случаев:',
          en: 'The company will not pass on to third parties your personal details and information collected about your activity on the website except in the cases listed below:'
        }
      ],
      bullets: {
        ru: [
          'если вы приобретаете товары и услуги у третьих лиц, предлагающих их к продаже через Компанию, — таким третьим лицам будет предоставлена информация, необходимая для завершения процесса покупки;',
          'в случае правового спора между вами и Компанией, требующего раскрытия ваших данных;',
          'если ваши действия на сайтах противоречат закону;',
          'если решение суда обязывает Компанию предоставить ваши данные или информацию о вас третьему лицу;',
          'если Компания продаёт или передаёт управление сайтом любой корпорации любым способом, либо в случае слияния с другим лицом или объединения деятельности сайта с деятельностью третьего лица, при условии, что такая корпорация принимает положения настоящей Политики конфиденциальности в отношении вас.'
        ],
        en: [
          'If you purchase products and services from third parties that offer them for sale through the Company, these third parties will be provided with the information they need to complete the purchase process;',
          'In the event of a legal dispute between you and the Company that will require the disclosure of your details;',
          'If your actions on the websites are against the law;',
          'If a court ruling orders the Company to provide your details or information about you to a third party;',
          'If the Company sells or transfers the website operation to any corporation in any way or in the event that it merges with another entity or merges the website operation with the activities of a third party, provided that this corporation accepts the provisions of this Privacy Policy towards you.'
        ]
      }
    },
    {
      heading: { ru: 'Файлы cookie', en: 'Cookies' },
      paragraphs: [
        {
          ru: 'Компания использует файлы cookie и аналогичные технологии (такие как пиксели, теги и локальное хранилище) на сайте для обеспечения основной функциональности, улучшения пользовательского опыта, безопасности, анализа производительности и (где применимо) поддержки маркетинговой деятельности.',
          en: 'The Company uses cookies and similar technologies (such as pixels, tags and local storage) on the website to enable core functionality, enhance user experience, provide security, analyze performance, and (where applicable) support marketing activities.'
        }
      ]
    },
    {
      heading: { ru: 'Категории файлов cookie', en: 'Cookie Categories' },
      bullets: {
        ru: [
          'Необходимые (строго обязательные). Требуются для работы сайта, обеспечения безопасности и предотвращения мошенничества. Эти файлы cookie всегда активны.',
          'Предпочтения / персонализация. Используются для запоминания выбора и предпочтений (например, выбранного языка).',
          'Аналитика. Используются для понимания того, как используется сайт, и для его улучшения (например, посредством аналитических инструментов).',
          'Маркетинг. Используются для измерения и оптимизации маркетинговых кампаний и показа рекламы (например, посредством рекламных пикселей).'
        ],
        en: [
          'Essentials (Strictly Necessary). Required for the website to function and for security and fraud prevention. These cookies are always active.',
          'Preferences / Personalization. Used to remember choices and preferences (for example, language selection).',
          'Analytics. Used to understand how the website is used and to improve it (for example, via analytics tools).',
          'Marketing. Used to measure and optimize marketing campaigns and deliver advertising (for example, via advertising pixels).'
        ]
      }
    },
    {
      heading: {
        ru: 'Примеры необходимых файлов cookie (всегда активны)',
        en: 'Essentials Examples (Always Active)'
      },
      paragraphs: [
        {
          ru: 'Примеры необходимых файлов cookie могут включать: (i) файлы cookie и токены безопасности, используемые для выявления мошенничества, злоупотреблений или автоматизированного трафика; (ii) файлы cookie, необходимые для обеспечения и защиты отправки форм и их защиты от ботов (включая файлы cookie, связанные с CAPTCHA / reCAPTCHA, где применимо); (iii) сессионные файлы cookie и файлы балансировки нагрузки, используемые для поддержания стабильности и производительности; (iv) файлы cookie, используемые для хранения вашего статуса согласия на использование cookie и ваших предпочтений; и (v) файлы cookie, необходимые для предоставления функции, которую вы явно запросили.',
          en: 'Examples of Essentials may include: (i) security cookies and tokens used to detect fraud, abuse, or automated traffic; (ii) cookies required to enable and secure form submissions and protect them from bots (including CAPTCHA / reCAPTCHA-related cookies where applicable); (iii) session and load-balancing cookies used to maintain stability and performance; (iv) cookies used to store your cookie-consent status and preferences; and (v) cookies required to provide a feature you explicitly requested.'
        }
      ]
    },
    {
      heading: {
        ru: 'Согласие и управление',
        en: 'Consent and Controls'
      },
      paragraphs: [
        {
          ru: 'За исключением необходимых файлов cookie, мы размещаем и используем файлы cookie только при наличии и после получения вашего согласия (где это требуется) через наш механизм согласия на использование cookie. Вы можете дать согласие на все категории либо выбрать отдельные категории. Вы можете отозвать или изменить своё согласие в любое время через ссылку настроек cookie на сайте (например, «Управление файлами cookie»).',
          en: 'Except for Essentials, we will place and use cookies only if and after you provide your consent (where required) via our cookie consent mechanism. You can consent to all categories or choose specific categories. You can withdraw or change your consent at any time via the cookie settings link on the website (e.g., “Manage cookies”).'
        },
        {
          ru: 'Мы можем хранить запись о ваших предпочтениях в отношении cookie (включая дату/время и выбранные категории), чтобы подтвердить соблюдение требований и учитывать ваш выбор.',
          en: 'We may retain a record of your cookie preferences (including the date/time and categories chosen) to demonstrate compliance and to respect your choices.'
        }
      ]
    },
    {
      heading: { ru: 'Последствия отказа', en: 'Impact of Refusal' },
      paragraphs: [
        {
          ru: 'Если вы отклоните необязательные файлы cookie (или отдельные категории), некоторые части сайта могут работать не так, как предполагалось (например, запоминание предпочтений или отображение встроенного содержимого).',
          en: 'If you reject non-essential cookies (or certain categories), some parts of the website may not function as intended (for example, remembering preferences or enabling certain embedded content).'
        }
      ]
    },
    {
      heading: {
        ru: 'Сторонние файлы cookie и встроенное содержимое',
        en: 'Third-Party Cookies and Embedded Content'
      },
      paragraphs: [
        {
          ru: 'Сайт может включать сторонние сервисы и встроенное содержимое (например, видеоплееры) и сторонние скрипты. Такие третьи лица могут устанавливать собственные файлы cookie и собирать данные в собственных целях в соответствии с их собственными политиками и могут выступать в качестве самостоятельных операторов данных. Где это возможно, мы используем варианты встраивания с повышенной конфиденциальностью (например, «режим повышенной конфиденциальности» YouTube), чтобы сократить использование cookie до момента вашего взаимодействия со встроенным содержимым.',
          en: 'The website may include third-party services and embedded content (for example, video players) and third-party scripts. These third parties may set their own cookies and collect data for their own purposes, subject to their own policies, and may act as independent controllers. Where possible, we use privacy-enhanced embedding options (for example, YouTube “privacy-enhanced mode”) to reduce cookie usage until you interact with the embedded content.'
        }
      ]
    },
    {
      heading: { ru: 'Настройки браузера', en: 'Browser Settings' },
      paragraphs: [
        {
          ru: 'Вы также можете управлять файлами cookie через настройки вашего браузера. Однако отключение файлов cookie может повлиять на функциональность сайта.',
          en: 'You can also control cookies through your browser settings. However, disabling cookies may affect the functionality of the website.'
        }
      ]
    },
    {
      heading: { ru: 'Безопасность данных', en: 'Data Security' },
      paragraphs: [
        {
          ru: 'Компания применяет современные системы и процедуры информационной безопасности на своих сайтах и действует в соответствии с применимыми требованиями израильского законодательства, включая Положения о защите неприкосновенности частной жизни (Безопасность данных) 5777-2017 с изменениями. Хотя эти системы и процедуры снижают риски несанкционированного проникновения, они не обеспечивают полной безопасности. Поэтому Компания не гарантирует, что её услуги будут полностью защищены от несанкционированного доступа к хранящейся в них информации.',
          en: 'The Company implements up-to-date information security systems and procedures at its websites, and acts in accordance with applicable requirements under Israeli law, including the Protection of Privacy Regulations (Data Security), 5777-2017 (as amended). While these systems and procedures reduce the risks of unauthorized intrusion, they do not provide complete security. Therefore, the Company does not warrant that its services will be completely immune from unauthorized access to the information stored therein.'
        }
      ]
    },
    {
      heading: { ru: 'Базы данных', en: 'Databases' },
      paragraphs: [
        {
          ru: 'Согласно Закону о защите неприкосновенности частной жизни 5741-1981 (включая Поправку № 13) и иному применимому законодательству, вы можете иметь право запросить доступ к Персональной информации, которую мы храним о вас, а также потребовать её исправления, обновления или удаления (в применимых случаях).',
          en: 'Under the Protection of Privacy Law, 5741-1981 (including Amendment No. 13), and other applicable law, you may be entitled to request access to Personal Information we hold about you, and to request that such information be corrected, updated, or deleted (as applicable).'
        },
        {
          ru: 'Запросы по этому вопросу следует направлять по адресу: {email}.',
          en: 'Requests on this subject should be directed to: {email}.'
        },
        {
          ru: 'В случаях, когда мы используем вашу Персональную информацию для прямого маркетинга, вы можете иметь право возразить против этого и/или потребовать удаления такой информации из наших баз данных в соответствии с применимым законодательством.',
          en: 'Where we use your Personal Information for direct marketing, you may be entitled to object and/or request deletion of such information from our databases, in accordance with applicable law.'
        }
      ]
    },
    {
      heading: { ru: 'Прочие положения', en: 'Miscellaneous' },
      paragraphs: [
        {
          ru: 'В случае существенных изменений настоящей Политики конфиденциальности в части использования предоставленной вами персональной информации уведомление будет опубликовано на главной странице сайта.',
          en: 'In the event of the sufficient changes to this Privacy Policy in regards the use of personal information that you have provided, a notice will be published on the home page of the website.'
        },
        {
          ru: 'Сайты Компании могут содержать ссылки на внешние сайты, предлагающие различные услуги и принадлежащие третьим лицам и управляемые ими. Эти услуги не являются частью настоящей политики конфиденциальности, и заинтересованным лицам следует ознакомиться с условиями конфиденциальности таких третьих лиц. Настоящим разъясняется, что Компания не несёт ответственности за взаимодействие между её пользователями и указанными выше третьими лицами.',
          en: 'Company’s websites may contain links to external websites, which offer a variety of services, owned and operated by third parties. These services are not part of this privacy policy and those interested should check the privacy terms of these third parties. It is hereby clarified that the Company will not be responsible for the interaction between its users and the third parties as stated above.'
        }
      ]
    }
  ],
  governingNote
};

/* ─────────────────────────────── TERMS ─────────────────────────────── */

export const termsAndConditions: LegalDocument = {
  title: { ru: 'Условия использования', en: 'Terms and Conditions' },
  intro: [
    {
      ru: 'Настоящие Условия использования («Условия») являются обязывающим соглашением между {entity} («мы», «наш», «нас») и любым лицом, которое получает доступ к нашему сайту и услугам или использует их («вы», «пользователь»).',
      en: 'These Terms and Conditions (“Terms”) are a binding agreement between {entity} (“we”, “our”, “us”) and any person who accesses or uses our website and services (“you”, “user”).'
    }
  ],
  blocks: [
    {
      heading: { ru: 'Принятие Условий', en: 'Acceptance of the Terms' },
      paragraphs: [
        {
          ru: 'Получая доступ к нашему сайту или услугам либо используя их, вы подтверждаете, что прочитали, поняли и согласны соблюдать настоящие Условия, а также нашу Политику конфиденциальности и любые дополнительные условия, опубликованные на сайте. Если вы не согласны с настоящими Условиями, вы не должны использовать сайт или услуги.',
          en: 'By accessing or using our website or services, you confirm that you have read, understood, and agree to be bound by these Terms, together with our Privacy Policy and any additional terms published on the website. If you do not agree to these Terms, you must not use the website or services.'
        }
      ]
    },
    {
      // ADAPTED — the template restricted all use to persons over 18, which
      // is incompatible with the children's and teens' study groups the
      // school actually sells. Rewritten so an adult contracts on a minor's
      // behalf. Requires counsel review.
      heading: {
        ru: 'Право на использование и возрастные ограничения',
        en: 'Eligibility and Age Restriction'
      },
      paragraphs: [
        {
          ru: 'Заключение договора и приобретение услуг через сайт доступно только лицам, достигшим 18 лет и обладающим правоспособностью для заключения настоящих Условий, либо, где применимо, имеющим надлежащие полномочия для их заключения. Вы заявляете и гарантируете, что соответствуете этим требованиям.',
          en: 'Entering into an agreement and purchasing services through the website is permitted only to individuals who are at least 18 years old and legally eligible to enter into these Terms, or, where applicable, who hold all proper authorization to enter into these Terms. You represent and warrant that you meet these requirements.'
        },
        {
          ru: 'Часть наших курсов предназначена для детей и подростков. Несовершеннолетний может участвовать в таких курсах только в том случае, если его регистрацию осуществил родитель или законный представитель, который принимает настоящие Условия от своего имени и от имени несовершеннолетнего и несёт ответственность за исполнение обязательств по ним, включая оплату.',
          en: 'Some of our courses are intended for children and teenagers. A minor may participate in such courses only where the registration has been completed by a parent or legal guardian, who accepts these Terms on their own behalf and on behalf of the minor, and who is responsible for performing the obligations under them, including payment.'
        }
      ]
    },
    {
      heading: { ru: 'Изменение Условий', en: 'Amendments of the Terms' },
      paragraphs: [
        {
          ru: 'Мы оставляем за собой право периодически изменять или пересматривать настоящие Условия по своему усмотрению; такие изменения вступают в силу немедленно с момента размещения изменённых Условий. Дата последнего пересмотра указывается под заголовком выше. Продолжение использования вами сайта и доступных на нём услуг после таких изменений означает ваше ознакомление с ними и согласие с ними, а также согласие соблюдать их, в связи с чем рекомендуется периодически просматривать настоящие Условия. В случае существенных изменений мы приложим все усилия для публикации уведомления.',
          en: 'We reserve the right to periodically amend or revise these Terms at our sole discretion; such changes will be effective immediately upon the display of the revised Terms. The last revision date will be reflected below the title above. Your continued use of the website and Services available therein following such amendments constitutes your acknowledgment and consent of such amendments to the Terms and your agreement to be bound by them, and thus, it is recommended to review these Terms periodically. In the event of material changes, we will make our best efforts to post notification.'
        }
      ]
    },
    {
      heading: {
        ru: 'Наш сайт, услуги и содержание',
        en: 'Our Website, Service & Content offered'
      },
      paragraphs: [
        {
          ru: 'Наш сайт предоставляет общую информацию и ресурсы о нашей деятельности, услугах и продуктах, а также любое связанное с ними содержание, которое может включать, помимо прочего, статьи, блоги, аудио, изображения, отчёты, графику, логотипы и т. д. (совместно — «Содержание»).',
          en: 'Our website provides general information and resources regarding our business, services and products, and any other content related thereto, and may include, inter alia, articles, blogs, audio, images, reports, graphics, logos, graphics, etc. (collectively the "Content").'
        },
        {
          ru: 'Кроме того, сайт предоставляет вам средства связи, которые вы можете использовать, чтобы связаться с нами, например если у вас есть вопрос о нашей деятельности, услугах или продуктах, либо чтобы подписаться на нашу рассылку и список рассылки (если применимо).',
          en: 'In addition, the website provides you with communications means which you can use to contact us, for example, if you have any inquiry regarding our business, Services or products, or sign up to our newsletter and mailing list (if will be applicable).'
        },
        {
          ru: 'Обратите внимание, что Содержание предоставляется исключительно в качестве общей информации и не является и не должно рассматриваться как профессиональная консультация или её замена, равно как и не является предложением, обязательством, мнением или рекомендацией с нашей стороны.',
          en: 'Please note that the Content is provided solely as general information and it does not constitute, and should not be considered, as professional advice or a substitute for professional advice, nor any offer or obligation, opinion, or recommendation on behalf of us.'
        },
        {
          ru: 'Кроме того, описание наших услуг или продуктов на сайте носит исключительно общий информационный и маркетинговый характер, и между таким описанием и фактической услугой возможны расхождения. В любом случае обязывающими для нас являются только официальный документ с нашей стороны или заключённое с нами соглашение об оказании услуг.',
          en: 'In addition, the description of our Services or products on the website are for general information and marketing purposes only and there may be discrepancies between such description and the actual service. In any event, only an official document on behalf of us or a designated agreement executed with us for the purpose of its Services, will bind us.'
        },
        {
          ru: 'Мы прилагаем разумные усилия для обеспечения актуальности и точности Содержания; однако мы не гарантируем отсутствие ошибок, неточностей или неверных сведений и не несём ответственности в этой связи.',
          en: 'We make reasonable efforts to ensure that the Content is up to date and accurate; however, it does not guarantee that no errors, mistakes or inaccuracies will occur and will not be held responsible for this matter.'
        },
        {
          ru: 'Использование Содержания или доверие к нему осуществляется исключительно под вашу ответственность и на ваш риск, и мы настоящим отказываемся от какой-либо ответственности за любое решение, принятое, либо действие, совершённое или несовершённое, на основании Содержания, которое предоставляется пользователям «как есть».',
          en: 'The use or reliance on the Content is at your sole responsibility and risk, and we hereby disclaims any responsibility or liability for any decision made, or action taken or not taken, based on the Content, which is offered to users as-is.'
        }
      ]
    },
    {
      // ADAPTED — the template described a parenting/teacher-training
      // consultancy and a direct card-capture checkout. Replaced with the
      // school's actual services and its redirect-to-provider payment flow.
      // Requires counsel review.
      heading: { ru: 'Платные услуги', en: 'Paid Services' },
      paragraphs: [
        {
          ru: 'Мы проводим онлайн-курсы по истории, философии, литературе и антропологии для взрослых, подростков и детей. Занятия проходят вживую в небольших учебных группах посредством видеосвязи, с записями и учебными материалами, доступными участникам группы (совместно — «Услуги»).',
          en: 'We provide online courses in history, philosophy, literature and anthropology for adults, teenagers and children. Classes are held live in small study groups by video conference, with recordings and learning materials made available to the members of the group (together the “Services”).'
        },
        {
          ru: 'Приобретение Услуг разрешено (i) лицам, достигшим 18 лет, и/или организациям, представленным уполномоченными лицами, имеющими право связывать их договорными обязательствами; и (ii) лицам, обладающим действительным средством платежа, принимаемым нашим поставщиком платёжных услуг.',
          en: 'The purchase of the Services is permitted to (i) individuals who are at least 18 years old and/or entities represented by authorized personnel with the authority to bind them to contractual agreements; and (ii) persons holding a valid means of payment accepted by our payment services provider.'
        },
        {
          ru: 'При регистрации на Услуги вам будет предложено предоставить полную и достоверную информацию, запрашиваемую нами, включая имя, фамилию и адрес электронной почты. Оплата производится на защищённой платёжной странице нашего внешнего поставщика платёжных услуг; мы не собираем и не храним реквизиты вашей платёжной карты.',
          en: 'When registering for the Services you will be required to provide complete and correct information requested by us, including first name, last name and e-mail address. Payment is completed on the secure payment page of our external payment services provider; we do not collect or store your payment card details.'
        },
        {
          ru: 'Подтверждение операции поставщиком платёжных услуг или эмитентом карты является необходимым условием для подтверждения любой онлайн-операции. Если операция не подтверждена, она не имеет силы, а заказ считается недействительным и аннулированным.',
          en: 'Approval of the transaction by the payment services provider or the issuing card company is a prerequisite for approval of any online operation. In the event that the transaction is not approved, the transaction will not be valid and the order will be void and canceled.'
        },
        {
          ru: 'Мы не несём ответственности за какие-либо ошибки, допущенные вами при вводе информации для целей онлайн-покупки, включая персональные идентификационные данные. Несмотря на вышеизложенное, мы оставляем за собой право аннулировать любую такую регистрацию.',
          en: 'We will not be responsible for any error made by you while entering information for the purpose of an online purchase, including a customer’s personal identification information. Notwithstanding the aforesaid, we reserve the right to cancel any such booking.'
        },
        {
          ru: 'В редких случаях возможны ошибки в информации об Услугах на сайте, включая их стоимость. Такие ошибки являются результатом человеческого фактора или опечаток. В этих случаях вы не сможете воспользоваться ошибкой, и вам будет предложено приобрести услугу по правильной цене. Мы можем отменить или изменить любую акцию в любое время.',
          en: 'In rare cases possible mistakes in information about the Services on the website, including their prices. These mistakes are resulting from a human error or a typos. In these you will not be able to benefit of the error and he will be asked to purchase the service at the correct price. We may cancel or change any promotion at any time.'
        },
        {
          ru: 'Цены не включают какие-либо дополнительные или иные расходы, которые могут применяться.',
          en: 'The prices do not include any additional or other expenses that may apply.'
        }
      ]
    },
    {
      heading: {
        ru: 'Отмена и возврат средств',
        en: 'Cancellation and Refund Policy'
      },
      paragraphs: [
        {
          ru: 'Отмена услуг регулируется положениями израильского Закона о защите прав потребителей 1981 года и принятыми на его основании подзаконными актами («Закон о защите прав потребителей»).',
          en: 'Cancellation of services shall be governed by the provisions of the Israeli Consumer Protection Law, 1981 and the regulations enacted thereunder (the “Consumer Protection Law”).'
        },
        {
          ru: 'С учётом Закона о защите прав потребителей клиент может отменить сделку в течение 14 дней с даты сделки или с даты получения сведений о сделке, в зависимости от того, что наступит позднее, при условии, что, если услуга запланирована на определённую дату или период, запрос об отмене подан не позднее чем за семь (7) рабочих дней до запланированного начала оказания услуги, если иное не предусмотрено законом.',
          en: 'Subject to the Consumer Protection Law, a customer may cancel a transaction within 14 days from the date of the transaction or from the date of receipt of the transaction details, whichever is later, provided that, where the service is scheduled for a specific date or period, the cancellation request is submitted no later than seven (7) business days prior to the scheduled commencement of the service, unless otherwise required by law.'
        },
        {
          ru: 'Указанный 14-дневный срок отмены продлевается до четырёх (4) месяцев для клиента с инвалидностью, пожилого гражданина или нового репатрианта (как эти понятия определены в Законе о защите прав потребителей), при условии что соответствующий статус был раскрыт нам при совершении сделки или в последующей переписке.',
          en: 'The above 14-day cancellation period shall be extended to four (4) months in the case of a customer with a disability, a senior citizen, or a new immigrant (as such terms are defined under the Consumer Protection Law), provided that the relevant status was disclosed to us during the transaction or in subsequent correspondence.'
        },
        {
          ru: 'Если клиент имеет право отменить сделку в соответствии с Законом о защите прав потребителей либо по иной письменной договорённости с нами, отмена осуществляется путём направления письменного уведомления об отмене на наш адрес электронной почты: {email}.',
          en: 'Where a customer is entitled to cancel a transaction in accordance with the Consumer Protection Law or as otherwise agreed with us in writing, cancellation shall be effected by submitting a written cancellation notice to our email address: {email}.'
        },
        {
          ru: 'Уведомление об отмене должно содержать полное имя клиента, идентификационный номер и достаточные сведения об услуге или сделке, подлежащей отмене.',
          en: 'The cancellation notice must include the customer’s full name, identification number, and sufficient details of the service or transaction to be canceled.'
        },
        {
          ru: 'В случае правомерной отмены мы вправе удержать плату за отмену в размере до 5% от стоимости сделки или 100 шекелей, в зависимости от того, что меньше, как это разрешено Законом о защите прав потребителей, если только закон не требует возврата без удержания платы за отмену.',
          en: 'In the event of a lawful cancellation, we may charge a cancellation fee of up to 5% of the transaction value or 100 NIS, whichever is lower, as permitted under the Consumer Protection Law, unless a refund without a cancellation fee is required by law.'
        }
      ]
    },
    {
      heading: { ru: 'Ограничения использования', en: 'Use Restrictions' },
      paragraphs: [
        {
          ru: 'Настоящим вы заявляете и гарантируете, что не будете: (i) использовать сайт и Содержание незаконным, противоправным, мошенническим или ненадлежащим образом; (ii) обходить, отключать или иным образом нарушать функции безопасности сайта; (iii) копировать, воспроизводить, повторно публиковать, загружать, размещать (кроме случаев, прямо разрешённых нами), передавать или иным образом распространять сайт, Содержание или любую их часть, а также удалять, портить, скрывать или изменять сайт или любое Содержание на нём, включая уведомления об авторских правах, товарные знаки или иные права собственности; (iv) использовать сайт и Содержание в неличных или коммерческих целях; (v) использовать сайт и Содержание для целей сравнительного анализа; (vi) заявлять какие-либо права собственности на Содержание или сайт; (vii) использовать наш сайт для сбора любой информации, включая персональную информацию, электронными или иными средствами, посредством взлома или сбора данных, в том числе для целей несанкционированной рассылки, либо с использованием электронных средств проникновения или любых иных средств, включая скрипты; (viii) использовать наше наименование, логотип или товарные знаки без нашего предварительного письменного согласия; и (ix) использовать сайт и Содержание с нарушением прав третьих лиц или наших прав, включая права интеллектуальной собственности и права на неприкосновенность частной жизни, либо с нарушением настоящих Условий.',
          en: 'You hereby represent and warrant that you will not: (i) use the website and Content in unlawful, illegal, fraudulent or inappropriate manner; (ii) circumvent, disable or otherwise interfere with security-related features of the website; (iii) copy, reproduce, republish, upload, post (unless where specifically permitted by us), transmit, or otherwise distribute, the website, Content, or any part thereof, nor remove, deface, obscure, or alter the website or any Content therein including any copyright notices, trademarks, or other proprietary rights; (iv) use the website and Content for any non-personal or commercial purposes; (v) use the website and Content for benchmarking purposes; (vi) assert any proprietary rights in or to the Content or website; (vii) use our website to collect any information, including personal information, whether in electronic means or other means, through hacking or mining, including for the purposes of unauthorized mailing or using electronic means of penetration or any other means, including scripts; (viii) use our name, logo or trademarks without our prior written consent; and (ix) use the website and Content in breach of third parties’ rights or our rights, including intellectual property rights and privacy rights, or in breach of these Terms.'
        },
        {
          ru: 'Без ущерба для любых иных прав или средств правовой защиты, доступных нам по настоящим Условиям или применимому законодательству, в любом случае при наличии у нас подозрения, что использование пользователем сайта не соответствует положениям настоящих Условий или применимого законодательства, мы вправе отслеживать использование сайта пользователем, запретить пользователю доступ к сайту либо раскрыть такую информацию третьим лицам, которые докажут, по нашему единоличному усмотрению, что им был причинён вред нарушающей деятельностью пользователя, а также предпринять любые иные действия, которые мы сочтём необходимыми для защиты своего имущества, своих прав и прав третьих лиц.',
          en: 'Without derogating from any other right or remedy we shall be entitled to under these Terms or applicable law, in any event any suspicion by us that the user’s use of the website does not comply with the provisions of these Terms or applicable law, we may track the user’s use of the website, prevent the user from accessing the website, or disclose such information to third parties who will prove, at ours sole determination, that they were harmed by the user’s infringing activity as well as take any other action that we deem appropriate to protect its property, rights and third parties’ rights.'
        }
      ]
    },
    {
      heading: {
        ru: 'Интеллектуальная собственность',
        en: 'Intellectual Property'
      },
      paragraphs: [
        {
          ru: 'Сайт и Содержание (за исключением Содержания третьих лиц) принадлежат нам или создаются при нашем участии, включая, помимо прочего, любой дизайн, фирменные наименования, товарные знаки, логотипы, изображения, программное обеспечение и т. д. За исключением случаев, прямо предусмотренных настоящим документом, вам не предоставляется никакая лицензия, право, титул или интерес в отношении Содержания, и мы сохраняем все права, титул и право собственности на сайт и Содержание. Вы не вправе использовать наши авторские права, товарные знаки, фирменные наименования или иную интеллектуальную собственность каким-либо образом, кроме ограниченного объёма, прямо согласованного в настоящих Условиях. Вы не вправе удалять или уничтожать какие-либо уведомления или указания, связанные с интеллектуальной собственностью, размещённые на сайте.',
          en: 'The website and Content (excluding Third-Party Content) are owned or contributed to us, including, but not limited to, any design, trade names, trademarks, logos, images, software etc. Except as explicitly provided herein, no license, right, title, or interest to the Content shall be licensed to you, and we reserve any and all rights, title, and ownership of the website and Content. You shall not use our copyrights, trademarks, trade names, or other Intellectual Property in any way except to the limited extent as may be expressly agreed in these Terms. You may not remove or delete any intellectual property related notice or indications posted on the website.'
        }
      ]
    },
    {
      heading: {
        ru: 'Содержание третьих лиц',
        en: 'Third-Party Content'
      },
      paragraphs: [
        {
          ru: 'Сайт, Услуги и/или Содержание могут дополнительно включать информацию или ссылки на сайты и ресурсы третьих лиц, не управляемые нами и не принадлежащие нам («Содержание третьих лиц»). Просматривая, используя или иным образом получая доступ к такому Содержанию третьих лиц, вы подпадаете под действие их условий обслуживания и политик. Мы не контролируем сайты третьих лиц и предоставляемое на них содержание, не осуществляем и не обязаны осуществлять их мониторинг, и настоящим отказываемся от всякой ответственности, связанной с таким Содержанием третьих лиц. Включение Содержания третьих лиц на наш сайт не означает нашей поддержки, одобрения или согласия с таким содержанием, равно как и каких-либо иных отношений с этими сайтами или их операторами. Мы не гарантируем работоспособность таких ссылок. Мы вправе по своему единоличному усмотрению удалить любую ссылку с сайта в любое время.',
          en: 'The Website, Services and/or Content may further include information or links to third parties’ websites and resources not operated or owned by us ("Third-Party Content"). By reviewing, using or otherwise accessing such Third-Party Content, you will be subject to their terms of service and policies. We have no control over third parties’ websites, nor the content provided therein, and we do not, nor we are obligated to, monitor them and we hereby disclaim all liability or responsibility related to such Third-Party Content. Inclusion of Third-Party Content in our website does not indicate our support, endorsement or approval of such content or any other relationship with these websites or their operators. We do not guarantee the functionality of such links. We may, at its sole discretion, remove any link from the website at any time.'
        }
      ]
    },
    {
      heading: {
        ru: 'Практика в отношении конфиденциальности',
        en: 'Privacy Practices'
      },
      paragraphs: [
        {
          ru: 'Мы уважаем ваши права на неприкосновенность частной жизни. Наша Политика конфиденциальности содержит информацию о нашей практике сбора и обработки данных пользователей данного сайта и включена в настоящий документ посредством ссылки.',
          en: 'We respect your privacy rights. Our Privacy Policy provides information regarding our data collection and processing practices related to this website’s user, and is incorporated herein by reference.'
        }
      ]
    },
    {
      heading: {
        ru: 'Доступность сайта и изменения',
        en: 'Website Availability and Changes'
      },
      paragraphs: [
        {
          ru: 'Мы оставляем за собой право пересматривать, обновлять или вносить любые изменения в сайт, Услуги и Содержание, а также прекращать работу сайта или любой его части, включая предлагаемые на нём Услуги, временно или постоянно, в любое время по своему единоличному усмотрению и без предварительного уведомления. Мы не гарантируем, что сайт будет работать или будет доступен в любой момент времени, равно как и отсутствие перебоев или ошибок.',
          en: 'We reserve the right to revise, update or make any changes to the website, Services and Content as well as to cease the operation of the website or any part thereof, including the Services offered therein, temporarily or permanently, at any time, according to its sole discretion and without prior notice. We do not guarantee that the website will operate or be available at any time, nor that no interruptions or errors will occur.'
        }
      ]
    },
    {
      heading: {
        ru: 'Отказ от гарантий и ограничение ответственности',
        en: 'Disclaimer and Limitation of Liability'
      },
      emphasis: true,
      paragraphs: [
        {
          ru: 'ЗА ИСКЛЮЧЕНИЕМ СЛУЧАЕВ, ПРЯМО ПРЕДУСМОТРЕННЫХ НАСТОЯЩИМ ДОКУМЕНТОМ, САЙТ, УСЛУГИ И СОДЕРЖАНИЕ ПРЕДОСТАВЛЯЮТСЯ НА УСЛОВИЯХ «КАК ЕСТЬ» И «КАК ДОСТУПНО» БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ. МЫ ОТКАЗЫВАЕМСЯ ОТ ВСЕХ ГАРАНТИЙ, ПРЯМЫХ ИЛИ ПОДРАЗУМЕВАЕМЫХ, И НЕ ДАЁМ НИКАКИХ ЗАВЕРЕНИЙ ИЛИ ГАРАНТИЙ ЛЮБОГО РОДА В ОТНОШЕНИИ САЙТА, УСЛУГ И СОДЕРЖАНИЯ, ВКЛЮЧАЯ, ПОМИМО ПРОЧЕГО, ГАРАНТИИ КОММЕРЧЕСКОЙ ПРИГОДНОСТИ ИЛИ ПРИГОДНОСТИ ДЛЯ ОПРЕДЕЛЁННОЙ ЦЕЛИ, ТАКОЙ КАК УСПЕШНОСТЬ НАШИХ УСЛУГ. МЫ НЕ ДАЁМ ЗАВЕРЕНИЙ ИЛИ ГАРАНТИЙ ТОГО, ЧТО САЙТ, УСЛУГИ И СОДЕРЖАНИЕ ДОСТУПНЫ ИЛИ БУДУТ ДОСТУПНЫ ДЛЯ ИСПОЛЬЗОВАНИЯ В КАКОМ-ЛИБО КОНКРЕТНОМ МЕСТЕ ИЛИ В КОНКРЕТНОЕ ВРЕМЯ, ЧТО САЙТ БУДЕТ ЗАЩИЩЁН, РАБОТАТЬ БЕЗ ПЕРЕБОЕВ ИЛИ ОШИБОК ЛИБО БУДЕТ СВОБОДЕН ОТ ВИРУСОВ ИЛИ ИНЫХ ВРЕДОНОСНЫХ КОМПОНЕНТОВ, РАВНО КАК И ТОГО, ЧТО СОДЕРЖАНИЕ БУДЕТ ТОЧНЫМ ИЛИ ДОСТОВЕРНЫМ. ТАКЖЕ МЫ НЕ ДАЁМ ЗАВЕРЕНИЙ ИЛИ ГАРАНТИЙ ТОГО, ЧТО ОКАЗЫВАЕМЫЕ УСЛУГИ ПОЗВОЛЯТ ДОСТИЧЬ ИНДИВИДУАЛЬНЫХ ИЛИ ГРУППОВЫХ ЦЕЛЕЙ. ВЫ СОГЛАШАЕТЕСЬ, ЧТО МЫ НЕ НЕСЁМ ОТВЕТСТВЕННОСТИ ЗА ЛЮБОЕ РЕШЕНИЕ, ПРИНЯТОЕ, ЛИБО ДЕЙСТВИЕ, СОВЕРШЁННОЕ ИЛИ НЕСОВЕРШЁННОЕ В РАСЧЁТЕ НА САЙТ, УСЛУГИ ИЛИ СОДЕРЖАНИЕ, И НЕ ПРИНИМАЕМ НА СЕБЯ ОТВЕТСТВЕННОСТИ ЗА ЛЮБЫЕ УБЫТКИ, ВКЛЮЧАЯ, ПОМИМО ПРОЧЕГО, КОСВЕННЫЕ, ПОСЛЕДУЮЩИЕ, СПЕЦИАЛЬНЫЕ, ШТРАФНЫЕ ИЛИ СЛУЧАЙНЫЕ УБЫТКИ, ЛИБО УБЫТКИ ОТ УПУЩЕННОЙ ВЫГОДЫ, ПЕРЕРЫВА В ДЕЯТЕЛЬНОСТИ, УТРАТЫ ДЕЛОВОЙ ИНФОРМАЦИИ ИЛИ ИНЫХ ИМУЩЕСТВЕННЫХ ПОТЕРЬ, ВОЗНИКАЮЩИХ ИЗ ИСПОЛЬЗОВАНИЯ САЙТА, УСЛУГ И СОДЕРЖАНИЯ, ДАЖЕ ЕСЛИ МЫ БЫЛИ УВЕДОМЛЕНЫ О ВОЗМОЖНОСТИ ТАКИХ УБЫТКОВ.',
          en: 'EXCEPT AS EXPLICITLY PROVIDED HEREIN, THE WEBSITE, SERVICES AND CONTENT ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTY OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EITHER EXPRESS OR IMPLIED, AND MAKE NO REPRESENTATION OR WARRANTIES OF ANY KIND, RELATED TO THE WEBSITE AND SERVICES AND CONTENT, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE SUCH AS THE SUCCESS OF OUR SERVICES. WE MAKE NO REPRESENTATION OR WARRANTIES THAT THE WEBSITE AND SERVICES AND CONTENT ARE OR WILL BE AVAILABLE FOR USE IN ANY PARTICULAR LOCATION OR AT A SPECIFIC TIME, THAT THE WEBSITE WILL BE SECURED, UNINTERRUPTED OR ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS, NOR THAT CONTENT WILL BE ACCURATE OR RELIABLE. ALSO WE MAKE NO REPRESENTATION OR WARRANTIES THAT THE SERVICES RENDERED HEREIN WILL ACHIEVE INDIVIDUALS’ OR GROUPS’ GOALS. YOU AGREE THAT WE WILL NOT BE HELD RESPONSIBLE FOR ANY DECISION MADE OR ACTION TAKEN OR NOT TAKEN IN RELIANCE ON THE WEBSITE OR SERVICES OR CONTENT NOR DO WE ASSUME ANY RESPONSIBILITY FOR ANY DAMAGES WHATSOEVER INCLUDING, WITHOUT LIMITATION, INDIRECT, CONSEQUENTIAL, SPECIAL, PUNITIVE OR INCIDENTAL DAMAGES, OR DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF BUSINESS INFORMATION, OR OTHER PECUNIARY LOSS, ARISING OUT OF THE USE OF THE WEBSITE AND SERVICES AND CONTENT, EVEN IF WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGES.'
        }
      ]
    },
    {
      heading: { ru: 'Возмещение убытков', en: 'Indemnification' },
      paragraphs: [
        {
          ru: 'Вы соглашаетесь защищать, возмещать убытки и ограждать нас, а также наших соответствующих должностных лиц, директоров, работников и агентов от любых претензий третьих лиц, убытков, обязательств и расходов (включая разумные гонорары юристов), возникающих в связи с использованием вами сайта, Услуг или Содержания с нарушением настоящих Условий либо применимого законодательства.',
          en: 'You agree to defend, indemnify and hold us harmless and our respective officers, directors, employees, and agents from any third-party claims, damages, liabilities, and expenses (including reasonable attorney’s fees) arising from your use of the website, Services or Content that does not comply with these Terms or made in breach of any applicable law.'
        }
      ]
    },
    {
      heading: {
        ru: 'Применимое право и разрешение споров',
        en: 'Jurisdiction and Dispute Resolution'
      },
      paragraphs: [
        {
          ru: 'Настоящие Условия регулируются и толкуются в соответствии с законодательством Государства Израиль. Настоящим вы соглашаетесь разрешать любые споры исключительно в компетентном суде города Тель-Авив, Израиль.',
          en: 'These Terms shall be governed by and construed in accordance with the laws of the State of Israel. You hereby agree to resolve any dispute you have exclusively with the competent court in Tel-Aviv, Israel.'
        }
      ]
    },
    {
      heading: { ru: 'Прочие положения', en: 'Miscellaneous' },
      bullets: {
        ru: [
          'Полнота соглашения — настоящие Условия представляют собой полное понимание между сторонами в отношении предмета настоящего документа.',
          'Уступка — настоящие Условия и любое предоставленное по ним право не могут быть уступлены вами без нашего предварительного письменного согласия. Мы вправе уступить свои права и обязанности, изложенные в настоящем документе, в любое время по своему единоличному усмотрению.',
          'Делимость — если одно или несколько положений настоящих Условий будут признаны недействительными, незаконными или неисполнимыми в каком-либо отношении, действительность, законность и исполнимость остальных положений настоящих Условий не будут затронуты или ограничены таким признанием и сохранят полную силу и действие, а затронутое положение будет истолковано как исполнимое в максимально допустимой законом степени.',
          'Отказ от прав — без ущерба для вышеизложенного любая задержка или бездействие любой из сторон в осуществлении какого-либо права по настоящим Условиям не считается отказом от такого права. Отказ любой из сторон от какого-либо положения об исполнении настоящих Условий не считается отказом от любого последующего исполнения или нарушения.'
        ],
        en: [
          'Entire Agreement — these Terms constitutes the entire understanding between the parties relating to the subject matter herein.',
          'Assignment — these Terms and any right granted herein shall not be assigned by you without our prior written consent. We may assign our rights and obligations set forth herein at any time, at its sole discretion.',
          'Severability — should one or more of the provisions of these Terms be determined to be invalid, unlawful, or unenforceable in any respect, the validity, legality, and enforceability of the remaining provisions of these Terms shall not in any way be affected or impaired by such determination and will remain in full force and effect, and the provision affected will be construed to be enforceable to the maximum extent permissible by law.',
          'Waiver — without derogating from the above, any delay or omission by either party to exercise any right under these Terms shall not be construed to be a waiver of such right. A waiver by either party of any of the performance provisions of these Terms shall not be construed to be a waiver of any succeeding performance or breach.'
        ]
      }
    }
  ],
  governingNote
};
