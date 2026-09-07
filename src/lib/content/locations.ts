import type { LocalizedString } from '../types';

/**
 * Where each string in the catalogue actually appears on the site.
 *
 * The editor without this is a list of 491 dotted keys grouped by
 * namespace, which tells you what a string is called and nothing about
 * where it lives or what stands next to it. Editing `why2Text` well means
 * seeing that it sits between `why1Text` and `why3Text` in a four-card row
 * under "Why study here" — length and tone have to match its neighbours,
 * and the key name says none of that.
 *
 * So this map is written by hand, page by page, in the order the reader
 * meets the strings. It is documentation that happens to be executable.
 *
 * Two rules keep it from rotting:
 *
 *  1. Nothing is ever hidden by omission. A key that matches no section
 *     falls into "everything else" and is still editable — adding a string
 *     to the catalogue can never make it disappear from the editor.
 *  2. Sections marked `hidden` are strings the site does not currently
 *     render. They are kept, not deleted, because the component that used
 *     them is usually parked rather than gone — but an editor who polishes
 *     wording nobody will read deserves to be told.
 */

export interface ContentSection {
  id: string;
  title: LocalizedString;
  /** One line on what this block is, when the title is not enough. */
  hint?: LocalizedString;
  /** Keys within the namespace. A trailing `.*` matches by prefix. */
  keys: string[];
  /** In the catalogue, but not rendered anywhere on the site today. */
  hidden?: boolean;
}

export interface ContentPlace {
  namespace: string;
  title: LocalizedString;
  /** Where this copy is read, in one line. */
  where: LocalizedString;
  /**
   * Site path to open, without the locale prefix. `{slug}` and `{groupId}`
   * are filled in with a real course and group by the caller.
   */
  path?: string;
  area: 'site' | 'service' | 'admin';
  sections: ContentSection[];
}

const s = (ru: string, en: string): LocalizedString => ({ ru, en });

export const contentPlaces: ContentPlace[] = [
  {
    namespace: 'nav',
    title: s('Шапка сайта', 'Site header'),
    where: s('Верхняя панель и мобильное меню — на каждой странице', 'Top bar and mobile menu — on every page'),
    path: '/',
    area: 'site',
    sections: [
      {
        id: 'links',
        title: s('Пункты меню', 'Menu links'),
        keys: ['home', 'courses', 'about', 'faq', 'contacts']
      },
      {
        id: 'actions',
        title: s('Кнопка в шапке', 'Header button'),
        keys: ['explore']
      },
      {
        id: 'drawer',
        title: s('Мобильное меню', 'Mobile menu'),
        hint: s('Подписи кнопок открытия и закрытия — видны только на телефоне', 'Open and close labels — visible on phones only'),
        keys: ['menu', 'closeMenu', 'close']
      },
      {
        id: 'locale',
        title: s('Переключатель языка', 'Language switch'),
        keys: ['switchLocale']
      },
      {
        id: 'parked',
        title: s('Кнопка консультации', 'Consultation button'),
        hint: s('Строка осталась в каталоге, но такой кнопки на сайте сейчас нет', 'The string is still here, but no such button is on the site'),
        keys: ['consultation'],
        hidden: true
      }
    ]
  },
  {
    namespace: 'home',
    title: s('Главная страница', 'Home page'),
    where: s('Всё, что читается на главной, сверху вниз', 'Everything on the home page, top to bottom'),
    path: '/',
    area: 'site',
    sections: [
      {
        id: 'hero',
        title: s('1. Первый экран', '1. Hero'),
        hint: s('Крупная картинка, которая раскрывается при прокрутке', 'The large image that opens as you scroll'),
        keys: ['heroEyebrow', 'heroTitle', 'heroSubtitle', 'heroCtaPrimary', 'scrollHint']
      },
      {
        id: 'manifesto',
        title: s('2. Манифест', '2. Manifesto'),
        hint: s('Один абзац по центру, сразу под первым экраном', 'A single centred paragraph below the hero'),
        keys: ['manifestoTitle', 'manifesto']
      },
      {
        id: 'featured',
        title: s('3. Избранные курсы', '3. Featured courses'),
        hint: s('Заголовок блока с карточками курсов и кнопка под ними', 'Heading above the course cards and the button below them'),
        keys: ['featuredTitle', 'featuredSubtitle', 'allCourses']
      },
      {
        id: 'why',
        title: s('4. Почему мы — четыре карточки', '4. Why us — four cards'),
        hint: s('Карточки стоят в ряд: тексты лучше держать примерно одной длины', 'The cards sit in a row: keep the texts about the same length'),
        keys: ['whyTitle', 'why1Title', 'why1Text', 'why2Title', 'why2Text', 'why3Title', 'why3Text', 'why4Title', 'why4Text']
      },
      {
        id: 'how',
        title: s('5. Как всё устроено — четыре шага', '5. How it works — four steps'),
        hint: s('Тёмная полоса с пронумерованными шагами', 'The dark band with numbered steps'),
        keys: ['howTitle', 'how1Title', 'how1Text', 'how2Title', 'how2Text', 'how3Title', 'how3Text', 'how4Title', 'how4Text']
      },
      {
        id: 'testimonials',
        title: s('6. Отзывы', '6. Testimonials'),
        keys: ['testimonialsTitle', 'testimonial1', 'testimonial1Author', 'testimonial2', 'testimonial2Author', 'testimonial3', 'testimonial3Author']
      },
      {
        id: 'faq',
        title: s('7. Вопросы на главной', '7. FAQ preview'),
        hint: s('Показываются первые четыре вопроса из раздела «Вопросы и ответы»', 'Shows the first four questions from the FAQ page'),
        keys: ['faqTitle', 'faqMore']
      },
      {
        id: 'newsletter',
        title: s('Подписка на рассылку', 'Newsletter sign-up'),
        hint: s('Блок отключён до подключения почтовой рассылки — на сайте его сейчас нет', 'Parked until email delivery exists — not on the site today'),
        keys: ['newsletter*'],
        hidden: true
      }
    ]
  },
  {
    namespace: 'courses',
    title: s('Каталог курсов', 'Course catalogue'),
    where: s('Страница «Курсы», карточки курсов на главной и ярлыки курса везде', 'The Courses page, the cards on the home page, and course labels everywhere'),
    path: '/courses',
    area: 'site',
    sections: [
      {
        id: 'header',
        title: s('Заголовок страницы', 'Page header'),
        keys: ['title', 'intro', 'empty']
      },
      {
        id: 'card',
        title: s('Карточка курса', 'Course card'),
        hint: s('Эти же подписи используются на главной и на странице курса', 'The same labels are used on the home page and on a course page'),
        keys: ['viewCourse', 'close', 'perMonth', 'months', 'nextCohort', 'seatsLeft', 'noSeats']
      },
      {
        id: 'category',
        title: s('Ярлык: направление', 'Label: subject'),
        keys: ['category.*']
      },
      {
        id: 'difficulty',
        title: s('Ярлык: уровень', 'Label: level'),
        keys: ['difficulty.*']
      },
      {
        id: 'ageGroup',
        title: s('Ярлык: возраст', 'Label: age group'),
        keys: ['ageGroup.*']
      }
    ]
  },
  {
    namespace: 'course',
    title: s('Страница курса', 'Course page'),
    where: s('Подписи разделов на странице любого курса. Сами тексты курса правятся в «Курсах»', 'Section headings on any course page. The course text itself is edited under Courses'),
    path: '/courses/{slug}',
    area: 'site',
    sections: [
      {
        id: 'top',
        title: s('Шапка курса', 'Course header'),
        keys: ['backToCourses', 'registerCta']
      },
      {
        id: 'about',
        title: s('Заголовки описания', 'Description headings'),
        keys: ['aboutTitle', 'outcomesTitle', 'audienceTitle']
      },
      {
        id: 'format',
        title: s('Формат обучения', 'Format block'),
        hint: s('Четыре пункта списка — одинаковые для всех курсов', 'Four bullet points — the same on every course'),
        keys: ['formatTitle', 'format1', 'format2', 'format3', 'format4', 'telegramPublic']
      },
      {
        id: 'schedule',
        title: s('Заголовок расписания', 'Schedule heading'),
        hint: s('Сами карточки групп — в разделе «Расписание и слоты»', 'The slot cards themselves are in the Schedule namespace'),
        keys: ['scheduleTitle', 'scheduleSubtitle']
      },
      {
        id: 'pricing',
        title: s('Стоимость', 'Pricing'),
        keys: ['pricingNote']
      },
      {
        id: 'curriculum',
        title: s('Программа и преподаватель', 'Curriculum and teacher'),
        keys: ['curriculumTitle', 'moduleLabel', 'teacherTitle']
      },
      {
        id: 'faq',
        title: s('Вопросы о курсе', 'Course FAQ'),
        keys: ['faqTitle']
      },
      {
        id: 'parked',
        title: s('Заголовок «Стоимость»', 'Pricing heading'),
        hint: s('Сейчас не выводится: у блока цены нет отдельного заголовка', 'Not rendered today: the price block has no separate heading'),
        keys: ['pricingTitle'],
        hidden: true
      }
    ]
  },
  {
    namespace: 'schedule',
    title: s('Расписание и слоты', 'Schedule and slots'),
    where: s('Карточки групп на странице курса — то, из чего человек выбирает время', 'The group cards on a course page — where a student picks a time'),
    path: '/courses/{slug}',
    area: 'site',
    sections: [
      {
        id: 'audience',
        title: s('Разделение на детей и взрослых', 'Children and adults'),
        hint: s('Заголовки над двумя списками слотов', 'Headings above the two lists of slots'),
        keys: ['audience.*']
      },
      {
        id: 'slot',
        title: s('Карточка слота', 'Slot card'),
        hint: s('Кнопка, статус и подписи внутри одной карточки времени', 'The button, status and labels inside one time card'),
        keys: ['join', 'full', 'running', 'seatsLeft', 'groupSize', 'startsOn', 'startsWhenFull', 'runningSince', 'yourTime']
      },
      {
        id: 'empty',
        title: s('Когда мест нет', 'When nothing is open'),
        keys: ['tryInstead', 'noneOpen', 'noSlots']
      },
      {
        id: 'notes',
        title: s('Примечания под расписанием', 'Notes under the schedule'),
        keys: ['timezoneNote', 'holidaysNote']
      },
      {
        id: 'after',
        title: s('Что будет после оплаты', 'What happens after payment'),
        hint: s('Три пункта под расписанием. Тот же смысл повторяется на странице регистрации', 'Three points below the schedule. The same promise is repeated on the registration page'),
        keys: ['afterPaymentTitle', 'afterPayment1', 'afterPayment2', 'afterPayment3']
      },
      {
        id: 'legacy',
        title: s('Старая таблица расписания', 'The old schedule table'),
        hint: s('Расписание давно нарисовано карточками, эти заголовки столбцов нигде не выводятся', 'The schedule has been cards for a while; these column headings are not rendered anywhere'),
        keys: ['group', 'day', 'time', 'starts', 'seats', 'action'],
        hidden: true
      }
    ]
  },
  {
    namespace: 'register',
    title: s('Регистрация на группу', 'Registration'),
    where: s('Форма, которую человек заполняет перед переходом к оплате', 'The form a student fills in before going to payment'),
    path: '/register/{groupId}',
    area: 'service',
    sections: [
      {
        id: 'header',
        title: s('Заголовок страницы', 'Page header'),
        keys: ['title', 'subtitle', 'backToCourse', 'groupFull']
      },
      {
        id: 'summary',
        title: s('Блок «Ваш выбор»', 'The summary block'),
        hint: s('Подписи строк с курсом, временем и ценой', 'Row labels for the course, time and price'),
        keys: ['summaryTitle', 'course', 'group', 'schedule', 'start', 'duration', 'price', 'priceNote']
      },
      {
        id: 'plan',
        title: s('Выбор способа оплаты', 'Payment plan choice'),
        keys: ['planTitle', 'planMonthly', 'planMonthlyNote', 'planFull', 'planFullNote']
      },
      {
        id: 'participant',
        title: s('Кто будет заниматься', 'Who is attending'),
        hint: s('Показывается только для детских и подростковых групп', 'Shown only for children and teen groups'),
        keys: ['participantTitle', 'participantName', 'participantNameHint', 'participantBirthYear']
      },
      {
        id: 'fields',
        title: s('Поля формы', 'Form fields'),
        keys: ['firstName', 'lastName', 'email', 'phone', 'phonePlaceholder', 'agreement', 'submit', 'submitting']
      },
      {
        id: 'errors',
        title: s('Сообщения об ошибках', 'Error messages'),
        hint: s('Появляются под полем, если что-то не заполнено', 'Appear under a field when something is missing'),
        keys: ['errors.*']
      },
      {
        id: 'success',
        title: s('Экран перед переходом к оплате', 'The screen before payment'),
        keys: ['successTitle', 'successText', 'successManual', 'goToPayment', 'afterPayment', 'afterPayment1', 'afterPayment2', 'afterPayment3']
      }
    ]
  },
  {
    namespace: 'about',
    title: s('Страница «О нас»', 'About page'),
    where: s('Рассказ о проекте, принципы и приглашение в конце', 'The story, the principles and the closing invitation'),
    path: '/about',
    area: 'site',
    sections: [
      { id: 'header', title: s('Заголовок страницы', 'Page header'), keys: ['title', 'intro'] },
      { id: 'story', title: s('Наша история', 'Our story'), keys: ['storyTitle', 'story1', 'story2', 'story3'] },
      {
        id: 'values',
        title: s('Принципы — три карточки', 'Principles — three cards'),
        hint: s('Стоят в ряд, длину текстов лучше держать близкой', 'They sit in a row; keep the texts a similar length'),
        keys: ['valuesTitle', 'value1Title', 'value1Text', 'value2Title', 'value2Text', 'value3Title', 'value3Text']
      },
      { id: 'cta', title: s('Приглашение внизу', 'Closing invitation'), keys: ['ctaTitle', 'ctaText', 'ctaButton'] }
    ]
  },
  {
    namespace: 'teachers',
    title: s('Преподаватели', 'Teachers'),
    where: s('Блок с преподавателями на странице «О нас». Имена и биографии правятся в «Преподавателях»', 'The teachers block on the About page. Names and bios are edited under Teachers'),
    path: '/about',
    area: 'site',
    sections: [
      { id: 'all', title: s('Заголовки блока', 'Block headings'), keys: ['title', 'intro', 'coursesBy', 'highlightsTitle'] }
    ]
  },
  {
    namespace: 'faq',
    title: s('Вопросы и ответы', 'FAQ'),
    where: s('Страница «Вопросы». Первые четыре вопроса показываются и на главной', 'The FAQ page. The first four questions also appear on the home page'),
    path: '/faq',
    area: 'site',
    sections: [
      { id: 'header', title: s('Заголовок страницы', 'Page header'), keys: ['title', 'intro'] },
      {
        id: 'items',
        title: s('Вопросы', 'Questions'),
        hint: s('Пары «вопрос — ответ» по порядку. q — вопрос, a — ответ. Первые четыре видны на главной', 'Question and answer pairs in order. q is the question, a the answer. The first four show on the home page'),
        keys: ['items.*']
      }
    ]
  },
  {
    namespace: 'contacts',
    title: s('Контакты', 'Contacts'),
    where: s('Страница «Контакты». Сами адреса и номера — в настройках, не здесь', 'The Contacts page. The addresses and numbers themselves live in settings, not here'),
    path: '/contacts',
    area: 'site',
    sections: [
      { id: 'header', title: s('Заголовок страницы', 'Page header'), keys: ['title', 'intro'] },
      { id: 'links', title: s('Кнопки связи', 'Contact buttons'), keys: ['whatsapp', 'telegram', 'emailLabel'] },
      { id: 'note', title: s('Примечание внизу', 'Closing note'), keys: ['note'] }
    ]
  },
  {
    namespace: 'footer',
    title: s('Подвал сайта', 'Site footer'),
    where: s('Нижняя часть каждой страницы', 'The bottom of every page'),
    path: '/',
    area: 'site',
    sections: [
      { id: 'tagline', title: s('Подпись под названием', 'Tagline'), keys: ['tagline'] },
      { id: 'columns', title: s('Заголовки колонок', 'Column headings'), keys: ['coursesTitle', 'schoolTitle', 'legalTitle'] },
      { id: 'links', title: s('Ссылки на документы', 'Document links'), keys: ['privacy', 'terms'] },
      { id: 'copyright', title: s('Копирайт', 'Copyright'), keys: ['copyright'] }
    ]
  },
  {
    namespace: 'cookies',
    title: s('Баннер про cookie', 'Cookie banner'),
    where: s('Полоса внизу экрана при первом визите и окно настроек за кнопкой «Настроить»', 'The bar at the bottom on a first visit, and the panel behind “Customise”'),
    path: '/',
    area: 'service',
    sections: [
      {
        id: 'banner',
        title: s('Баннер', 'The banner'),
        hint: s('Формулировки согласия — юридически значимые, менять осторожно', 'Consent wording is legally significant — change with care'),
        keys: ['title', 'body', 'privacyLink', 'acceptAll', 'rejectAll', 'customise', 'save']
      },
      { id: 'panel', title: s('Окно настроек', 'The settings panel'), keys: ['manage', 'panelTitle', 'panelBody', 'alwaysOn', 'noOptionalInUse'] },
      { id: 'categories', title: s('Категории cookie', 'Cookie categories'), keys: ['categories.*'] }
    ]
  },
  {
    namespace: 'legal',
    title: s('Юридические документы', 'Legal documents'),
    where: s('Только подпись «Обновлено». Тексты политики и условий живут в коде и правятся с юристом', 'Only the “Updated” label. The policy and terms live in code and are changed with counsel'),
    path: '/privacy',
    area: 'service',
    sections: [{ id: 'all', title: s('Подпись', 'Label'), keys: ['lastUpdated'] }]
  },
  {
    namespace: 'meta',
    title: s('Заголовки для браузера и поиска', 'Browser and search titles'),
    where: s('Видно во вкладке браузера, в закладках и в результатах поиска. На самой странице не отображается', 'Seen in the browser tab, in bookmarks and in search results. Not shown on the page itself'),
    area: 'service',
    sections: [
      { id: 'site', title: s('Название сайта', 'Site name'), keys: ['siteName'] },
      { id: 'home', title: s('Главная', 'Home'), keys: ['home.*'] },
      { id: 'courses', title: s('Курсы', 'Courses'), keys: ['courses.*'] },
      { id: 'about', title: s('О нас', 'About'), keys: ['about.*'] },
      { id: 'faq', title: s('Вопросы', 'FAQ'), keys: ['faq.*'] },
      { id: 'contacts', title: s('Контакты', 'Contacts'), keys: ['contacts.*'] },
      { id: 'legal', title: s('Документы', 'Legal'), keys: ['privacy.*', 'terms.*'] },
      { id: 'register', title: s('Регистрация', 'Registration'), keys: ['register.*'] }
    ]
  },
  {
    namespace: 'enrollSuccess',
    title: s('Страница после оплаты', 'After payment'),
    where: s('Куда платёжная страница возвращает человека. Здесь он ждёт подтверждения и получает ссылку в Telegram-канал', 'Where the payment page returns a student. They wait for confirmation here and get the Telegram link'),
    area: 'service',
    sections: [
      { id: 'waiting', title: s('Пока платёж проверяется', 'While the payment is checked'), keys: ['title', 'waiting'] },
      { id: 'ready', title: s('Доступ выдан', 'Access granted'), keys: ['readyTitle', 'readyText', 'join', 'emailedToo'] },
      { id: 'pending', title: s('Платёж пока не подтверждён', 'Payment not confirmed yet'), keys: ['pendingTitle', 'pendingText'] },
      {
        id: 'manual',
        title: s('Если выдать доступ не вышло', 'If access could not be granted'),
        hint: s('Это видно, когда деньги получены, но Telegram не ответил. Человеку нужно понимать, что деньги не пропали', 'Shown when the money arrived but Telegram did not answer. The reader must understand the money is not lost'),
        keys: ['manualTitle', 'manualText', 'contact']
      }
    ]
  },
  {
    namespace: 'portal',
    title: s('Личный кабинет', 'Student portal'),
    where: s('Страница-заглушка: кабинет ещё не открыт', 'A placeholder page: the portal is not open yet'),
    path: '/portal',
    area: 'service',
    sections: [{ id: 'all', title: s('Заглушка', 'Placeholder'), keys: ['title', 'comingSoon', 'comingSoonText', 'backHome'] }]
  },
  {
    namespace: 'notFound',
    title: s('Страница не найдена', 'Not found'),
    where: s('Показывается на любом несуществующем адресе', 'Shown at any address that does not exist'),
    area: 'service',
    sections: [{ id: 'all', title: s('Текст страницы', 'Page text'), keys: ['title', 'text', 'backHome'] }]
  },
  {
    namespace: 'adminLogin',
    title: s('Вход в админку', 'Admin login'),
    where: s('Страница входа, которую видите вы, а не студенты', 'The login page you see, not your students'),
    path: '/admin-login',
    area: 'admin',
    sections: [
      { id: 'form', title: s('Форма входа', 'Login form'), keys: ['title', 'subtitle', 'subtitlePassword', 'email', 'password', 'signIn', 'signingIn', 'submit', 'sending'] },
      { id: 'sent', title: s('После отправки ссылки', 'After the link is sent'), keys: ['sentTitle', 'sentText'] },
      { id: 'errors', title: s('Ошибки и подсказки', 'Errors and hints'), keys: ['error', 'badCredentials', 'useLink', 'usePassword', 'demoNote'] }
    ]
  },
  {
    namespace: 'admin',
    title: s('Сама админка', 'The admin panel itself'),
    where: s('Подписи кнопок и колонок в этой панели. Студенты этого не видят', 'Button and column labels in this panel. Students never see any of it'),
    path: '/admin',
    area: 'admin',
    sections: [
      { id: 'general', title: s('Общее', 'General'), keys: ['title', 'demoBanner'] },
      { id: 'nav', title: s('Боковое меню', 'Sidebar menu'), keys: ['nav.*'] },
      { id: 'dashboard', title: s('Сводка', 'Dashboard'), keys: ['dashboard.*'] },
      { id: 'table', title: s('Заголовки таблиц', 'Table headings'), keys: ['table.*'] },
      { id: 'status', title: s('Статусы', 'Statuses'), keys: ['status.*'] },
      { id: 'actions', title: s('Кнопки действий', 'Action buttons'), keys: ['actions.*'] },
      { id: 'enrollments', title: s('Записи студентов', 'Enrollments'), keys: ['enrollments.*'] },
      { id: 'groupForm', title: s('Редактор группы', 'Group editor'), keys: ['groupForm.*'] },
      { id: 'courseForm', title: s('Редактор курса', 'Course editor'), keys: ['courseForm.*'] },
      { id: 'teacherForm', title: s('Редактор преподавателя', 'Teacher editor'), keys: ['teacherForm.*'] },
      { id: 'studentForm', title: s('Редактор студента', 'Student editor'), keys: ['studentForm.*'] },
      { id: 'content', title: s('Эта страница', 'This page'), keys: ['content.*'] },
      { id: 'settings', title: s('Настройки', 'Settings'), keys: ['settings.*'] }
    ]
  }
];

const byNamespace = new Map(contentPlaces.map((place) => [place.namespace, place]));

export function placeFor(namespace: string): ContentPlace | undefined {
  return byNamespace.get(namespace);
}

function matches(key: string, pattern: string): boolean {
  return pattern.endsWith('*')
    ? key.startsWith(pattern.slice(0, -1))
    : key === pattern;
}

export interface KeyGroup {
  id: string;
  title: LocalizedString;
  hint?: LocalizedString;
  hidden?: boolean;
  keys: string[];
}

/**
 * Sort a namespace's keys into the sections above, in section order.
 *
 * Anything the map does not mention lands in a final "everything else"
 * group rather than vanishing — see rule 1 at the top of this file. A
 * namespace with no entry at all comes back as one unnamed group, which
 * is exactly what the editor showed before this map existed.
 */
export function groupKeys(namespace: string, keys: string[]): KeyGroup[] {
  const place = byNamespace.get(namespace);
  if (!place) return [{ id: 'all', title: s('Все строки', 'All strings'), keys }];

  const taken = new Set<string>();
  const groups: KeyGroup[] = [];

  for (const section of place.sections) {
    const mine = keys.filter(
      (key) => !taken.has(key) && section.keys.some((pattern) => matches(key, pattern))
    );
    mine.forEach((key) => taken.add(key));
    if (mine.length > 0) {
      groups.push({
        id: section.id,
        title: section.title,
        hint: section.hint,
        hidden: section.hidden,
        keys: mine
      });
    }
  }

  const rest = keys.filter((key) => !taken.has(key));
  if (rest.length > 0) {
    groups.push({
      id: 'other',
      title: s('Остальное', 'Everything else'),
      hint: s('Эти строки ещё не разложены по местам — но правятся так же', 'These are not placed on the map yet — they edit the same way'),
      keys: rest
    });
  }

  return groups;
}

/**
 * The site address to open, or undefined when there is nothing to open.
 *
 * `{slug}` and `{groupId}` need a real course and group; when the database
 * has none, the caller gets undefined and the editor simply shows no link
 * rather than a URL that 404s.
 */
export function resolvePath(
  place: ContentPlace | undefined,
  vars: { slug?: string; groupId?: string }
): string | undefined {
  if (!place?.path) return undefined;
  let path = place.path;
  for (const [name, value] of Object.entries(vars)) {
    const token = `{${name}}`;
    if (path.includes(token)) {
      if (!value) return undefined;
      path = path.replace(token, value);
    }
  }
  return path.includes('{') ? undefined : path;
}
