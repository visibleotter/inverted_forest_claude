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
    slug: 'vadim-markov',
    photoUrl: null,
    name: { ru: 'Вадим Марков', en: 'Vadim Markov' },
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
      ru: 'Оплата помесячная. После регистрации вы переходите на защищённую страницу оплаты нашего платёжного провайдера. Условия отмены изложены в Условиях использования.',
      en: 'Billing is monthly. After registration you are redirected to our payment provider’s secure page. Cancellation terms are set out in our Terms and Conditions.'
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
    monthlyPrice: 220,
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
    monthlyPrice: 220,
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
    monthlyPrice: 220,
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
    monthlyPrice: 220,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: false,
    title: { ru: 'Рассвет человечества', en: 'The Dawn of Humanity' },
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
    monthlyPrice: 220,
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
  },
  {
    id: 'course_006',
    slug: 'ancient-near-east',
    teacherId: 'teacher_001',
    category: 'history',
    difficulty: 'intermediate',
    ageGroups: ['adults', 'teens'],
    durationMonths: 3,
    monthlyPrice: 220,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: true,
    title: {
      ru: 'Первые цивилизации Древнего Востока',
      en: 'The First Civilizations of the Ancient Near East'
    },
    shortDescription: {
      ru: 'Города, письменность и первые законы — от шумерского Урука до Вавилона, Ассирии и Египта фараонов.',
      en: 'Cities, writing and the first laws — from Sumerian Uruk to Babylon, Assyria and the Egypt of the pharaohs.'
    },
    description: {
      ru: 'Курс о том, как впервые в истории возникли город, государство и письменность. Мы проходим путь от первых земледельческих поселений Междуречья до великих империй: Шумер и Аккад, Вавилон Хаммурапи, Ассирия, Египет Древнего и Нового царства, хетты и Персия. Читаем древнейшие тексты — «Эпос о Гильгамеше», законы Хаммурапи, египетские гимны — и разбираемся, как складывались представления о власти, справедливости и загробной жизни, которые пережили сами эти цивилизации.',
      en: 'A course on the first appearance of the city, the state and writing. We follow the road from the earliest farming settlements of Mesopotamia to the great empires: Sumer and Akkad, the Babylon of Hammurabi, Assyria, the Egypt of the Old and New Kingdoms, the Hittites and Persia. We read the oldest surviving texts — the Epic of Gilgamesh, the laws of Hammurabi, the Egyptian hymns — and trace how ideas of power, justice and the afterlife took shape and outlived the civilizations that made them.'
    },
    outcomes: {
      ru: [
        'Понимать, почему город и государство возникли именно в Междуречье',
        'Читать древнейшие письменные памятники и видеть в них живых людей',
        'Ориентироваться в трёх тысячелетиях истории Древнего Востока',
        'Узнавать месопотамские и египетские сюжеты в позднейшей культуре'
      ],
      en: [
        'Understand why the city and the state first appeared between the rivers',
        'Read the oldest written monuments and find living people in them',
        'Navigate three millennia of Ancient Near Eastern history',
        'Recognise Mesopotamian and Egyptian motifs in later culture'
      ]
    },
    audience: {
      ru: [
        'Взрослые, которым интересно, с чего началась история',
        'Подростки, готовящиеся к углублённому изучению древности',
        'Читатели Библии и античных авторов, желающие увидеть их фон'
      ],
      en: [
        'Adults curious about where history actually begins',
        'Teens preparing for advanced study of antiquity',
        'Readers of the Bible and the classics who want to see the background'
      ]
    },
    curriculum: [
      {
        title: { ru: 'Рождение города', en: 'The Birth of the City' },
        topics: {
          ru: [
            'Междуречье: земля между Тигром и Евфратом',
            'Урук и первые города-государства Шумера',
            'Клинопись: как счёт превратился в литературу'
          ],
          en: [
            'Mesopotamia: the land between the Tigris and the Euphrates',
            'Uruk and the first city-states of Sumer',
            'Cuneiform: how accountancy turned into literature'
          ]
        }
      },
      {
        title: { ru: 'Империи между реками', en: 'Empires Between the Rivers' },
        topics: {
          ru: [
            'Саргон Аккадский и первая империя в истории',
            'Хаммурапи и его законы: справедливость по-вавилонски',
            'Ассирия: армия, библиотека Ашшурбанипала и падение Ниневии'
          ],
          en: [
            'Sargon of Akkad and the first empire in history',
            'Hammurabi and his laws: justice, Babylonian style',
            'Assyria: the army, Ashurbanipal’s library and the fall of Nineveh'
          ]
        }
      },
      {
        title: { ru: 'Египет и соседи', en: 'Egypt and its Neighbours' },
        topics: {
          ru: [
            'Дар Нила: фараон, пирамиды и Древнее царство',
            'Новое царство: Хатшепсут, Эхнатон, Рамсес',
            'Хетты, финикийцы и Персия: конец древнего мира Востока'
          ],
          en: [
            'The gift of the Nile: pharaoh, pyramids and the Old Kingdom',
            'The New Kingdom: Hatshepsut, Akhenaten, Ramesses',
            'Hittites, Phoenicians and Persia: the end of the ancient East'
          ]
        }
      }
    ],
    faq: sharedFaq
  },
  {
    id: 'course_007',
    slug: 'russia-early-modern',
    teacherId: 'teacher_001',
    category: 'history',
    difficulty: 'intermediate',
    ageGroups: ['adults', 'teens'],
    durationMonths: 3,
    monthlyPrice: 220,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: false,
    title: {
      ru: 'История России Нового времени: от Смуты до 1812 года',
      en: 'Early Modern Russia: from the Time of Troubles to 1812'
    },
    shortDescription: {
      ru: 'Два века, за которые Московское царство стало империей: Смута, раскол, Пётр, Екатерина и гроза двенадцатого года.',
      en: 'The two centuries in which a Muscovite kingdom became an empire: the Troubles, the schism, Peter, Catherine and the storm of 1812.'
    },
    description: {
      ru: 'Курс о том, как страна, едва не исчезнувшая в Смуту, за двести лет превратилась в европейскую империю — и чего это стоило. Мы начинаем с пресечения династии и самозванцев, проходим через первых Романовых и церковный раскол, разбираем петровские преобразования не как чудо, а как решение конкретных задач ценой конкретных жертв. Дальше — эпоха дворцовых переворотов, «просвещённый абсолютизм» Екатерины и Пугачёвщина как его тень, короткое царствование Павла и, наконец, 1812 год, когда империя впервые почувствовала себя нацией. Читаем указы, письма и мемуары современников и стараемся понять логику людей, которые не знали, чем всё кончится.',
      en: 'A course on how a country that nearly ceased to exist during the Time of Troubles became a European empire within two centuries — and what that cost. We begin with a broken dynasty and its pretenders, pass through the first Romanovs and the church schism, and treat the Petrine reforms not as a miracle but as answers to particular problems paid for with particular lives. Then the age of palace coups, Catherine’s enlightened absolutism with the Pugachev revolt as its shadow, the short reign of Paul, and finally 1812, when the empire first felt itself to be a nation. We read decrees, letters and memoirs, and try to recover the reasoning of people who did not know how any of it would end.'
    },
    outcomes: {
      ru: [
        'Понимать, почему Смута стала возможной и чем она закончилась',
        'Видеть в петровских реформах цену, а не только результат',
        'Разбираться в устройстве империи XVIII века: сословия, армия, двор',
        'Читать источники эпохи и отличать факт от позднейшего мифа'
      ],
      en: [
        'Understand what made the Time of Troubles possible and how it ended',
        'See the price of the Petrine reforms, not only their results',
        'Navigate the eighteenth-century empire: estates, army, court',
        'Read period sources and tell fact from later myth'
      ]
    },
    audience: {
      ru: [
        'Взрослые, которым школьный курс оставил больше вопросов, чем ответов',
        'Читатели русской классики, желающие понять её исторический фон',
        'Подростки, готовящиеся к серьёзному изучению истории'
      ],
      en: [
        'Adults left with more questions than answers by their school course',
        'Readers of the Russian classics who want their historical ground',
        'Teens preparing for serious study of history'
      ]
    },
    curriculum: [
      {
        title: { ru: 'Смута и первые Романовы', en: 'The Troubles and the First Romanovs' },
        topics: {
          ru: [
            'Пресечение династии, самозванцы и польская интервенция',
            'Земский собор 1613 года: как выбирали царя',
            'Соборное уложение и церковный раскол'
          ],
          en: [
            'A broken dynasty, the pretenders and the Polish intervention',
            'The Assembly of 1613: how a tsar was chosen',
            'The Law Code of 1649 and the church schism'
          ]
        }
      },
      {
        title: { ru: 'Пётр и рождение империи', en: 'Peter and the Birth of the Empire' },
        topics: {
          ru: [
            'Северная война и цена Петербурга',
            'Table of Ranks: новая служилая элита',
            'Церковь без патриарха и государство без границ'
          ],
          en: [
            'The Great Northern War and the cost of Petersburg',
            'The Table of Ranks and a new service elite',
            'A church without a patriarch, a state without limits'
          ]
        }
      },
      {
        title: { ru: 'Век Екатерины и гроза 1812 года', en: 'Catherine’s Age and the Storm of 1812' },
        topics: {
          ru: [
            'Дворцовые перевороты и роль гвардии',
            'Просвещённый абсолютизм и восстание Пугачёва',
            'Александр I, Наполеон и Отечественная война'
          ],
          en: [
            'Palace coups and the role of the guards',
            'Enlightened absolutism and the Pugachev revolt',
            'Alexander I, Napoleon and the Patriotic War'
          ]
        }
      }
    ],
    faq: sharedFaq
  },
  {
    id: 'course_008',
    slug: 'russia-nineteenth-century',
    teacherId: 'teacher_001',
    category: 'history',
    difficulty: 'intermediate',
    ageGroups: ['adults', 'teens'],
    durationMonths: 3,
    monthlyPrice: 220,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1547989453-2b26e4c85d2b?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: false,
    title: {
      ru: 'История России XIX века',
      en: 'Russia in the Nineteenth Century'
    },
    shortDescription: {
      ru: 'От декабристов до кануна революции: век великих реформ, великих романов и вопроса, который так и не был решён.',
      en: 'From the Decembrists to the eve of revolution: a century of great reforms, great novels and one unanswered question.'
    },
    description: {
      ru: 'Век, в котором Россия непрерывно спорила сама с собой о том, кто она такая. Мы начинаем с декабрьского утра 1825 года и николаевской реакции, проходим через спор западников и славянофилов, поражение в Крыму, отмену крепостного права и остальные Великие реформы. Смотрим, как из разочарования в реформах вырастает народничество, а из него — террор, и как убийство Александра II разворачивает страну назад. Заканчиваем индустриализацией девяностых и обществом, которое уже нельзя вернуть к прежнему порядку. Всё это — рядом с Пушкиным, Достоевским и Толстым, потому что их книги были не отражением этих споров, а их частью.',
      en: 'A century in which Russia argued continuously with itself about what it was. We open on a December morning in 1825 and the reaction that followed, pass through the quarrel of Westernisers and Slavophiles, defeat in the Crimea, the emancipation of the serfs and the other Great Reforms. We watch disappointment in those reforms grow into populism and then into terror, and see the assassination of Alexander II turn the country back. We finish with the industrialisation of the 1890s and a society that could no longer be returned to the old order. All of it alongside Pushkin, Dostoevsky and Tolstoy, whose books were not a reflection of these arguments but a part of them.'
    },
    outcomes: {
      ru: [
        'Понимать, почему отмена крепостного права не решила крестьянский вопрос',
        'Разбираться в спорах западников, славянофилов и народников',
        'Видеть связь между русским романом и политикой своего времени',
        'Объяснять, откуда в России взялся революционный терроризм'
      ],
      en: [
        'Understand why emancipation did not settle the peasant question',
        'Follow the arguments of Westernisers, Slavophiles and populists',
        'See how the Russian novel and the politics of its day were connected',
        'Explain where revolutionary terrorism in Russia came from'
      ]
    },
    audience: {
      ru: [
        'Читатели русской классики, которым нужен исторический контекст',
        'Взрослые, интересующиеся историей реформ и их пределами',
        'Подростки и студенты гуманитарных направлений'
      ],
      en: [
        'Readers of the Russian classics who want the historical context',
        'Adults interested in reform and the limits of reform',
        'Teens and humanities students'
      ]
    },
    curriculum: [
      {
        title: { ru: 'После 1812: империя и её недовольные', en: 'After 1812: the Empire and Its Discontents' },
        topics: {
          ru: [
            'Декабристы: заговор офицеров и его смысл',
            'Николай I: порядок, цензура и «официальная народность»',
            'Западники и славянофилы: спор о пути'
          ],
          en: [
            'The Decembrists: an officers’ conspiracy and what it meant',
            'Nicholas I: order, censorship and Official Nationality',
            'Westernisers and Slavophiles: the argument about the road'
          ]
        }
      },
      {
        title: { ru: 'Великие реформы', en: 'The Great Reforms' },
        topics: {
          ru: [
            'Крымская война как приговор старому порядку',
            'Отмена крепостного права: что получили крестьяне',
            'Земства, суд присяжных, всеобщая воинская повинность'
          ],
          en: [
            'The Crimean War as a verdict on the old order',
            'Emancipation: what the peasants actually received',
            'Local assemblies, jury trials and universal conscription'
          ]
        }
      },
      {
        title: { ru: 'От народничества к революции', en: 'From Populism to Revolution' },
        topics: {
          ru: [
            '«Хождение в народ» и рождение террора',
            '1 марта 1881 года и контрреформы Александра III',
            'Индустриализация, город и общество накануне 1905 года'
          ],
          en: [
            'Going to the People, and the birth of terror',
            'March 1881 and the counter-reforms of Alexander III',
            'Industry, the city and society on the eve of 1905'
          ]
        }
      }
    ],
    faq: sharedFaq
  },
  {
    id: 'course_009',
    slug: 'russia-twentieth-century',
    teacherId: 'teacher_001',
    category: 'history',
    difficulty: 'deep_dive',
    ageGroups: ['adults'],
    durationMonths: 3,
    monthlyPrice: 220,
    currency: 'ILS',
    imageUrl:
      'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1200&q=80',
    publicTelegramUrl: 'https://t.me/invertedforest',
    status: 'published',
    featured: false,
    title: {
      ru: 'История России XX века',
      en: 'Russia in the Twentieth Century'
    },
    shortDescription: {
      ru: 'Век, в который уместились две революции, две войны, большой террор и распад страны, где всё это происходило.',
      en: 'A century holding two revolutions, two wars, the Great Terror and the collapse of the country in which all of it happened.'
    },
    description: {
      ru: 'Самый близкий и самый трудный для разговора век. Мы идём от 1905 года и Первой мировой к семнадцатому году — двум революциям, которые обычно сливают в одну, — через Гражданскую войну, НЭП и сворачивание НЭПа к коллективизации и Большому террору. Отдельно и подробно — война 1941–1945 годов: как её вели, чем за неё заплатили и как о ней потом вспоминали. Затем оттепель и её пределы, застой, Афганистан, перестройка и декабрь 1991 года. Курс опирается на документы, статистику и свидетельства и не заменяет сложность удобной версией — ни одной из тех, что предлагаются сегодня.',
      en: 'The nearest century, and the hardest to discuss. We move from 1905 and the First World War into 1917 — two revolutions usually merged into one — through the Civil War, the New Economic Policy and its reversal, to collectivisation and the Great Terror. The war of 1941–1945 gets its own extended treatment: how it was fought, what it cost, and how it was afterwards remembered. Then the Thaw and its limits, stagnation, Afghanistan, perestroika and December 1991. The course works from documents, statistics and testimony, and does not trade complexity for a convenient version — of which several are currently on offer.'
    },
    outcomes: {
      ru: [
        'Различать февраль и октябрь 1917 года и понимать, что стояло за каждым',
        'Разбираться в механике коллективизации и террора, а не только в цифрах',
        'Говорить о войне 1941–1945 годов на основании документов',
        'Понимать, почему СССР распался именно так и именно тогда'
      ],
      en: [
        'Tell February 1917 from October, and see what stood behind each',
        'Understand the mechanics of collectivisation and terror, not only the figures',
        'Discuss the war of 1941–1945 from documents',
        'Understand why the USSR collapsed in the way it did, when it did'
      ]
    },
    audience: {
      ru: [
        'Взрослые, готовые к трудному и подробному разговору',
        'Те, кто вырос на одной версии этого века и хочет проверить её',
        'Читатели документальной прозы и мемуаров эпохи'
      ],
      en: [
        'Adults ready for a difficult and detailed conversation',
        'Anyone raised on one version of this century who wants to test it',
        'Readers of the period’s documentary prose and memoirs'
      ]
    },
    curriculum: [
      {
        title: { ru: 'Революция и Гражданская война', en: 'Revolution and Civil War' },
        topics: {
          ru: [
            '1905 год, Дума и незавершённая реформа',
            'Февраль и Октябрь: две революции одного года',
            'Гражданская война, красный и белый террор, эмиграция'
          ],
          en: [
            '1905, the Duma and an unfinished reform',
            'February and October: two revolutions in one year',
            'Civil war, red and white terror, emigration'
          ]
        }
      },
      {
        title: { ru: 'Сталинский порядок и война', en: 'The Stalinist Order and the War' },
        topics: {
          ru: [
            'НЭП и его свёртывание; коллективизация и голод',
            'Большой террор: механика, масштаб, документы',
            'Война 1941–1945: ход, цена, память'
          ],
          en: [
            'The NEP and its reversal; collectivisation and famine',
            'The Great Terror: mechanics, scale, documents',
            'The war of 1941–1945: course, cost, memory'
          ]
        }
      },
      {
        title: { ru: 'От оттепели к 1991 году', en: 'From the Thaw to 1991' },
        topics: {
          ru: [
            'XX съезд, оттепель и её границы',
            'Застой, диссиденты, Афганистан',
            'Перестройка, гласность и распад Союза'
          ],
          en: [
            'The Twentieth Congress, the Thaw and its limits',
            'Stagnation, dissidents, Afghanistan',
            'Perestroika, glasnost and the end of the Union'
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
    startDateConfirmed: false,
    endDate: '2026-12-22',
    capacity: 7,
    seatsTaken: 5,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000101',
    telegramChatType: 'channel',
    inviteMemberLimit: 2,
    meetingUrl: 'https://meet.google.com/demo-101',
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
    startDateConfirmed: false,
    endDate: '2026-12-22',
    capacity: 7,
    seatsTaken: 4,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000102',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-102',
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
    startDateConfirmed: false,
    endDate: '2026-12-25',
    capacity: 7,
    seatsTaken: 5,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000103',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-103',
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
    startDateConfirmed: false,
    endDate: '2027-01-06',
    capacity: 7,
    seatsTaken: 5,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000104',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-104',
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
    startDateConfirmed: false,
    endDate: '2027-01-04',
    capacity: 7,
    seatsTaken: 5,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-380',
    telegramChannelId: '-1001000000105',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-105',
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
    startDateConfirmed: false,
    endDate: '2027-01-07',
    capacity: 7,
    seatsTaken: 5,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-380',
    telegramChannelId: '-1001000000106',
    telegramChatType: 'channel',
    inviteMemberLimit: 2,
    meetingUrl: 'https://meet.google.com/demo-106',
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
    startDateConfirmed: false,
    endDate: '2026-12-27',
    capacity: 7,
    seatsTaken: 2,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-380',
    telegramChannelId: '-1001000000107',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-107',
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
    startDateConfirmed: false,
    endDate: '2027-01-07',
    capacity: 7,
    seatsTaken: 5,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-300',
    telegramChannelId: '-1001000000108',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-108',
    status: 'enrolling'
  },
  {
    id: 'group_109',
    courseId: 'course_006',
    slug: 'near-east-tue-20-adults',
    audience: 'adults',
    weekday: 2,
    time: '20:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-06',
    startDateConfirmed: false,
    endDate: '2027-01-05',
    capacity: 7,
    seatsTaken: 3,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000109',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-109',
    status: 'enrolling'
  },
  {
    id: 'group_110',
    courseId: 'course_006',
    slug: 'near-east-sun-18-teens',
    audience: 'teens',
    weekday: 0,
    time: '18:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-11',
    startDateConfirmed: false,
    endDate: '2027-01-10',
    capacity: 7,
    seatsTaken: 1,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000110',
    telegramChatType: 'channel',
    inviteMemberLimit: 2,
    meetingUrl: 'https://meet.google.com/demo-110',
    status: 'enrolling'
  },
  {
    id: 'group_111',
    courseId: 'course_007',
    slug: 'early-modern-mon-20-adults',
    audience: 'adults',
    weekday: 1,
    time: '20:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-05',
    startDateConfirmed: false,
    endDate: '2027-01-04',
    capacity: 7,
    seatsTaken: 3,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000111',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-111',
    status: 'enrolling'
  },
  {
    id: 'group_112',
    courseId: 'course_007',
    slug: 'early-modern-thu-18-teens',
    audience: 'teens',
    weekday: 4,
    time: '18:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-08',
    startDateConfirmed: false,
    endDate: '2027-01-07',
    capacity: 7,
    seatsTaken: 2,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000112',
    telegramChatType: 'channel',
    inviteMemberLimit: 2,
    meetingUrl: 'https://meet.google.com/demo-112',
    status: 'enrolling'
  },
  {
    id: 'group_113',
    courseId: 'course_008',
    slug: 'nineteenth-wed-20-adults',
    audience: 'adults',
    weekday: 3,
    time: '20:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-07',
    startDateConfirmed: false,
    endDate: '2027-01-06',
    capacity: 7,
    seatsTaken: 4,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000113',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-113',
    status: 'enrolling'
  },
  {
    id: 'group_114',
    courseId: 'course_008',
    slug: 'nineteenth-sun-19-adults',
    audience: 'adults',
    weekday: 0,
    time: '19:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-11',
    startDateConfirmed: false,
    endDate: '2027-01-10',
    capacity: 7,
    seatsTaken: 1,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-350',
    telegramChannelId: '-1001000000114',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-114',
    status: 'enrolling'
  },
  {
    id: 'group_115',
    courseId: 'course_009',
    slug: 'twentieth-tue-20-adults',
    audience: 'adults',
    weekday: 2,
    time: '20:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-06',
    startDateConfirmed: false,
    endDate: '2027-01-05',
    capacity: 7,
    seatsTaken: 5,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-380',
    telegramChannelId: '-1001000000115',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-115',
    status: 'enrolling'
  },
  {
    id: 'group_116',
    courseId: 'course_009',
    slug: 'twentieth-fri-11-adults',
    audience: 'adults',
    weekday: 5,
    time: '11:00',
    timezone: 'Asia/Jerusalem',
    startDate: '2026-10-09',
    startDateConfirmed: false,
    endDate: '2027-01-08',
    capacity: 7,
    seatsTaken: 2,
    seatsHeld: 0,
    paymentUrl: 'https://allpay.to/link/demo-380',
    telegramChannelId: '-1001000000116',
    telegramChatType: 'channel',
    inviteMemberLimit: 1,
    meetingUrl: 'https://meet.google.com/demo-116',
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
    participantName: null,
    participantBirthYear: null,
    plan: 'monthly',
    orderId: 'enr_001',
    externalSubscriptionId: null,
    subscriptionStatus: 'active',
    paidThrough: '2026-11-04',
    graceUntil: null,
    pendingExpiresAt: null,
    cancelledAt: null,
    cancelReason: null,
    telegramAccessStatus: 'joined',
    telegramUserId: '480010001',
    telegramJoinedAt: '2026-06-28T11:02:00Z',
    telegramRemovedAt: null,
    createdAt: '2026-06-28T10:15:00Z'
  },
  {
    id: 'enr_002',
    studentId: 'student_002',
    groupId: 'group_105',
    courseId: 'course_003',
    status: 'active',
    telegramInvitedAt: '2026-06-30T18:45:00Z',
    participantName: null,
    participantBirthYear: null,
    plan: 'monthly',
    orderId: 'enr_002',
    externalSubscriptionId: null,
    subscriptionStatus: 'active',
    paidThrough: '2026-11-10',
    graceUntil: null,
    pendingExpiresAt: null,
    cancelledAt: null,
    cancelReason: null,
    telegramAccessStatus: 'joined',
    telegramUserId: '480010002',
    telegramJoinedAt: '2026-06-30T19:10:00Z',
    telegramRemovedAt: null,
    createdAt: '2026-06-30T18:40:00Z'
  },
  {
    id: 'enr_003',
    studentId: 'student_003',
    groupId: 'group_104',
    courseId: 'course_001',
    status: 'pending_payment',
    telegramInvitedAt: null,
    participantName: null,
    participantBirthYear: null,
    plan: 'monthly',
    orderId: 'enr_003',
    externalSubscriptionId: null,
    subscriptionStatus: 'none',
    paidThrough: null,
    graceUntil: null,
    pendingExpiresAt: '2026-07-02T10:05:00Z',
    cancelledAt: null,
    cancelReason: null,
    telegramAccessStatus: 'not_granted',
    telegramUserId: null,
    telegramJoinedAt: null,
    telegramRemovedAt: null,
    createdAt: '2026-07-02T09:05:00Z'
  },
  {
    id: 'enr_004',
    studentId: 'student_004',
    groupId: 'group_103',
    courseId: 'course_002',
    status: 'past_due',
    telegramInvitedAt: '2026-07-05T20:30:00Z',
    participantName: null,
    participantBirthYear: null,
    plan: 'monthly',
    orderId: 'enr_004',
    externalSubscriptionId: null,
    subscriptionStatus: 'error',
    paidThrough: '2026-08-20',
    graceUntil: '2026-08-23T00:00:00Z',
    pendingExpiresAt: null,
    cancelledAt: null,
    cancelReason: null,
    telegramAccessStatus: 'joined',
    telegramUserId: '480010004',
    telegramJoinedAt: '2026-07-05T21:00:00Z',
    telegramRemovedAt: null,
    createdAt: '2026-07-05T20:22:00Z'
  }
];

export const demoPayments: Payment[] = [
  {
    id: 'pay_001',
    enrollmentId: 'enr_001',
    provider: 'allpay',
    amount: 350,
    currency: 'ILS',
    status: 'succeeded',
    externalId: 'enr_001#1',
    periodIndex: 1,
    receiptUrl: 'https://allpay.to/receipt/demo',
    createdAt: '2026-06-28T10:18:00Z'
  },
  {
    id: 'pay_002',
    enrollmentId: 'enr_002',
    provider: 'allpay',
    amount: 380,
    currency: 'ILS',
    status: 'succeeded',
    externalId: 'enr_002#1',
    periodIndex: 1,
    receiptUrl: 'https://allpay.to/receipt/demo',
    createdAt: '2026-06-30T18:43:00Z'
  },
  {
    id: 'pay_003',
    enrollmentId: 'enr_003',
    provider: 'allpay',
    amount: 350,
    currency: 'ILS',
    status: 'pending',
    externalId: null,
    periodIndex: 1,
    receiptUrl: null,
    createdAt: '2026-07-02T09:06:00Z'
  },
  {
    id: 'pay_004',
    enrollmentId: 'enr_004',
    provider: 'allpay',
    amount: 350,
    currency: 'ILS',
    status: 'failed',
    externalId: 'enr_004#1',
    periodIndex: 1,
    receiptUrl: null,
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
