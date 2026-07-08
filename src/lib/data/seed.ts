import type {
  AutomationLog,
  Course,
  Enrollment,
  Payment,
  Student,
  StudyGroup,
  Teacher
} from '../types';

/**
 * Seed content. Used directly by the seed data provider (demo mode) and
 * mirrored by supabase/seed.sql for the production database.
 */

export const teachers: Teacher[] = [
  {
    id: 'teacher_001',
    slug: 'mark-ovadia',
    photoUrl: null,
    name: { ru: 'Марк Овадия', en: 'Mark Ovadia' },
    title: { ru: 'Историк и философ', en: 'Historian & Philosopher' },
    bio: {
      ru: 'Историк и философ, увлечённый тем, чтобы оживлять прошлое для любознательных умов всех возрастов. Имея образование в области классических исследований и средневековой истории, я разработал каждый курс так, чтобы сочетать академическую строгость с доступностью. Преподаю на английском и русском языках и работаю со взрослыми, подростками и детьми. Я верю, что философия и история — не роскошь, а необходимые инструменты для понимания себя и нашего мира.',
      en: 'A historian and philosopher passionate about bringing the past to life for curious minds of all ages. With a background in classical studies and medieval history, I have designed each course to balance scholarly rigour with accessibility. I teach in both English and Russian and work with adults, teenagers, and children. I believe that philosophy and history are not luxuries — they are essential tools for understanding ourselves and our world.'
    },
    highlights: {
      ru: [
        'Двуязычное преподавание (английский и русский)',
        'Индивидуальные и групповые занятия',
        'Курсы для взрослых, подростков и детей',
        'Живые занятия с вопросами и ответами, записи предоставляются',
        'Основаны на первоисточниках и оригинальных текстах'
      ],
      en: [
        'Bilingual instruction (English & Russian)',
        'Individual and group sessions available',
        'Courses for adults, teens, and children',
        'Live sessions with Q&A, recordings provided',
        'Rooted in primary sources and original texts'
      ]
    }
  }
];

const sharedFaq = [
  {
    question: {
      ru: 'Как проходят занятия?',
      en: 'How are the classes held?'
    },
    answer: {
      ru: 'Занятия проходят вживую в Zoom или Google Meet. Каждая группа получает записи занятий и материалы в закрытом Telegram-канале.',
      en: 'Classes are held live on Zoom or Google Meet. Every group receives session recordings and materials in a private Telegram channel.'
    }
  },
  {
    question: {
      ru: 'Как устроена оплата?',
      en: 'How does payment work?'
    },
    answer: {
      ru: 'Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты. Отменить участие можно в конце любого месяца.',
      en: 'Billing is monthly. After registration you are redirected to a secure payment page. You can cancel at the end of any month.'
    }
  },
  {
    question: {
      ru: 'Что, если я пропущу занятие?',
      en: 'What if I miss a class?'
    },
    answer: {
      ru: 'Все занятия записываются. Записи публикуются в Telegram-канале группы в течение суток.',
      en: 'All sessions are recorded. Recordings are posted in your group’s Telegram channel within 24 hours.'
    }
  }
];

export const courses: Course[] = [
  {
    id: 'course_001',
    slug: 'medieval-russia',
    teacherId: 'teacher_001',
    category: 'history',
    difficulty: 'intermediate',
    ageGroups: ['adults', 'teens'],
    durationMonths: 3,
    monthlyPrice: 350,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: true,
    title: { ru: 'Средневековая Россия', en: 'Medieval Russia' },
    shortDescription: {
      ru: 'Путешествие по драматическим векам Киевской Руси и Московского государства — от варяжских основателей до Ивана Грозного.',
      en: 'Journey through the dramatic centuries of Kievan Rus and the Muscovite state — from Viking founders to Ivan the Terrible.'
    },
    description: {
      ru: 'Курс охватывает политическое, культурное и религиозное развитие России с IX по XVI век: основание Руси, крещение славян, монгольское нашествие и его долгая тень, возвышение Москвы, правление Ивана III и Ивана IV. Студенты будут работать с первоисточниками и яркими историческими нарративами.',
      en: 'This course covers the political, cultural, and religious development of Russia from the 9th to the 16th century: the founding of Rus, the Christianisation of the Slavs, the Mongol invasion and its long shadow, the rise of Moscow, and the reigns of Ivan III and Ivan IV. Students engage with primary sources and vivid historical narratives.'
    },
    outcomes: {
      ru: [
        'Понимать ключевые этапы русской истории IX–XVI веков',
        'Читать и анализировать первоисточники — летописи и грамоты',
        'Видеть, как средневековая цивилизация сформировала современную идентичность',
        'Уверенно ориентироваться в историографических спорах'
      ],
      en: [
        'Understand the key stages of Russian history from the 9th to the 16th century',
        'Read and analyse primary sources — chronicles and charters',
        'See how a medieval civilisation forged a modern identity',
        'Navigate major historiographical debates with confidence'
      ]
    },
    audience: {
      ru: [
        'Взрослые, интересующиеся историей Восточной Европы',
        'Подростки, готовящиеся к углублённому изучению истории',
        'Все, кто хочет понять истоки современной России'
      ],
      en: [
        'Adults interested in Eastern European history',
        'Teens preparing for advanced history study',
        'Anyone who wants to understand the origins of modern Russia'
      ]
    },
    curriculum: [
      {
        title: { ru: 'Рождение Руси', en: 'The Birth of Rus' },
        topics: {
          ru: [
            'Варяги и путь «из варяг в греки»',
            'Киев, Новгород и первые князья',
            'Крещение Руси и византийское наследие'
          ],
          en: [
            'The Varangians and the route “from the Varangians to the Greeks”',
            'Kyiv, Novgorod and the first princes',
            'The Christianisation of Rus and the Byzantine legacy'
          ]
        }
      },
      {
        title: { ru: 'Под тенью Орды', en: 'Under the Shadow of the Horde' },
        topics: {
          ru: [
            'Монгольское нашествие 1237–1240 годов',
            'Жизнь под игом: дань, ярлыки, выживание',
            'Александр Невский: святой или прагматик?'
          ],
          en: [
            'The Mongol invasion of 1237–1240',
            'Life under the yoke: tribute, patents, survival',
            'Alexander Nevsky: saint or pragmatist?'
          ]
        }
      },
      {
        title: { ru: 'Возвышение Москвы', en: 'The Rise of Moscow' },
        topics: {
          ru: [
            'Собирание земель и Куликовская битва',
            'Иван III и рождение государства',
            'Иван Грозный: реформы и опричнина'
          ],
          en: [
            'The gathering of the lands and the Battle of Kulikovo',
            'Ivan III and the birth of the state',
            'Ivan the Terrible: reforms and the Oprichnina'
          ]
        }
      }
    ],
    faq: sharedFaq
  },
  {
    id: 'course_002',
    slug: 'ancient-greece',
    teacherId: 'teacher_001',
    category: 'history',
    difficulty: 'intro',
    ageGroups: ['adults', 'children'],
    durationMonths: 3,
    monthlyPrice: 350,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: true,
    title: { ru: 'Древняя Греция', en: 'Ancient Greece' },
    shortDescription: {
      ru: 'Мир полисов, демократии и мифов — от минойцев бронзового века до завоеваний Александра Македонского.',
      en: 'The world of city-states, democracy, and myth — from the Bronze Age Minoans to the conquests of Alexander the Great.'
    },
    description: {
      ru: 'Широкий обзор истории и культуры Древней Греции: минойский и микенский мир, Тёмные века, архаический и классический периоды, эллинистическая эпоха. Особое внимание уделяется Афинам и Спарте, греко-персидским войнам, Пелопоннесской войне и культурным достижениям, продолжающим вдохновлять человечество.',
      en: 'A broad survey of ancient Greek history and culture covering the Minoan and Mycenaean worlds, the Dark Ages, the Archaic and Classical periods, and the Hellenistic era. Special attention is given to Athens and Sparta, the Persian Wars, the Peloponnesian War, and the cultural achievements that continue to inspire humanity.'
    },
    outcomes: {
      ru: [
        'Ориентироваться в трёх тысячелетиях греческой истории',
        'Понимать, как родилась демократия и почему она выжила',
        'Узнавать наследие Греции в театре, спорте и науке',
        'Читать мифы как исторические источники'
      ],
      en: [
        'Navigate three millennia of Greek history',
        'Understand how democracy was born and why it survived',
        'Recognise Greece’s legacy in theatre, sport and science',
        'Read myths as historical sources'
      ]
    },
    audience: {
      ru: [
        'Дети от 10 лет — отдельные группы с адаптированной программой',
        'Взрослые, которые хотят систематизировать знания об античности',
        'Родители, желающие учиться вместе с детьми'
      ],
      en: [
        'Children from age 10 — separate groups with an adapted programme',
        'Adults who want a structured view of antiquity',
        'Parents who wish to learn alongside their children'
      ]
    },
    curriculum: [
      {
        title: { ru: 'До полисов', en: 'Before the Polis' },
        topics: {
          ru: [
            'Минойский Крит и микенские дворцы',
            'Тёмные века и Гомер',
            'Архаическая революция: алфавит, колонии, тираны'
          ],
          en: [
            'Minoan Crete and the Mycenaean palaces',
            'The Dark Ages and Homer',
            'The Archaic revolution: alphabet, colonies, tyrants'
          ]
        }
      },
      {
        title: { ru: 'Классическая Греция', en: 'Classical Greece' },
        topics: {
          ru: [
            'Афины и Спарта: два мира',
            'Греко-персидские войны',
            'Век Перикла и Пелопоннесская война'
          ],
          en: [
            'Athens and Sparta: two worlds',
            'The Persian Wars',
            'The Age of Pericles and the Peloponnesian War'
          ]
        }
      },
      {
        title: { ru: 'Эллинизм', en: 'The Hellenistic World' },
        topics: {
          ru: [
            'Филипп II и возвышение Македонии',
            'Александр Великий: от Граника до Индии',
            'Эллинистические царства и наследие Греции'
          ],
          en: [
            'Philip II and the rise of Macedon',
            'Alexander the Great: from the Granicus to India',
            'The Hellenistic kingdoms and the Greek legacy'
          ]
        }
      }
    ],
    faq: sharedFaq
  },
  {
    id: 'course_003',
    slug: 'greek-philosophy',
    teacherId: 'teacher_001',
    category: 'philosophy',
    difficulty: 'intermediate',
    ageGroups: ['adults', 'teens'],
    durationMonths: 3,
    monthlyPrice: 380,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: true,
    title: { ru: 'Греческая философия', en: 'Greek Philosophy' },
    shortDescription: {
      ru: 'От досократиков до пещеры Платона, этики Аристотеля и стоического поиска душевного покоя — философия как живая практика.',
      en: 'From the pre-Socratics to Plato’s cave, Aristotle’s ethics, and the Stoic quest for peace of mind — philosophy as a living practice.'
    },
    description: {
      ru: 'Курс исследует основные школы и мыслителей древнегреческой философии. Начинаем с досократиков (Гераклит, Парменид, Демокрит), переходим к Сократу, Платону и Аристотелю, и завершаем эллинистическими школами: стоицизм, эпикуреизм и скептицизм. Каждое занятие связывает древние аргументы с современной актуальностью.',
      en: 'This course explores the major schools and thinkers of ancient Greek philosophy. We begin with the pre-Socratics (Heraclitus, Parmenides, Democritus), move through Socrates, Plato, and Aristotle, and conclude with the Hellenistic schools: Stoicism, Epicureanism, and Skepticism. Each session connects ancient arguments to contemporary relevance.'
    },
    outcomes: {
      ru: [
        'Понимать главные вопросы и ответы античной философии',
        'Читать Платона и Аристотеля в оригинальной аргументации',
        'Применять стоические практики в повседневной жизни',
        'Строить и разбирать философские аргументы'
      ],
      en: [
        'Understand the central questions and answers of ancient philosophy',
        'Read Plato and Aristotle in their original arguments',
        'Apply Stoic practices to everyday life',
        'Construct and dissect philosophical arguments'
      ]
    },
    audience: {
      ru: [
        'Взрослые, ищущие интеллектуального вызова',
        'Подростки с интересом к большим вопросам',
        'Читатели, желающие глубже понять западную мысль'
      ],
      en: [
        'Adults looking for an intellectual challenge',
        'Teens drawn to the big questions',
        'Readers who want a deeper grasp of Western thought'
      ]
    },
    curriculum: [
      {
        title: { ru: 'Досократики', en: 'The Pre-Socratics' },
        topics: {
          ru: [
            '«Из чего состоит всё?» — милетцы и Гераклит',
            'Парменид и проблема бытия',
            'Демокрит и рождение атомизма'
          ],
          en: [
            '“What is everything made of?” — the Milesians and Heraclitus',
            'Parmenides and the problem of being',
            'Democritus and the birth of atomism'
          ]
        }
      },
      {
        title: { ru: 'Афинская триада', en: 'The Athenian Triad' },
        topics: {
          ru: [
            'Сократ: метод, суд и смерть',
            'Платон: пещера, идеи, государство',
            'Аристотель: этика добродетели и логика'
          ],
          en: [
            'Socrates: the method, the trial, the death',
            'Plato: the cave, the forms, the Republic',
            'Aristotle: virtue ethics and logic'
          ]
        }
      },
      {
        title: { ru: 'Эллинистические школы', en: 'The Hellenistic Schools' },
        topics: {
          ru: [
            'Стоицизм: Зенон, Эпиктет, Марк Аврелий',
            'Эпикур и искусство удовольствия',
            'Скептики и конец античной философии'
          ],
          en: [
            'Stoicism: Zeno, Epictetus, Marcus Aurelius',
            'Epicurus and the art of pleasure',
            'The Skeptics and the end of ancient philosophy'
          ]
        }
      }
    ],
    faq: sharedFaq
  },
  {
    id: 'course_004',
    slug: 'prehistoric-mindset',
    teacherId: 'teacher_001',
    category: 'anthropology',
    difficulty: 'deep_dive',
    ageGroups: ['adults'],
    durationMonths: 2,
    monthlyPrice: 380,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: false,
    title: { ru: 'Доисторическое мышление', en: 'Prehistoric Mindset' },
    shortDescription: {
      ru: 'Когнитивный и духовный мир наших доисторических предков — наскальная живопись, ритуал, шаманизм и рождение символического мышления.',
      en: 'The cognitive and spiritual world of our prehistoric ancestors — cave paintings, ritual, shamanism, and the birth of symbolic thought.'
    },
    description: {
      ru: 'Опираясь на археологию, когнитивные науки и антропологию, курс исследует, как Homo sapiens развил сознание, язык, искусство и религию. Изучаем ключевые объекты: Ласко, Гёбекли-Тепе, Стоунхендж — и задаёмся вопросом, что они говорят о происхождении человеческого разума и глубочайших корнях культуры.',
      en: 'Drawing on archaeology, cognitive science, and anthropology, this course investigates how Homo sapiens developed consciousness, language, art, and religion. We examine major sites such as Lascaux, Göbekli Tepe, and Stonehenge, and ask what they tell us about the origins of the human mind and the deepest roots of culture.'
    },
    outcomes: {
      ru: [
        'Понимать современные теории происхождения сознания',
        '«Читать» наскальное искусство и мегалитические памятники',
        'Видеть корни религии и ритуала в глубокой древности',
        'Критически оценивать научные и популярные гипотезы'
      ],
      en: [
        'Understand current theories on the origins of consciousness',
        '“Read” cave art and megalithic monuments',
        'Trace the roots of religion and ritual into deep prehistory',
        'Evaluate scholarly and popular hypotheses critically'
      ]
    },
    audience: {
      ru: [
        'Взрослые с интересом к антропологии и археологии',
        'Читатели Харари, желающие копнуть глубже',
        'Все, кого волнует вопрос «откуда мы?»'
      ],
      en: [
        'Adults interested in anthropology and archaeology',
        'Readers of Harari who want to dig deeper',
        'Anyone moved by the question “where do we come from?”'
      ]
    },
    curriculum: [
      {
        title: { ru: 'Рождение разума', en: 'The Birth of the Mind' },
        topics: {
          ru: [
            'Когнитивная революция и символическое мышление',
            'Язык, воображение и совместные мифы',
            'Неандертальцы: другой разум'
          ],
          en: [
            'The cognitive revolution and symbolic thought',
            'Language, imagination and shared myths',
            'The Neanderthals: a different mind'
          ]
        }
      },
      {
        title: { ru: 'Искусство и ритуал', en: 'Art and Ritual' },
        topics: {
          ru: [
            'Ласко и Шове: зачем рисовали в темноте?',
            'Шаманизм и изменённые состояния сознания',
            'Погребения и рождение представлений о смерти'
          ],
          en: [
            'Lascaux and Chauvet: why paint in the dark?',
            'Shamanism and altered states of consciousness',
            'Burials and the birth of ideas about death'
          ]
        }
      },
      {
        title: { ru: 'Первые храмы', en: 'The First Temples' },
        topics: {
          ru: [
            'Гёбекли-Тепе: храм до города',
            'Стоунхендж и археоастрономия',
            'От ритуала к религии и цивилизации'
          ],
          en: [
            'Göbekli Tepe: the temple before the city',
            'Stonehenge and archaeoastronomy',
            'From ritual to religion and civilisation'
          ]
        }
      }
    ],
    faq: sharedFaq
  },
  {
    id: 'course_005',
    slug: 'american-short-stories',
    teacherId: 'teacher_001',
    category: 'literature',
    difficulty: 'intro',
    ageGroups: ['adults'],
    durationMonths: 3,
    monthlyPrice: 300,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: false,
    title: {
      ru: 'Чтение американских рассказов',
      en: 'Reading Short American Stories'
    },
    shortDescription: {
      ru: 'Книжный клуб для взрослых: от Хемингуэя и Карвера до Фланнери О’Коннор — внимательное чтение, дискуссия и литературное открытие.',
      en: 'A book club for adults: from Hemingway and Carver to Flannery O’Connor — close reading, discussion, and literary discovery.'
    },
    description: {
      ru: 'Каждое занятие посвящено одному-двум рассказам, выбранным за мастерство, темы и культурное значение. Участники обсуждают характеры, стиль, образы и смысл в непринуждённой и интеллектуально насыщенной атмосфере. Список литературы предоставляется. Предварительное литературоведческое образование не требуется — только любопытство и любовь к историям.',
      en: 'Each session focuses on one or two short stories chosen for their craft, themes, and cultural significance. Participants discuss character, style, imagery, and meaning in a relaxed and intellectually stimulating environment. A reading list is provided. No prior literary study required — only curiosity and a love of stories.'
    },
    outcomes: {
      ru: [
        'Читать прозу медленно и видеть больше',
        'Понимать приёмы великих рассказчиков',
        'Уверенно говорить о литературе',
        'Открыть авторов, которых захочется перечитывать'
      ],
      en: [
        'Read fiction slowly and see more',
        'Understand the craft of great storytellers',
        'Talk about literature with confidence',
        'Discover authors you will want to reread'
      ]
    },
    audience: {
      ru: [
        'Взрослые, любящие читать и обсуждать прочитанное',
        'Изучающие английский через литературу',
        'Все, кто скучает по хорошему разговору о книгах'
      ],
      en: [
        'Adults who love to read and discuss',
        'English learners who study through literature',
        'Anyone missing a good conversation about books'
      ]
    },
    curriculum: [
      {
        title: { ru: 'Мастера краткости', en: 'Masters of Brevity' },
        topics: {
          ru: [
            'Хемингуэй и теория айсберга',
            'Рэймонд Карвер: грязный реализм',
            'Джон Чивер и пригородная Америка'
          ],
          en: [
            'Hemingway and the iceberg theory',
            'Raymond Carver: dirty realism',
            'John Cheever and suburban America'
          ]
        }
      },
      {
        title: { ru: 'Юг и готика', en: 'The South and the Gothic' },
        topics: {
          ru: [
            'Фланнери О’Коннор: благодать и гротеск',
            'Юдора Уэлти и голос Юга',
            'Уильям Фолкнер в миниатюре'
          ],
          en: [
            'Flannery O’Connor: grace and the grotesque',
            'Eudora Welty and the voice of the South',
            'William Faulkner in miniature'
          ]
        }
      },
      {
        title: { ru: 'Современные голоса', en: 'Contemporary Voices' },
        topics: {
          ru: [
            'Джордж Сондерс и добрая сатира',
            'Джумпа Лахири: между культурами',
            'Итоговая дискуссия: что делает рассказ великим?'
          ],
          en: [
            'George Saunders and kind satire',
            'Jhumpa Lahiri: between cultures',
            'Closing discussion: what makes a story great?'
          ]
        }
      }
    ],
    faq: sharedFaq
  }
];

export const studyGroups: StudyGroup[] = [
  {
    id: 'group_101',
    courseId: 'course_002',
    slug: 'greece-tue-16-children',
    audience: 'children',
    weekday: 2,
    time: '16:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-06',
    endDate: '2026-12-22',
    capacity: 12,
    seatsTaken: 5,
    paymentUrl: 'https://www.paypal.com/paypalme/invertedforest/350',
    telegramChannelId: '-1001000000101',
    status: 'enrolling'
  },
  {
    id: 'group_102',
    courseId: 'course_002',
    slug: 'greece-tue-20-adults',
    audience: 'adults',
    weekday: 2,
    time: '20:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-06',
    endDate: '2026-12-22',
    capacity: 15,
    seatsTaken: 4,
    paymentUrl: 'https://www.paypal.com/paypalme/invertedforest/350',
    telegramChannelId: '-1001000000102',
    status: 'enrolling'
  },
  {
    id: 'group_103',
    courseId: 'course_002',
    slug: 'greece-fri-18-adults',
    audience: 'adults',
    weekday: 5,
    time: '18:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-09',
    endDate: '2026-12-25',
    capacity: 15,
    seatsTaken: 11,
    paymentUrl: 'https://www.paypal.com/paypalme/invertedforest/350',
    telegramChannelId: '-1001000000103',
    status: 'enrolling'
  },
  {
    id: 'group_104',
    courseId: 'course_001',
    slug: 'medieval-russia-wed-20-adults',
    audience: 'adults',
    weekday: 3,
    time: '20:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-07',
    endDate: '2027-01-06',
    capacity: 15,
    seatsTaken: 7,
    paymentUrl: 'https://www.paypal.com/paypalme/invertedforest/350',
    telegramChannelId: '-1001000000104',
    status: 'enrolling'
  },
  {
    id: 'group_105',
    courseId: 'course_003',
    slug: 'philosophy-mon-20-adults',
    audience: 'adults',
    weekday: 1,
    time: '20:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-05',
    endDate: '2027-01-04',
    capacity: 15,
    seatsTaken: 9,
    paymentUrl: 'https://www.paypal.com/paypalme/invertedforest/380',
    telegramChannelId: '-1001000000105',
    status: 'enrolling'
  },
  {
    id: 'group_106',
    courseId: 'course_003',
    slug: 'philosophy-thu-18-teens',
    audience: 'teens',
    weekday: 4,
    time: '18:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-08',
    endDate: '2027-01-07',
    capacity: 12,
    seatsTaken: 12,
    paymentUrl: 'https://www.paypal.com/paypalme/invertedforest/380',
    telegramChannelId: '-1001000000106',
    status: 'full'
  },
  {
    id: 'group_107',
    courseId: 'course_004',
    slug: 'prehistoric-sun-20-adults',
    audience: 'adults',
    weekday: 0,
    time: '20:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-11-01',
    endDate: '2026-12-27',
    capacity: 15,
    seatsTaken: 2,
    paymentUrl: 'https://www.paypal.com/paypalme/invertedforest/380',
    telegramChannelId: '-1001000000107',
    status: 'enrolling'
  },
  {
    id: 'group_108',
    courseId: 'course_005',
    slug: 'stories-thu-20-adults',
    audience: 'adults',
    weekday: 4,
    time: '20:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-08',
    endDate: '2027-01-07',
    capacity: 10,
    seatsTaken: 6,
    paymentUrl: 'https://www.paypal.com/paypalme/invertedforest/300',
    telegramChannelId: '-1001000000108',
    status: 'enrolling'
  }
];

/* ── Demo CRM records (admin demo mode only) ───────────────────────── */

export const demoStudents: Student[] = [
  {
    id: 'student_001',
    firstName: 'Анна',
    lastName: 'Козлова',
    email: 'anna.kozlova@example.com',
    phone: '+972 50 000 0001',
    locale: 'ru',
    createdAt: '2026-06-28T10:15:00Z'
  },
  {
    id: 'student_002',
    firstName: 'Michael',
    lastName: 'Stern',
    email: 'm.stern@example.com',
    phone: null,
    locale: 'en',
    createdAt: '2026-06-30T18:40:00Z'
  },
  {
    id: 'student_003',
    firstName: 'Дмитрий',
    lastName: 'Ваксман',
    email: 'd.waksman@example.com',
    phone: '+972 54 000 0003',
    locale: 'ru',
    createdAt: '2026-07-02T09:05:00Z'
  },
  {
    id: 'student_004',
    firstName: 'Елена',
    lastName: 'Брук',
    email: 'elena.bruk@example.com',
    phone: '+972 52 000 0004',
    locale: 'ru',
    createdAt: '2026-07-05T20:22:00Z'
  }
];

export const demoEnrollments: Enrollment[] = [
  {
    id: 'enr_001',
    studentId: 'student_001',
    groupId: 'group_102',
    courseId: 'course_002',
    status: 'active',
    telegramInvitedAt: '2026-06-28T10:20:00Z',
    createdAt: '2026-06-28T10:15:00Z'
  },
  {
    id: 'enr_002',
    studentId: 'student_002',
    groupId: 'group_105',
    courseId: 'course_003',
    status: 'active',
    telegramInvitedAt: '2026-06-30T18:45:00Z',
    createdAt: '2026-06-30T18:40:00Z'
  },
  {
    id: 'enr_003',
    studentId: 'student_003',
    groupId: 'group_104',
    courseId: 'course_001',
    status: 'pending_payment',
    telegramInvitedAt: null,
    createdAt: '2026-07-02T09:05:00Z'
  },
  {
    id: 'enr_004',
    studentId: 'student_004',
    groupId: 'group_103',
    courseId: 'course_002',
    status: 'past_due',
    telegramInvitedAt: '2026-07-05T20:30:00Z',
    createdAt: '2026-07-05T20:22:00Z'
  }
];

export const demoPayments: Payment[] = [
  {
    id: 'pay_001',
    enrollmentId: 'enr_001',
    provider: 'paypal',
    amount: 350,
    currency: 'ILS',
    status: 'succeeded',
    externalId: 'PAYID-DEMO-001',
    createdAt: '2026-06-28T10:18:00Z'
  },
  {
    id: 'pay_002',
    enrollmentId: 'enr_002',
    provider: 'paypal',
    amount: 380,
    currency: 'ILS',
    status: 'succeeded',
    externalId: 'PAYID-DEMO-002',
    createdAt: '2026-06-30T18:43:00Z'
  },
  {
    id: 'pay_003',
    enrollmentId: 'enr_003',
    provider: 'paypal',
    amount: 350,
    currency: 'ILS',
    status: 'pending',
    externalId: null,
    createdAt: '2026-07-02T09:06:00Z'
  },
  {
    id: 'pay_004',
    enrollmentId: 'enr_004',
    provider: 'paypal',
    amount: 350,
    currency: 'ILS',
    status: 'failed',
    externalId: 'PAYID-DEMO-004',
    createdAt: '2026-07-05T20:25:00Z'
  }
];

export const demoLogs: AutomationLog[] = [
  {
    id: 'log_001',
    source: 'make',
    event: 'payment.succeeded → telegram.invite',
    status: 'ok',
    detail: 'group_102 · one-time invite sent to anna.kozlova@example.com',
    createdAt: '2026-06-28T10:20:00Z'
  },
  {
    id: 'log_002',
    source: 'telegram-bot',
    event: 'member.joined',
    status: 'ok',
    detail: 'group_105 · m.stern joined the private channel',
    createdAt: '2026-06-30T19:02:00Z'
  },
  {
    id: 'log_003',
    source: 'make',
    event: 'payment.failed → email.reminder',
    status: 'ok',
    detail: 'group_103 · payment reminder sent to elena.bruk@example.com',
    createdAt: '2026-07-05T20:26:00Z'
  },
  {
    id: 'log_004',
    source: 'site',
    event: 'registration.created',
    status: 'ok',
    detail: 'group_104 · d.waksman@example.com redirected to PayPal',
    createdAt: '2026-07-02T09:06:00Z'
  }
];
